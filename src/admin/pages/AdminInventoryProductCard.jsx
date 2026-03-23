import React from "react";
import { StatusChip, Toggle } from "@/shared/ui/Primitives";
import { formatCategoryLabel } from "@/utils/productOptions";

const AdminInventoryProductCard = ({
  product,
  canOrder,
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
  const isSavingProduct = savingKey === `product-${product._id}`;

  const renderWeightsOnly = (eggType) => (
    <div className="space-y-1">
      {weightOptions.map((weight) => {
        const avail = getTypedAvailability(
          product,
          eggType,
          "Cake",
          weight.label,
        );
        if (avail === null) return null;

        const weightKey = `fw-${product._id}-${eggType}-Cake-${weight.label}`;
        const isOn = avail;
        const saving = savingKey === weightKey;

        return (
          <button
            key={weightKey}
            type="button"
            onClick={() =>
              onFlavorWeightToggleByType(product, eggType, "Cake", weight.label)
            }
            disabled={saving}
            className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium admin-motion disabled:opacity-50 ${
              isOn
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-600"
            }`}
          >
            <span>{weight.label}</span>
            <span className="text-[10px] font-semibold">
              {isOn ? "ON" : "OFF"}
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderFlavorColumn = (eggType) => (
    <div className="space-y-3">
      {flavorOptions.map((option) => {
        const optionKey = `typed-flavor-${product._id}-${eggType}-${option.name}`;
        return (
          <div key={`${eggType}-${option.name}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                {option.name}
              </span>
              <Toggle
                checked={isTypedFlavorOn(product, eggType, option.name)}
                onClick={() =>
                  onTypedFlavorToggle(product, eggType, option.name)
                }
                disabled={savingKey === optionKey}
                label={`toggle flavor ${option.name} ${eggType} cake type`}
              />
            </div>
            <div className="mt-1.5 space-y-1 pl-2">
              {weightOptions.map((weight) => {
                const avail = getTypedAvailability(
                  product,
                  eggType,
                  option.name,
                  weight.label,
                );
                if (avail === null) return null;

                const isOn = avail;
                const saving =
                  savingKey ===
                  `fw-${product._id}-${eggType}-${option.name}-${weight.label}`;

                return (
                  <button
                    key={`${eggType}-${option.name}-${weight.label}`}
                    type="button"
                    onClick={() =>
                      onFlavorWeightToggleByType(
                        product,
                        eggType,
                        option.name,
                        weight.label,
                      )
                    }
                    disabled={saving}
                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium admin-motion disabled:opacity-50 ${
                      isOn
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-600"
                    }`}
                  >
                    <span>{weight.label}</span>
                    <span className="text-[10px] font-semibold">
                      {isOn ? "ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderColumn = (eggType, label, hasFlavors) => (
    <div className="p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-800">{label}</span>
        <Toggle
          checked={isEggTypeOn(product, eggType)}
          onClick={() => onEggTypeToggle(product, eggType)}
          disabled={savingKey === `${eggType}-${product._id}`}
          label={`toggle ${eggType} cake type`}
        />
      </div>
      {hasFlavors ? renderFlavorColumn(eggType) : renderWeightsOnly(eggType)}
    </div>
  );

  const showEgg = product.isEgg !== false;
  const showEggless = product.isEggless === true;
  const hasFlavors = flavorOptions.length > 0;
  const cols = showEgg && showEggless ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-3 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <img
            src={product.images?.[0] || product.image}
            alt={product.name}
            className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl object-cover ring-1 ring-slate-200 flex-shrink-0"
            onError={(event) => {
              event.target.onerror = null;
              event.target.src = "";
              event.target.style.background = "#f1f5f9";
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-base sm:text-xl font-bold text-slate-900 truncate">
                  {product.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <StatusChip tone="info">
                    {formatCategoryLabel(product.category)}
                  </StatusChip>
                  <StatusChip tone={canOrder ? "success" : "warning"}>
                    {canOrder ? "Live" : "Attention"}
                  </StatusChip>
                </div>
              </div>
              <Toggle
                checked={product.isAvailable !== false}
                onClick={() => onProductToggle(product)}
                disabled={isSavingProduct}
                label={`toggle ${product.name}`}
              />
            </div>
            <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
              {flavorOptions.length > 0
                ? `${availableFlavorCount}/${flavorOptions.length} flavors · `
                : ""}
              {weightOptions.length > 0
                ? `${availableWeightCount}/${weightOptions.length} ${portionTypeMeta.heading.toLowerCase()}`
                : `No ${portionTypeMeta.heading.toLowerCase()}`}
            </p>
          </div>
        </div>
      </div>

      {(showEgg || showEggless) && (
        <div className={`grid ${cols} divide-x divide-slate-100`}>
          {showEgg && renderColumn("egg", "Egg", hasFlavors)}
          {showEggless && renderColumn("eggless", "Eggless", hasFlavors)}
        </div>
      )}
    </div>
  );
};

export default AdminInventoryProductCard;
