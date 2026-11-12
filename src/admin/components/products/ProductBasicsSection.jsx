import React, { useState } from "react";
import { formatCategoryLabel } from "@/utils/productOptions";
import { Toggle } from "@/shared/ui/Primitives";
import { FormField, FormSection, fieldClass } from "@/shared/workspace/Form";

const ProductBasicsSection = ({
  formData,
  hasWeightOptions,
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

  const toggleField = (name) => () =>
    onChange({
      target: { name, type: "checkbox", checked: !formData[name] },
    });

  return (
    <FormSection title="Basics">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
        <FormField label="Name">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            className={fieldClass}
          />
        </FormField>
        <FormField label="Category">
          <select
            value={useCustomCategory ? "__new__" : formData.category}
            onChange={onCategoryChange}
            className={fieldClass}
          >
            {availableCategories.map((category) => (
              <option key={category} value={category}>
                {formatCategoryLabel(category)}
              </option>
            ))}
            <option value="__new__">Add new category…</option>
          </select>
        </FormField>
        <FormField
          label="Base price (₹)"
          hint={hasWeightOptions ? "Set per size below" : undefined}
        >
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={onChange}
            readOnly={hasWeightOptions}
            className={fieldClass}
          />
        </FormField>
      </div>

      {useCustomCategory && (
        <FormField label="New category" className="mt-3">
          <input
            type="text"
            value={customCategory}
            onChange={(event) => onCustomCategoryChange(event.target.value)}
            required
            placeholder="Type new category name"
            className={fieldClass}
          />
        </FormField>
      )}

      <FormField label="Description" className="mt-3">
        <textarea
          name="description"
          rows={2}
          value={formData.description}
          onChange={onChange}
          required
          className={fieldClass}
        />
      </FormField>

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-xs font-semibold text-[#5c4a26]">Cake type</span>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1f1709]">
          <Toggle
            checked={formData.isEgg}
            onClick={toggleField("isEgg")}
            label="Egg"
            size="sm"
          />
          Egg
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#1f1709]">
          <Toggle
            checked={formData.isEggless}
            onClick={toggleField("isEggless")}
            label="Eggless"
            size="sm"
          />
          Eggless
        </label>

        {onRenameCategory && onDeleteCategory && (
          <button
            type="button"
            onClick={() => setManagingCategories(!managingCategories)}
            className="ml-auto text-xs font-semibold text-[#8b6914] hover:underline"
          >
            {managingCategories ? "Hide categories" : "Manage categories"}
          </button>
        )}
      </div>

      {managingCategories && onRenameCategory && onDeleteCategory && (
        <div className="mt-2 grid gap-1 rounded-xl border border-[#ebe1cb] bg-[#faf6ec] p-2 sm:grid-cols-2">
          {availableCategories.map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5"
            >
              {editingCat === cat ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-[#e3d7bb] bg-white px-2 py-1 text-xs text-[#1f1709] focus:border-[#c9a84c] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editValue.trim() && editValue.trim() !== cat) {
                        onRenameCategory(cat, editValue.trim());
                      }
                      setEditingCat(null);
                    }}
                    className="text-xs font-semibold text-[#8b6914]"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="text-xs font-semibold text-[#7d6c4d]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-xs font-medium text-[#1f1709]">
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
                    className="text-xs text-rose-600 hover:text-rose-800"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </FormSection>
  );
};

export default ProductBasicsSection;
