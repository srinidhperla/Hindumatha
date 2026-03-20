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
  <SurfaceCard className="mb-4 sm:mb-6 p-3 sm:p-5">
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <ActionButton
          onClick={() => onSelectCategory("all")}
          variant={selectedCategory === "all" ? "primary" : "soft"}
          className="rounded-full text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
        >
          All
        </ActionButton>
        {availableCategories.map((category) => (
          <ActionButton
            key={category}
            onClick={() => onSelectCategory(category)}
            variant={selectedCategory === category ? "primary" : "soft"}
            className="rounded-full text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
          >
            {formatCategoryLabel(category)}
          </ActionButton>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search products"
          className="rounded-xl border border-gold-200/70 bg-white/80 px-3 py-2 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
        />
        <div className="flex gap-2">
          <Link
            to="/admin/inventory"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-xl border border-gold-200/70 bg-white/80 px-4 py-2 text-center text-xs sm:text-sm font-semibold text-primary-700 admin-motion hover:-translate-y-0.5 hover:border-gold-300 hover:bg-gold-50/70"
          >
            Inventory
          </Link>
          <ActionButton
            onClick={onAddProduct}
            className="flex-1 sm:flex-initial text-xs sm:text-sm"
          >
            Add Product
          </ActionButton>
        </div>
      </div>
    </div>
  </SurfaceCard>
);

export default AdminProductsToolbar;
