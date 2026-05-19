const CATEGORY_CODE_FALLBACK = "cake";
const DEFAULT_WEIGHT_STEP = 0.5;

const toTrimmedString = (value = "") => String(value || "").trim();

const toUniqueOptions = (items = []) =>
  Array.from(new Set(items.map((item) => toTrimmedString(item)).filter(Boolean)));

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const roundWeightValue = (value) => Math.round(Number(value) * 100) / 100;

const formatWeightValue = (value) => {
  const normalizedValue = roundWeightValue(value);
  return Number.isInteger(normalizedValue)
    ? `${normalizedValue}`
    : normalizedValue.toFixed(1).replace(/\.0$/, "");
};

export const formatGalleryCategoryLabel = (value = "") =>
  toTrimmedString(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const buildGalleryCodePrefix = (value = "") => {
  const normalizedValue = toTrimmedString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedValue || CATEGORY_CODE_FALLBACK;
};

export const normalizeGallerySearchText = (value = "") =>
  toTrimmedString(value)
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const attachGalleryItemCodes = (items = []) => {
  const categoryCounts = new Map();

  return items.map((item) => {
    const categoryKey = buildGalleryCodePrefix(item?.category);
    const nextCount = (categoryCounts.get(categoryKey) || 0) + 1;
    const codeNumber = String(nextCount).padStart(2, "0");
    categoryCounts.set(categoryKey, nextCount);

    return {
      ...item,
      cakeCode: `${categoryKey}-#${codeNumber}`,
      cakeCodeSearch: `${categoryKey}-${codeNumber}`,
    };
  });
};

export const getGalleryItemSelections = (item = {}, sectionKey = "") => {
  const normalizedSectionKey = toTrimmedString(sectionKey);
  if (!normalizedSectionKey) {
    return [];
  }

  const sectionOptionsEntry = Array.isArray(item?.sectionOptions)
    ? item.sectionOptions.find(
        (entry) => toTrimmedString(entry?.sectionKey) === normalizedSectionKey,
      )
    : null;

  if (sectionOptionsEntry) {
    return toUniqueOptions(sectionOptionsEntry.options || []);
  }

  return toUniqueOptions(item?.[normalizedSectionKey] || []);
};

export const getGalleryWeightRange = (item = {}) => {
  const min = toNumber(item?.weightRange?.min);
  const max = toNumber(item?.weightRange?.max);
  const unit = toTrimmedString(item?.weightRange?.unit) || "kg";

  if (min === null && max === null) {
    return null;
  }

  const resolvedMin = min ?? max ?? 0;
  const resolvedMax = max ?? min ?? resolvedMin;

  return {
    min: Math.min(resolvedMin, resolvedMax),
    max: Math.max(resolvedMin, resolvedMax),
    unit,
  };
};

export const formatGalleryWeightRange = (item = {}) => {
  const range = getGalleryWeightRange(item);
  if (!range) {
    return "";
  }

  const minLabel = formatWeightValue(range.min);
  const maxLabel = formatWeightValue(range.max);

  if (range.min === range.max) {
    return `${minLabel} ${range.unit}`;
  }

  return `${minLabel}-${maxLabel} ${range.unit}`;
};

export const buildGalleryWeightChoices = (source = {}, unitOverride = "") => {
  const range =
    source && Object.prototype.hasOwnProperty.call(source, "weightRange")
      ? getGalleryWeightRange(source)
      : getGalleryWeightRange({ weightRange: source });

  if (!range) {
    return [];
  }

  const optionMap = new Map();

  for (
    let currentValue = range.min;
    currentValue <= range.max + 0.001;
    currentValue += DEFAULT_WEIGHT_STEP
  ) {
    const roundedValue = roundWeightValue(currentValue);
    const value = String(roundedValue);

    if (!optionMap.has(value)) {
      optionMap.set(value, {
        value,
        label: `${formatWeightValue(roundedValue)} ${
          toTrimmedString(unitOverride) || range.unit
        }`,
      });
    }
  }

  return Array.from(optionMap.values()).sort(
    (left, right) => Number(left.value) - Number(right.value),
  );
};

export const matchesGalleryOptionFilter = (
  item = {},
  sectionKey = "",
  expectedValue = "",
) => {
  const normalizedValue = toTrimmedString(expectedValue);

  if (!normalizedValue) {
    return true;
  }

  return getGalleryItemSelections(item, sectionKey).includes(normalizedValue);
};

export const matchesGalleryWeightFilter = (item = {}, selectedWeight = "") => {
  const normalizedValue = toTrimmedString(selectedWeight);
  if (!normalizedValue) {
    return true;
  }

  const weightValue = toNumber(normalizedValue);
  const range = getGalleryWeightRange(item);

  if (weightValue === null || !range) {
    return false;
  }

  return weightValue >= range.min && weightValue <= range.max;
};

export const buildGalleryWeightFilterOptions = (items = []) => {
  const optionMap = new Map();

  items.forEach((item) => {
    buildGalleryWeightChoices(item).forEach((entry) => {
      if (!optionMap.has(entry.value)) {
        optionMap.set(entry.value, entry);
      }
    });
  });

  return Array.from(optionMap.values()).sort(
    (left, right) => Number(left.value) - Number(right.value),
  );
};
