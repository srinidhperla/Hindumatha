import React from "react";
import { ActionButton } from "@/shared/ui/Primitives";
import {
  FormSection,
  RemovableChip,
  SuggestChip,
  fieldClass,
} from "@/shared/workspace/Form";
import {
  getDefaultOptionsForPortionType,
  getPortionTypeMeta,
  PRODUCT_PORTION_TYPES,
} from "@/utils/productOptions";

const onEnter = (handler) => (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handler();
  }
};

const ProductOptionsSection = ({
  formData,
  availableFlavors,
  customFlavor,
  customWeightLabel,
  onCustomFlavorChange,
  onAddFlavor,
  onRemoveFlavor,
  onAddFlavorOption,
  onCustomWeightLabelChange,
  onPortionTypeChange,
  onAddWeight,
  onRemoveWeight,
  onWeightFieldChange,
}) => {
  const portionTypeMeta = getPortionTypeMeta(formData.portionType);
  const suggestedWeightOptions = getDefaultOptionsForPortionType(
    formData.portionType,
  ).filter(
    (option) =>
      !formData.weightOptions.some(
        (current) => current.label.toLowerCase() === option.label.toLowerCase(),
      ),
  );
  const suggestedFlavors = availableFlavors.filter(
    (flavor) =>
      !formData.flavorOptions.some(
        (option) => option.name.toLowerCase() === flavor.toLowerCase(),
      ),
  );

  return (
    <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
      <FormSection title="Flavors">
        <div className="flex gap-2">
          <input
            type="text"
            value={customFlavor}
            onChange={(event) => onCustomFlavorChange(event.target.value)}
            onKeyDown={onEnter(onAddFlavor)}
            placeholder="Add a flavor"
            className={fieldClass}
          />
          <ActionButton type="button" variant="secondary" onClick={onAddFlavor}>
            Add
          </ActionButton>
        </div>

        {formData.flavorOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {formData.flavorOptions.map((option) => (
              <RemovableChip
                key={option.name}
                label={`Remove ${option.name}`}
                onRemove={() => onRemoveFlavor(option.name)}
              >
                {option.name}
              </RemovableChip>
            ))}
          </div>
        )}

        {suggestedFlavors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestedFlavors.map((flavor) => (
              <SuggestChip
                key={flavor}
                onClick={() => onAddFlavorOption(flavor)}
              >
                {flavor}
              </SuggestChip>
            ))}
          </div>
        )}
      </FormSection>

      <FormSection title={portionTypeMeta.heading}>
        <div className="flex gap-2">
          <select
            value={formData.portionType || "weight"}
            onChange={(event) => onPortionTypeChange(event.target.value)}
            className={`${fieldClass} w-auto shrink-0`}
            aria-label="Unit type"
          >
            {PRODUCT_PORTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {getPortionTypeMeta(type).heading}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={customWeightLabel}
            onChange={(event) => onCustomWeightLabelChange(event.target.value)}
            onKeyDown={onEnter(onAddWeight)}
            placeholder={portionTypeMeta.example}
            className={`${fieldClass} min-w-0`}
          />
          <ActionButton type="button" variant="secondary" onClick={onAddWeight}>
            Add
          </ActionButton>
        </div>

        {formData.weightOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {formData.weightOptions.map((option, index) => (
              <span
                key={option.label}
                className="inline-flex items-center rounded-full border border-[#e3d7bb] bg-[#faf6ec] pr-1"
              >
                <input
                  type="text"
                  value={option.label}
                  onChange={(event) =>
                    onWeightFieldChange(index, "label", event.target.value)
                  }
                  size={Math.max(4, option.label.length)}
                  aria-label={`${portionTypeMeta.singular} label`}
                  className="rounded-full bg-transparent py-1 pl-3 pr-1 text-xs font-semibold text-[#1f1709] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemoveWeight(option.label)}
                  aria-label={`Remove ${option.label}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[#8a7a5c] hover:bg-[#f1cdc6] hover:text-[#a3271b]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {suggestedWeightOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {suggestedWeightOptions.map((option) => (
              <SuggestChip
                key={option.label}
                onClick={() => onAddWeight(option.label)}
              >
                {option.label}
              </SuggestChip>
            ))}
          </div>
        )}
      </FormSection>
    </div>
  );
};

export default ProductOptionsSection;
