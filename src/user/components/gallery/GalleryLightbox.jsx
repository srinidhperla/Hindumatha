import React from "react";
import { OptimizedImage } from "@/shared/ui";

const GalleryLightbox = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/92 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
      >
        Close
      </button>

      <div className="relative max-h-[88vh] w-auto max-w-[96vw] overflow-hidden rounded-2xl shadow-2xl">
        {item.cakeCode ? (
          <div className="absolute left-4 top-4 z-10 rounded-full bg-[rgba(18,12,2,0.86)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fff7e3] shadow-lg">
            {item.cakeCode}
          </div>
        ) : null}
        <OptimizedImage
          src={item.imageUrl}
          alt={item.title}
          width={1400}
          height={1400}
          loading="lazy"
          maxWidth={1600}
          className="max-h-[88vh] w-auto max-w-[96vw] object-contain"
        />
      </div>
    </div>
  );
};

export default GalleryLightbox;
