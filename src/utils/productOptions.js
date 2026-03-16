export const DEFAULT_WEIGHT_OPTIONS = [
  { label: "500g", multiplier: 0.5, isAvailable: true },
  { label: "1kg", multiplier: 1, isAvailable: true },
  { label: "1.5kg", multiplier: 1.5, isAvailable: true },
  { label: "2kg", multiplier: 2, isAvailable: true },
  { label: "3kg", multiplier: 3, isAvailable: true },
];

export const DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS = [
  { label: "500g", multiplier: 0.5, isAvailable: true },
  { label: "1kg", multiplier: 1, isAvailable: true },
];

const DEFAULT_PORTION_OPTIONS = {
  weight: DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS,
  size: [
    { label: "Small", multiplier: 1, isAvailable: true },
    { label: "Medium", multiplier: 1, isAvailable: true },
    { label: "Large", multiplier: 1, isAvailable: true },
  ],
  pieces: [
    { label: "1 pc", multiplier: 1, isAvailable: true },
    { label: "6 pcs", multiplier: 1, isAvailable: true },
    { label: "12 pcs", multiplier: 1, isAvailable: true },
  ],
};

export const PRODUCT_PORTION_TYPES = ["weight", "size", "pieces"];

const PORTION_TYPE_META = {
  weight: {
    heading: "Weights",
    singular: "weight",
    example: "Example: 1kg",
  },
  size: {
    heading: "Sizes",
    singular: "size",
    example: "Example: Small",
  },
  pieces: {
    heading: "Pieces",
    singular: "piece",
    example: "Example: 6 pcs",
  },
};

export const normalizePortionType = (value) =>
  PRODUCT_PORTION_TYPES.includes(String(value || "").toLowerCase())
    ? String(value).toLowerCase()
    : "weight";

export const getPortionTypeMeta = (value) =>
  PORTION_TYPE_META[normalizePortionType(value)] || PORTION_TYPE_META.weight;

export const getDefaultOptionsForPortionType = (value) => {
  const type = normalizePortionType(value);
  return (DEFAULT_PORTION_OPTIONS[type] || DEFAULT_PORTION_OPTIONS.weight).map(
    (option) => ({ ...option }),
  );
};

export const formatCategoryLabel = (value = "") =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const normalizeFlavorOptions = (product) => {
  if (Array.isArray(product?.flavorOptions) && product.flavorOptions.length) {
    return product.flavorOptions
      .map((option) => ({
        name: option?.name?.trim(),
        isAvailable: option?.isAvailable !== false,
      }))
      .filter((option) => option.name);
  }

  return (product?.flavors || []).map((flavor) => ({
    name: flavor,
    isAvailable: true,
  }));
};

export const normalizeWeightOptions = (product) => {
  if (Array.isArray(product?.weightOptions) && product.weightOptions.length) {
    return product.weightOptions
      .map((option) => ({
        label: option?.label?.trim(),
        multiplier:
          Number.isFinite(Number(option?.multiplier)) &&
          Number(option.multiplier) > 0
            ? Number(option.multiplier)
            : 1,
        isAvailable: option?.isAvailable !== false,
      }))
      .filter((option) => option.label);
  }

  if (Array.isArray(product?.sizes) && product.sizes.length) {
    return product.sizes.map((label, index) => ({
      label,
      multiplier: DEFAULT_WEIGHT_OPTIONS[index]?.multiplier || 1,
      isAvailable: true,
    }));
  }

  return DEFAULT_WEIGHT_OPTIONS;
};

const readVariantPriceValue = (value) => {
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

const getObjectEntries = (source) => {
  if (!source || typeof source !== "object") return [];
  return source instanceof Map
    ? Array.from(source.entries())
    : Object.entries(source);
};

const resolveTypedRow = (source, typedKey) => {
  if (!source || typeof source !== "object") return null;

  const direct = source?.[typedKey] || source?.get?.(typedKey);
  if (direct && typeof direct === "object") return direct;

  const typedKeyLower = String(typedKey).toLowerCase();
  const match = getObjectEntries(source).find(
    ([key]) => String(key).toLowerCase() === typedKeyLower,
  );
  return match && typeof match[1] === "object" ? match[1] : null;
};

const readRowValue = (row, label) => {
  if (!row || typeof row !== "object") return undefined;
  if (label in row) return row[label];

  const lowerLabel = String(label).toLowerCase();
  if (lowerLabel in row) return row[lowerLabel];

  const match = Object.entries(row).find(
    ([key]) => String(key).toLowerCase() === lowerLabel,
  );
  return match ? match[1] : undefined;
};

const resolveVariantFlavorName = (product, flavorName = "") => {
  if (flavorName) return flavorName;
  return getAvailableFlavorOptions(product)[0]?.name || "Cake";
};

export const getVariantPrice = (
  product,
  { flavorName = "", weightLabel = "", eggType = "" } = {},
) => {
  const selectedWeight = normalizeWeightOptions(product).find(
    (weight) => weight.label === weightLabel,
  );

  if (!selectedWeight) {
    return Number(product?.price || 0);
  }

  const resolvedFlavor = resolveVariantFlavorName(product, flavorName);
  const base =
    Number(product?.price || 0) * Number(selectedWeight.multiplier || 1);

  if (!eggType) {
    return base;
  }

  const source = product?.variantPrices;
  if (!source || typeof source !== "object") {
    return base;
  }

  const typedKey = `${eggType}::${resolvedFlavor}`;
  const typedRow = resolveTypedRow(source, typedKey);

  if (!typedRow || typeof typedRow !== "object") {
    return base;
  }

  const direct = readVariantPriceValue(readRowValue(typedRow, weightLabel));
  if (direct !== null) {
    return direct;
  }

  return base;
};

export const normalizeFlavorWeightAvailability = (product) => {
  const flavors = normalizeFlavorOptions(product);
  const weights = normalizeWeightOptions(product);
  const source =
    product?.flavorWeightAvailability &&
    typeof product.flavorWeightAvailability === "object"
      ? product.flavorWeightAvailability
      : {};

  // First collect typed key rows (egg::Cake, eggless::Cake)
  const typedRows = {};
  const sourceKeys =
    source instanceof Map ? Array.from(source.keys()) : Object.keys(source);
  sourceKeys.forEach((key) => {
    if (!key.includes("::")) return;
    const rowSource = source instanceof Map ? source.get(key) : source[key];
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

  // Build plain flavor keys by aggregating typed keys.
  // A weight is available for a flavor if available in ANY egg type.
  const matrix = {};
  const effectiveFlavors =
    flavors.length > 0 ? flavors : [{ name: "Cake", isAvailable: true }];
  effectiveFlavors.forEach((flavor) => {
    const flavorName = flavor.name;
    const matchedTypedKeys = ["egg", "eggless"]
      .map((t) => `${t}::${flavorName}`.toLowerCase())
      .filter((k) => typedRows[k]);

    const row = {};
    weights.forEach((weight) => {
      const label = weight.label;
      if (matchedTypedKeys.length > 0) {
        const statuses = matchedTypedKeys.map((k) => typedRows[k][label]);
        if (statuses.some((s) => s === true)) row[label] = true;
        else if (statuses.some((s) => s === false)) row[label] = false;
        else row[label] = null;
      } else {
        // Fallback to plain key
        const flavorKey = String(flavorName || "").toLowerCase();
        const rowSource = source[flavorName] || source[flavorKey] || {};
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
      }
    });

    matrix[flavorName] = row;
  });

  return matrix;
};

export const isFlavorWeightAvailable = (product, flavorName, weightLabel) => {
  if (!flavorName || !weightLabel) {
    return true;
  }

  const flavor = normalizeFlavorOptions(product).find(
    (entry) => entry.name === flavorName,
  );
  const weight = normalizeWeightOptions(product).find(
    (entry) => entry.label === weightLabel,
  );

  if (!flavor?.isAvailable || !weight?.isAvailable) {
    return false;
  }

  const matrix = normalizeFlavorWeightAvailability(product);
  return matrix?.[flavorName]?.[weightLabel] === true;
};

export const getAvailableFlavorOptions = (product) => {
  const flavors = normalizeFlavorOptions(product).filter(
    (option) => option.isAvailable,
  );
  return flavors.length > 0 ? flavors : [{ name: "Cake", isAvailable: true }];
};

export const getAvailableWeightOptions = (
  product,
  flavorName = "",
  eggType = "",
) => {
  const weightOptions = normalizeWeightOptions(product).filter(
    (option) => option.isAvailable,
  );

  if (!flavorName) {
    return weightOptions;
  }

  if (eggType) {
    const source = product?.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const row = resolveTypedRow(source, typedKey);
    if (row) {
      return weightOptions.filter((w) => {
        const val = readRowValue(row, w.label);
        return val !== false && val !== null;
      });
    }
  }

  const matrix = normalizeFlavorWeightAvailability(product);
  return weightOptions.filter(
    (option) => matrix?.[flavorName]?.[option.label] === true,
  );
};

export const isEggTypeAvailable = (product, eggType) => {
  const source = product?.flavorWeightAvailability || {};
  const weights = normalizeWeightOptions(product).filter((o) => o.isAvailable);
  const flavors = normalizeFlavorOptions(product);
  const flavorNames =
    flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
  return flavorNames.some((fn) => {
    const typedKey = `${eggType}::${fn}`;
    const row = resolveTypedRow(source, typedKey);
    if (!row) return true;
    return weights.some((w) => {
      const val = readRowValue(row, w.label);
      return val !== false && val !== null;
    });
  });
};

export const getOrderableFlavors = (product) => {
  const flavors = getAvailableFlavorOptions(product);
  const matrix = normalizeFlavorWeightAvailability(product);
  const weights = normalizeWeightOptions(product).filter((o) => o.isAvailable);
  return flavors.filter((flavor) =>
    weights.some((w) => matrix?.[flavor.name]?.[w.label] === true),
  );
};

export const getOrderableWeights = (product) => {
  const flavors = getAvailableFlavorOptions(product);
  const matrix = normalizeFlavorWeightAvailability(product);
  const weights = normalizeWeightOptions(product).filter((o) => o.isAvailable);
  return weights.filter((weight) =>
    flavors.some((f) => matrix?.[f.name]?.[weight.label] === true),
  );
};

export const isProductPurchasable = (product) => {
  if (product?.isAvailable === false) return false;
  const flavors = getAvailableFlavorOptions(product);
  const matrix = normalizeFlavorWeightAvailability(product);
  const weights = normalizeWeightOptions(product).filter((o) => o.isAvailable);
  return flavors.some((flavor) =>
    weights.some((w) => matrix?.[flavor.name]?.[w.label] === true),
  );
};

export const createDefaultProductForm = () => ({
  name: "",
  description: "",
  price: "",
  portionType: "weight",
  category: "cakes",
  image: "",
  images: [],
  flavorOptions: [],
  weightOptions: DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS.map((option) => ({
    ...option,
  })),
  flavorWeightAvailability: {},
  variantPrices: {},
  isEgg: true,
  isEggless: false,
  isFeatured: false,
});
