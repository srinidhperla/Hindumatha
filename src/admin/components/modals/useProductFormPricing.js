import { formatCategoryLabel } from "@/utils/productOptions";
import {
  readRowValue,
  readVariantPriceValue,
  resolveTypedRow,
} from "@/utils/productOptionInternals";

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

  const getTypedPrice = (eggType, flavorName, weightOption) => {
    const key = getTypedKey(eggType, flavorName);
    const row = resolveTypedRow(formData.variantPrices, key) || {};
    const raw = readRowValue(row, weightOption.label);
    const direct = readVariantPriceValue(raw);
    const fallbackBasePrice = Number(formData.price);
    const fallbackMultiplier = Number(weightOption?.multiplier || 1);

    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    if (raw === "" || raw === 0 || raw === "0") {
      return "";
    }

    if (
      Number.isFinite(fallbackBasePrice) &&
      fallbackBasePrice > 0 &&
      Number.isFinite(fallbackMultiplier) &&
      fallbackMultiplier > 0
    ) {
      return fallbackBasePrice * fallbackMultiplier;
    }

    return "";
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
