import { useEffect } from "react";
import { formatCategoryLabel } from "@/utils/productOptions";

const getTypedKey = (eggType, flavorName) => `${eggType}::${flavorName}`;

export const useProductFormPricing = ({
  formData,
  onVariantPricesChange,
  onFlavorWeightAvailabilityChange,
}) => {
  const selectedEggTypes = [
    formData.isEgg ? "egg" : null,
    formData.isEggless ? "eggless" : null,
  ].filter(Boolean);

  const flavorRows =
    formData.flavorOptions.length > 0
      ? formData.flavorOptions.map((option) => option.name)
      : ["Cake"];

  const fallbackFlavorLabel = formatCategoryLabel(
    formData.category || formData.name || "cake",
  );

  const getDefaultPrice = (weightOption) => {
    const fallback = Math.round(
      (Number(formData.price) || 0) * Number(weightOption.multiplier || 1),
    );
    return fallback > 0 ? fallback : "";
  };

  const getTypedPrice = (eggType, flavorName, weightOption) => {
    const key = getTypedKey(eggType, flavorName);
    const row = formData.variantPrices?.[key] || {};
    const raw = row?.[weightOption.label];
    const direct = Number(raw);

    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    if (raw === "" || raw === 0 || raw === "0") {
      return "";
    }

    return getDefaultPrice(weightOption);
  };

  const isWeightOn = (eggType, flavorName, weightLabel) => {
    const key = getTypedKey(eggType, flavorName);
    const row = formData.flavorWeightAvailability?.[key] || {};
    return row[weightLabel] !== false && row[weightLabel] !== null;
  };

  const updateTypedPrice = (eggType, flavorName, weightLabel, nextPrice) => {
    if (!isWeightOn(eggType, flavorName, weightLabel)) {
      return;
    }

    const key = getTypedKey(eggType, flavorName);
    const parsedPrice = Number(nextPrice);

    const current = formData.variantPrices || {};
    const nextPrices = {
      ...current,
      [key]: {
        ...(current[key] || {}),
        [weightLabel]:
          Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 0,
      },
    };

    onVariantPricesChange(nextPrices);
  };

  const updateTypedWeight = (eggType, flavorName, weightLabel, nextValue) => {
    const key = getTypedKey(eggType, flavorName);
    const current = formData.flavorWeightAvailability || {};
    const nextMatrix = {
      ...current,
      [key]: {
        ...(current[key] || {}),
        [weightLabel]: nextValue ? true : null,
      },
    };
    onFlavorWeightAvailabilityChange(nextMatrix);
  };

  useEffect(() => {
    if (!selectedEggTypes.length || !formData.weightOptions.length) {
      return;
    }

    const current = formData.variantPrices || {};
    const nextVariantPrices = { ...current };
    let changed = false;

    selectedEggTypes.forEach((eggType) => {
      flavorRows.forEach((flavorName) => {
        const key = getTypedKey(eggType, flavorName);
        const currentRow =
          nextVariantPrices[key] && typeof nextVariantPrices[key] === "object"
            ? nextVariantPrices[key]
            : {};

        const nextRow = { ...currentRow };
        let rowChanged = !(key in nextVariantPrices);

        formData.weightOptions.forEach((weightOption) => {
          const weightLabel = weightOption.label;
          const rawValue = currentRow[weightLabel];
          if (rawValue === undefined) {
            nextRow[weightLabel] = getDefaultPrice(weightOption);
            rowChanged = true;
          }
        });

        if (rowChanged) {
          nextVariantPrices[key] = nextRow;
          changed = true;
        }
      });
    });

    if (changed) {
      onVariantPricesChange(nextVariantPrices);
    }
  }, [
    formData.price,
    formData.variantPrices,
    formData.weightOptions,
    flavorRows,
    onVariantPricesChange,
    selectedEggTypes,
  ]);

  return {
    selectedEggTypes,
    flavorRows,
    fallbackFlavorLabel,
    getTypedPrice,
    isWeightOn,
    updateTypedPrice,
    updateTypedWeight,
  };
};
