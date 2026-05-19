import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import AdminGalleryCombinationPricingSection from "@/admin/components/gallery/AdminGalleryCombinationPricingSection";
import AdminGalleryOptionSection from "@/admin/components/gallery/AdminGalleryOptionSection";
import AdminGalleryPreviewPanel from "@/admin/components/gallery/AdminGalleryPreviewPanel";
import AdminGalleryGeneralSection from "@/admin/components/gallery/AdminGalleryGeneralSection";
import AdminGalleryWeightRangeSection from "@/admin/components/gallery/AdminGalleryWeightRangeSection";
import { getGallerySectionMeta } from "@/admin/pages/adminGalleryConfig";
import {
  buildGalleryPriceCombinations,
  mergeGalleryCombinationPrices,
} from "@/admin/pages/adminGalleryPricingUtils";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";
const COMBINATION_SECTION_KEYS = ["cakeTypes", "eggOptions", "flavors"];

const AdminGalleryFormModal = ({
  editingItem,
  formData,
  galleryCategories,
  categoryDrafts,
  optionCatalogs,
  imagePreview,
  imageFileName,
  isSubmitting,
  mode = "general",
  onCategoryDraftChange,
  onDeleteCategory,
  onClose,
  onOptionPriceChange,
  onCombinationEnabledChange,
  onCombinationPriceChange,
  onRenameCategory,
  onSubmit,
  onFieldChange,
  onWeightRangeChange,
  onToggleOption,
  onToggleAllSectionOptions,
  onAddOption,
  onRenameOption,
  onDeleteOption,
  onAddCustomSection,
  onRenameFieldSection,
  onDeleteFieldSection,
  onImageChange,
}) => {
  const fileInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const [pendingSectionTitles, setPendingSectionTitles] = useState({
    general: "",
    extras: "",
  });
  const [pendingSectionOptions, setPendingSectionOptions] = useState({
    general: "",
    extras: "",
  });
  const [activeAddFieldArea, setActiveAddFieldArea] = useState("");
  const [pendingValues, setPendingValues] = useState({});

  const isPricingMode = mode === "pricing";

  useEffect(() => {
    setPendingSectionTitles({
      general: "",
      extras: "",
    });
    setPendingSectionOptions({
      general: "",
      extras: "",
    });
    setActiveAddFieldArea("");
  }, [editingItem?._id, mode]);

  useEffect(() => {
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 160);
  }, [mode]);

  const allSections = useMemo(
    () =>
      (formData.fieldSections || []).map((section) => {
        const meta = getGallerySectionMeta(section.key);
        const resolvedOptions =
          optionCatalogs[section.key] ||
          (section.isCustom ? formData[section.key] || [] : []);
        const usesFieldToggle =
          section.area === "extras" &&
          section.isCustom &&
          resolvedOptions.length === 0;

        return {
          ...section,
          description:
            meta?.description ||
            "Create and manage all values inside this field.",
          placeholder:
            meta?.placeholder ||
            `Add ${String(section.title || "field").toLowerCase()} option`,
          options: resolvedOptions,
          usesFieldToggle,
        };
      }),
    [formData, optionCatalogs],
  );

  useEffect(() => {
    setPendingValues((current) =>
      Object.fromEntries(
        allSections.map((section) => [section.key, current[section.key] || ""]),
      ),
    );
  }, [allSections]);

  const groupedSections = useMemo(
    () => ({
      general: allSections.filter((section) => section.area === "general"),
      extras: allSections.filter((section) => section.area === "extras"),
    }),
    [allSections],
  );
  const hasFlatExtrasSection = useMemo(
    () => allSections.some((section) => section.key === "extras"),
    [allSections],
  );

  const pricingSections = useMemo(
    () =>
      allSections.map((section) => ({
        ...section,
        pricedOptions: (
          section.options.length
            ? section.options
            : section.usesFieldToggle
              ? [section.title]
              : []
        ).map((option) => ({
          option,
          price:
            (formData.optionPrices || []).find(
              (entry) =>
                entry.sectionKey === section.key &&
                String(entry.option || "").trim() === String(option).trim(),
            )?.price || 0,
        })),
      })),
    [allSections, formData.optionPrices],
  );

  const groupedPricingSections = useMemo(
    () => ({
      general: pricingSections.filter(
        (section) =>
          section.area === "general" &&
          !COMBINATION_SECTION_KEYS.includes(section.key),
      ),
      extras: pricingSections.filter((section) => section.area === "extras"),
    }),
    [pricingSections],
  );

  const combinationSections = useMemo(
    () =>
      allSections.filter((section) =>
        COMBINATION_SECTION_KEYS.includes(section.key),
      ),
    [allSections],
  );

  const combinationPricingRows = useMemo(() => {
    const combinationFieldSections = (formData.fieldSections || []).filter((section) =>
      COMBINATION_SECTION_KEYS.includes(section.key),
    );
    const { combinations } = buildGalleryPriceCombinations({
      ...formData,
      fieldSections: combinationFieldSections,
    });
    return mergeGalleryCombinationPrices(combinations, formData.combinationPrices || []);
  }, [formData]);

  const handleAddCustomSection = (area) => {
    const nextTitle = String(pendingSectionTitles[area] || "").trim();
    const nextOption =
      area === "general"
        ? String(pendingSectionOptions[area] || "").trim()
        : "";

    if (area === "extras" && hasFlatExtrasSection) {
      const didAddExtra = onAddOption("extras", nextTitle);
      if (didAddExtra) {
        setPendingSectionTitles((current) => ({
          ...current,
          [area]: "",
        }));
        setActiveAddFieldArea("");
      }
      return;
    }

    const createdSectionKey = onAddCustomSection(area, nextTitle);

    if (createdSectionKey) {
      if (nextOption) {
        onAddOption(createdSectionKey, nextOption);
      }
      setPendingSectionTitles((current) => ({
        ...current,
        [area]: "",
      }));
      setPendingSectionOptions((current) => ({
        ...current,
        [area]: "",
      }));
      setActiveAddFieldArea("");
    }
  };

  const title = isPricingMode
    ? "Set Price & Configure"
    : editingItem
      ? "Edit Gallery Item"
      : "Add Gallery Image";

  const renderAddFieldPopup = (area) => {
    const isOpen = activeAddFieldArea === area;

    return (
      <div className="relative">
        <ActionButton
          type="button"
          variant="secondary"
          className="text-xs sm:text-sm"
          onClick={() =>
            setActiveAddFieldArea((current) => (current === area ? "" : area))
          }
        >
          Add Field
        </ActionButton>

        {isOpen ? (
          <div className="absolute right-0 top-full z-20 mt-3 w-[300px] rounded-2xl border border-gold-200/80 bg-white p-3 shadow-[0_16px_36px_rgba(18,12,2,0.18)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">
              {area === "extras" && hasFlatExtrasSection
                ? "Create Extra"
                : "Create Field"}
            </p>
            <label className="mt-3 block text-sm font-medium text-primary-700">
              {area === "extras" && hasFlatExtrasSection
                ? "Extra Name"
                : "Field Name"}
              <input
                type="text"
                value={pendingSectionTitles[area]}
                onChange={(event) =>
                  setPendingSectionTitles((current) => ({
                    ...current,
                    [area]: event.target.value,
                  }))
                }
                placeholder={
                  area === "extras" && hasFlatExtrasSection
                    ? "Add extra name"
                    : `New ${area} field`
                }
                className={inputClassName}
              />
            </label>
            {area === "general" ? (
              <label className="mt-3 block text-sm font-medium text-primary-700">
                Option Name
                <input
                  type="text"
                  value={pendingSectionOptions[area]}
                  onChange={(event) =>
                    setPendingSectionOptions((current) => ({
                      ...current,
                      [area]: event.target.value,
                    }))
                  }
                  placeholder="First option name"
                  className={inputClassName}
                />
              </label>
            ) : null}
            <div className="mt-3 flex justify-end gap-2">
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setActiveAddFieldArea("")}
              >
                Cancel
              </ActionButton>
              <ActionButton type="button" onClick={() => handleAddCustomSection(area)}>
                Create
              </ActionButton>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderPricingArea = (area, heading, description, tone) => {
    const sections = groupedPricingSections[area] || [];

    return (
      <SurfaceCard className="p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
              {heading}
            </h3>
            <p className="mt-1 text-sm text-primary-600">{description}</p>
          </div>
          <StatusChip tone={tone}>{heading} pricing</StatusChip>
        </div>

        {!sections.length ? (
          <div className="rounded-2xl border border-dashed border-gold-200/80 bg-gold-50/40 p-4 text-sm text-primary-600">
            No {area} fields available for pricing.
          </div>
        ) : (
          <div className="grid gap-4">
            {sections.map((section) => (
              <div
                key={`pricing-${section.key}`}
                className="rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary-900">
                      {section.title}
                    </p>
                    <p className="mt-1 text-xs text-primary-600">
                      {section.usesFieldToggle
                        ? "Set price for this extra field."
                        : "Set price for each option in this field."}
                    </p>
                  </div>
                  <StatusChip tone={tone}>
                    {section.pricedOptions.length} options
                  </StatusChip>
                </div>

                {!section.pricedOptions.length ? (
                  <div className="rounded-2xl border border-dashed border-gold-200/80 bg-gold-50/40 p-4 text-sm text-primary-600">
                    {section.usesFieldToggle
                      ? "This extra uses the field name directly. Set its price here."
                      : "No options here yet. Add values in Add Gallery Image first."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {section.pricedOptions.map((entry) => (
                      <div
                        key={`${section.key}-${entry.option}`}
                        className="grid gap-3 rounded-2xl border border-[rgba(201,168,76,0.18)] bg-[#fffaf0] p-3 sm:grid-cols-[1fr,180px]"
                      >
                        <div className="flex items-center">
                          <div>
                            <p className="text-sm font-semibold text-primary-900">
                              {entry.option}
                            </p>
                            <p className="text-xs text-primary-600">
                              {section.title} option
                            </p>
                          </div>
                        </div>
                        <label className="text-sm font-medium text-primary-700">
                          Price
                          <input
                            type="number"
                            min="0"
                            value={entry.price}
                            onChange={(event) =>
                              onOptionPriceChange(
                                section,
                                entry.option,
                                event.target.value,
                              )
                            }
                            className={inputClassName}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    );
  };

  const renderPricingCatalogManager = (section) => (
    <div
      key={`pricing-manager-${section.key}`}
      className="rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary-900">{section.title}</p>
          <p className="mt-1 text-xs text-primary-600">
            Add shared options here, then enable only the combinations you want below.
          </p>
        </div>
        <StatusChip tone="info">{section.options.length} options</StatusChip>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {section.options.map((option) => (
          <span
            key={`${section.key}-${option}`}
            className="rounded-full border border-[rgba(201,168,76,0.28)] bg-[#fffaf0] px-3 py-1.5 text-xs font-semibold text-primary-800"
          >
            {option}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={pendingValues[section.key] || ""}
          onChange={(event) =>
            setPendingValues((current) => ({
              ...current,
              [section.key]: event.target.value,
            }))
          }
          placeholder={section.placeholder}
          className={inputClassName}
        />
        <ActionButton
          type="button"
          onClick={() => {
            const nextValue = String(pendingValues[section.key] || "").trim();

            if (onAddOption(section.key, nextValue)) {
              setPendingValues((current) => ({
                ...current,
                [section.key]: "",
              }));
            }
          }}
        >
          Add {section.title}
        </ActionButton>
      </div>
    </div>
  );

  return (
    <Modal
      title={title}
      badge={
        <StatusChip tone={isPricingMode ? "accent" : "info"}>
          {isPricingMode ? "Pricing popup" : "Admin popup"}
        </StatusChip>
      }
      onClose={onClose}
      maxWidthClassName="max-w-7xl"
      footer={
        <div className="flex justify-end gap-3">
          <ActionButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="gallery-editor-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isPricingMode
                ? "Save Pricing"
                : editingItem
                  ? "Update Gallery"
                  : "Create Gallery"}
          </ActionButton>
        </div>
      }
    >
      <div className="rounded-2xl border border-gold-200/50 bg-gradient-to-br from-gold-50/35 via-white/70 to-cream-100/45 p-3 sm:p-4">
        <form id="gallery-editor-form" onSubmit={onSubmit} className="space-y-5">
          <div
            className={
              isPricingMode
                ? "grid gap-5"
                : "grid gap-5 xl:grid-cols-[320px,1fr]"
            }
          >
            {!isPricingMode ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onImageChange}
                />
                <AdminGalleryPreviewPanel
                  imagePreview={imagePreview}
                  imageFileName={imageFileName}
                  editingItem={editingItem}
                  onImagePick={() => fileInputRef.current?.click()}
                />
              </div>
            ) : null}

            <div className="space-y-5">
              {!isPricingMode ? (
                <AdminGalleryGeneralSection
                  categoryDrafts={categoryDrafts}
                  formData={formData}
                  titleInputRef={titleInputRef}
                  onFieldChange={onFieldChange}
                  galleryCategories={galleryCategories}
                  onCategoryDraftChange={onCategoryDraftChange}
                  onRenameCategory={onRenameCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              ) : null}

              {isPricingMode ? (
                <>
                  <SurfaceCard className="p-4 sm:p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
                          Matrix Setup
                        </h3>
                        <p className="mt-1 text-sm text-primary-600">
                          Keep Cake Type, Egg Type, and Flavor global here, then price the valid combinations.
                        </p>
                      </div>
                      <StatusChip tone="accent">Shared pricing</StatusChip>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                      {combinationSections.map((section) =>
                        renderPricingCatalogManager(section),
                      )}
                    </div>
                  </SurfaceCard>

                  <AdminGalleryCombinationPricingSection
                    combinations={combinationPricingRows}
                    cakeTypes={
                      combinationSections.find((section) => section.key === "cakeTypes")
                        ?.options || []
                    }
                    eggOptions={
                      combinationSections.find((section) => section.key === "eggOptions")
                        ?.options || []
                    }
                    flavorOptions={
                      combinationSections.find((section) => section.key === "flavors")
                        ?.options || []
                    }
                    onToggleCombination={onCombinationEnabledChange}
                    onChangeCombinationPrice={onCombinationPriceChange}
                  />

                  {renderPricingArea(
                    "general",
                    "General",
                    "Other General fields can still use direct option pricing here.",
                    "info",
                  )}
                  {renderPricingArea(
                    "extras",
                    "Extras",
                    "Same Extras fields from Add Gallery Image, with only price inputs here.",
                    "accent",
                  )}
                </>
              ) : null}

              {!isPricingMode ? (
              <SurfaceCard className="p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
                      General
                    </h3>
                    <p className="mt-1 text-sm text-primary-600">
                      Cake type, egg type, flavor, fondant, and other main setup fields.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip tone="info">General block</StatusChip>
                    {renderAddFieldPopup("general")}
                  </div>
                </div>

                <div className="grid gap-5">
                  <AdminGalleryWeightRangeSection
                    weightRange={formData.weightRange}
                    onWeightRangeChange={onWeightRangeChange}
                  />

                  {groupedSections.general.map((section) => (
                    <AdminGalleryOptionSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      placeholder={section.placeholder}
                      options={section.options}
                      selectedValues={formData[section.key] || []}
                      usesFieldToggle={section.usesFieldToggle}
                      fieldToggleValue={section.title}
                      canDeleteSection
                      pendingValue={pendingValues[section.key] || ""}
                      onPendingValueChange={(value) =>
                        setPendingValues((current) => ({
                          ...current,
                          [section.key]: value,
                        }))
                      }
                      onToggleOption={(option) => onToggleOption(section.key, option)}
                      onToggleAllOptions={(forceState) =>
                        onToggleAllSectionOptions(
                          section.key,
                          section.usesFieldToggle ? [section.title] : section.options,
                          forceState,
                        )
                      }
                      onAddOption={() => {
                        const nextValue = String(
                          pendingValues[section.key] || "",
                        ).trim();

                        if (onAddOption(section.key, nextValue)) {
                          setPendingValues((current) => ({
                            ...current,
                            [section.key]: "",
                          }));
                        }
                      }}
                      onRenameOption={(index, value) =>
                        onRenameOption(section.key, index, value)
                      }
                      onDeleteOption={(index) =>
                        onDeleteOption(section.key, index)
                      }
                      onRenameSection={(value) =>
                        onRenameFieldSection(section.key, value)
                      }
                      onDeleteSection={() => onDeleteFieldSection(section.key)}
                    />
                  ))}
                </div>
              </SurfaceCard>
              ) : null}

              {!isPricingMode ? (
              <SurfaceCard className="p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
                      Extras
                    </h3>
                    <p className="mt-1 text-sm text-primary-600">
                      Keep photo options and simple extra names here like Doll, Deposit, and topper add-ons.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusChip tone="accent">Extras block</StatusChip>
                    {renderAddFieldPopup("extras")}
                  </div>
                </div>

                <div className="grid gap-5">
                  {groupedSections.extras.map((section) => (
                    <AdminGalleryOptionSection
                      key={section.key}
                      title={section.title}
                      description={section.description}
                      placeholder={section.placeholder}
                      options={section.options}
                      selectedValues={formData[section.key] || []}
                      usesFieldToggle={section.usesFieldToggle}
                      fieldToggleValue={section.title}
                      canDeleteSection
                      pendingValue={pendingValues[section.key] || ""}
                      onPendingValueChange={(value) =>
                        setPendingValues((current) => ({
                          ...current,
                          [section.key]: value,
                        }))
                      }
                      onToggleOption={(option) => onToggleOption(section.key, option)}
                      onToggleAllOptions={(forceState) =>
                        onToggleAllSectionOptions(
                          section.key,
                          section.usesFieldToggle ? [section.title] : section.options,
                          forceState,
                        )
                      }
                      onAddOption={() => {
                        const nextValue = String(
                          pendingValues[section.key] || "",
                        ).trim();

                        if (onAddOption(section.key, nextValue)) {
                          setPendingValues((current) => ({
                            ...current,
                            [section.key]: "",
                          }));
                        }
                      }}
                      onRenameOption={(index, value) =>
                        onRenameOption(section.key, index, value)
                      }
                      onDeleteOption={(index) =>
                        onDeleteOption(section.key, index)
                      }
                      onRenameSection={(value) =>
                        onRenameFieldSection(section.key, value)
                      }
                      onDeleteSection={() => onDeleteFieldSection(section.key)}
                    />
                  ))}
                </div>
              </SurfaceCard>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AdminGalleryFormModal;
