import React from "react";
import { EmptyState } from "../ui/AdminUi";
import { SurfaceCard } from "@/shared/ui/Primitives";
import { OptimizedImage } from "@/shared/ui";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
} from "@/utils/productOptions";

const eggLabel = (product) =>
  [product.isEgg !== false && "Egg", product.isEggless && "Eggless"]
    .filter(Boolean)
    .join(" · ");

/* One product per row: everything needed to find and edit an item, with the
 * long description and image counts left to the edit form. */
const AdminProductsGrid = ({ products, onEdit, onDelete }) => {
  if (!products.length) {
    return (
      <SurfaceCard className="p-8">
        <EmptyState message="No products yet. Click 'Add Product' above to create your first product." />
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="divide-y divide-[#f3ecdb] overflow-hidden">
      {products.map((product) => {
        const flavorCount = getAvailableFlavorOptions(product).length;
        const sizeCount = getAvailableWeightOptions(product).length;
        const options = [
          sizeCount > 0 && `${sizeCount} size${sizeCount === 1 ? "" : "s"}`,
          flavorCount > 0 &&
            `${flavorCount} flavor${flavorCount === 1 ? "" : "s"}`,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <div
            key={product._id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#fdfbf5] sm:px-4"
          >
            <OptimizedImage
              src={product.images?.[0] || product.image}
              alt=""
              width={112}
              height={112}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-xl bg-[#f3ecdb] object-cover sm:h-14 sm:w-14"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#1f1709]">
                {product.name}
              </p>
              <p className="truncate text-xs text-[#7d6c4d]">
                {formatCategoryLabel(product.category)}
                {eggLabel(product) ? ` · ${eggLabel(product)}` : ""}
              </p>
            </div>

            <p className="hidden w-36 shrink-0 text-xs text-[#7d6c4d] md:block">
              {options || "Single price"}
            </p>

            <p className="w-16 shrink-0 text-right text-sm font-bold text-[#1f1709]">
              ₹{product.price}
            </p>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="rounded-lg border border-[#e3d7bb] bg-white px-3 py-1.5 text-xs font-semibold text-[#5c4a26] hover:bg-[#faf6ec]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(product._id)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#a3271b] hover:bg-[#fdf1ef]"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </SurfaceCard>
  );
};

export default AdminProductsGrid;
