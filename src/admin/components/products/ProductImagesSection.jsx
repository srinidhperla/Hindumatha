import React from "react";
import { ActionButton, SurfaceCard } from "../../../components/ui/Primitives";

const ProductImagesSection = ({
  imageItems,
  formData,
  onImageChange,
  onMoveImage,
  onRemoveImage,
}) => (
  <SurfaceCard className="p-4 sm:p-5">
    <h3 className="text-lg font-semibold text-slate-900">Images</h3>
    <p className="mt-1 text-sm text-slate-500">
      Upload multiple images. First image will be product cover.
    </p>
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={onImageChange}
      className="mt-3 block w-full text-sm text-slate-500"
    />

    {imageItems.length > 0 && (
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {imageItems.map((item, index) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200"
          >
            <img
              src={item.preview}
              alt={`${formData.name || "Product"} ${index + 1}`}
              className="h-36 w-full object-cover"
            />
            <div className="grid grid-cols-3 gap-2 border-t border-slate-200 p-2">
              <ActionButton
                type="button"
                variant="soft"
                onClick={() => onMoveImage(index, -1)}
                disabled={index === 0}
                className="px-2 py-1 text-xs"
              >
                Left
              </ActionButton>
              <ActionButton
                type="button"
                variant="soft"
                onClick={() => onMoveImage(index, 1)}
                disabled={index === imageItems.length - 1}
                className="px-2 py-1 text-xs"
              >
                Right
              </ActionButton>
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => onRemoveImage(item.id)}
                className="px-2 py-1 text-xs"
              >
                Delete
              </ActionButton>
            </div>
          </div>
        ))}
      </div>
    )}
  </SurfaceCard>
);

export default ProductImagesSection;
