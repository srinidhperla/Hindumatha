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
        className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white transition hover:bg-black/65"
        aria-label="Close image preview"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div className="relative w-full max-w-[90vw] rounded-2xl border border-white/10 bg-[rgba(14,10,8,0.65)] p-3 shadow-2xl sm:max-w-[82vw] lg:max-w-[74vw]">
        {item.cakeCode ? (
          <div className="absolute left-5 top-5 z-10 rounded-full bg-[rgba(18,12,2,0.82)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fff7e3] shadow-lg">
            {item.cakeCode}
          </div>
        ) : null}
        <div className="flex max-h-[78vh] items-center justify-center overflow-hidden rounded-xl">
          <OptimizedImage
            src={item.imageUrl}
            alt={item.title}
            width={1400}
            height={1400}
            loading="lazy"
            maxWidth={1600}
            className="max-h-[72vh] w-auto max-w-full object-contain"
          />
        </div>
        <div className="mt-3 px-1 text-center">
          <p className="text-sm font-semibold text-white/90 sm:text-base">
            {item.title}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GalleryLightbox;
