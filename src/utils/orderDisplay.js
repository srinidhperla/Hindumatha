export const getOrderDisplayCode = (order) => {
  if (order?.orderCode) {
    return String(order.orderCode).toUpperCase();
  }

  const fallback = String(order?._id || "")
    .slice(-6)
    .toUpperCase();
  return fallback ? `HM${fallback}` : "HM";
};
