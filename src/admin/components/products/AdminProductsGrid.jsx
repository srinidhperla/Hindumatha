import React from "react";
import { EmptyState } from "../ui/AdminUi";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "@/shared/ui/Primitives";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
} from "@/utils/productOptions";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";

const AdminProductsGrid = ({ products, onEdit, onDelete }) => {
  if (!products.length) {
    return (
      <SurfaceCard className="p-8">
        <EmptyState message="No products yet. Click 'Add Product' above to create your first product." />
      </SurfaceCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const availableFlavorCount = getAvailableFlavorOptions(product).length;
        const availableWeightCount = getAvailableWeightOptions(product).length;

        return (
          <SurfaceCard
            key={product._id}
            className="group overflow-hidden flex flex-col admin-motion hover:-translate-y-1 hover:shadow-[0_20px_36px_rgba(18,12,2,0.16)]"
          >
            <img
              src={optimizeProductImageUrl(product.images?.[0] || product.image)}
              alt={product.name}
              width={640}
              height={420}
              loading="lazy"
              className="h-36 sm:h-48 w-full object-cover admin-motion-transform group-hover:scale-[1.04]"
            />
            <div className="flex flex-1 flex-col p-3 sm:p-5">
              <div className="mb-2 sm:mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <StatusChip tone="info">
                    {formatCategoryLabel(product.category)}
                  </StatusChip>
                  {product.isEgg !== false && (
                    <StatusChip tone="neutral">Egg</StatusChip>
                  )}
                  {product.isEggless && (
                    <StatusChip tone="success">Eggless</StatusChip>
                  )}
                  <h3 className="mt-1 text-sm sm:text-base font-bold text-primary-800 leading-tight truncate">
                    {product.name}
                  </h3>
                </div>
                <p className="shrink-0 text-sm sm:text-base font-semibold text-primary-700">
                  ₹{product.price}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-primary-600 line-clamp-2">
                {product.description}
              </p>

              <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium">
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-primary-700">
                  {availableFlavorCount} flavors
                </span>
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-primary-700">
                  {availableWeightCount} sizes
                </span>
                <span className="rounded-full bg-cream-100 px-2.5 py-0.5 sm:px-3 sm:py-1 text-primary-700">
                  {product.images?.length || 1} imgs
                </span>
              </div>

              {!!product.flavorOptions?.length && (
                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-1.5">
                  {product.flavorOptions.slice(0, 3).map((option) => (
                    <span
                      key={`${product._id}-${option.name}`}
                      className="rounded-full bg-cream-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-primary-700"
                    >
                      {option.name}
                    </span>
                  ))}
                  {product.flavorOptions.length > 3 && (
                    <span className="rounded-full bg-cream-100 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-primary-500">
                      +{product.flavorOptions.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto pt-3 sm:pt-4 flex gap-2 sm:gap-3">
                <ActionButton
                  onClick={() => onEdit(product)}
                  variant="secondary"
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  Edit
                </ActionButton>
                <ActionButton
                  onClick={() => onDelete(product._id)}
                  variant="danger"
                  className="flex-1 text-xs sm:text-sm py-2"
                >
                  Delete
                </ActionButton>
              </div>
            </div>
          </SurfaceCard>
        );
      })}
    </div>
  );
};

export default AdminProductsGrid;
