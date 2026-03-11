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
  "breads",
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

export const getOrderItemCount = (order) =>
  getOrderItems(order).reduce((total, item) => total + (item.quantity || 0), 0);

export const getOrderSummary = (order) => {
  const items = getOrderItems(order);

  if (!items.length) {
    return "Custom Cake";
  }

  const names = items.map((item) => item.product?.name || "Custom Cake");
  return names.length === 1
    ? names[0]
    : `${names[0]} +${names.length - 1} more`;
};

export const getErrorMessage = (error, fallbackMessage) =>
  error?.message || error?.error || fallbackMessage;
