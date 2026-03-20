import React from "react";
import { ActionButton, SurfaceCard } from "../../../components/ui/Primitives";

const ProductImagesSection = ({
  imageItems,
  formData,
  onImageChange,
  onMoveImage,
  onRemoveImage,
}) => (
  <SurfaceCard className="p-3 sm:p-5">
    <h3 className="text-base sm:text-lg font-semibold text-primary-900">
      Images
    </h3>
    <p className="mt-1 text-xs sm:text-sm text-primary-600">
      Upload multiple images. First image = cover.
    </p>
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={onImageChange}
      className="mt-3 block w-full text-sm text-primary-600"
    />

    {imageItems.length > 0 && (
      <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
        {imageItems.map((item, index) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-gold-200/60 bg-white/80"
          >
            <img
              src={item.preview}
              alt={`${formData.name || "Product"} ${index + 1}`}
              className="h-28 sm:h-36 w-full object-cover"
            />
            <div className="flex items-center gap-1 border-t border-gold-200/60 p-1.5 sm:p-2">
              <ActionButton
                type="button"
                variant="soft"
                onClick={() => onMoveImage(index, -1)}
                disabled={index === 0}
                className="flex-1 px-1 py-1 text-[10px] sm:text-xs"
              >
                ←
              </ActionButton>
              <ActionButton
                type="button"
                variant="soft"
                onClick={() => onMoveImage(index, 1)}
                disabled={index === imageItems.length - 1}
                className="flex-1 px-1 py-1 text-[10px] sm:text-xs"
              >
                →
              </ActionButton>
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => onRemoveImage(item.id)}
                className="flex-1 px-1 py-1 text-[10px] sm:text-xs"
              >
                ✕
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
    )}
  </SurfaceCard>
);

export default ProductImagesSection;
