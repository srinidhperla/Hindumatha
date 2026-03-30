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

export const getPaymentStatusLabel = (paymentStatus) => {
  switch (paymentStatus) {
    case "completed":
      return "Successful";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
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

export const getPaymentStatusTone = (paymentStatus) => {
  switch (paymentStatus) {
    case "completed":
      return "success";
    case "failed":
      return "danger";
    default:
      return "warning";
  }
};
