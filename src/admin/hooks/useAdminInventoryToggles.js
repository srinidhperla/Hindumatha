import { useState } from "react";
import { updateProductInventory } from "@/features/products/productSlice";
import { getErrorMessage } from "@/admin/pages/adminShared";
import {
  normalizeFlavorOptions,
  normalizeWeightOptions,
} from "@/utils/productOptions";

const buildInventoryPayload = (overrides = {}) => {
  const payload = {};
  if (overrides.isAvailable !== undefined) {
    payload.isAvailable = overrides.isAvailable;
  }
  if (overrides.flavorWeightAvailability !== undefined) {
    payload.flavorWeightAvailability = overrides.flavorWeightAvailability;
  }
  return payload;
};

const getTypedRow = (source, typedKey) => {
  if (!source || typeof source !== "object") return null;

  const direct = source?.[typedKey] || source?.get?.(typedKey);
  if (direct && typeof direct === "object") return direct;

  const typedKeyLower = String(typedKey).toLowerCase();
  const entries = Object.entries(source || {});
  const match = entries.find(
    ([key]) => String(key).toLowerCase() === typedKeyLower,
  );
  return match && typeof match[1] === "object" ? match[1] : null;
};

const getTypedKeyName = (source, typedKey) => {
  if (!source || typeof source !== "object") return typedKey;
  const typedKeyLower = String(typedKey).toLowerCase();
  const match = Object.keys(source || {}).find(
    (key) => String(key).toLowerCase() === typedKeyLower,
  );
  return match || typedKey;
};

const getRowValue = (row, label) => {
  if (!row || typeof row !== "object") return undefined;
  if (label in row) return row[label];

  const lower = String(label).toLowerCase();
  if (lower in row) return row[lower];

  const match = Object.entries(row).find(
    ([key]) => String(key).toLowerCase() === lower,
  );
  return match ? match[1] : undefined;
};

const useAdminInventoryToggles = ({ dispatch, onToast }) => {
  const [savingKey, setSavingKey] = useState("");

  const saveInventory = async (
    product,
    overrides,
    actionKey,
    successMessage,
  ) => {
    try {
      setSavingKey(actionKey);
      await dispatch(
        updateProductInventory({
          id: product._id,
          inventoryData: buildInventoryPayload(overrides),
        }),
      ).unwrap();
      onToast(successMessage);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to update inventory."), "error");
    } finally {
      setSavingKey("");
    }
  };

  const handleProductToggle = (product) => {
    const nextValue = product.isAvailable === false;
    saveInventory(
      product,
      { isAvailable: nextValue },
      `product-${product._id}`,
      `${product.name} is now ${nextValue ? "live" : "paused"}.`,
    );
  };

  const getTypedAvailability = (product, eggType, flavorName, weightLabel) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const row = getTypedRow(raw, typedKey);
    const val = getRowValue(row, weightLabel);
    if (val !== undefined) {
      if (val === null) return null;
      return val !== false;
    }
    return true;
  };

  const isTypedFlavorOn = (product, eggType, flavorName) => {
    const weights = normalizeWeightOptions(product);
    return weights.some((weight) => {
      const value = getTypedAvailability(
        product,
        eggType,
        flavorName,
        weight.label,
      );
      return value === true;
    });
  };

  const isEggTypeOn = (product, eggType) => {
    const weights = normalizeWeightOptions(product);
    const flavors = normalizeFlavorOptions(product);
    const flavorNames =
      flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
    return flavorNames.some((name) =>
      weights.some((weight) => {
        const value = getTypedAvailability(
          product,
          eggType,
          name,
          weight.label,
        );
        return value === true;
      }),
    );
  };

  const ensureOtherTypeMatrix = (product, nextMatrix, otherType, weights) => {
    const hasOtherType =
      otherType === "egg"
        ? product.isEgg !== false
        : product.isEggless === true;
    if (!hasOtherType) {
      return;
    }

    const flavors = normalizeFlavorOptions(product);
    const flavorNames =
      flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
    flavorNames.forEach((flavorName) => {
      const otherKey = `${otherType}::${flavorName}`;
      if (!nextMatrix[otherKey]) {
        const otherRow = {};
        weights.forEach((weight) => {
          otherRow[weight.label] = true;
        });
        nextMatrix[otherKey] = otherRow;
      }
    });
  };

  const handleEggTypeToggle = (product, eggType) => {
    const raw = product.flavorWeightAvailability || {};
    const weights = normalizeWeightOptions(product);
    const flavors = normalizeFlavorOptions(product);
    const flavorNames =
      flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
    const otherType = eggType === "egg" ? "eggless" : "egg";

    const anyOn = flavorNames.some((flavorName) => {
      const typedKey = `${eggType}::${flavorName}`;
      const row = getTypedRow(raw, typedKey);
      if (!row) return true;
      return weights.some(
        (weight) =>
          getRowValue(row, weight.label) !== false &&
          getRowValue(row, weight.label) !== null,
      );
    });

    const nextMatrix = {};
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });

    flavorNames.forEach((flavorName) => {
      const typedKey = `${eggType}::${flavorName}`;
      const currentRow = getTypedRow(raw, typedKey) || {};
      const newRow = {};
      weights.forEach((weight) => {
        const current = getRowValue(currentRow, weight.label);
        newRow[weight.label] = current === null ? null : !anyOn;
      });
      nextMatrix[getTypedKeyName(raw, typedKey)] = newRow;
    });

    ensureOtherTypeMatrix(product, nextMatrix, otherType, weights);

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `${eggType}-${product._id}`,
      `${product.name} ${eggType === "egg" ? "Egg" : "Eggless"} cake type is now ${!anyOn ? "ON" : "OFF"}.`,
    );
  };

  const handleTypedFlavorToggle = (product, eggType, flavorName) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const weights = normalizeWeightOptions(product);
    const currentRow = getTypedRow(raw, typedKey) || {};

    const offeredWeights = weights.filter(
      (weight) => getRowValue(currentRow, weight.label) !== null,
    );
    if (!offeredWeights.length && Object.keys(currentRow).length > 0) return;

    const anyOn =
      offeredWeights.length > 0
        ? offeredWeights.some(
            (weight) => getRowValue(currentRow, weight.label) !== false,
          )
        : true;

    const newRow = {};
    weights.forEach((weight) => {
      const current = getRowValue(currentRow, weight.label);
      newRow[weight.label] = current === null ? null : !anyOn;
    });

    const nextMatrix = {};
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });
    nextMatrix[getTypedKeyName(raw, typedKey)] = newRow;

    const otherType = eggType === "egg" ? "eggless" : "egg";
    ensureOtherTypeMatrix(product, nextMatrix, otherType, weights);

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `typed-flavor-${product._id}-${eggType}-${flavorName}`,
      `${flavorName} (${eggType === "egg" ? "Egg" : "Eggless"} cake type) updated for ${product.name}.`,
    );
  };

  const handleFlavorWeightToggleByType = (
    product,
    eggType,
    flavorName,
    weightLabel,
  ) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const existingRow = getTypedRow(raw, typedKey) || {};
    const rawValue = getRowValue(existingRow, weightLabel);
    if (rawValue === null) return;

    const currentValue = rawValue !== undefined ? rawValue !== false : true;
    const nextMatrix = {};
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });

    nextMatrix[getTypedKeyName(raw, typedKey)] = {
      ...existingRow,
      [weightLabel]: !currentValue,
    };

    const otherType = eggType === "egg" ? "eggless" : "egg";
    const weights = normalizeWeightOptions(product);
    ensureOtherTypeMatrix(product, nextMatrix, otherType, weights);

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `fw-${product._id}-${eggType}-${flavorName}-${weightLabel}`,
      `${flavorName} ${weightLabel} (${eggType === "egg" ? "Egg" : "Eggless"} cake type) updated for ${product.name}.`,
    );
  };

  return {
    savingKey,
    handleProductToggle,
    handleEggTypeToggle,
    handleTypedFlavorToggle,
    handleFlavorWeightToggleByType,
    getTypedAvailability,
    isTypedFlavorOn,
    isEggTypeOn,
  };
};

export default useAdminInventoryToggles;
