import React from "react";
import { ActionButton, SurfaceCard } from "../../../components/ui/Primitives";

const ProductOptionsSection = ({
  formData,
  inputClassName,
  availableFlavors,
  customFlavor,
  customWeightLabel,
  customWeightMultiplier,
  onCustomFlavorChange,
  onAddFlavor,
  onRemoveFlavor,
  onAddFlavorOption,
  onCustomWeightLabelChange,
  onCustomWeightMultiplierChange,
  onAddWeight,
  onRemoveWeight,
  onWeightFieldChange,
}) => (
  <div className="space-y-4 sm:space-y-5">
    {/* Egg type info banner */}
    {(formData.isEgg || formData.isEggless) && (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-fuchsia-100 bg-fuchsia-50/60 px-3 py-2.5">
        <span className="text-xs font-semibold text-slate-600">
          Applies to:
        </span>
        {formData.isEgg && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            🥚 Egg
          </span>
        )}
        {formData.isEggless && (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            🌱 Eggless
          </span>
        )}
        <span className="ml-auto text-[10px] text-slate-400">
          Fine-tune per-type in Inventory
        </span>
      </div>
    )}

    <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
      <SurfaceCard className="p-3 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          Flavors
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Add available flavors quickly. Inventory toggles stay in Inventory
          page.
        </p>

        {availableFlavors.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {availableFlavors
              .filter(
                (flavor) =>
                  !formData.flavorOptions.some(
                    (option) =>
                      option.name.toLowerCase() === flavor.toLowerCase(),
                  ),
              )
              .map((flavor) => (
                <ActionButton
                  key={flavor}
                  type="button"
                  variant="soft"
                  onClick={() => onAddFlavorOption(flavor)}
                  className="rounded-full px-3 py-1 text-xs"
                >
                  + {flavor}
                </ActionButton>
              ))}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={customFlavor}
            onChange={(event) => onCustomFlavorChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onAddFlavor();
              }
            }}
            placeholder="Add new flavor"
            className={inputClassName.replace("mt-1 ", "")}
          />
          <ActionButton type="button" variant="secondary" onClick={onAddFlavor}>
            Add
          </ActionButton>
        </div>

        <div className="mt-4 space-y-2">
          {formData.flavorOptions.map((option) => (
            <div
              key={option.name}
              className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2"
            >
              <span className="text-sm font-medium text-slate-800">
                {option.name}
              </span>
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => onRemoveFlavor(option.name)}
                className="px-3 py-1 text-xs"
              >
                Remove
              </ActionButton>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="p-3 sm:p-5">
        <h3 className="text-base sm:text-lg font-semibold text-slate-900">
          Weights
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Configure weight labels and price multipliers.
        </p>

        <div className="mt-3 sm:mt-4 flex gap-2 sm:gap-3">
          <input
            type="text"
            value={customWeightLabel}
            onChange={(event) => onCustomWeightLabelChange(event.target.value)}
            placeholder="Example: 1kg"
            className={inputClassName.replace("mt-1 ", "")}
          />
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={customWeightMultiplier}
            onChange={(event) =>
              onCustomWeightMultiplierChange(event.target.value)
            }
            className="w-20 sm:w-28 rounded-xl border border-slate-300 bg-white px-2 sm:px-3 py-2 sm:py-2.5 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
          />
          <ActionButton type="button" variant="secondary" onClick={onAddWeight}>
            Add
          </ActionButton>
        </div>

        <div className="mt-3 sm:mt-4 space-y-2">
          {formData.weightOptions.map((option, index) => (
            <div
              key={option.label}
              className="rounded-xl bg-slate-100 p-2 sm:p-3"
            >
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={option.label}
                  onChange={(event) =>
                    onWeightFieldChange(index, "label", event.target.value)
                  }
                  className="flex-1 min-w-0 rounded-xl border border-slate-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                />
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={option.multiplier}
                  onChange={(event) =>
                    onWeightFieldChange(index, "multiplier", event.target.value)
                  }
                  className="w-20 sm:w-28 rounded-xl border border-slate-300 bg-white px-2 sm:px-3 py-1.5 sm:py-2 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
                />
                <ActionButton
                  type="button"
                  variant="danger"
                  onClick={() => onRemoveWeight(option.label)}
                  className="px-2 sm:px-3 py-1 text-xs flex-shrink-0"
                >
                  ✕
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  </div>
);

export default ProductOptionsSection;
