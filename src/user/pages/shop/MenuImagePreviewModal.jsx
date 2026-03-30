import React from "react";
import { OptimizedImage } from "@/shared/ui";

const MenuImagePreviewModal = ({ imagePreview, closeImagePreview }) => {
  if (!imagePreview) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeImagePreview();
        }
      }}
    >
      <button
        type="button"
        onClick={closeImagePreview}
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
      >
        Close
      </button>
      <OptimizedImage
        src={imagePreview.src}
        alt={imagePreview.name}
        width={1200}
        height={1200}
        loading="eager"
        maxWidth={1400}
        className="max-h-[88vh] w-auto max-w-[96vw] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
};

export default MenuImagePreviewModal;
