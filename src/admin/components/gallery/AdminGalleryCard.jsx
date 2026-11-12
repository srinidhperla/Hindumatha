import React from "react";
import {
  formatGalleryCategoryLabel,
  formatGalleryWeightRange,
  getGalleryItemCategories,
} from "@/utils/galleryItems";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Price not set";
  }

  return `₹${numericValue.toLocaleString("en-IN")}`;
};

/* A photo tile: the image, what it is, what it costs. The per-option details
 * (cake type, flavour, fondant…) live in the edit form. */
const AdminGalleryCard = ({ item, onEdit, onDelete }) => {
  const weightLabel = formatGalleryWeightRange(item);
  const categories = getGalleryItemCategories(item);

  return (
    <div className="ws-card group overflow-hidden">
      <button
        type="button"
        onClick={onEdit}
        className="relative block aspect-square w-full bg-[#f3ecdb]"
        aria-label={`Edit ${item.title}`}
      >
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        {item.cakeCode ? (
          <span className="absolute left-2 top-2 rounded-full bg-[rgba(18,12,2,0.82)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#fff7e3]">
            {item.cakeCode}
          </span>
        ) : null}
      </button>

      <div className="px-3 pb-2.5 pt-2">
        <h3 className="truncate text-sm font-semibold text-[#1f1709]">
          {item.title}
        </h3>
        <p className="truncate text-xs text-[#7d6c4d]">
          <span className="font-semibold text-[#8b6914]">
            {formatPrice(item.price)}
          </span>
          {weightLabel ? ` · ${weightLabel}` : ""}
        </p>
        <p className="truncate text-[11px] text-[#8a7a5c]">
          {categories.map(formatGalleryCategoryLabel).join(", ")}
        </p>

        <div className="mt-2 flex items-center justify-between border-t border-[#f3ecdb] pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-[#8b6914] hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-semibold text-[#a3271b] hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGalleryCard;
