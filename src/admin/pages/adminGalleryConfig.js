export const DEFAULT_GALLERY_EDITOR_OPTIONS = {
  cakeTypes: ["Cool cake", "Butter Cream cake"],
  eggOptions: ["Egg", "Eggless"],
  flavors: [
    "Vanilla",
    "Butterscotch",
    "Strawberry",
    "Chocolate",
    "Pineapple",
    "Red Velvet",
  ],
  fondantOptions: ["Full fondant", "Semi fondant"],
  photoOptions: ["Edible photo", "Non edible photo"],
  extras: ["Deposit", "Doll"],
};

export const GALLERY_LIST_SECTION_DEFINITIONS = [
  {
    key: "cakeTypes",
    area: "general",
    title: "Cake Type",
    description: "Add, edit, or create cake styles for this gallery item.",
    placeholder: "Add cake type",
  },
  {
    key: "eggOptions",
    area: "general",
    title: "Egg Type",
    description: "Add egg and eggless options for this design.",
    placeholder: "Add egg type",
  },
  {
    key: "flavors",
    area: "general",
    title: "Flavor",
    description: "Add, edit, or create flavors available for this cake.",
    placeholder: "Add flavor",
  },
  {
    key: "fondantOptions",
    area: "general",
    title: "Fondant",
    description: "Set fondant styles like full or semi fondant.",
    placeholder: "Add fondant option",
  },
  {
    key: "photoOptions",
    area: "extras",
    title: "Photo",
    description: "Choose the photo finish options for this cake.",
    placeholder: "Add photo option",
  },
  {
    key: "extras",
    area: "extras",
    title: "Extras",
    description: "Add, edit, or create extras like doll, deposit, and more.",
    placeholder: "Add extra",
  },
];

export const DEFAULT_GALLERY_FIELD_SECTIONS =
  GALLERY_LIST_SECTION_DEFINITIONS.map((section) => ({
    key: section.key,
    area: section.area,
    title: section.title,
    isCustom: false,
    pricingMode: section.area === "general" ? "per_kg" : "fixed",
    priceSource: "shared",
  }));

const SECTION_METADATA_BY_KEY = Object.fromEntries(
  GALLERY_LIST_SECTION_DEFINITIONS.map((section) => [section.key, section]),
);

const BUILT_IN_SECTION_KEYS = Object.keys(DEFAULT_GALLERY_EDITOR_OPTIONS);
const buildOptionPriceKey = (sectionKey = "", option = "") =>
  `${String(sectionKey || "").trim()}::${String(option || "").trim()}`;

const cloneOptionList = (items = []) =>
  items.map((item) => String(item || "").trim()).filter(Boolean);

const toUniqueOptions = (items = []) =>
  Array.from(new Set(cloneOptionList(items)));

const cloneFieldSections = (items = []) =>
  items
    .map((section) => ({
      key: String(section?.key || "").trim(),
      area: section?.area === "extras" ? "extras" : "general",
      title: String(section?.title || "").trim(),
      isCustom: Boolean(section?.isCustom),
      pricingMode:
        section?.pricingMode === "per_kg" ||
        (section?.pricingMode !== "fixed" &&
          section?.area !== "extras")
          ? "per_kg"
          : "fixed",
      priceSource:
        section?.area === "extras" && section?.priceSource === "per_image"
          ? "per_image"
          : "shared",
    }))
    .filter((section) => section.key && section.title);

const normalizeCategoryList = (items = [], fallbackCategory = "") =>
  Array.from(
    new Set(
      [
        ...(Array.isArray(items) ? items : []),
        String(fallbackCategory || "").trim(),
      ]
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  );

const cloneOptionCatalogEntries = (items = []) =>
  items
    .map((entry) => ({
      sectionKey: String(entry?.sectionKey || "").trim(),
      options: toUniqueOptions(entry?.options || []),
    }))
    .filter((entry) => entry.sectionKey);

const cloneOptionPriceEntries = (items = []) =>
  items
    .map((entry) => ({
      sectionKey: String(entry?.sectionKey || "").trim(),
      sectionTitle: String(entry?.sectionTitle || "").trim(),
      option: String(entry?.option || "").trim(),
      price: Math.max(0, Number(entry?.price) || 0),
    }))
    .filter((entry) => entry.sectionKey && entry.option);

const buildFieldSectionMap = (items = []) =>
  new Map(cloneFieldSections(items).map((section) => [section.key, section]));

const buildOptionPriceEntryMap = (items = []) =>
  new Map(
    cloneOptionPriceEntries(items).map((entry) => [
      buildOptionPriceKey(entry.sectionKey, entry.option),
      entry,
    ]),
  );

const cloneCombinationPriceEntries = (items = []) =>
  items
    .map((entry) => ({
      key: String(entry?.key || "").trim(),
      label: String(entry?.label || "").trim(),
      price: Math.max(0, Number(entry?.price) || 0),
      isEnabled: entry?.isEnabled !== false,
      selections: Array.isArray(entry?.selections)
        ? entry.selections
            .map((selection) => ({
              sectionKey: String(selection?.sectionKey || "").trim(),
              sectionTitle: String(selection?.sectionTitle || "").trim(),
              option: String(selection?.option || "").trim(),
            }))
            .filter((selection) => selection.sectionKey && selection.option)
        : [],
    }))
    .filter((entry) => entry.key);

const isDirectToggleSection = (section = {}) =>
  section?.area === "extras" && Boolean(section?.isCustom);

const stripImplicitToggleOptions = (section = {}, options = []) => {
  const normalizedOptions = toUniqueOptions(options || []);

  if (
    isDirectToggleSection(section) &&
    normalizedOptions.length === 1 &&
    normalizedOptions[0] === String(section?.title || "").trim()
  ) {
    return [];
  }

  return normalizedOptions;
};

const getAllowedSectionOptions = (section = {}, optionCatalogMap = {}) => {
  const configuredOptions = cloneOptionList(optionCatalogMap[section.key] || []);

  if (configuredOptions.length > 0) {
    return configuredOptions;
  }

  if (isDirectToggleSection(section)) {
    return cloneOptionList([section.title]);
  }

  return [];
};

export const isGallerySectionPriceSetPerImage = (section = {}) =>
  section?.area === "extras" && section?.priceSource === "per_image";

const mergeOptionPricesBySectionSource = ({
  fieldSections = [],
  sharedOptionPrices = [],
  itemOptionPrices = [],
}) => {
  const fieldSectionMap = buildFieldSectionMap(fieldSections);
  const sharedMap = buildOptionPriceEntryMap(sharedOptionPrices);
  const itemMap = buildOptionPriceEntryMap(itemOptionPrices);
  const allKeys = Array.from(new Set([...sharedMap.keys(), ...itemMap.keys()]));

  return allKeys
    .map((key) => {
      const sharedEntry = sharedMap.get(key) || null;
      const itemEntry = itemMap.get(key) || null;
      const baseEntry = sharedEntry || itemEntry;

      if (!baseEntry) {
        return null;
      }

      const section = fieldSectionMap.get(baseEntry.sectionKey) || {};
      const resolvedEntry = isGallerySectionPriceSetPerImage(section)
        ? itemEntry
        : sharedEntry || itemEntry;

      if (!resolvedEntry) {
        return null;
      }

      return {
        ...resolvedEntry,
        sectionTitle: section.title || resolvedEntry.sectionTitle,
      };
    })
    .filter(Boolean);
};

const filterSharedOptionPrices = (optionPrices = [], fieldSections = []) => {
  const fieldSectionMap = buildFieldSectionMap(fieldSections);

  return cloneOptionPriceEntries(optionPrices).filter((entry) => {
    const section = fieldSectionMap.get(entry.sectionKey) || {};
    return !isGallerySectionPriceSetPerImage(section);
  });
};

const buildLegacySectionOptionsMap = (item = {}) => {
  const fieldSections = Array.isArray(item?.fieldSections) ? item.fieldSections : [];
  const customSectionKeys = new Set(
    fieldSections
      .filter((section) => section?.isCustom)
      .map((section) => String(section?.key || "").trim())
      .filter(Boolean),
  );

  const legacySelections = {
    cakeTypes: item?.cakeTypes,
    eggOptions: item?.eggOptions,
    flavors: item?.flavors,
    fondantOptions: item?.fondantOptions,
    photoOptions: item?.photoOptions,
    extras: item?.extras,
  };

  customSectionKeys.forEach((sectionKey) => {
    legacySelections[sectionKey] =
      item?.[sectionKey] ||
      (Array.isArray(item?.customSections)
        ? item.customSections.find((section) => section?.key === sectionKey)?.options
        : []);
  });

  return Object.fromEntries(
    Object.entries(legacySelections).map(([sectionKey, options]) => [
      sectionKey,
      toUniqueOptions(options || []),
    ]),
  );
};

export const createDefaultGalleryFieldConfig = () => ({
  fieldSections: cloneFieldSections(DEFAULT_GALLERY_FIELD_SECTIONS),
  optionCatalogs: [
    ...Object.entries(DEFAULT_GALLERY_EDITOR_OPTIONS).map(
      ([sectionKey, options]) => ({
        sectionKey,
        options: cloneOptionList(options),
      }),
    ),
  ],
  optionPrices: [],
  combinationPrices: [],
});

export const buildOptionCatalogMap = (galleryFieldConfig = {}) => {
  const normalizedConfig = normalizeGalleryFieldConfig(galleryFieldConfig);
  const entries = normalizedConfig.optionCatalogs.map((entry) => [
    entry.sectionKey,
    cloneOptionList(entry.options),
  ]);

  return Object.fromEntries(entries);
};

export const normalizeGalleryFieldConfig = (source = {}, galleryItems = []) => {
  const fallbackConfig = createDefaultGalleryFieldConfig();
  const rawSections = Array.isArray(source?.fieldSections) ? source.fieldSections : [];
  const rawCatalogs = Array.isArray(source?.optionCatalogs) ? source.optionCatalogs : [];
  const rawOptionPrices = Array.isArray(source?.optionPrices)
    ? source.optionPrices
    : [];
  const rawCombinationPrices = Array.isArray(source?.combinationPrices)
    ? source.combinationPrices
    : [];
  const hasExplicitConfig =
    Array.isArray(source?.fieldSections) ||
    Array.isArray(source?.optionCatalogs) ||
    Array.isArray(source?.optionPrices) ||
    Array.isArray(source?.combinationPrices);

  const fieldSectionMap = new Map(
    (hasExplicitConfig ? [] : fallbackConfig.fieldSections).map((section) => [
      section.key,
      section,
    ]),
  );
  const optionCatalogMap = new Map(
    (hasExplicitConfig ? [] : fallbackConfig.optionCatalogs).map((entry) => [
      entry.sectionKey,
      entry.options,
    ]),
  );

  rawSections.forEach((section) => {
    const normalizedSection = cloneFieldSections([section])[0];
    if (normalizedSection) {
      fieldSectionMap.set(normalizedSection.key, normalizedSection);
    }
  });

  rawCatalogs.forEach((entry) => {
    const normalizedEntry = cloneOptionCatalogEntries([entry])[0];
    if (normalizedEntry) {
      optionCatalogMap.set(normalizedEntry.sectionKey, normalizedEntry.options);
    }
  });

  if (!hasExplicitConfig) {
    galleryItems.forEach((item) => {
      const itemSections = Array.isArray(item?.fieldSections) ? item.fieldSections : [];
      const itemSectionMap = new Map();

      itemSections.forEach((section) => {
        const normalizedSection = cloneFieldSections([section])[0];
        if (normalizedSection && !fieldSectionMap.has(normalizedSection.key)) {
          fieldSectionMap.set(normalizedSection.key, normalizedSection);
        }
        if (normalizedSection) {
          itemSectionMap.set(normalizedSection.key, normalizedSection);
        }
      });

      const legacySectionOptions = buildLegacySectionOptionsMap(item);
      Object.entries(legacySectionOptions).forEach(([sectionKey, options]) => {
        const section = itemSectionMap.get(sectionKey) || fieldSectionMap.get(sectionKey);
        const nextOptions = stripImplicitToggleOptions(section, options);
        if (!nextOptions.length) {
          return;
        }

        optionCatalogMap.set(
          sectionKey,
          toUniqueOptions([
            ...(optionCatalogMap.get(sectionKey) || []),
            ...nextOptions,
          ]),
        );
      });

      if (Array.isArray(item?.customSections)) {
        item.customSections.forEach((section) => {
          const sectionKey = String(section?.key || "").trim();
          if (!sectionKey) {
            return;
          }

          const normalizedSection =
            itemSectionMap.get(sectionKey) || cloneFieldSections([section])[0];
          const nextOptions = stripImplicitToggleOptions(
            normalizedSection,
            section?.options || [],
          );
          if (!nextOptions.length) {
            return;
          }

          optionCatalogMap.set(
            sectionKey,
            toUniqueOptions([
              ...(optionCatalogMap.get(sectionKey) || []),
              ...nextOptions,
            ]),
          );
        });
      }
    });
  }

  const fieldSections = Array.from(fieldSectionMap.values()).filter(Boolean);
  const resolvedFieldSections =
    fieldSections.length || hasExplicitConfig
      ? fieldSections
      : fallbackConfig.fieldSections;

  return {
    fieldSections: resolvedFieldSections,
    optionCatalogs: resolvedFieldSections.map((section) => ({
      sectionKey: section.key,
      options: toUniqueOptions(optionCatalogMap.get(section.key) || []),
    })),
    optionPrices: cloneOptionPriceEntries(rawOptionPrices),
    combinationPrices: cloneCombinationPriceEntries(rawCombinationPrices),
  };
};

export const createGalleryFieldConfigFromForm = (formData = {}, optionCatalogs = {}) => {
  const fieldSections = cloneFieldSections(formData.fieldSections || []);

  return {
    fieldSections,
    optionCatalogs: fieldSections.map((section) => ({
      sectionKey: section.key,
      options: toUniqueOptions(optionCatalogs[section.key] || []),
    })),
    optionPrices: filterSharedOptionPrices(formData.optionPrices || [], fieldSections),
    combinationPrices: cloneCombinationPriceEntries(formData.combinationPrices || []),
  };
};

const buildSectionSelectionMap = (item = {}, normalizedConfig = {}) => {
  const catalogMap = buildOptionCatalogMap(normalizedConfig);
  const rawSectionOptions = Array.isArray(item?.sectionOptions) ? item.sectionOptions : [];

  const selectionMap =
    rawSectionOptions.length > 0
      ? Object.fromEntries(
          rawSectionOptions.map((entry) => [
            String(entry?.sectionKey || "").trim(),
            toUniqueOptions(entry?.options || []),
          ]),
        )
      : buildLegacySectionOptionsMap(item);

  return Object.fromEntries(
    normalizedConfig.fieldSections.map((section) => [
      section.key,
      toUniqueOptions(selectionMap[section.key] || []).filter((option) =>
        getAllowedSectionOptions(section, catalogMap).includes(option),
      ),
    ]),
  );
};

export const createEmptyGalleryForm = (
  galleryFieldConfig = createDefaultGalleryFieldConfig(),
) => {
  const normalizedConfig = normalizeGalleryFieldConfig(galleryFieldConfig);
  const optionCatalogMap = buildOptionCatalogMap(normalizedConfig);
  const selectionDefaults = Object.fromEntries(
    normalizedConfig.fieldSections.map((section) => [
      section.key,
      cloneOptionList(optionCatalogMap[section.key] || []),
    ]),
  );

  return {
    title: "",
    category: "",
    categories: [],
    likes: 0,
    price: 0,
    priceLabel: "Starting at",
    configurationNote: "",
    optionPrices: mergeOptionPricesBySectionSource({
      fieldSections: normalizedConfig.fieldSections,
      sharedOptionPrices: normalizedConfig.optionPrices || [],
      itemOptionPrices: [],
    }),
    combinationPrices: cloneCombinationPriceEntries(
      normalizedConfig.combinationPrices || [],
    ),
    weightRange: {
      min: 1,
      max: 5,
      unit: "kg",
    },
    fieldSections: cloneFieldSections(normalizedConfig.fieldSections),
    customSections: normalizedConfig.fieldSections
      .filter((section) => section.isCustom)
      .map((section) => ({
        key: section.key,
        title: section.title,
        area: section.area,
      })),
    ...selectionDefaults,
  };
};

export const normalizeGalleryFormFromItem = (
  item = {},
  galleryFieldConfig = createDefaultGalleryFieldConfig(),
) => {
  const normalizedConfig = normalizeGalleryFieldConfig(galleryFieldConfig, [item]);
  const sectionSelections = buildSectionSelectionMap(item, normalizedConfig);

  return {
    title: item?.title || "",
    category:
      normalizeCategoryList(item?.categories, item?.category)[0] ||
      item?.category ||
      "",
    categories: normalizeCategoryList(item?.categories, item?.category),
    likes: Number(item?.likes) || 0,
    price: Number(item?.price) || 0,
    priceLabel: item?.priceLabel || "Starting at",
    configurationNote: item?.configurationNote || "",
    optionPrices: mergeOptionPricesBySectionSource({
      fieldSections: normalizedConfig.fieldSections,
      sharedOptionPrices: normalizedConfig.optionPrices || [],
      itemOptionPrices: item?.optionPrices || [],
    }),
    combinationPrices: cloneCombinationPriceEntries(
      normalizedConfig.combinationPrices || [],
    ),
    weightRange: {
      min: Number(item?.weightRange?.min) || 1,
      max: Number(item?.weightRange?.max) || 5,
      unit: String(item?.weightRange?.unit || "kg").trim() || "kg",
    },
    fieldSections: cloneFieldSections(normalizedConfig.fieldSections),
    customSections: normalizedConfig.fieldSections
      .filter((section) => section.isCustom)
      .map((section) => ({
        key: section.key,
        title: section.title,
        area: section.area,
      })),
    ...Object.fromEntries(
      normalizedConfig.fieldSections.map((section) => [
        section.key,
        cloneOptionList(sectionSelections[section.key] || []),
      ]),
    ),
  };
};

export const getGallerySectionMeta = (sectionKey) =>
  SECTION_METADATA_BY_KEY[sectionKey] || null;

export const getBuiltInGallerySectionKeys = () => [...BUILT_IN_SECTION_KEYS];
