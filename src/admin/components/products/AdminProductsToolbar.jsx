import React from "react";
import { Link } from "react-router-dom";
import { ActionButton, SurfaceCard } from "../../../components/ui/Primitives";
import { formatCategoryLabel } from "../../../utils/productOptions";

const AdminProductsToolbar = ({
  availableCategories,
  selectedCategory,
  searchTerm,
  onSelectCategory,
  onSearch,
  onAddProduct,
}) => (
  <SurfaceCard className="mb-6 p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        <ActionButton
          onClick={() => onSelectCategory("all")}
          variant={selectedCategory === "all" ? "primary" : "soft"}
          className="rounded-full"
        >
          All
        </ActionButton>
        {availableCategories.map((category) => (
          <ActionButton
            key={category}
            onClick={() => onSelectCategory(category)}
            variant={selectedCategory === category ? "primary" : "soft"}
            className="rounded-full"
          >
            {formatCategoryLabel(category)}
          </ActionButton>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search products"
          className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <Link
          to="/admin/inventory"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage Inventory
        </Link>
        <ActionButton onClick={onAddProduct}>Add New Product</ActionButton>
      </div>
    </div>
  </SurfaceCard>
);

export default AdminProductsToolbar;
