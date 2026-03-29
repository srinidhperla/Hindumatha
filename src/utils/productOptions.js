import {
  buildFlavorWeightAvailabilityMatrix,
  readRowValue,
  readVariantPriceValue,
  resolveTypedRow,
} from "./productOptionInternals";
import {
  DEFAULT_PORTION_OPTIONS,
  DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS,
  DEFAULT_WEIGHT_OPTIONS,
  PORTION_TYPE_META,
  PRODUCT_PORTION_TYPES,
} from "./productOptionConstants";

export {
  DEFAULT_PRODUCT_FORM_WEIGHT_OPTIONS,
  DEFAULT_WEIGHT_OPTIONS,
  PRODUCT_PORTION_TYPES,
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
  return buildFlavorWeightAvailabilityMatrix({
    source: product?.flavorWeightAvailability,
    flavors,
    weights,
  });
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

    // If any typed rows exist for this flavor but this specific cake type row
    // is missing, treat it as "all ON" for this cake type by default.
    const hasAnyTypedFlavorRows = ["egg", "eggless"].some((type) =>
      Boolean(resolveTypedRow(source, `${type}::${flavorName}`)),
    );
    if (hasAnyTypedFlavorRows) {
      return weightOptions;
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

export const getMenuWeightVariantCount = (product) => {
  const flavors = getAvailableFlavorOptions(product);
  const flavorNames =
    flavors.length > 0 ? flavors.map((option) => option.name) : [""];
  const activeCakeTypes = [];

  if (product?.isEgg !== false && isEggTypeAvailable(product, "egg")) {
    activeCakeTypes.push("egg");
  }

  if (product?.isEggless === true && isEggTypeAvailable(product, "eggless")) {
    activeCakeTypes.push("eggless");
  }

  const visibleWeightLabels = new Set();

  flavorNames.forEach((flavorName) => {
    if (activeCakeTypes.length > 0) {
      activeCakeTypes.forEach((cakeType) => {
        getAvailableWeightOptions(product, flavorName, cakeType).forEach(
          (option) => {
            visibleWeightLabels.add(option.label);
          },
        );
      });
      return;
    }

    getAvailableWeightOptions(product, flavorName).forEach((option) => {
      visibleWeightLabels.add(option.label);
    });
  });

  return visibleWeightLabels.size;
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
  isAddon: false,
  addOns: [],
});
