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

  const matrix = {};
  flavors.forEach((flavor) => {
    const flavorKey = String(flavor.name || "").toLowerCase();
    const rowSource = source[flavor.name] || source[flavorKey] || {};
    const row = {};

    weights.forEach((weight) => {
      const weightKey = String(weight.label || "").toLowerCase();
      const rawValue =
        rowSource[weight.label] ??
        rowSource[weightKey] ??
        rowSource?.[weight.label] ??
        rowSource?.[weightKey];
      row[weight.label] = rawValue !== false;
    });

    matrix[flavor.name] = row;
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
  return matrix?.[flavorName]?.[weightLabel] !== false;
};

export const getAvailableFlavorOptions = (product) =>
  normalizeFlavorOptions(product).filter((option) => option.isAvailable);

export const getAvailableWeightOptions = (product, flavorName = "") => {
  const weightOptions = normalizeWeightOptions(product).filter(
    (option) => option.isAvailable,
  );

  if (!flavorName) {
    return weightOptions;
  }

  const matrix = normalizeFlavorWeightAvailability(product);
  return weightOptions.filter(
    (option) => matrix?.[flavorName]?.[option.label] !== false,
  );
};

export const isProductPurchasable = (product) =>
  Boolean(
    product?.isAvailable !== false &&
    getAvailableFlavorOptions(product).length > 0 &&
    getAvailableWeightOptions(product).length > 0,
  );

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
  isFeatured: false,
});
