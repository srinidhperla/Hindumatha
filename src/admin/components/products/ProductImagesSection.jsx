import React, { useRef } from "react";
import { OptimizedImage } from "@/shared/ui";
import { FormSection } from "@/shared/workspace/Form";

const controlClass =
  "flex h-6 flex-1 items-center justify-center text-xs text-white hover:bg-white/20 disabled:opacity-30";

const ProductImagesSection = ({
  imageItems,
  formData,
  onImageChange,
  onMoveImage,
  onRemoveImage,
}) => {
  const fileInputRef = useRef(null);

  return (
    <FormSection title="Images">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onImageChange}
        className="hidden"
      />
      <div className="flex flex-wrap gap-2">
        {imageItems.map((item, index) => (
          <div
            key={item.id}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-[#ebe1cb] bg-[#f3ecdb]"
          >
            <OptimizedImage
              src={item.preview}
              alt={`${formData.name || "Product"} ${index + 1}`}
              width={192}
              height={192}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded-full bg-[#1f1709] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#f3dd96]">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex bg-[rgba(18,12,2,0.72)]">
              <button
                type="button"
                onClick={() => onMoveImage(index, -1)}
                disabled={index === 0}
                aria-label="Move left"
                className={controlClass}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onMoveImage(index, 1)}
                disabled={index === imageItems.length - 1}
                aria-label="Move right"
                className={controlClass}
              >
                →
              </button>
              <button
                type="button"
                onClick={() => onRemoveImage(item.id)}
                aria-label="Remove image"
                className={controlClass}
              >
                ✕
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#d9c48a] text-xs font-semibold text-[#5c4a26] hover:border-[#c9a84c] hover:bg-[#faf6ec]"
        >
          <span className="text-xl leading-none">+</span>
          Add images
        </button>
      </div>
    </FormSection>
  );
};

export default ProductImagesSection;
