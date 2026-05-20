import React, { useState } from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

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
        <h3 className="text-base font-semibold text-primary-900 sm:text-lg">
          Main Details
        </h3>
        <p className="mt-1 text-sm text-primary-600">
          Add and edit the main gallery details for this image.
        </p>
      </div>
      <StatusChip tone="info">Popup editor</StatusChip>
    </div>

    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium text-primary-700">
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

      <div className="text-sm font-medium text-primary-700 md:col-span-2">
        Categories
        <div className="mt-2 rounded-2xl border border-gold-200/70 bg-white/85 p-3">
          <div className="flex flex-wrap gap-2">
            {galleryCategories.map((cat) => {
              const isSelected = selectedCategories.includes(cat);

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                    isSelected
                      ? "border-primary-900 bg-primary-900 text-white"
                      : "border-gold-200/80 bg-white text-primary-800 hover:border-gold-400 hover:bg-gold-50/70"
                  }`}
                >
                  {formatCategoryLabel(cat)}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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
            <ActionButton type="button" variant="secondary" onClick={addPendingCategory}>
              Add Category
            </ActionButton>
          </div>
          <div className="mt-3 rounded-xl bg-gold-50/60 px-3 py-2 text-xs text-primary-700">
            Select one or more categories. The first selected category is used as the main gallery label.
          </div>
          {selectedCategories.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedCategories.map((category, index) => (
                <span
                  key={`selected-${category}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#fff5d8] px-3 py-1.5 text-xs font-semibold text-primary-900"
                >
                  {formatCategoryLabel(category)}
                  {index === 0 ? <span className="text-[10px] uppercase text-primary-700">Main</span> : null}
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
              className="text-xs font-medium text-primary-700 admin-motion hover:text-primary-900"
            >
              {managingCategories ? "Hide" : "Manage"} categories
            </button>

            {managingCategories ? (
              <div className="mt-2 space-y-1.5 rounded-xl border border-gold-200/60 bg-gold-50/50 p-2.5">
                {galleryCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-sm admin-motion hover:bg-white"
                  >
                    <input
                      type="text"
                      value={categoryDrafts[cat] || cat}
                      onChange={(event) =>
                        onCategoryDraftChange?.(cat, event.target.value)
                      }
                      className="min-w-0 flex-1 rounded-lg border border-gold-200/70 bg-white px-2 py-1 text-xs text-primary-800 focus:border-gold-400 focus:outline-none"
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
