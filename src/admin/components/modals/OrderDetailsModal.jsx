import React from "react";
import {
  getOrderItemName,
  getOrderItemOptionEntries,
  getOrderItems,
  getOrderSpecialInstructions,
  ORDER_STATUS_OPTIONS,
} from "../../pages/adminShared";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { downloadInvoicePDF } from "@/services/invoiceService";
import { buildGoogleMapsSearchUrl, formatAddressText } from "@/utils/mapsLinks";

const ESTIMATED_DELIVERY_LABELS = {
  "15min": "15 minutes",
  "30min": "30 minutes",
  "45min": "45 minutes",
  "1hour": "1 hour",
  "1.5hours": "1.5 hours",
  "2hours": "2 hours",
};

const getPaymentMethodLabel = (paymentMethod) => {
  if (!paymentMethod) return "Not specified";
  if (paymentMethod === "upi") return "UPI";
  if (paymentMethod === "cash") return "Cash on delivery";
  return paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1);
};

const getPaymentStatusClasses = (paymentStatus) => {
  switch (paymentStatus) {
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "failed":
      return "bg-red-50 text-red-700";
    default:
      return "bg-amber-50 text-amber-700";
  }
};

const formatRequestedDelivery = (order) => {
  if (order?.deliveryMode === "now") {
    return "Deliver now";
  }

  const dateLabel = order?.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Scheduled";

  return `${dateLabel}${order?.deliveryTime ? ` at ${order.deliveryTime}` : ""}`;
};

const formatEstimatedDelivery = (order) => {
  const value = String(order?.estimatedDeliveryTime || "").trim();

  if (!value) {
    return "Awaiting admin acceptance";
  }

  if (value === "custom") {
    return order?.customDeliveryTime || "Custom timing";
  }

  return ESTIMATED_DELIVERY_LABELS[value] || value;
};

const formatINR = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

const buildDeliveryShareText = (order) => {
  const address = order?.deliveryAddress || {};
  const specialInstructions = getOrderSpecialInstructions(order);
  const lines = [
    `Order: ${getOrderDisplayCode(order)}`,
    `Customer: ${order?.user?.name || "Guest Customer"}`,
    `Phone: ${order?.user?.phone || address?.phone || "N/A"}`,
    `Address: ${formatAddressText(address) || "Address not provided"}`,
    `Customer asked for: ${formatRequestedDelivery(order)}`,
    `Estimated delivery: ${formatEstimatedDelivery(order)}`,
  ];

  if (specialInstructions) {
    lines.push(`Special Instructions: ${specialInstructions}`);
  }

  const mapsLink = buildGoogleMapsSearchUrl(address);
  if (mapsLink) {
    lines.push(`Maps: ${mapsLink}`);
  }

  return lines.join("\n");
};

const OrderDetailsModal = ({
  order,
  onClose,
  onStatusChange,
  onRequestAction,
  onToast,
}) => {
  if (!order) return null;

  const handleCopyAddress = async () => {
    const shareText = buildDeliveryShareText(order);
    try {
      await navigator.clipboard.writeText(shareText);
      onToast?.("Delivery details copied.", "success");
    } catch {
      onToast?.("Failed to copy delivery details.", "error");
    }
  };

  const handleDownloadInvoice = () => {
    try {
      downloadInvoicePDF(order);
      onToast?.("Opening invoice for download...", "success");
    } catch {
      onToast?.("Failed to generate invoice.", "error");
    }
  };

  const canAssignDelivery =
    order.status !== "pending" &&
    order.status !== "cancelled" &&
    order.status !== "delivered";
  const specialInstructions = getOrderSpecialInstructions(order);
  const deliveryFee = Number(order.deliveryFee || 0);
  const discountAmount = Number(order.discountAmount || 0);
  const canEditProgressStatus = ["confirmed", "preparing", "ready"].includes(
    String(order.status || ""),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900/70 via-primary-900/55 to-black/60 p-4 backdrop-blur-md">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/35 bg-white/25 p-6 shadow-[0_30px_80px_rgba(10,10,20,0.45)] backdrop-blur-2xl">
        <div className="mb-6 flex items-start justify-between rounded-2xl border border-white/40 bg-white/35 p-4 backdrop-blur-xl">
          <div>
            <h2 className="text-xl font-semibold text-primary-900">
              Order details
            </h2>
            <p className="mt-1 text-sm font-medium text-primary-700">
              {getOrderDisplayCode(order)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/50 bg-white/45 p-2 text-primary-700 admin-motion hover:bg-white/70"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-primary-900">Customer</h3>
            <p className="mt-2 text-sm font-medium text-primary-800">
              {order.user?.name || "Guest Customer"}
            </p>
            <p className="text-sm text-primary-700">
              {order.user?.email || "No email"}
            </p>
            <p className="text-sm text-primary-700">
              {order.user?.phone || order.deliveryAddress?.phone || "No phone"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-primary-900">Delivery</h3>
            {order.deliveryAddress?.label && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                {order.deliveryAddress.label}
              </p>
            )}
            <p className="mt-2 text-sm font-semibold text-primary-900">
              Customer asked for: {formatRequestedDelivery(order)}
            </p>
            <p className="mt-1 text-sm text-primary-700">
              Estimated: {formatEstimatedDelivery(order)}
            </p>
            <p className="mt-3 text-sm text-primary-800">
              {formatAddressText(order.deliveryAddress) || "Address not provided"}
            </p>
            {order.assignedDeliveryPartner?.name && (
              <p className="mt-2 text-sm text-primary-700">
                Assigned delivery partner: {order.assignedDeliveryPartner.name}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="rounded-lg border border-white/55 bg-white/55 px-3 py-1.5 text-xs font-semibold text-primary-800 admin-motion hover:bg-white/80"
              >
                Copy Address
              </button>
              {formatAddressText(order.deliveryAddress) && (
                  <a
                    href={buildGoogleMapsSearchUrl(order.deliveryAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/55 bg-white/55 px-3 py-1.5 text-xs font-semibold text-primary-800 admin-motion hover:bg-white/80"
                  >
                    Open in Maps
                  </a>
                )}
            </div>
          </div>
        </div>

        {specialInstructions && (
          <div className="mt-5 rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-primary-900">
              Special Instructions
            </h3>
            <p className="mt-2 text-sm text-primary-800">
              {specialInstructions}
            </p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-white/45 bg-white/35 backdrop-blur-xl">
          <div className="border-b border-white/45 px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-900">Items</h3>
          </div>
          <div className="divide-y divide-white/45">
            {getOrderItems(order).map((item, index) => {
              const optionEntries = getOrderItemOptionEntries(item);
              return (
                <div
                  key={`${order._id}-${item.product?._id || index}`}
                  className="px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-primary-900">
                        {getOrderItemName(item)}
                      </p>
                      <p className="mt-1 text-xs font-medium text-primary-700">
                        Qty: {Number(item.quantity || 0)}
                      </p>
                      <p className="mt-1 text-xs text-primary-700">
                        Price per item: {formatINR(item.price)}
                      </p>
                      {optionEntries.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {optionEntries.map((entry) => (
                            <span
                              key={`${order._id}-${index}-${entry.label}-${entry.value}`}
                              className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-primary-700"
                            >
                              {entry.label}: {entry.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-primary-900">
                      {formatINR(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-primary-700">Payment Method</p>
              <p className="text-sm font-semibold text-primary-900">
                {getPaymentMethodLabel(order.paymentMethod)}
              </p>
            </div>
            <div>
              <p className="text-sm text-primary-700">Payment Status</p>
              <p
                className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${getPaymentStatusClasses(order.paymentStatus)}`}
              >
                {order.paymentStatus || "pending"}
              </p>
            </div>
            {order.paymentGateway && (
              <div>
                <p className="text-sm text-primary-700">Gateway</p>
                <p className="text-sm font-semibold uppercase text-primary-900">
                  {order.paymentGateway}
                </p>
              </div>
            )}
            {order.paymentGatewayPaymentId && (
              <div>
                <p className="text-sm text-primary-700">Payment ID</p>
                <p className="break-all text-sm font-semibold text-primary-900">
                  {order.paymentGatewayPaymentId}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/55 bg-white/55 px-4 py-2">
              <p className="text-xs uppercase tracking-wide text-primary-700">
                Delivery
              </p>
              <p className="text-base font-semibold text-primary-900">
                {formatINR(deliveryFee)}
              </p>
            </div>
            <div className="rounded-xl border border-white/55 bg-white/55 px-4 py-2">
              <p className="text-xs uppercase tracking-wide text-primary-700">
                Discount
              </p>
              <p className="text-base font-semibold text-emerald-700">
                {discountAmount > 0
                  ? `-${formatINR(discountAmount)}`
                  : formatINR(0)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-xl border border-white/55 bg-white/55 px-4 py-2">
              <p className="text-xs uppercase tracking-wide text-primary-700">
                Total Amount
              </p>
              <p className="text-lg font-bold text-primary-900">
                Rs.{order.totalAmount?.toLocaleString("en-IN") || 0}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => onRequestAction?.("accept", order)}
                    className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestAction?.("reject", order)}
                    className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </>
              )}
              {canEditProgressStatus && (
                <select
                  value={order.status}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (!nextValue || nextValue === order.status) return;
                    if (nextValue === "cancelled") {
                      onRequestAction?.("reject", order);
                      return;
                    }
                    onStatusChange?.(order._id, nextValue);
                  }}
                  className="rounded-xl border border-white/60 bg-white/65 px-3 py-2 text-sm font-semibold text-primary-900 hover:bg-white"
                  aria-label="Update order status"
                  title="Update order status"
                >
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {canAssignDelivery && (
                <button
                  type="button"
                  onClick={() => onRequestAction?.("assign", order)}
                  className="rounded-xl border border-white/60 bg-white/65 px-4 py-2 font-semibold text-primary-900 hover:bg-white"
                >
                  {order.assignedDeliveryPartner
                    ? "Reassign Delivery"
                    : "Assign Delivery"}
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadInvoice}
                className="rounded-xl border border-white/60 bg-white/65 px-4 py-2 font-semibold text-primary-900 hover:bg-white"
              >
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
