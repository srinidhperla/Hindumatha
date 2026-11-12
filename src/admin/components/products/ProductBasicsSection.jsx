import React, { useState } from "react";
import { formatCategoryLabel } from "@/utils/productOptions";
import { SurfaceCard, Toggle } from "@/shared/ui/Primitives";

const ProductBasicsSection = ({
  formData,
  hasWeightOptions,
  inputClassName,
  availableCategories,
  useCustomCategory,
  customCategory,
  onChange,
  onCategoryChange,
  onCustomCategoryChange,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const [managingCategories, setManagingCategories] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editValue, setEditValue] = useState("");

  return (
    <SurfaceCard className="p-4 sm:p-5 admin-motion hover:shadow-[0_18px_34px_rgba(18,12,2,0.16)]">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#5c4a26]">
        Basics
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-[#5c4a26]">Name</span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            className={inputClassName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[#5c4a26]">Base Price</span>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={onChange}
            readOnly={hasWeightOptions}
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-[#5c4a26]">
            {hasWeightOptions
              ? "Preserved from the saved product and updated only when you edit a price in Set Prices."
              : "Used directly when this product has no weights."}
          </p>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-[#5c4a26]">Description</span>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={onChange}
          required
          className={inputClassName}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-[#5c4a26]">Category</span>
        <select
          value={useCustomCategory ? "__new__" : formData.category}
          onChange={onCategoryChange}
          className={inputClassName}
        >
          {availableCategories.map((category) => (
            <option key={category} value={category}>
              {formatCategoryLabel(category)}
            </option>
          ))}
          <option value="__new__">Add New Category</option>
        </select>
      </label>

      {onRenameCategory && onDeleteCategory && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setManagingCategories(!managingCategories)}
            className="text-xs font-medium text-[#5c4a26] admin-motion hover:text-[#1f1709]"
          >
            {managingCategories ? "Hide" : "Manage"} categories
          </button>
          {managingCategories && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-2.5">
              {availableCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm admin-motion hover:bg-white"
                >
                  {editingCat === cat ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(event) => setEditValue(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-[#ebe1cb] bg-white px-2 py-1 text-xs text-[#1f1709] focus:border-[#c9a84c] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editValue.trim() && editValue.trim() !== cat) {
                            onRenameCategory(cat, editValue.trim());
                          }
                          setEditingCat(null);
                        }}
                        className="text-xs font-semibold text-[#5c4a26] hover:text-[#1f1709]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        className="text-xs font-semibold text-[#7d6c4d] hover:text-[#5c4a26]"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-xs font-medium text-[#5c4a26]">
                        {formatCategoryLabel(cat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setEditValue(cat);
                        }}
                        className="text-xs text-[#5c4a26] hover:text-[#1f1709]"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {useCustomCategory && (
        <label className="mt-4 block">
          <span className="text-sm font-medium text-[#5c4a26]">
            New Category
          </span>
          <input
            type="text"
            value={customCategory}
            onChange={(event) => onCustomCategoryChange(event.target.value)}
            required
            placeholder="Type new category name"
            className={inputClassName}
          />
        </label>
      )}

      <div className="mt-4 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-4 admin-motion hover:border-[#ebe1cb] hover:bg-[#faf6ec]">
        <p className="mb-3 text-sm font-semibold text-[#5c4a26]">Cake Type</p>
        <div className="flex flex-wrap gap-6">
          <label className="flex cursor-pointer items-center gap-3">
            <Toggle
              checked={formData.isEgg}
              onClick={() =>
                onChange({
                  target: {
                    name: "isEgg",
                    type: "checkbox",
                    checked: !formData.isEgg,
                  },
                })
              }
              label="Egg"
            />
            <span className="text-sm font-medium text-[#5c4a26]">Egg</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <Toggle
              checked={formData.isEggless}
              onClick={() =>
                onChange({
                  target: {
                    name: "isEggless",
                    type: "checkbox",
                    checked: !formData.isEggless,
                  },
                })
              }
              label="Eggless"
            />
            <span className="text-sm font-medium text-[#5c4a26]">Eggless</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-[#7d6c4d]">
          Toggle to indicate whether this product is available in Egg and/or
          Eggless cake types.
        </p>
      </div>
    </SurfaceCard>
  );
};

export default ProductBasicsSection;
