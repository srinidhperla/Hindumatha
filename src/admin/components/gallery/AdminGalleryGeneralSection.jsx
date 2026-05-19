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
  galleryCategories = [],
  onCategoryDraftChange,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [useCustomCategory, setUseCustomCategory] = useState(
    formData.category && !galleryCategories.includes(formData.category),
  );
  const [managingCategories, setManagingCategories] = useState(false);

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

      <div className="text-sm font-medium text-primary-700">
        Category
        <select
          value={useCustomCategory ? "__new__" : formData.category}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setUseCustomCategory(true);
              onFieldChange({ target: { name: "category", value: "" } });
            } else {
              setUseCustomCategory(false);
              onFieldChange({ target: { name: "category", value: e.target.value } });
            }
          }}
          className={inputClassName}
        >
          <option value="" disabled>Select a category</option>
          {galleryCategories.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategoryLabel(cat)}
            </option>
          ))}
          <option value="__new__">Add New Category</option>
        </select>
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
        {useCustomCategory && (
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={onFieldChange}
            placeholder="Type new category name"
            className="mt-2 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
          />
        )}
      </div>
    </div>
  </SurfaceCard>
  );
};

export default AdminGalleryGeneralSection;
