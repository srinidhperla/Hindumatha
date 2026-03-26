import React, { useEffect, useState } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { getOrderDisplayCode } from "@/utils/orderDisplay";

const ACCEPT_OPTIONS = [
  { value: "15min", label: "15 min" },
  { value: "30min", label: "30 min" },
  { value: "45min", label: "45 min" },
  { value: "1hour", label: "1 hour" },
  { value: "1.5hours", label: "1.5 hours" },
  { value: "2hours", label: "2 hours" },
  { value: "custom", label: "Custom" },
];

const REJECT_OPTIONS = [
  { value: "outOfStock", label: "Out of stock" },
  { value: "tooFar", label: "Too far from delivery area" },
  { value: "shopClosed", label: "Shop closed" },
  { value: "other", label: "Other" },
];
const STATUS_EDIT_OPTIONS = [
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready for delivery" },
];

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/90 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

const getRequestedDeliveryLabel = (order) => {
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

const AdminOrderActionModal = ({
  mode,
  order,
  deliveryPartners = [],
  submitting = false,
  onClose,
  onConfirm,
}) => {
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState("30min");
  const [customDeliveryTime, setCustomDeliveryTime] = useState("");
  const [acceptanceMessage, setAcceptanceMessage] = useState("");
  const [rejectionReason, setRejectionReason] = useState("outOfStock");
  const [rejectionMessage, setRejectionMessage] = useState("");
  const [assignedDeliveryPartner, setAssignedDeliveryPartner] = useState("");
  const [editedStatus, setEditedStatus] = useState("confirmed");

  useEffect(() => {
    if (!order) {
      return;
    }

    setEstimatedDeliveryTime(order.estimatedDeliveryTime || "30min");
    setCustomDeliveryTime(order.customDeliveryTime || "");
    setAcceptanceMessage(order.acceptanceMessage || "");
    setRejectionReason(order.rejectionReason || "outOfStock");
    setRejectionMessage(order.rejectionMessage || "");
    setAssignedDeliveryPartner(order.assignedDeliveryPartner?._id || "");
    setEditedStatus(order.status || "confirmed");
  }, [order, mode]);

  if (!mode || !order) {
    return null;
  }

  const titleMap = {
    accept: "Accept Order",
    reject: "Reject Order",
    assign: "Assign Delivery",
    editStatus: "Edit Order Status",
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "accept") {
      onConfirm({
        status: "confirmed",
        estimatedDeliveryTime,
        customDeliveryTime,
        acceptanceMessage,
      });
      return;
    }

    if (mode === "reject") {
      onConfirm({
        status: "cancelled",
        rejectionReason,
        rejectionMessage,
      });
      return;
    }

    if (mode === "editStatus") {
      onConfirm({
        status: editedStatus,
      });
      return;
    }

    onConfirm({
      status: order.status,
      assignedDeliveryPartner,
    });
  };

  return (
    <Modal
      title={titleMap[mode]}
      badge={<StatusChip tone="info">{getOrderDisplayCode(order)}</StatusChip>}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
      footer={
        <div className="flex justify-end gap-3">
          <ActionButton type="button" variant="secondary" onClick={onClose}>
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="admin-order-action-form"
            disabled={
              submitting ||
              (mode === "accept" &&
                estimatedDeliveryTime === "custom" &&
                !customDeliveryTime.trim()) ||
              (mode === "assign" && !assignedDeliveryPartner) ||
              (mode === "editStatus" && !editedStatus)
            }
          >
            {submitting ? "Saving..." : "Confirm"}
          </ActionButton>
        </div>
      }
    >
      <form id="admin-order-action-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/55 p-4 text-sm text-primary-700">
          <p className="font-semibold text-primary-900">
            Customer request: {getRequestedDeliveryLabel(order)}
          </p>
          <p className="mt-1">
            {order.user?.name || "Customer"} | Rs.
            {Number(order.totalAmount || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {mode === "accept" && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-primary-700">
                Estimated delivery time
              </span>
              <select
                value={estimatedDeliveryTime}
                onChange={(event) => setEstimatedDeliveryTime(event.target.value)}
                className={inputClassName}
              >
                {ACCEPT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {estimatedDeliveryTime === "custom" && (
              <label className="block">
                <span className="text-sm font-medium text-primary-700">
                  Custom delivery time
                </span>
                <input
                  type="text"
                  value={customDeliveryTime}
                  onChange={(event) => setCustomDeliveryTime(event.target.value)}
                  placeholder="Example: 75 minutes"
                  className={inputClassName}
                />
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-primary-700">
                Message to customer
              </span>
              <textarea
                rows={3}
                value={acceptanceMessage}
                onChange={(event) => setAcceptanceMessage(event.target.value)}
                placeholder="Optional note about preparation or dispatch timing"
                className={inputClassName}
              />
            </label>
          </>
        )}

        {mode === "reject" && (
          <>
            <label className="block">
              <span className="text-sm font-medium text-primary-700">
                Rejection reason
              </span>
              <select
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className={inputClassName}
              >
                {REJECT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-primary-700">
                Message to customer
              </span>
              <textarea
                rows={3}
                value={rejectionMessage}
                onChange={(event) => setRejectionMessage(event.target.value)}
                placeholder="Optional note with more context"
                className={inputClassName}
              />
            </label>
          </>
        )}

        {mode === "assign" && (
          <label className="block">
            <span className="text-sm font-medium text-primary-700">
              Delivery partner
            </span>
            <select
              value={assignedDeliveryPartner}
              onChange={(event) => setAssignedDeliveryPartner(event.target.value)}
              className={inputClassName}
            >
              <option value="">Select delivery partner</option>
              {deliveryPartners.map((partner) => (
                <option key={partner._id} value={partner._id}>
                  {partner.name}
                  {partner.phone ? ` - ${partner.phone}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === "editStatus" && (
          <label className="block">
            <span className="text-sm font-medium text-primary-700">
              Select status
            </span>
            <select
              value={editedStatus}
              onChange={(event) => setEditedStatus(event.target.value)}
              className={inputClassName}
            >
              {STATUS_EDIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </form>
    </Modal>
  );
};

export default AdminOrderActionModal;
