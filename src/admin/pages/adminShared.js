export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Baking" },
  { value: "ready", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export const DEFAULT_PRODUCT_CATEGORIES = [
  "cakes",
  "pastries",

  "cookies",
  "custom",
];

export const normalizeCategoryValue = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getOrderItems = (order) =>
  Array.isArray(order?.items) ? order.items : [];

const toText = (value) => String(value ?? "").trim();
const toCompactKey = (value = "") =>
  String(value).replace(/[^a-z0-9]/gi, "").toLowerCase();

const HIDDEN_OPTION_KEYS = new Set(["size"]);
const OPTION_DISPLAY_PRIORITY = {
  weight: 1,
  caketype: 2,
  flavor: 3,
  occasion: 4,
  messageoncake: 5,
};

const toEggTypeLabel = (eggType = "") => {
  if (String(eggType).toLowerCase() === "eggless") {
    return "Eggless";
  }
  if (String(eggType).toLowerCase() === "egg") {
    return "Egg";
  }
  return toText(eggType);
};

const keyToLabel = (key = "") => {
  const compact = toCompactKey(key);
  const mapped = {
    eggtype: "Cake Type",
    caketype: "Cake Type",
    flavor: "Flavor",
    size: "Size",
    weight: "Weight",
    occasion: "Occasion",
    custommessage: "Message on Cake",
    messageoncake: "Message on Cake",
    message: "Message on Cake",
    portion: "Portion",
    portiontype: "Portion",
  };

  if (mapped[compact]) {
    return mapped[compact];
  }

  return toText(key)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const normalizeOptionEntries = (selectedOptions) => {
  const entries = [];

  if (Array.isArray(selectedOptions)) {
    selectedOptions.forEach((entry) => {
      const label = toText(entry?.label || entry?.name || entry?.key);
      const value = toText(entry?.value ?? entry?.choice ?? entry?.selected);
      if (label && value) {
        entries.push({ label, value });
      }
    });
    return entries;
  }

  if (!selectedOptions || typeof selectedOptions !== "object") {
    return [];
  }

  Object.entries(selectedOptions).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const label = toText(value.label) || keyToLabel(key);
      const normalizedValue = toText(
        value.value ?? value.choice ?? value.selected,
      );
      if (label && normalizedValue) {
        entries.push({ label, value: normalizedValue });
      }
      return;
    }

    const label = keyToLabel(key);
    const normalizedValue = toText(value);
    if (label && normalizedValue) {
      entries.push({ label, value: normalizedValue });
    }
  });

  return entries;
};

const dedupeOptionEntries = (entries = []) => {
  const filteredEntries = entries
    .map((entry, index) => ({
      index,
      label: toText(entry?.label),
      value: toText(entry?.value),
    }))
    .filter((entry) => {
      if (!entry.label || !entry.value) {
        return false;
      }

      return !HIDDEN_OPTION_KEYS.has(toCompactKey(entry.label));
    });

  const seen = new Set();
  const dedupedEntries = filteredEntries.filter((entry) => {
    const key = `${entry.label.toLowerCase()}::${entry.value.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });

  return dedupedEntries
    .sort((left, right) => {
      const leftPriority =
        OPTION_DISPLAY_PRIORITY[toCompactKey(left.label)] || Number.MAX_SAFE_INTEGER;
      const rightPriority =
        OPTION_DISPLAY_PRIORITY[toCompactKey(right.label)] ||
        Number.MAX_SAFE_INTEGER;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return left.index - right.index;
    })
    .map(({ label, value }) => ({ label, value }));
};

export const getOrderItemName = (item) =>
  toText(item?.productName) || toText(item?.product?.name) || "Custom Cake";

export const getOrderItemOptionEntries = (item) => {
  const entries = normalizeOptionEntries(item?.selectedOptions);
  const push = (label, value) => {
    const normalizedLabel = toText(label);
    const normalizedValue = toText(value);
    if (normalizedLabel && normalizedValue) {
      entries.push({
        label: normalizedLabel,
        value: normalizedValue,
      });
    }
  };

  push("Weight", item?.weight || item?.size);
  push("Flavor", item?.flavor);
  push("Cake Type", toEggTypeLabel(item?.cakeType || item?.eggType));
  push("Occasion", item?.occasion);
  push("Message on Cake", item?.customMessage || item?.message);

  if (Array.isArray(item?.customizations)) {
    item.customizations.forEach((customization) => {
      push(
        toText(customization?.name) || "Customization",
        customization?.choice,
      );
    });
  }

  return dedupeOptionEntries(entries);
};

export const getOrderItemShortSummary = (item, maxEntries = 3) => {
  const entries = getOrderItemOptionEntries(item);
  if (entries.length > 0) {
    return entries
      .slice(0, maxEntries)
      .map((entry) => `${entry.label}: ${entry.value}`)
      .join(" | ");
  }

  const explicitSummary = toText(item?.optionSummary);
  if (explicitSummary) {
    return explicitSummary;
  }

  return "";
};

export const getOrderItemFullSummary = (item) => {
  const entries = getOrderItemOptionEntries(item);
  if (entries.length > 0) {
    return entries.map((entry) => `${entry.label}: ${entry.value}`).join(" | ");
  }

  return toText(item?.optionSummary);
};

export const getOrderSpecialInstructions = (order) => {
  const raw = toText(order?.specialInstructions);
  if (!raw) {
    return "";
  }

  const parts = raw
    .split("|")
    .map((part) => toText(part))
    .filter(Boolean);

  return parts
    .filter(
      (part) =>
        !/^contact\s*name\s*:/i.test(part) && !/^phone\s*:/i.test(part),
    )
    .join(" | ");
};

export const getOrderItemCount = (order) =>
  getOrderItems(order).reduce((total, item) => total + (item.quantity || 0), 0);

export const getOrderSummary = (order) => {
  const items = getOrderItems(order);

  if (!items.length) {
    return "Custom Cake";
  }

  const names = items.map((item) => getOrderItemName(item));
  return names.length === 1
    ? names[0]
    : `${names[0]} +${names.length - 1} more`;
};

export const getErrorMessage = (error, fallbackMessage) =>
  error?.message || error?.error || fallbackMessage;
