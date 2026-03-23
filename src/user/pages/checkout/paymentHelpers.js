export const CHECKOUT_STORAGE_KEY = "bakeryPendingCheckout";

export const scrollToPageTop = () => {
  window.scrollTo({ top: 0, behavior: "auto" });
};

export const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const getPendingCheckout = (locationState) => {
  if (locationState?.orderData) {
    return locationState;
  }

  try {
    const rawValue = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

export const getSafePaymentUnitPrice = (item) =>
  Number(
    item.price ??
      item.unitPrice ??
      (Number(item.quantity || 0) > 0
        ? Number(item.lineTotal || 0) / Number(item.quantity || 1)
        : 0),
  );

export const getDeliverySummaryLabel = (orderData) => {
  const deliveryDateTimeValue = orderData?.deliveryDateTime
    ? new Date(orderData.deliveryDateTime)
    : null;
  const hasValidDeliveryDateTime =
    deliveryDateTimeValue instanceof Date &&
    !Number.isNaN(deliveryDateTimeValue.getTime());

  if (orderData?.deliveryMode !== "scheduled" || !hasValidDeliveryDateTime) {
    return "ASAP";
  }

  return `${deliveryDateTimeValue.toLocaleDateString("en-IN")} | ${deliveryDateTimeValue.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  )}`;
};
