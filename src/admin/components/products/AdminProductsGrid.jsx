import React from "react";
import { EmptyState } from "../ui/AdminUi";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../../components/ui/Primitives";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
} from "../../../utils/productOptions";

const AdminProductsGrid = ({ products, onEdit, onDelete }) => {
  if (!products.length) {
    return (
      <SurfaceCard className="p-8">
        <EmptyState message="No products match the current filters." />
      </SurfaceCard>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const availableFlavorCount = getAvailableFlavorOptions(product).length;
        const availableWeightCount = getAvailableWeightOptions(product).length;

        return (
          <SurfaceCard
            key={product._id}
            className="overflow-hidden flex flex-col"
          >
            <img
              src={product.images?.[0] || product.image}
              alt={product.name}
              className="h-48 w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <StatusChip tone="info">
                    {formatCategoryLabel(product.category)}
                  </StatusChip>
                  <h3 className="mt-1 text-base font-bold text-primary-800 leading-tight">
                    {product.name}
                  </h3>
                </div>
                <p className="shrink-0 text-base font-semibold text-primary-700">
                  ₹{product.price}
                </p>
              </div>

              <p className="text-sm text-primary-600 line-clamp-2">
                {product.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-cream-100 px-3 py-1 text-primary-700">
                  {availableFlavorCount} flavors
                </span>
                <span className="rounded-full bg-cream-100 px-3 py-1 text-primary-700">
                  {availableWeightCount} sizes
                </span>
                <span className="rounded-full bg-cream-100 px-3 py-1 text-primary-700">
                  {product.images?.length || 1} images
                </span>
              </div>

              {!!product.flavorOptions?.length && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.flavorOptions.slice(0, 4).map((option) => (
                    <span
                      key={`${product._id}-${option.name}`}
                      className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-primary-700"
                    >
                      {option.name}
                    </span>
                  ))}
                  {product.flavorOptions.length > 4 && (
                    <span className="rounded-full bg-cream-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      +{product.flavorOptions.length - 4} more
                    </span>
                  )}
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-3">
                <ActionButton
                  onClick={() => onEdit(product)}
                  variant="secondary"
                  className="flex-1"
                >
                  Edit
                </ActionButton>
                <ActionButton
                  onClick={() => onDelete(product._id)}
                  variant="danger"
                  className="flex-1"
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
