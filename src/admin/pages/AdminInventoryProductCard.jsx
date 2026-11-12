import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatusChip, Toggle } from "@/shared/ui/Primitives";
import { OptimizedImage } from "@/shared/ui";
import { formatCategoryLabel } from "@/utils/productOptions";

/* Availability cascades downwards, the way a delivery app's menu does:
 *
 *   category  →  product  →  egg / eggless  →  flavour  →  size
 *
 * Switching a level off takes everything under it off the website, but each
 * child keeps its own saved setting, so switching the parent back on brings
 * the item back exactly as it was. While a parent is off its children are
 * shown off and locked, so the screen always matches what customers see. */

const chipTone = (state) => {
  if (state === "on")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "off") return "border-red-200 bg-red-50 text-red-600";
  // "blocked": off only because something above it is off
  return "border-[#e3d7bb] bg-[#f6f1e6] text-[#a8936a]";
};

const SizeChip = ({ label, isOn, blocked, saving, onClick }) => {
  const state = blocked ? "blocked" : isOn ? "on" : "off";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving || blocked}
      title={
        blocked ? "Off because the level above is switched off" : undefined
      }
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold admin-motion ${
        saving ? "opacity-50" : ""
      } ${blocked ? "cursor-not-allowed" : ""} ${chipTone(state)}`}
    >
      <span className={blocked ? "line-through" : ""}>{label}</span>
      <span className="text-[9px] font-bold opacity-70">
        {state === "on" ? "ON" : "OFF"}
      </span>
    </button>
  );
};

const AdminInventoryProductCard = ({
  product,
  canOrder,
  categoryActive = true,
  flavorOptions,
  weightOptions,
  portionTypeMeta,
  availableFlavorCount,
  availableWeightCount,
  savingKey,
  onProductToggle,
  onEggTypeToggle,
  onTypedFlavorToggle,
  onFlavorWeightToggleByType,
  getTypedAvailability,
  isTypedFlavorOn,
  isEggTypeOn,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isSavingProduct = savingKey === `product-${product._id}`;

  // What the customer effectively gets at each level.
  const productSwitchOn = product.isAvailable !== false;
  const productLive = categoryActive && productSwitchOn;

  const renderSizes = (eggType, flavorName, parentLive) => (
    <div className="flex flex-wrap gap-1.5">
      {weightOptions.map((weight) => {
        const availability = getTypedAvailability(
          product,
          eggType,
          flavorName,
          weight.label,
        );
        if (availability === null) return null;

        const weightKey = `fw-${product._id}-${eggType}-${flavorName}-${weight.label}`;

        return (
          <SizeChip
            key={weightKey}
            label={weight.label}
            isOn={availability}
            blocked={!parentLive}
            saving={savingKey === weightKey}
            onClick={() =>
              onFlavorWeightToggleByType(
                product,
                eggType,
                flavorName,
                weight.label,
              )
            }
          />
        );
      })}
    </div>
  );

  const renderFlavorColumn = (eggType) => (
    <div className="space-y-2">
      {flavorOptions.map((option) => {
        const optionKey = `typed-flavor-${product._id}-${eggType}-${option.name}`;
        return (
          <div key={`${eggType}-${option.name}`}>
            <div className="mb-1 flex items-center justify-between">
              <span className="min-w-0 flex-1 truncate pr-2 text-xs font-semibold text-[#1f1709] sm:text-sm">
                {option.name}
              </span>
              <Toggle
                checked={
                  productLive && isTypedFlavorOn(product, eggType, option.name)
                }
                onClick={() =>
                  onTypedFlavorToggle(product, eggType, option.name)
                }
                disabled={!productLive || savingKey === optionKey}
                label={`toggle flavor ${option.name} ${eggType} cake type`}
                size="compact"
              />
            </div>
            {renderSizes(eggType, option.name, productLive)}
          </div>
        );
      })}
    </div>
  );

  const renderColumn = (eggType, label, hasFlavors) => (
    <div className="px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`text-sm font-bold ${
            productLive ? "text-[#1f1709]" : "text-[#a8936a]"
          }`}
        >
          {label}
        </span>
        <Toggle
          checked={productLive && isEggTypeOn(product, eggType)}
          onClick={() => onEggTypeToggle(product, eggType)}
          disabled={!productLive || savingKey === `${eggType}-${product._id}`}
          label={`toggle ${eggType} cake type`}
          size="compact"
        />
      </div>
      {hasFlavors
        ? renderFlavorColumn(eggType)
        : renderSizes(eggType, "Cake", productLive)}
    </div>
  );

  const showEgg = product.isEgg !== false;
  const showEggless = product.isEggless === true;
  const hasFlavors = flavorOptions.length > 0;
  const hasWeightOptions = weightOptions.length > 0;
  const cols = showEgg && showEggless ? "grid-cols-2" : "grid-cols-1";

  const blockedReason = !categoryActive
    ? "Hidden — category is off"
    : !productSwitchOn
      ? "Paused — hidden from the menu"
      : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-xl border bg-white transition-opacity ${
        productLive ? "border-[#ebe1cb]" : "border-[#e3d7bb] bg-[#fbf8f1]"
      }`}
    >
      <div className="border-b border-[#f3ecdb] px-3 py-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab touch-none py-1 text-xl font-bold leading-none text-[#7d6c4d] hover:text-[#5c4a26] active:cursor-grabbing"
            title="Drag to reorder"
          >
            {"≡"}
          </button>
          <OptimizedImage
            src={product.images?.[0] || product.image}
            alt={product.name}
            width={80}
            height={80}
            loading="lazy"
            className={`h-10 w-10 flex-shrink-0 rounded-lg bg-[#f3ecdb] object-cover ${
              productLive ? "" : "opacity-50 grayscale"
            }`}
            onError={(event) => {
              event.target.onerror = null;
              event.target.src = "";
              event.target.style.background = "#f1f5f9";
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={`truncate text-sm font-semibold ${
                    productLive ? "text-[#1f1709]" : "text-[#8a7a5c]"
                  }`}
                >
                  {product.name}
                  {blockedReason ? (
                    <StatusChip tone="danger" className="ml-2 !px-2 !py-0.5">
                      {blockedReason}
                    </StatusChip>
                  ) : (
                    !canOrder && (
                      <StatusChip tone="warning" className="ml-2 !px-2 !py-0.5">
                        Nothing to order — all options off
                      </StatusChip>
                    )
                  )}
                </p>
                <p className="truncate text-xs text-[#7d6c4d]">
                  {formatCategoryLabel(product.category)}
                  {" · "}
                  {flavorOptions.length > 0
                    ? `${availableFlavorCount}/${flavorOptions.length} flavors · `
                    : ""}
                  {hasWeightOptions
                    ? `${availableWeightCount}/${weightOptions.length} ${portionTypeMeta.heading.toLowerCase()}`
                    : "Single price"}
                </p>
              </div>
              <Toggle
                checked={productSwitchOn}
                onClick={() => onProductToggle(product)}
                disabled={isSavingProduct}
                label={`toggle ${product.name}`}
                size="compact"
              />
            </div>
          </div>
        </div>
      </div>

      {hasWeightOptions && (showEgg || showEggless) && (
        <div className={`grid ${cols} divide-x divide-[#f3ecdb]`}>
          {showEgg && renderColumn("egg", "Egg", hasFlavors)}
          {showEggless && renderColumn("eggless", "Eggless", hasFlavors)}
        </div>
      )}
    </div>
  );
};

export default AdminInventoryProductCard;
