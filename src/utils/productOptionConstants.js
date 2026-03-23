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

export const PRODUCT_PORTION_TYPES = ["weight", "size", "pieces"];

export const DEFAULT_PORTION_OPTIONS = {
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

export const PORTION_TYPE_META = {
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
