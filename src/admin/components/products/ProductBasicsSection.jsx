import React from "react";
import { formatCategoryLabel } from "../../../utils/productOptions";
import { SurfaceCard } from "../../../components/ui/Primitives";

const ProductBasicsSection = ({
  formData,
  inputClassName,
  availableCategories,
  useCustomCategory,
  customCategory,
  onChange,
  onCategoryChange,
  onCustomCategoryChange,
}) => (
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
          onChange={onChange}
          required
          className={inputClassName}
        />
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
  </SurfaceCard>
);

export default ProductBasicsSection;
