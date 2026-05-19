const MAX_GALLERY_PRICE_COMBINATIONS = 200;

const toCleanText = (value = "") => String(value || "").trim();

export const buildGalleryCombinationKey = (selections = []) =>
  selections
    .map(
      (selection) =>
        `${toCleanText(selection.sectionKey)}:${toCleanText(selection.option)}`,
    )
    .join("||");

export const buildGalleryCombinationLabel = (selections = []) =>
  selections
    .map(
      (selection) =>
        `${toCleanText(selection.sectionTitle)}: ${toCleanText(selection.option)}`,
    )
    .join(" | ");

export const getGalleryPricingSections = (formData = {}) =>
  (Array.isArray(formData.fieldSections) ? formData.fieldSections : [])
    .map((section) => ({
      key: toCleanText(section?.key),
      title: toCleanText(section?.title),
      area: toCleanText(section?.area) || "general",
      options: Array.isArray(formData?.[section?.key])
        ? formData[section.key].map((option) => toCleanText(option)).filter(Boolean)
        : [],
    }))
    .filter((section) => section.key && section.title && section.options.length > 0);

export const buildGalleryPriceCombinations = (formData = {}) => {
  const sections = getGalleryPricingSections(formData);

  if (!sections.length) {
    return {
      combinations: [],
      totalCount: 0,
      isLimited: false,
    };
  }

  let isLimited = false;
  let combinations = [[]];

  for (const section of sections) {
    const nextCombinations = [];

    for (const combination of combinations) {
      for (const option of section.options) {
        nextCombinations.push([
          ...combination,
          {
            sectionKey: section.key,
            sectionTitle: section.title,
            option,
          },
        ]);

        if (nextCombinations.length >= MAX_GALLERY_PRICE_COMBINATIONS) {
          isLimited = true;
          break;
        }
      }

      if (isLimited) {
        break;
      }
    }

    combinations = nextCombinations;

    if (isLimited) {
      break;
    }
  }

  return {
    combinations: combinations.map((selections) => ({
      key: buildGalleryCombinationKey(selections),
      label: buildGalleryCombinationLabel(selections),
      selections,
    })),
    totalCount: sections.reduce(
      (product, section) => product * section.options.length,
      1,
    ),
    isLimited,
  };
};

export const mergeGalleryCombinationPrices = (
  combinations = [],
  savedPrices = [],
) => {
  const savedByKey = new Map(
    (Array.isArray(savedPrices) ? savedPrices : [])
      .map((entry) => [
        toCleanText(entry?.key),
        {
          key: toCleanText(entry?.key),
          label: toCleanText(entry?.label),
          price: Number(entry?.price) || 0,
          isEnabled: entry?.isEnabled !== false,
          selections: Array.isArray(entry?.selections) ? entry.selections : [],
        },
      ])
      .filter(([key]) => key),
  );
  const hasSavedEntries = savedByKey.size > 0;

  return combinations.map((combination) => ({
    ...combination,
    price: Number(savedByKey.get(combination.key)?.price) || 0,
    isEnabled:
      savedByKey.has(combination.key)
        ? savedByKey.get(combination.key)?.isEnabled !== false
        : !hasSavedEntries,
  }));
};

export const normalizeCombinationPricePayload = (formData = {}) => {
  const { combinations } = buildGalleryPriceCombinations(formData);
  const savedByKey = new Map(
    (Array.isArray(formData?.combinationPrices) ? formData.combinationPrices : [])
      .map((entry) => [
        toCleanText(entry?.key),
        {
          key: toCleanText(entry?.key),
          label: toCleanText(entry?.label),
          price: Number(entry?.price) || 0,
          isEnabled: entry?.isEnabled !== false,
          selections: Array.isArray(entry?.selections) ? entry.selections : [],
        },
      ])
      .filter(([key]) => key),
  );
  const hasSavedEntries = savedByKey.size > 0;

  return combinations.map((combination) => ({
    key: combination.key,
    label: combination.label,
    price: Number(savedByKey.get(combination.key)?.price) || 0,
    isEnabled:
      savedByKey.has(combination.key)
        ? savedByKey.get(combination.key)?.isEnabled !== false
        : !hasSavedEntries,
    selections: combination.selections,
  }));
};

export { MAX_GALLERY_PRICE_COMBINATIONS };
