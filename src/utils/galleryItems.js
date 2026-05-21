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

export const getGalleryItemCategories = (item = {}) =>
  toUniqueOptions([
    ...(Array.isArray(item?.categories) ? item.categories : []),
    item?.category,
  ]);

export const getPrimaryGalleryCategory = (item = {}) =>
  getGalleryItemCategories(item)[0] || "";

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
  const indexedItems = items.map((item, index) => ({
    item,
    index,
    categoryKey: buildGalleryCodePrefix(getPrimaryGalleryCategory(item)),
  }));
  const categoryGroups = new Map();

  indexedItems.forEach((entry) => {
    if (!categoryGroups.has(entry.categoryKey)) {
      categoryGroups.set(entry.categoryKey, []);
    }

    categoryGroups.get(entry.categoryKey).push(entry);
  });

  const codeByIndex = new Map();

  categoryGroups.forEach((entries, categoryKey) => {
    const sortedEntries = [...entries].sort((left, right) => {
      const leftTime = new Date(
        left.item?.createdAt || left.item?.updatedAt || 0,
      ).getTime();
      const rightTime = new Date(
        right.item?.createdAt || right.item?.updatedAt || 0,
      ).getTime();

      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const leftId = String(left.item?._id || "");
      const rightId = String(right.item?._id || "");

      if (leftId && rightId && leftId !== rightId) {
        return leftId.localeCompare(rightId);
      }

      return left.index - right.index;
    });

    sortedEntries.forEach((entry, orderIndex) => {
      const codeNumber = String(orderIndex + 1).padStart(2, "0");
      codeByIndex.set(entry.index, {
        cakeCode: `${categoryKey}-#${codeNumber}`,
        cakeCodeSearch: `${categoryKey}-${codeNumber}`,
      });
    });
  });

  return indexedItems.map((entry) => ({
    ...entry.item,
    ...(codeByIndex.get(entry.index) || {
      cakeCode: `${entry.categoryKey}-#01`,
      cakeCodeSearch: `${entry.categoryKey}-01`,
    }),
  }));
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

export const matchesGalleryCategoryFilter = (item = {}, selectedCategory = "") => {
  const normalizedValue = toTrimmedString(selectedCategory);

  if (!normalizedValue || normalizedValue === "All") {
    return true;
  }

  return getGalleryItemCategories(item).includes(normalizedValue);
};
