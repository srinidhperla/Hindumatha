import React, { useState } from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-[#ebe1cb] bg-white px-3 py-2.5 text-sm text-[#1f1709] shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[rgba(201,168,76,0.25)]";

const formatCategoryLabel = (cat) =>
  cat.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

const AdminGalleryGeneralSection = ({
  categoryDrafts = {},
  formData,
  titleInputRef,
  onFieldChange,
  onCategoriesChange,
  galleryCategories = [],
  onCategoryDraftChange,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [managingCategories, setManagingCategories] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const selectedCategories = Array.from(
    new Set(
      [
        ...(Array.isArray(formData.categories) ? formData.categories : []),
        formData.category,
      ]
        .map((category) => String(category || "").trim())
        .filter(Boolean),
    ),
  );

  const toggleCategory = (categoryName) => {
    const normalizedCategory = String(categoryName || "").trim();
    if (!normalizedCategory) {
      return;
    }

    const isSelected = selectedCategories.includes(normalizedCategory);
    onCategoriesChange?.(
      isSelected
        ? selectedCategories.filter((entry) => entry !== normalizedCategory)
        : [...selectedCategories, normalizedCategory],
    );
  };

  const addPendingCategory = () => {
    const normalizedCategory = String(pendingCategory || "").trim();

    if (!normalizedCategory) {
      return;
    }

    onCategoriesChange?.([...selectedCategories, normalizedCategory]);
    setPendingCategory("");
  };

  return (
    <SurfaceCard className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#1f1709] sm:text-lg">
            Main Details
          </h3>
        </div>
      </div>

      <div className="mt-2 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-[#5c4a26]">
          Title
          <input
            ref={titleInputRef}
            type="text"
            name="title"
            value={formData.title}
            onChange={onFieldChange}
            placeholder="Cool birthday design"
            className={inputClassName}
          />
        </label>

        <div className="text-sm font-medium text-[#5c4a26] md:col-span-2">
          Categories
          <div className="mt-1.5">
            <div className="flex flex-wrap gap-1.5">
              {galleryCategories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-[#1f1709] bg-[#1f1709] text-[#f3dd96]"
                        : "border-[#ebe1cb] bg-white text-[#1f1709] hover:border-[#c9a84c] hover:bg-[#faf6ec]"
                    }`}
                  >
                    {formatCategoryLabel(cat)}
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex max-w-md gap-2">
              <input
                type="text"
                value={pendingCategory}
                onChange={(event) => setPendingCategory(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addPendingCategory();
                  }
                }}
                placeholder="Add new category"
                className={inputClassName.replace("mt-1 ", "")}
              />
              <ActionButton
                type="button"
                variant="secondary"
                onClick={addPendingCategory}
              >
                Add
              </ActionButton>
            </div>
            {selectedCategories.length ? (
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#7d6c4d]">
                Selected:
                {selectedCategories.map((category, index) => (
                  <span
                    key={`selected-${category}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#faf6ec] px-2.5 py-1 text-xs font-semibold text-[#1f1709]"
                  >
                    {formatCategoryLabel(category)}
                    {index === 0 ? (
                      <span className="text-[10px] uppercase text-[#5c4a26]">
                        Main
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {onRenameCategory && onDeleteCategory ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setManagingCategories((current) => !current)}
                className="text-xs font-medium text-[#5c4a26] admin-motion hover:text-[#1f1709]"
              >
                {managingCategories ? "Hide" : "Manage"} categories
              </button>

              {managingCategories ? (
                <div className="mt-2 space-y-1.5 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-2.5">
                  {galleryCategories.map((cat) => (
                    <div
                      key={cat}
                      className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm admin-motion hover:bg-white"
                    >
                      <input
                        type="text"
                        value={categoryDrafts[cat] || cat}
                        onChange={(event) =>
                          onCategoryDraftChange?.(cat, event.target.value)
                        }
                        className="min-w-0 flex-1 rounded-lg border border-[#ebe1cb] bg-white px-2 py-1 text-xs text-[#1f1709] focus:border-[#c9a84c] focus:outline-none"
                      />
                      <ActionButton
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => onRenameCategory(cat)}
                      >
                        Rename
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="danger"
                        className="px-3 py-1.5 text-xs"
                        onClick={() => onDeleteCategory(cat)}
                      >
                        Delete
                      </ActionButton>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  );
};

export default AdminGalleryGeneralSection;
