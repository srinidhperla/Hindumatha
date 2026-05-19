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

const formatPriceDelta = (value) =>
  Number(value || 0) > 0 ? `+${formatCurrency(value)}` : "Included";

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

  if (sharedSections.length) {
    return sharedSections
      .map((section) => ({
        key: String(section?.key || "").trim(),
        title: String(section?.title || "").trim(),
        area: section?.area === "extras" ? "extras" : "general",
        isCustom: Boolean(section?.isCustom),
      }))
      .filter((section) => section.key && section.title);
  }

  return (Array.isArray(item?.fieldSections) ? item.fieldSections : [])
    .map((section) => ({
      key: String(section?.key || "").trim(),
      title: String(section?.title || "").trim(),
      area: section?.area === "extras" ? "extras" : "general",
      isCustom: Boolean(section?.isCustom),
    }))
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

const GalleryCalculatorModal = ({ item, galleryFieldConfig, onClose }) => {
  const [selectedWeight, setSelectedWeight] = useState("");
  const sharedOptionPrices = useMemo(
    () => buildSharedOptionPrices(galleryFieldConfig, item),
    [galleryFieldConfig, item],
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
          : toUniqueOptions(sectionSelectionMap.get(section.key) || []).filter(
              (option) => {
                const catalogOptions = optionCatalogMap[section.key];
                return Array.isArray(catalogOptions)
                  ? catalogOptions.includes(option)
                  : true;
              },
            ),
      }))
      .filter((section) => section.options.length > 0);
  }, [galleryFieldConfig, item]);

  const [selectedOptions, setSelectedOptions] = useState({});

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

  useEffect(() => {
    setSelectedOptions((current) =>
      Object.fromEntries(
        selectableSections.map((section) => {
          const currentValue = String(current[section.key] || "").trim();
          return [
            section.key,
            section.options.includes(currentValue) ? currentValue : "",
          ];
        }),
      ),
    );
  }, [selectableSections]);

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

  const coreSections = useMemo(
    () =>
      selectableSections.filter((section) =>
        COMBINATION_SECTION_KEYS.includes(section.key),
      ),
    [selectableSections],
  );

  const addOnSections = useMemo(
    () =>
      selectableSections.filter(
        (section) => !COMBINATION_SECTION_KEYS.includes(section.key),
      ),
    [selectableSections],
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
        Object.values(selectedOptions).some((value) =>
          String(value || "").trim(),
        ))
    );
  }, [
    coreSections,
    hasCombinationPricing,
    hasWeightSelection,
    selectedOptions,
    weightRange,
  ]);

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

  const selectedAddOnEntries = useMemo(
    () =>
      addOnSections
        .map((section) => {
          const selectedOption = String(selectedOptions[section.key] || "").trim();
          if (!selectedOption) {
            return null;
          }

          return {
            sectionKey: section.key,
            sectionTitle: section.title,
            option: selectedOption,
            price: findOptionPrice(sharedOptionPrices, section.key, selectedOption),
            isPerKg: section.area === "general",
          };
        })
        .filter(Boolean),
    [addOnSections, selectedOptions, sharedOptionPrices],
  );

  const priceBreakdown = useMemo(() => {
    const basePricePerKg = Number(item?.price) || 0;
    const combinationPricePerKg = Number(selectedCombinationEntry?.price || 0);
    const perKgAddOnPrice = selectedAddOnEntries.reduce(
      (sum, entry) => sum + (entry.isPerKg ? Number(entry.price || 0) : 0),
      0,
    );
    const fixedAddOnPrice = selectedAddOnEntries.reduce(
      (sum, entry) => sum + (!entry.isPerKg ? Number(entry.price || 0) : 0),
      0,
    );
    const perKgSubtotal =
      basePricePerKg + combinationPricePerKg + perKgAddOnPrice;
    const scaledTotal = perKgSubtotal * weightMultiplier;
    const total = scaledTotal + fixedAddOnPrice;

    return {
      basePricePerKg,
      combinationPricePerKg,
      perKgAddOnPrice,
      fixedAddOnPrice,
      perKgSubtotal,
      total,
    };
  }, [item, selectedAddOnEntries, selectedCombinationEntry, weightMultiplier]);
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
      addOnSections.map((section) => ({
        ...section,
        options: section.options.map((option) => ({
          value: option,
          label:
            section.area === "general"
              ? `${option} ${formatPriceDelta(
                  findOptionPrice(sharedOptionPrices, section.key, option),
                )}/kg`
              : `${option} ${formatPriceDelta(
                  findOptionPrice(sharedOptionPrices, section.key, option),
                )}`,
        })),
      })),
    [addOnSections, sharedOptionPrices],
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
              <OptionField
                title="Weight"
                options={weightChoices}
                selectedValue={selectedWeight}
                onSelect={setSelectedWeight}
                compact
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
              />
            ))}

            {estimatedRange ? (
              <SurfaceCard className="overflow-hidden">
                <div className="bg-[linear-gradient(180deg,#2f2319_0%,#1f1711_100%)] p-5 text-white sm:p-6">
                  <p className="text-sm font-medium text-white/70">
                    Estimated price range
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {formatCurrency(estimatedRange.min)} -{" "}
                    {formatCurrency(estimatedRange.max)}
                  </p>
                  <p className="mt-3 text-sm text-white/75">
                    Current total {formatCurrency(priceBreakdown.total)}
                  </p>
                </div>
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
