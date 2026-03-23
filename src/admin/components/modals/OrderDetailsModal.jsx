import React, { useState } from "react";
import { getOrderItems } from "../../pages/adminShared";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { downloadInvoicePDF } from "@/services/invoiceService";

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

const buildDeliveryShareText = (order) => {
  const address = order?.deliveryAddress || {};
  const lines = [
    `Order: ${getOrderDisplayCode(order)}`,
    `Customer: ${order?.user?.name || "Guest Customer"}`,
    `Phone: ${order?.user?.phone || "N/A"}`,
    `Address: ${[
      address.label,
      address.street,
      address.landmark,
      address.city,
      address.state,
      address.zipCode,
    ]
      .filter(Boolean)
      .join(", ")}`,
    `Delivery: ${order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString("en-IN") : "N/A"}${
      order?.deliveryTime ? `, ${order.deliveryTime}` : ""
    }`,
  ];

  if (
    Number.isFinite(Number(address.lat)) &&
    Number.isFinite(Number(address.lng))
  ) {
    lines.push(
      `Maps: https://maps.google.com/?q=${address.lat},${address.lng}`,
    );
  }

  return lines.join("\n");
};

const OrderDetailsModal = ({ order, onClose, onStatusChange, onToast }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!order) return null;

  const handleCopyAddress = async () => {
    const shareText = buildDeliveryShareText(order);
    try {
      await navigator.clipboard.writeText(shareText);
      onToast?.("Delivery details copied.", "success");
    } catch (error) {
      onToast?.("Failed to copy delivery details.", "error");
    }
  };

  const handleAcceptOrder = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await onStatusChange(order._id, "confirmed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadInvoice = () => {
    try {
      downloadInvoicePDF(order);
      onToast?.("Opening invoice for download...", "success");
    } catch (error) {
      onToast?.("Failed to generate invoice.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-900/70 via-primary-900/55 to-black/60 p-4 backdrop-blur-md">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/35 bg-white/25 p-6 shadow-[0_30px_80px_rgba(10,10,20,0.45)] backdrop-blur-2xl">
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
              {order.user?.phone || "No phone"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/45 bg-white/35 p-4 backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-primary-900">Delivery</h3>
            {order.deliveryAddress?.label && (
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary-700">
                {order.deliveryAddress.label}
              </p>
            )}
            <p className="mt-2 text-sm text-primary-800">
              {order.deliveryAddress?.street || ""}
            </p>
            {order.deliveryAddress?.landmark && (
              <p className="text-sm text-primary-700">
                {order.deliveryAddress.landmark}
              </p>
            )}
            <p className="text-sm text-primary-700">
              {[
                order.deliveryAddress?.city,
                order.deliveryAddress?.state,
                order.deliveryAddress?.zipCode,
              ]
                .filter(Boolean)
                .join(", ") || "Address not provided"}
            </p>
            <p className="mt-2 text-sm text-primary-700">
              {order.deliveryDate
                ? new Date(order.deliveryDate).toLocaleDateString("en-IN")
                : "No delivery date"}
              {order.deliveryTime ? `, ${order.deliveryTime}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="rounded-lg border border-white/55 bg-white/55 px-3 py-1.5 text-xs font-semibold text-primary-800 admin-motion hover:bg-white/80"
              >
                Copy Address
              </button>
              {Number.isFinite(Number(order.deliveryAddress?.lat)) &&
                Number.isFinite(Number(order.deliveryAddress?.lng)) && (
                  <a
                    href={`https://maps.google.com/?q=${order.deliveryAddress.lat},${order.deliveryAddress.lng}`}
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

        <div className="mt-5 rounded-2xl border border-white/45 bg-white/35 backdrop-blur-xl">
          <div className="border-b border-white/45 px-4 py-3">
            <h3 className="text-sm font-semibold text-primary-900">Items</h3>
          </div>
          <div className="divide-y divide-white/45">
            {getOrderItems(order).map((item, index) => (
              <div
                key={`${order._id}-${item.product?._id || index}`}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-primary-900">
                    {item.product?.name || "Custom Cake"}
                  </p>
                  <p className="text-sm text-primary-700">
                    Qty: {item.quantity || 0}
                    {item.size ? ` • ${item.size}` : ""}
                    {item.flavor ? ` • ${item.flavor}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary-900">
                  ₹
                  {((item.price || 0) * (item.quantity || 0)).toLocaleString(
                    "en-IN",
                  )}
                </p>
              </div>
            ))}
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="rounded-xl border border-white/55 bg-white/55 px-4 py-2">
              <p className="text-xs uppercase tracking-wide text-primary-700">
                Total Amount
              </p>
              <p className="text-lg font-bold text-primary-900">
                ₹{order.totalAmount?.toLocaleString("en-IN") || 0}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {order.status === "pending" && (
                <button
                  type="button"
                  onClick={handleAcceptOrder}
                  disabled={isProcessing}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? "Accepting..." : "Accept Order"}
                </button>
              )}
              {order.status === "confirmed" && (
                <span className="rounded-xl bg-emerald-100 px-4 py-2 font-semibold text-emerald-700">
                  Accepted
                </span>
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
