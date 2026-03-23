export const readVariantPriceValue = (value) => {
  if (Number.isFinite(Number(value)) && Number(value) > 0) {
    return Number(value);
  }

  if (
    value &&
    typeof value === "object" &&
    Number.isFinite(Number(value.price)) &&
    Number(value.price) > 0
  ) {
    return Number(value.price);
  }

  return null;
};

export const getObjectEntries = (source) => {
  if (!source || typeof source !== "object") return [];
  return source instanceof Map
    ? Array.from(source.entries())
    : Object.entries(source);
};

export const resolveTypedRow = (source, typedKey) => {
  if (!source || typeof source !== "object") return null;

  const direct = source?.[typedKey] || source?.get?.(typedKey);
  if (direct && typeof direct === "object") return direct;

  const typedKeyLower = String(typedKey).toLowerCase();
  const match = getObjectEntries(source).find(
    ([key]) => String(key).toLowerCase() === typedKeyLower,
  );
  return match && typeof match[1] === "object" ? match[1] : null;
};

export const readRowValue = (row, label) => {
  if (!row || typeof row !== "object") return undefined;
  if (label in row) return row[label];

  const lowerLabel = String(label).toLowerCase();
  if (lowerLabel in row) return row[lowerLabel];

  const match = Object.entries(row).find(
    ([key]) => String(key).toLowerCase() === lowerLabel,
  );
  return match ? match[1] : undefined;
};

export const resolveVariantFlavorName = (product, flavorName = "") => {
  if (flavorName) return flavorName;
  return (
    (Array.isArray(product?.flavorOptions) && product.flavorOptions[0]?.name) ||
    "Cake"
  );
};

export const buildFlavorWeightAvailabilityMatrix = ({
  source,
  flavors,
  weights,
}) => {
  const safeSource = source && typeof source === "object" ? source : {};

  const typedRows = {};
  const sourceKeys =
    safeSource instanceof Map
      ? Array.from(safeSource.keys())
      : Object.keys(safeSource);

  sourceKeys.forEach((key) => {
    if (!key.includes("::")) return;
    const rowSource =
      safeSource instanceof Map ? safeSource.get(key) : safeSource[key];
    if (!rowSource || typeof rowSource !== "object") return;

    const row = {};
    weights.forEach((weight) => {
      const label = weight.label;
      const lower = String(label || "").toLowerCase();
      const rawValue =
        label in rowSource
          ? rowSource[label]
          : lower in rowSource
            ? rowSource[lower]
            : undefined;
      if (rawValue === null) row[label] = null;
      else if (rawValue === false) row[label] = false;
      else row[label] = true;
    });

    typedRows[String(key).toLowerCase()] = row;
  });

  const matrix = {};
  const effectiveFlavors =
    flavors.length > 0 ? flavors : [{ name: "Cake", isAvailable: true }];

  effectiveFlavors.forEach((flavor) => {
    const flavorName = flavor.name;
    const matchedTypedKeys = ["egg", "eggless"]
      .map((type) => `${type}::${flavorName}`.toLowerCase())
      .filter((key) => typedRows[key]);

    const row = {};
    weights.forEach((weight) => {
      const label = weight.label;
      if (matchedTypedKeys.length > 0) {
        const statuses = matchedTypedKeys.map((key) => typedRows[key][label]);
        if (statuses.some((status) => status === true)) row[label] = true;
        else if (statuses.some((status) => status === false))
          row[label] = false;
        else row[label] = null;
        return;
      }

      const flavorKey = String(flavorName || "").toLowerCase();
      const rowSource = safeSource[flavorName] || safeSource[flavorKey] || {};
      const lower = String(label || "").toLowerCase();
      const rawValue =
        label in rowSource
          ? rowSource[label]
          : lower in rowSource
            ? rowSource[lower]
            : undefined;
      if (rawValue === null) row[label] = null;
      else if (rawValue === false) row[label] = false;
      else row[label] = true;
    });

    matrix[flavorName] = row;
  });

  return matrix;
};
