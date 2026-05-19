import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import { buildGalleryCombinationKey } from "@/admin/pages/adminGalleryPricingUtils";
import {
  buildGalleryWeightChoices,
  formatGalleryWeightRange,
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

const GalleryCalculatorModal = ({ item, galleryFieldConfig, onClose }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
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

  const requiredSelectionKeys = useMemo(() => {
    const keys = hasCombinationPricing
      ? coreSections.map((section) => section.key)
      : [];

    if (weightRange) {
      keys.push("weight");
    }

    return keys;
  }, [coreSections, hasCombinationPricing, weightRange]);

  const selectedRequiredCount = useMemo(() => {
    const optionCount = requiredSelectionKeys.filter((sectionKey) => {
      if (sectionKey === "weight") {
        return hasWeightSelection;
      }

      return String(selectedOptions[sectionKey] || "").trim();
    }).length;

    return optionCount;
  }, [hasWeightSelection, requiredSelectionKeys, selectedOptions]);

  const isEstimateReady = useMemo(() => {
    if (hasCombinationPricing) {
      return (
        requiredSelectionKeys.length > 0 &&
        requiredSelectionKeys.every((sectionKey) => {
          if (sectionKey === "weight") {
            return hasWeightSelection;
          }

          return String(selectedOptions[sectionKey] || "").trim();
        })
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
    hasCombinationPricing,
    hasWeightSelection,
    requiredSelectionKeys,
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

  const priceSummaryRows = useMemo(() => {
    const rows = [];

    if (weightRange && selectedWeight) {
      rows.push({
        key: "weight",
        title: "Weight",
        value: `${selectedWeight} ${weightRange.unit}`,
        note: "Used for 1kg-based pricing",
      });
    }

    coreSections.forEach((section) => {
      const selectedOption = String(selectedOptions[section.key] || "").trim();
      if (!selectedOption) {
        return;
      }

      rows.push({
        key: section.key,
        title: section.title,
        value: selectedOption,
        note: hasCombinationPricing ? "Included in cake style" : "Main choice",
      });
    });

    selectedAddOnEntries.forEach((entry) => {
      rows.push({
        key: entry.sectionKey,
        title: entry.sectionTitle,
        value: entry.option,
        note: entry.isPerKg
          ? `${formatPriceDelta(entry.price)} / kg`
          : `${formatPriceDelta(entry.price)} fixed`,
      });
    });

    return rows;
  }, [
    coreSections,
    hasCombinationPricing,
    selectedAddOnEntries,
    selectedOptions,
    selectedWeight,
    weightRange,
  ]);

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
      badge={<StatusChip tone="accent">Live estimate</StatusChip>}
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
        <div className="flex justify-end">
          <ActionButton
            type="button"
            variant="secondary"
            className="min-w-[48px] rounded-full px-4 py-2 text-xs sm:text-sm"
            onClick={() => setIsGuideOpen((current) => !current)}
          >
            {isGuideOpen ? "Hide Help" : "Quick Guide"}
          </ActionButton>
        </div>

        {isGuideOpen ? (
          <SurfaceCard className="p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              Quick guide
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-[rgba(201,168,76,0.2)] bg-[#fff8ec] p-4">
                <p className="text-sm font-semibold text-primary-900">
                  Base price is treated as 1kg
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  Pick the weight first. The calculator multiplies the 1kg price by
                  your selected cake weight.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(201,168,76,0.2)] bg-white p-4">
                <p className="text-sm font-semibold text-primary-900">
                  Main cake style updates next
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  Cake type, egg type, and flavor unlock the matched price row when
                  combination pricing is enabled.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(201,168,76,0.2)] bg-white p-4">
                <p className="text-sm font-semibold text-primary-900">
                  General add-ons scale, extras stay fixed
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  General fields are treated as per-kg. Extras like photo or doll are
                  added as one fixed charge.
                </p>
              </div>
            </div>
          </SurfaceCard>
        ) : null}

        <SurfaceCard className="overflow-hidden">
          <div className="bg-[linear-gradient(135deg,rgba(255,248,226,0.95),rgba(255,255,255,0.92)_58%,rgba(255,244,226,0.86))] p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <StatusChip tone="info">
                  {item.priceLabel || "Starting at"} {formatCurrency(item.price)} / kg
                </StatusChip>
                <p className="mt-3 text-sm leading-6 text-primary-700">
                  Select the cake weight, choose the main cake style, then add any
                  finishing options you need.
                </p>
                {formatGalleryWeightRange(item) ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary-500">
                    Available range: {formatGalleryWeightRange(item)}
                  </p>
                ) : null}
              </div>
              {requiredSelectionKeys.length ? (
                <div className="rounded-2xl border border-[rgba(42,31,14,0.1)] bg-white/80 px-4 py-3 text-center shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-500">
                    Required selections
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-900">
                    {selectedRequiredCount}/{requiredSelectionKeys.length} done
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        {priceSummaryRows.length ? (
          <SurfaceCard className="p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                  Your selections
                </p>
                <p className="mt-1 text-sm text-primary-600">
                  Live summary of the choices affecting the final estimate.
                </p>
              </div>
              <StatusChip tone="accent">
                Total now {formatCurrency(priceBreakdown.total)}
              </StatusChip>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {priceSummaryRows.map((entry) => (
                <div
                  key={`summary-${entry.key}`}
                  className="rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/80 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-500">
                    {entry.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-primary-900">
                      {entry.value}
                    </p>
                    <span className="text-xs font-semibold text-primary-600">
                      {entry.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SurfaceCard>
        ) : null}

        {!selectableSections.length && !weightChoices.length ? (
          <SurfaceCard className="p-4 sm:p-5">
            <p className="text-sm text-primary-600">
              No calculator fields are enabled for this cake right now.
            </p>
          </SurfaceCard>
        ) : (
          <div className="space-y-5">
            {weightChoices.length ? (
              <SurfaceCard className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">
                      Choose the weight
                    </h3>
                    <p className="mt-1 text-sm text-primary-600">
                      Pick one weight from the available range.
                    </p>
                  </div>
                  {selectedWeight ? (
                    <StatusChip tone="success">
                      {selectedWeight} {weightRange?.unit || "kg"} selected
                    </StatusChip>
                  ) : (
                    <StatusChip tone="warning">Pick weight</StatusChip>
                  )}
                </div>

                <div className="mt-5 rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,236,0.84))] p-4">
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-[rgba(201,168,76,0.24)]" />
                    <div className="relative flex gap-3 overflow-x-auto pb-2">
                      {weightChoices.map((choice) => {
                        const isSelected = selectedWeight === choice.value;

                        return (
                          <button
                            key={choice.value}
                            type="button"
                            onClick={() => setSelectedWeight(choice.value)}
                            className={`relative z-[1] min-w-[88px] shrink-0 rounded-full border px-4 py-3 text-center text-sm font-semibold transition-all ${
                              isSelected
                                ? "border-[#b45f40] bg-[#b45f40] text-white shadow-[0_16px_28px_rgba(180,95,64,0.26)]"
                                : "border-[rgba(42,31,14,0.12)] bg-white text-primary-800 hover:border-[#d3b18f] hover:bg-[#fff8f1]"
                            }`}
                          >
                            {choice.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ) : null}

            {coreSections.length ? (
              <SurfaceCard className="p-4 sm:p-5">
                <div>
                  <h3 className="mt-2 text-lg font-semibold text-primary-900">
                    Choose the main cake style
                  </h3>
                  <p className="mt-1 text-sm text-primary-600">
                    Pick the required cake details first. Available options update
                    automatically.
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  {coreSections.map((section, index) => (
                    <div
                      key={section.key}
                      className="rounded-[28px] border border-[rgba(201,168,76,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,248,235,0.78))] p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#2f2319] text-sm font-bold text-white">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-primary-900">
                              {section.title}
                            </p>
                            <p className="mt-1 text-xs text-primary-600">
                              {section.key === "eggOptions"
                                ? "Egg choices depend on the cake type you pick."
                                : section.key === "flavors"
                                  ? "Only matching flavors are shown here."
                                  : "Choose one option to continue the cake setup."}
                            </p>
                          </div>
                        </div>
                        {selectedOptions[section.key] ? (
                          <StatusChip tone="success">Selected</StatusChip>
                        ) : (
                          <StatusChip tone="warning">Pending</StatusChip>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {section.options.map((option) => {
                          const isSelected = selectedOptions[section.key] === option;

                          return (
                            <button
                              key={`${section.key}-${option}`}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((current) => ({
                                  ...current,
                                  [section.key]: option,
                                }))
                              }
                              className={`min-h-[52px] rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                                isSelected
                                  ? "border-[#b45f40] bg-[#b45f40] text-white shadow-[0_16px_28px_rgba(180,95,64,0.26)]"
                                  : "border-[rgba(42,31,14,0.12)] bg-white text-primary-800 hover:border-[#d3b18f] hover:bg-[#fff8f1]"
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}

            {addOnSections.length ? (
              <SurfaceCard className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-primary-900">
                      Add finishing options
                    </h3>
                    <p className="mt-1 text-sm text-primary-600">
                      General fields add per-kg price. Extras stay as one fixed charge.
                    </p>
                  </div>
                  <StatusChip tone="info">Optional</StatusChip>
                </div>

                <div className="mt-5 grid gap-4">
                  {addOnSections.map((section) => (
                    <div
                      key={section.key}
                      className="rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/80 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-primary-900">
                            {section.title}
                          </p>
                          <p className="mt-1 text-xs text-primary-600">
                            {section.area === "general"
                              ? "This option adds a per-kg price."
                              : "This option adds a fixed one-time price."}
                          </p>
                        </div>
                        {selectedOptions[section.key] ? (
                          <ActionButton
                            type="button"
                            variant="secondary"
                            className="px-3 py-2 text-xs"
                            onClick={() =>
                              setSelectedOptions((current) => ({
                                ...current,
                                [section.key]: "",
                              }))
                            }
                          >
                            Clear
                          </ActionButton>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {section.options.map((option) => {
                          const isSelected = selectedOptions[section.key] === option;
                          const optionPrice = findOptionPrice(
                            sharedOptionPrices,
                            section.key,
                            option,
                          );

                          return (
                            <button
                              key={`${section.key}-${option}`}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((current) => ({
                                  ...current,
                                  [section.key]: option,
                                }))
                              }
                              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                                isSelected
                                  ? "border-[#2f2319] bg-[#2f2319] text-white shadow-[0_16px_28px_rgba(31,23,17,0.22)]"
                                  : "border-[rgba(42,31,14,0.12)] bg-[#fffaf1] text-primary-800 hover:border-[#c9a84c] hover:bg-white"
                              }`}
                            >
                              <p className="text-sm font-semibold">{option}</p>
                              <p
                                className={`mt-1 text-xs ${
                                  isSelected ? "text-white/75" : "text-primary-500"
                                }`}
                              >
                                {section.area === "general"
                                  ? `${formatPriceDelta(optionPrice)} / kg`
                                  : `${formatPriceDelta(optionPrice)} fixed`}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </SurfaceCard>
            ) : null}

            {item.configurationNote ? (
              <SurfaceCard className="p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
                  Bakery note
                </p>
                <p className="mt-3 text-sm leading-6 text-primary-700">
                  {item.configurationNote}
                </p>
              </SurfaceCard>
            ) : null}

            {estimatedRange ? (
              <SurfaceCard className="overflow-hidden">
                <div className="bg-[linear-gradient(180deg,#2f2319_0%,#1f1711_100%)] p-5 text-white sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                    Final estimate
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white/8 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                        1kg subtotal
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {formatCurrency(priceBreakdown.perKgSubtotal)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                        Weight selected
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {selectedWeight || "1"} {weightRange?.unit || "kg"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/8 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                        Fixed extras
                      </p>
                      <p className="mt-2 text-lg font-bold">
                        {formatCurrency(priceBreakdown.fixedAddOnPrice)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm font-medium text-white/70">
                    Estimated price range
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                    {formatCurrency(estimatedRange.min)} -{" "}
                    {formatCurrency(estimatedRange.max)}
                  </p>
                  <p className="mt-3 text-sm text-white/75">
                    Current setup is around {formatCurrency(priceBreakdown.total)}.
                    The main cake price is calculated from your selected weight using
                    the 1kg base price.
                  </p>
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-4 sm:p-5">
                <p className="text-sm font-semibold text-primary-900">
                  Final estimate will appear here after the required selections are
                  completed.
                </p>
                {requiredSelectionKeys.length ? (
                  <p className="mt-2 text-sm text-primary-600">
                    Completed: {selectedRequiredCount} of {requiredSelectionKeys.length} required selections.
                  </p>
                ) : null}
              </SurfaceCard>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default GalleryCalculatorModal;
