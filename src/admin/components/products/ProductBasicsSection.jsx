import React, { useState } from "react";
import { formatCategoryLabel } from "../../../utils/productOptions";
import {
  SurfaceCard,
  Toggle,
  ActionButton,
} from "../../../components/ui/Primitives";

const ProductBasicsSection = ({
  formData,
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
    <SurfaceCard className="p-4 sm:p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Basics
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Name</span>
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
          <span className="text-sm font-medium text-slate-700">Base Price</span>
          <input
            type="number"
            name="price"
            min="0"
            step="0.01"
            value={formData.price}
            readOnly
            className={inputClassName}
          />
          <p className="mt-1 text-xs text-slate-500">
            Auto-calculated from the lowest value in Set Prices.
          </p>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-slate-700">Description</span>
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
        <span className="text-sm font-medium text-slate-700">Category</span>
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
            className="text-xs font-medium text-fuchsia-600 hover:text-fuchsia-800 transition-colors"
          >
            {managingCategories ? "Hide" : "Manage"} categories
          </button>
          {managingCategories && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              {availableCategories.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 text-sm"
                >
                  {editingCat === cat ? (
                    <>
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 min-w-0 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-fuchsia-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editValue.trim() && editValue.trim() !== cat) {
                            onRenameCategory(cat, editValue.trim());
                          }
                          setEditingCat(null);
                        }}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCat(null)}
                        className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-xs font-medium text-slate-700">
                        {formatCategoryLabel(cat)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCat(cat);
                          setEditValue(cat);
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCategory(cat)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        🗑️
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
          <span className="text-sm font-medium text-slate-700">
            New Category Name
          </span>
          <input
            type="text"
            value={customCategory}
            onChange={(event) => onCustomCategoryChange(event.target.value)}
            required
            placeholder="For example: photo-cakes"
            className={inputClassName}
          />
        </label>
      )}

      {/* Egg / Eggless toggles */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-sm font-semibold text-slate-700">Egg Type</p>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
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
            <span className="text-sm font-medium text-slate-700">Egg</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
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
            <span className="text-sm font-medium text-slate-700">Eggless</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Toggle to indicate whether this product is available in Egg and/or
          Eggless variants.
        </p>
      </div>
    </SurfaceCard>
  );
};

export default ProductBasicsSection;
