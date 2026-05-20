import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
import { buildGalleryCombinationKey } from "@/admin/pages/adminGalleryPricingUtils";
import {
  buildGalleryWeightChoices,
  getGalleryWeightRange,
} from "@/utils/galleryItems";

const COMBINATION_SECTION_KEYS = ["cakeTypes", "eggOptions", "flavors"];
const PRICE_RANGE_OFFSET = 100;

const toUniqueOptions = (items = []) =>
  Array.from(
    new Set(items.map((item) => String(item || "").trim()).filter(Boolean)),
  );

const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

const getSectionPricingMode = (section = {}) =>
  section?.pricingMode === "fixed" ? "fixed" : "per_kg";

const getSectionPriceSource = (section = {}) =>
  section?.area === "extras" && section?.priceSource === "per_image"
    ? "per_image"
    : "shared";

const isDirectToggleSection = (section = {}, catalogOptions = []) =>
  section?.area === "extras" &&
  Boolean(section?.isCustom) &&
  (!Array.isArray(catalogOptions) || catalogOptions.length === 0);

const formatPriceDelta = (value, pricingMode = "fixed") =>
  Number(value || 0) > 0
    ? `+${formatCurrency(value)}${pricingMode === "per_kg" ? "/kg" : ""}`
    : "Included";

const formatSummarySelectionValue = ({
  price = 0,
  isPerKg = false,
  weightMultiplier = 1,
}) => {
  if (!isPerKg) {
    return formatCurrency(price);
  }

  return `${formatCurrency(price)}/kg (${formatCurrency(
    Number(price || 0) * Number(weightMultiplier || 1),
  )})`;
};

const buildOptionCatalogMap = (galleryFieldConfig = {}, item = {}) => {
  const catalogMap = new Map();

  if (Array.isArray(galleryFieldConfig?.optionCatalogs)) {
    galleryFieldConfig.optionCatalogs.forEach((entry) => {
      const sectionKey = String(entry?.sectionKey || "").trim();
      if (sectionKey) {
        catalogMap.set(sectionKey, toUniqueOptions(entry?.options || []));
      }
    });
  }

  if (Array.isArray(item?.customSections)) {
    item.customSections.forEach((section) => {
      const sectionKey = String(section?.key || "").trim();
      if (sectionKey) {
        catalogMap.set(
          sectionKey,
          toUniqueOptions([
            ...(catalogMap.get(sectionKey) || []),
            ...(section?.options || []),
          ]),
        );
      }
    });
  }

  return Object.fromEntries(catalogMap);
};

const buildFieldSections = (galleryFieldConfig = {}, item = {}) => {
  const sharedSections = Array.isArray(galleryFieldConfig?.fieldSections)
    ? galleryFieldConfig.fieldSections
    : [];

  const normalizeSection = (section = {}) => ({
    key: String(section?.key || "").trim(),
    title: String(section?.title || "").trim(),
    area: section?.area === "extras" ? "extras" : "general",
    isCustom: Boolean(section?.isCustom),
    pricingMode: getSectionPricingMode(section),
    priceSource: getSectionPriceSource(section),
  });

  if (sharedSections.length) {
    return sharedSections
      .map((section) => normalizeSection(section))
      .filter((section) => section.key && section.title);
  }

  return (Array.isArray(item?.fieldSections) ? item.fieldSections : [])
    .map((section) => normalizeSection(section))
    .filter((section) => section.key && section.title);
};

const buildSectionSelectionMap = (item = {}) => {
  const sectionMap = new Map();

  if (Array.isArray(item?.sectionOptions) && item.sectionOptions.length > 0) {
    item.sectionOptions.forEach((entry) => {
      const sectionKey = String(entry?.sectionKey || "").trim();
      if (sectionKey) {
        sectionMap.set(sectionKey, toUniqueOptions(entry?.options || []));
      }
    });
    return sectionMap;
  }

  [
    ["cakeTypes", item?.cakeTypes],
    ["eggOptions", item?.eggOptions],
    ["flavors", item?.flavors],
    ["fondantOptions", item?.fondantOptions],
    ["photoOptions", item?.photoOptions],
    ["extras", item?.extras],
  ].forEach(([sectionKey, options]) => {
    sectionMap.set(sectionKey, toUniqueOptions(options || []));
  });

  if (Array.isArray(item?.customSections)) {
    item.customSections.forEach((section) => {
      const sectionKey = String(section?.key || "").trim();
      if (!sectionKey) {
        return;
      }

      sectionMap.set(
        sectionKey,
        toUniqueOptions(item?.[sectionKey] || section?.options || []),
      );
    });
  }

  return sectionMap;
};

const buildSharedOptionPrices = (galleryFieldConfig = {}, item = {}) =>
  Array.isArray(galleryFieldConfig?.optionPrices) &&
  galleryFieldConfig.optionPrices.length > 0
    ? galleryFieldConfig.optionPrices
    : Array.isArray(item?.optionPrices)
      ? item.optionPrices
      : [];

const buildSharedCombinationPrices = (galleryFieldConfig = {}) =>
  Array.isArray(galleryFieldConfig?.combinationPrices)
    ? galleryFieldConfig.combinationPrices
    : [];

const findOptionPrice = (entries = [], sectionKey, option) =>
  Number(
    (Array.isArray(entries) ? entries : []).find(
      (entry) =>
        entry.sectionKey === sectionKey &&
        String(entry.option || "").trim() === String(option || "").trim(),
    )?.price || 0,
  );

const resolveOptionPrice = ({
  sharedEntries = [],
  itemEntries = [],
  section = {},
  option = "",
}) => {
  if (getSectionPriceSource(section) === "per_image") {
    return findOptionPrice(itemEntries, section.key, option);
  }

  return (
    findOptionPrice(sharedEntries, section.key, option) ||
    findOptionPrice(itemEntries, section.key, option)
  );
};

const getCombinationOption = (entry, sectionKey) =>
  String(
    (Array.isArray(entry?.selections) ? entry.selections : []).find(
      (selection) => selection.sectionKey === sectionKey,
    )?.option || "",
  ).trim();

const OptionField = ({
  title,
  options = [],
  selectedValue = "",
  onSelect,
  note = "",
  compact = false,
}) => (
  <SurfaceCard className="p-4 sm:p-5">
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-primary-900">{title}</p>
        {note ? <p className="mt-1 text-xs text-primary-600">{note}</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={`${title}-${option.value}`}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                compact ? "min-w-[88px]" : ""
              } ${
                isSelected
                  ? "border-[#b45f40] bg-[#b45f40] text-white shadow-[0_14px_24px_rgba(180,95,64,0.24)]"
                  : "border-[rgba(42,31,14,0.12)] bg-white text-primary-800 hover:border-[#d3b18f] hover:bg-[#fff8f1]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  </SurfaceCard>
);

const WeightSliderField = ({
  title,
  options = [],
  selectedValue = "",
  onSelect,
  note = "",
}) => {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === selectedValue),
  );
  const activeOption = options[selectedIndex] || options[0] || null;
  const fillWidth =
    options.length <= 1 ? 100 : (selectedIndex / (options.length - 1)) * 100;
  const minWidth = Math.max(options.length * 72, 320);

  if (!options.length) {
    return null;
  }

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary-900">{title}</p>
            {note ? <p className="mt-1 text-xs text-primary-600">{note}</p> : null}
          </div>
          <div className="rounded-full bg-[#fff5d8] px-4 py-2 text-sm font-semibold text-primary-900">
            {activeOption?.label}
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="relative pt-4" style={{ minWidth }}>
            <div className="absolute left-0 right-0 top-7 h-1 rounded-full bg-[rgba(42,31,14,0.12)]" />
            <div
              className="absolute left-0 top-7 h-1 rounded-full bg-[#b45f40]"
              style={{ width: `${fillWidth}%` }}
            />
            <input
              type="range"
              min="0"
              max={Math.max(options.length - 1, 0)}
              step="1"
              value={selectedIndex}
              onChange={(event) =>
                onSelect(options[Number(event.target.value)]?.value || "")
              }
              className="absolute left-0 right-0 top-[6px] h-10 w-full cursor-grab opacity-0"
              aria-label="Select cake weight"
            />
            <div
              className="relative grid"
              style={{
                gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === selectedValue;

                return (
                  <button
                    key={`weight-${option.value}`}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    className="flex flex-col items-center gap-2 text-center"
                  >
                    <span
                      className={`relative z-10 h-5 w-5 rounded-full border-4 transition-all ${
                        isSelected
                          ? "border-[#b45f40] bg-white shadow-[0_0_0_6px_rgba(180,95,64,0.18)]"
                          : "border-white bg-[#d8c4ae] shadow-[0_0_0_2px_rgba(42,31,14,0.12)]"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-semibold sm:text-xs ${
                        isSelected ? "text-primary-900" : "text-primary-500"
                      }`}
                    >
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
};

const BreakdownRow = ({ label, value, strong = false }) => (
  <div className="flex items-start justify-between gap-4 py-2 text-sm">
    <span className={strong ? "font-semibold text-primary-900" : "text-primary-700"}>
      {label}
    </span>
    <span className={strong ? "font-semibold text-primary-900" : "text-primary-900"}>
      {value}
    </span>
  </div>
);

const GalleryCalculatorModal = ({ item, galleryFieldConfig, onClose }) => {
  const [selectedWeight, setSelectedWeight] = useState("");
  const [selectedOptions, setSelectedOptions] = useState({});
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownTab, setBreakdownTab] = useState("summary");

  const sharedOptionPrices = useMemo(
    () => buildSharedOptionPrices(galleryFieldConfig, item),
    [galleryFieldConfig, item],
  );
  const itemOptionPrices = useMemo(
    () => (Array.isArray(item?.optionPrices) ? item.optionPrices : []),
    [item],
  );

  const enabledCombinationPrices = useMemo(
    () =>
      buildSharedCombinationPrices(galleryFieldConfig).filter(
        (entry) => entry?.isEnabled !== false,
      ),
    [galleryFieldConfig],
  );

  const hasCombinationPricing = enabledCombinationPrices.length > 0;
  const weightRange = useMemo(() => getGalleryWeightRange(item), [item]);
  const weightChoices = useMemo(() => buildGalleryWeightChoices(item), [item]);
  const selectedWeightValue = Number(selectedWeight || 0);
  const weightMultiplier = selectedWeightValue > 0 ? selectedWeightValue : 1;
  const hasWeightSelection = !weightRange || selectedWeightValue > 0;

  const baseSelectableSections = useMemo(() => {
    if (!item) {
      return [];
    }

    const fieldSections = buildFieldSections(galleryFieldConfig, item);
    const optionCatalogMap = buildOptionCatalogMap(galleryFieldConfig, item);
    const sectionSelectionMap = buildSectionSelectionMap(item);

    return fieldSections
      .map((section) => ({
        ...section,
        options: COMBINATION_SECTION_KEYS.includes(section.key)
          ? toUniqueOptions(optionCatalogMap[section.key] || [])
          : (() => {
              const selectedSectionOptions = toUniqueOptions(
                sectionSelectionMap.get(section.key) || [],
              );
              const catalogOptions = optionCatalogMap[section.key];

              if (Array.isArray(catalogOptions) && catalogOptions.length > 0) {
                return selectedSectionOptions.filter((option) =>
                  catalogOptions.includes(option),
                );
              }

              if (isDirectToggleSection(section, catalogOptions)) {
                return selectedSectionOptions;
              }

              return selectedSectionOptions;
            })(),
      }))
      .filter((section) => section.options.length > 0);
  }, [galleryFieldConfig, item]);

  const selectableSections = useMemo(
    () =>
      baseSelectableSections
        .map((section) => {
          if (
            !hasCombinationPricing ||
            !COMBINATION_SECTION_KEYS.includes(section.key)
          ) {
            return section;
          }

          if (section.key === "cakeTypes") {
            return {
              ...section,
              options: section.options.filter((option) =>
                enabledCombinationPrices.some(
                  (entry) => getCombinationOption(entry, "cakeTypes") === option,
                ),
              ),
            };
          }

          if (section.key === "eggOptions") {
            const selectedCakeType = String(selectedOptions.cakeTypes || "").trim();

            return {
              ...section,
              options: section.options.filter((option) =>
                enabledCombinationPrices.some((entry) => {
                  const cakeType = getCombinationOption(entry, "cakeTypes");
                  const eggType = getCombinationOption(entry, "eggOptions");

                  return (
                    (!selectedCakeType || cakeType === selectedCakeType) &&
                    eggType === option
                  );
                }),
              ),
            };
          }

          if (section.key === "flavors") {
            const selectedCakeType = String(selectedOptions.cakeTypes || "").trim();
            const selectedEggType = String(selectedOptions.eggOptions || "").trim();

            return {
              ...section,
              options: section.options.filter((option) =>
                enabledCombinationPrices.some((entry) => {
                  const cakeType = getCombinationOption(entry, "cakeTypes");
                  const eggType = getCombinationOption(entry, "eggOptions");
                  const flavor = getCombinationOption(entry, "flavors");

                  return (
                    (!selectedCakeType || cakeType === selectedCakeType) &&
                    (!selectedEggType || eggType === selectedEggType) &&
                    flavor === option
                  );
                }),
              ),
            };
          }

          return section;
        })
        .filter((section) => section.options.length > 0),
    [
      baseSelectableSections,
      enabledCombinationPrices,
      hasCombinationPricing,
      selectedOptions.cakeTypes,
      selectedOptions.eggOptions,
    ],
  );

  const customerSelectableSections = useMemo(
    () =>
      selectableSections.filter((section) => section.area === "general"),
    [selectableSections],
  );

  const automaticExtraSections = useMemo(
    () =>
      selectableSections.filter((section) => section.area === "extras"),
    [selectableSections],
  );

  useEffect(() => {
    setSelectedOptions((current) =>
      Object.fromEntries(
        customerSelectableSections.map((section) => {
          const currentValue = String(current[section.key] || "").trim();
          const fallbackValue =
            section.options.length === 1 ? section.options[0] || "" : "";

          return [
            section.key,
            section.options.includes(currentValue) ? currentValue : fallbackValue,
          ];
        }),
      ),
    );
  }, [customerSelectableSections]);

  useEffect(() => {
    if (!weightChoices.length) {
      setSelectedWeight("");
      return;
    }

    setSelectedWeight((current) => {
      if (weightChoices.some((entry) => entry.value === current)) {
        return current;
      }

      return weightChoices[0]?.value || "";
    });
  }, [weightChoices]);

  useEffect(() => {
    setShowBreakdown(false);
    setBreakdownTab("summary");
  }, [item?._id]);

  const coreSections = useMemo(
    () =>
      customerSelectableSections.filter((section) =>
        COMBINATION_SECTION_KEYS.includes(section.key),
      ),
    [customerSelectableSections],
  );

  const customerAddOnSections = useMemo(
    () =>
      customerSelectableSections.filter(
        (section) => !COMBINATION_SECTION_KEYS.includes(section.key),
      ),
    [customerSelectableSections],
  );

  const automaticAddOnEntries = useMemo(
    () =>
      automaticExtraSections.flatMap((section) => {
        const pricingMode = getSectionPricingMode(section);

        return section.options.map((option) => ({
          sectionKey: section.key,
          sectionTitle: section.title,
          option,
          price: resolveOptionPrice({
            sharedEntries: sharedOptionPrices,
            itemEntries: itemOptionPrices,
            section,
            option,
          }),
          pricingMode,
          isPerKg: pricingMode === "per_kg",
          isAutomatic: true,
        }));
      }),
    [automaticExtraSections, itemOptionPrices, sharedOptionPrices],
  );

  const isEstimateReady = useMemo(() => {
    if (hasCombinationPricing) {
      return (
        coreSections.length > 0 &&
        hasWeightSelection &&
        coreSections.every((section) =>
          String(selectedOptions[section.key] || "").trim(),
        )
      );
    }

    return (
      hasWeightSelection &&
      (Boolean(weightRange) ||
        automaticAddOnEntries.length > 0 ||
        Object.values(selectedOptions).some((value) =>
          String(value || "").trim(),
        ))
    );
  }, [
    automaticAddOnEntries.length,
    coreSections,
    hasCombinationPricing,
    hasWeightSelection,
    selectedOptions,
    weightRange,
  ]);

  useEffect(() => {
    if (!isEstimateReady) {
      setShowBreakdown(false);
    }
  }, [isEstimateReady]);

  const selectedCombinationEntry = useMemo(() => {
    if (!hasCombinationPricing || !isEstimateReady) {
      return null;
    }

    const selectedCakeType = String(selectedOptions.cakeTypes || "").trim();
    const selectedEggType = String(selectedOptions.eggOptions || "").trim();
    const selectedFlavor = String(selectedOptions.flavors || "").trim();

    const combinationKey = buildGalleryCombinationKey([
      {
        sectionKey: "cakeTypes",
        sectionTitle: "Cake Type",
        option: selectedCakeType,
      },
      {
        sectionKey: "eggOptions",
        sectionTitle: "Egg Type",
        option: selectedEggType,
      },
      {
        sectionKey: "flavors",
        sectionTitle: "Flavor",
        option: selectedFlavor,
      },
    ]);

    return (
      enabledCombinationPrices.find(
        (entry) => String(entry.key || "").trim() === combinationKey,
      ) || null
    );
  }, [enabledCombinationPrices, hasCombinationPricing, isEstimateReady, selectedOptions]);

  const selectedCustomerAddOnEntries = useMemo(
    () =>
      customerAddOnSections
        .map((section) => {
          const selectedOption = String(selectedOptions[section.key] || "").trim();
          if (!selectedOption) {
            return null;
          }

          const pricingMode = getSectionPricingMode(section);

          return {
            sectionKey: section.key,
            sectionTitle: section.title,
            option: selectedOption,
            price: resolveOptionPrice({
              sharedEntries: sharedOptionPrices,
              itemEntries: itemOptionPrices,
              section,
              option: selectedOption,
            }),
            pricingMode,
            isPerKg: pricingMode === "per_kg",
            isAutomatic: false,
          };
        })
        .filter(Boolean),
    [customerAddOnSections, itemOptionPrices, selectedOptions, sharedOptionPrices],
  );

  const allAddOnEntries = useMemo(
    () => [...selectedCustomerAddOnEntries, ...automaticAddOnEntries],
    [automaticAddOnEntries, selectedCustomerAddOnEntries],
  );

  const priceBreakdown = useMemo(() => {
    const basePricePerKg = Number(item?.price) || 0;
    const combinationPricePerKg = Number(selectedCombinationEntry?.price || 0);

    const perKgSelections = [
      {
        label: item?.priceLabel
          ? `${item.priceLabel} base price`
          : "Base cake price",
        value: basePricePerKg,
      },
      ...(combinationPricePerKg > 0
        ? [
            {
              label:
                selectedCombinationEntry?.label ||
                "Cake type, egg type, and flavor combination",
              value: combinationPricePerKg,
            },
          ]
        : []),
      ...allAddOnEntries
        .filter((entry) => entry.isPerKg)
        .map((entry) => ({
          label: `${entry.sectionTitle}: ${entry.option}`,
          value: Number(entry.price || 0),
        })),
    ];

    const fixedSelections = allAddOnEntries
      .filter((entry) => !entry.isPerKg)
      .map((entry) => ({
        label: `${entry.sectionTitle}: ${entry.option}`,
        value: Number(entry.price || 0),
      }));

    const perKgSubtotal = perKgSelections.reduce(
      (sum, entry) => sum + Number(entry.value || 0),
      0,
    );
    const fixedSubtotal = fixedSelections.reduce(
      (sum, entry) => sum + Number(entry.value || 0),
      0,
    );
    const weightAdjustedSubtotal = perKgSubtotal * weightMultiplier;
    const total = weightAdjustedSubtotal + fixedSubtotal;

    return {
      basePricePerKg,
      combinationPricePerKg,
      perKgSelections,
      fixedSelections,
      perKgSubtotal,
      fixedSubtotal,
      weightAdjustedSubtotal,
      total,
    };
  }, [allAddOnEntries, item, selectedCombinationEntry, weightMultiplier]);

  const coreFieldOptions = useMemo(
    () =>
      coreSections.map((section) => ({
        ...section,
        options: section.options.map((option) => ({
          value: option,
          label: option,
        })),
      })),
    [coreSections],
  );

  const addOnFieldOptions = useMemo(
    () =>
      customerAddOnSections.map((section) => ({
        ...section,
        options: section.options.map((option) => ({
          value: option,
          label: `${option} ${formatPriceDelta(
            resolveOptionPrice({
              sharedEntries: sharedOptionPrices,
              itemEntries: itemOptionPrices,
              section,
              option,
            }),
            getSectionPricingMode(section),
          )}`,
        })),
      })),
    [customerAddOnSections, itemOptionPrices, sharedOptionPrices],
  );

  const estimatedRange = useMemo(() => {
    if (!isEstimateReady) {
      return null;
    }

    return {
      min: Math.max(0, priceBreakdown.total - PRICE_RANGE_OFFSET),
      max: priceBreakdown.total + PRICE_RANGE_OFFSET,
    };
  }, [isEstimateReady, priceBreakdown.total]);

  const breakdownTabs = useMemo(
    () =>
      [
        { key: "summary", label: "Summary" },
        { key: "perkg", label: "Per kg" },
        priceBreakdown.fixedSelections.length
          ? { key: "extras", label: "Extras" }
          : null,
      ].filter(Boolean),
    [priceBreakdown.fixedSelections.length],
  );

  const selectionSummary = useMemo(
    () =>
      [
        selectedWeightValue > 0 ? { label: "Weight", value: `${selectedWeightValue} kg` } : null,
        ...coreSections.map((section) => {
          const value = String(selectedOptions[section.key] || "").trim();
          return value ? { label: section.title, value } : null;
        }),
        ...selectedCustomerAddOnEntries.map((entry) => ({
          label: entry.sectionTitle,
          value: entry.option,
        })),
      ].filter(Boolean),
    [coreSections, selectedCustomerAddOnEntries, selectedOptions, selectedWeightValue],
  );

  const estimateSummarySelections = useMemo(
    () =>
      allAddOnEntries.map((entry) => ({
        label: `${entry.sectionTitle}: ${entry.option}`,
        value: formatSummarySelectionValue({
          price: entry.price,
          isPerKg: entry.isPerKg,
          weightMultiplier,
        }),
      })),
    [allAddOnEntries, weightMultiplier],
  );

  if (!item) {
    return null;
  }

  return (
    <Modal
      title={`Configure ${item.title || "Cake"}`}
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      footer={
        <div className="flex justify-end gap-3">
          <ActionButton type="button" variant="secondary" onClick={onClose}>
            Close
          </ActionButton>
        </div>
      }
    >
      <div className="space-y-5">
        {!selectableSections.length && !weightChoices.length ? (
          <SurfaceCard className="p-4 sm:p-5">
            <p className="text-sm text-primary-600">
              No calculator fields are enabled for this cake right now.
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-5">
            {weightChoices.length ? (
              <WeightSliderField
                title="Weight"
                options={weightChoices}
                selectedValue={selectedWeight}
                onSelect={setSelectedWeight}
                note="Drag the slider or tap a point to choose your cake weight."
              />
            ) : null}

            {coreFieldOptions.map((section) => (
              <OptionField
                key={section.key}
                title={section.title}
                options={section.options}
                selectedValue={selectedOptions[section.key] || ""}
                onSelect={(value) =>
                  setSelectedOptions((current) => ({
                    ...current,
                    [section.key]: value,
                  }))
                }
              />
            ))}

            {addOnFieldOptions.map((section) => (
              <OptionField
                key={section.key}
                title={section.title}
                options={section.options}
                selectedValue={selectedOptions[section.key] || ""}
                onSelect={(value) =>
                  setSelectedOptions((current) => ({
                    ...current,
                    [section.key]: current[section.key] === value ? "" : value,
                  }))
                }
                note={
                  getSectionPriceSource(section) === "per_image"
                    ? getSectionPricingMode(section) === "per_kg"
                      ? "This extra uses the price set for this cake image, per kg."
                      : "This extra uses the price set for this cake image."
                    : getSectionPricingMode(section) === "per_kg"
                      ? "This field is charged per kg."
                      : "This field is added as a fixed amount."
                }
              />
            ))}

            {estimatedRange ? (
              <SurfaceCard className="overflow-hidden">
                <div className="bg-[linear-gradient(180deg,#2f2319_0%,#1f1711_100%)] p-5 text-white sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/70">
                        Estimated price range
                      </p>
                      <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                        {formatCurrency(estimatedRange.min)} -{" "}
                        {formatCurrency(estimatedRange.max)}
                      </p>
                      <p className="mt-3 max-w-2xl text-sm text-white/75">
                        Estimated price only. Final price may vary after design
                        confirmation, custom decoration, and finishing details.
                      </p>
                    </div>
                    <ActionButton
                      type="button"
                      variant="secondary"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                      onClick={() => setShowBreakdown((current) => !current)}
                    >
                      {showBreakdown ? "Hide Price Details" : "View Price Details"}
                    </ActionButton>
                  </div>
                </div>

                {showBreakdown ? (
                  <div className="space-y-4 bg-[#fffaf2] p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                      {breakdownTabs.map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setBreakdownTab(tab.key)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                            breakdownTab === tab.key
                              ? "border-primary-900 bg-primary-900 text-white"
                              : "border-[rgba(42,31,14,0.14)] bg-white text-primary-800"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {breakdownTab === "summary" ? (
                      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
                        <SurfaceCard className="p-4 sm:p-5">
                          <p className="text-sm font-semibold text-primary-900">
                            Selected cake plan
                          </p>
                          <div className="mt-3 divide-y divide-[rgba(42,31,14,0.08)]">
                            {selectionSummary.map((entry) => (
                              <BreakdownRow
                                key={`${entry.label}-${entry.value}`}
                                label={entry.label}
                                value={entry.value}
                              />
                            ))}
                          </div>
                        </SurfaceCard>

                        <SurfaceCard className="p-4 sm:p-5">
                          <p className="text-sm font-semibold text-primary-900">
                            Estimate summary
                          </p>
                          <div className="mt-3 divide-y divide-[rgba(42,31,14,0.08)]">
                            <BreakdownRow
                              label="Per kg subtotal"
                              value={formatCurrency(priceBreakdown.perKgSubtotal)}
                            />
                            <BreakdownRow
                              label={`Weight x ${selectedWeightValue || 1} kg`}
                              value={formatCurrency(
                                priceBreakdown.weightAdjustedSubtotal,
                              )}
                            />
                            {estimateSummarySelections.map((entry) => (
                              <BreakdownRow
                                key={`summary-${entry.label}`}
                                label={entry.label}
                                value={entry.value}
                              />
                            ))}
                            <BreakdownRow
                              label="Estimated total"
                              value={formatCurrency(priceBreakdown.total)}
                              strong
                            />
                          </div>
                        </SurfaceCard>
                      </div>
                    ) : null}

                    {breakdownTab === "perkg" ? (
                      <SurfaceCard className="p-4 sm:p-5">
                        <p className="text-sm font-semibold text-primary-900">
                          Per kg calculation
                        </p>
                        <div className="mt-3 divide-y divide-[rgba(42,31,14,0.08)]">
                          {priceBreakdown.perKgSelections.map((entry) => (
                            <BreakdownRow
                              key={`perkg-${entry.label}`}
                              label={entry.label}
                              value={formatCurrency(entry.value)}
                            />
                          ))}
                          <BreakdownRow
                            label="Per kg subtotal"
                            value={formatCurrency(priceBreakdown.perKgSubtotal)}
                            strong
                          />
                          <BreakdownRow
                            label={`Per kg subtotal x ${selectedWeightValue || 1} kg`}
                            value={formatCurrency(
                              priceBreakdown.weightAdjustedSubtotal,
                            )}
                            strong
                          />
                        </div>
                      </SurfaceCard>
                    ) : null}

                    {breakdownTab === "extras" ? (
                      <SurfaceCard className="p-4 sm:p-5">
                        <p className="text-sm font-semibold text-primary-900">
                          Fixed extras
                        </p>
                        <div className="mt-3 divide-y divide-[rgba(42,31,14,0.08)]">
                          {priceBreakdown.fixedSelections.map((entry) => (
                            <BreakdownRow
                              key={`fixed-${entry.label}`}
                              label={entry.label}
                              value={formatCurrency(entry.value)}
                            />
                          ))}
                          <BreakdownRow
                            label="Fixed extras subtotal"
                            value={formatCurrency(priceBreakdown.fixedSubtotal)}
                            strong
                          />
                        </div>
                      </SurfaceCard>
                    ) : null}
                  </div>
                ) : null}
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-4 sm:p-5 text-sm text-primary-600">
                Select the available fields to see the estimate.
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GalleryCalculatorModal;
