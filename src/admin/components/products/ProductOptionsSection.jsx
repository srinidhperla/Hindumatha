import React from "react";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../../components/ui/Primitives";

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
  <div className="grid gap-5 lg:grid-cols-2">
    <SurfaceCard className="p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-slate-900">Flavors</h3>
      <p className="mt-1 text-sm text-slate-500">
        Add available flavors quickly. Inventory toggles stay in Inventory page.
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

    <SurfaceCard className="p-4 sm:p-5">
      <h3 className="text-lg font-semibold text-slate-900">Weights</h3>
      <p className="mt-1 text-sm text-slate-500">
        Configure weight labels and exact price multipliers.
      </p>

      <div className="mt-4 flex gap-3">
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
          className="w-28 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
        />
        <ActionButton type="button" variant="secondary" onClick={onAddWeight}>
          Add
        </ActionButton>
      </div>

      <div className="mt-4 space-y-2">
        {formData.weightOptions.map((option, index) => (
          <div key={option.label} className="rounded-xl bg-slate-100 p-3">
            <div className="grid gap-2 md:grid-cols-[1fr_120px_auto] md:items-center">
              <input
                type="text"
                value={option.label}
                onChange={(event) =>
                  onWeightFieldChange(index, "label", event.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
              />
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={option.multiplier}
                onChange={(event) =>
                  onWeightFieldChange(index, "multiplier", event.target.value)
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
              />
              <ActionButton
                type="button"
                variant="danger"
                onClick={() => onRemoveWeight(option.label)}
                className="px-3 py-1 text-xs"
              >
                Remove
              </ActionButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Flavor and weight preview
        </p>
        <div className="mt-2 space-y-2">
          {formData.flavorOptions.map((option) => (
            <div
              key={`matrix-${option.name}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <p className="text-sm font-semibold text-slate-800">
                {option.name}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.weightOptions.map((weightOption) => (
                  <StatusChip
                    key={`matrix-${option.name}-${weightOption.label}`}
                    tone="neutral"
                    className="text-[11px]"
                  >
                    {weightOption.label} x{weightOption.multiplier}
                  </StatusChip>
                ))}
              </div>
            </div>
          ))}
          {!formData.flavorOptions.length && (
            <p className="text-sm text-slate-500">
              Add flavors to preview how each flavor supports all listed
              weights.
            </p>
          )}
        </div>
      </div>
    </SurfaceCard>
  </div>
);

export default ProductOptionsSection;
