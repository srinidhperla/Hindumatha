import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
import { normalizeGalleryFormFromItem } from "@/admin/pages/adminGalleryConfig";
import { formatGalleryWeightRange } from "@/utils/galleryItems";

const formatPrice = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return "Price not set";
  }

  return `Rs.${numericValue.toLocaleString("en-IN")}`;
};

const summarizeOptions = (items = [], limit = 3) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  if (!normalizedItems.length) {
    return "Not set";
  }

  const preview = normalizedItems.slice(0, limit).join(", ");
  return normalizedItems.length > limit
    ? `${preview} +${normalizedItems.length - limit} more`
    : preview;
};

const summarizeSectionOptions = (section, items = []) => {
  const normalizedItems = Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (section?.area === "extras" && section?.isCustom) {
    const sectionTitle = String(section?.title || "").trim();

    if (normalizedItems.length === 1 && normalizedItems[0] === sectionTitle) {
      return "Enabled";
    }

    if (!normalizedItems.length) {
      return "Disabled";
    }
  }

  return summarizeOptions(normalizedItems);
};

const AdminGalleryCard = ({
  item,
  galleryFieldConfig,
  onEdit,
  onDelete,
}) => {
  const normalizedItem = normalizeGalleryFormFromItem(item, galleryFieldConfig);
  const visibleSections = Array.isArray(normalizedItem.fieldSections)
    ? normalizedItem.fieldSections
    : [];
  const weightLabel = formatGalleryWeightRange(item);

  return (
    <SurfaceCard className="overflow-hidden border-[rgba(201,168,76,0.28)]">
      <div className="relative">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="h-56 w-full object-cover"
        />
        {item.cakeCode ? (
          <div className="absolute left-3 top-3 rounded-full bg-[rgba(18,12,2,0.88)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fff7e3] shadow-lg">
            {item.cakeCode}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a2b]">
              {item.category}
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#2a1f0e]">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-[#6a5130]">
              {item.priceLabel || "Starting at"} {formatPrice(item.price)}
            </p>
            {weightLabel ? (
              <p className="mt-1 text-xs font-medium text-[#8a6630]">
                Weight: {weightLabel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/75 p-3 text-xs text-[#6a5130]">
          {visibleSections.map((section) => (
            <p key={section.key}>
              <span className="font-semibold text-[#6a4c16]">
                {section.title}:
              </span>{" "}
              {summarizeSectionOptions(section, normalizedItem[section.key])}
            </p>
          ))}
        </div>

        <div className="flex gap-2">
          <ActionButton
            onClick={onEdit}
            variant="secondary"
            className="w-full text-xs sm:text-sm"
          >
            Edit Image
          </ActionButton>
        </div>

        <ActionButton
          onClick={onDelete}
          variant="danger"
          className="w-full text-xs sm:text-sm"
        >
          Delete
        </ActionButton>
      </div>
    </SurfaceCard>
  );
};

export default AdminGalleryCard;
