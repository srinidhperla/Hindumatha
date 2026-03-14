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
    typedRows[key] = row;
  });

  // Build plain flavor keys by aggregating typed keys.
  // A weight is available for a flavor if available in ANY egg type.
  const matrix = {};
  const effectiveFlavors =
    flavors.length > 0 ? flavors : [{ name: "Cake", isAvailable: true }];
  effectiveFlavors.forEach((flavor) => {
    const flavorName = flavor.name;
    const matchedTypedKeys = ["egg", "eggless"]
      .map((t) => `${t}::${flavorName}`)
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
    const row = source[typedKey];
    if (row) {
      return weightOptions.filter((w) => {
        const val = row[w.label];
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
    const row = source[typedKey];
    if (!row) return true;
    return weights.some((w) => {
      const val = row[w.label];
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
  category: "cakes",
  image: "",
  images: [],
  flavorOptions: [],
  weightOptions: DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS.map((option) => ({
    ...option,
  })),
  flavorWeightAvailability: {},
  isEgg: true,
  isEggless: false,
  isFeatured: false,
});
