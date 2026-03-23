export const ORDER_TIMELINE = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Baking" },
  { key: "ready", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const getTimelineIndex = (status) =>
  ORDER_TIMELINE.findIndex((step) => step.key === status);

export const getStatusLabel = (status) =>
  ORDER_TIMELINE.find((step) => step.key === status)?.label || status;

export const getOrderTimelineEvents = (order) => {
  const persistedEvents = Array.isArray(order?.statusTimeline)
    ? order.statusTimeline
        .filter((event) => event?.status)
        .sort(
          (left, right) =>
            new Date(left.updatedAt || 0) - new Date(right.updatedAt || 0),
        )
    : [];

  if (persistedEvents.length > 0) {
    return persistedEvents;
  }

  const activeIndex = Math.max(getTimelineIndex(order?.status), 0);
  const fallbackEvents = ORDER_TIMELINE.slice(0, activeIndex + 1).map(
    (step, index) => ({
      status: step.key,
      updatedAt: index === 0 ? order?.createdAt : order?.updatedAt,
      actorRole: index === 0 ? "system" : "admin",
    }),
  );

  if (order?.status === "cancelled") {
    fallbackEvents.push({
      status: "cancelled",
      updatedAt: order?.updatedAt,
      actorRole: "user",
    });
  }

  return fallbackEvents;
};

export const getTimelineActorLabel = (actorRole) => {
  if (actorRole === "admin") return "by bakery";
  if (actorRole === "user") return "by you";
  return "automatic";
};

export const formatAddress = (deliveryAddress = {}) =>
  [
    deliveryAddress.street,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

export const getPaymentMethodLabel = (paymentMethod) => {
  if (!paymentMethod) {
    return "Not specified";
  }

  if (paymentMethod === "upi") {
    return "UPI";
  }

  if (paymentMethod === "cash") {
    return "Cash on delivery";
  }

  return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
};

export const getPaymentStatusClasses = (paymentStatus) => {
  switch (paymentStatus) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

export const canCancelOrder = (order) => order?.status === "pending";

export const isTimelineStepActive = (orderStatus, index) =>
  Math.max(getTimelineIndex(orderStatus), 0) >= index;

export const isTimelineStepConnectorActive = (orderStatus, index) =>
  Math.max(getTimelineIndex(orderStatus), 0) > index;
