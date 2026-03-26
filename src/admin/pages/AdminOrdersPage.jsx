import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminDeliveryPartners,
  fetchOrders,
  updateOrderStatus,
} from "@/features/orders/orderSlice";
import { useAdminOrderAlerts } from "../components/alerts/AdminOrderAlertsProvider";
import { LoadingState } from "@/admin/components/ui/AdminUi";
import OrderDetailsModal from "../components/modals/OrderDetailsModal";
import AdminOrderActionModal from "../components/modals/AdminOrderActionModal";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import AdminOrderAlertToolbar from "@/admin/components/orders/AdminOrderAlertToolbar";
import { getErrorMessage, ORDER_STATUS_OPTIONS, getOrderItemCount, getOrderSummary } from "./adminShared";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import {
  getPaymentMethodLabel,
  getPaymentStatusTone,
} from "./adminOrdersHelpers";

const REJECTION_REASON_LABELS = {
  outOfStock: "Out of stock",
  tooFar: "Too far from delivery area",
  shopClosed: "Shop closed",
  other: "Other",
};

const ESTIMATED_DELIVERY_LABELS = {
  "15min": "15 minutes",
  "30min": "30 minutes",
  "45min": "45 minutes",
  "1hour": "1 hour",
  "1.5hours": "1.5 hours",
  "2hours": "2 hours",
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

const getRejectionReasonLabel = (order) =>
  REJECTION_REASON_LABELS[String(order?.rejectionReason || "").trim()] || "";

const getStatusTone = (status) => {
  switch (status) {
    case "confirmed":
    case "ready":
    case "delivered":
      return "success";
    case "cancelled":
      return "danger";
    case "preparing":
      return "warning";
    default:
      return "info";
  }
};

const canEditProgressStatus = (status) =>
  ["confirmed", "preparing", "ready"].includes(String(status || ""));

const getProgressEditOptions = () => ORDER_STATUS_OPTIONS;

const AdminOrdersPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const { orders, deliveryPartners, loading } = useSelector(
    (state) => state.orders,
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionMode, setActionMode] = useState("");
  const [actionOrder, setActionOrder] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const latestOrder = useMemo(() => orders?.[0] || null, [orders]);
  const handledOrderRef = useRef(null);
  const {
    alertsEnabled,
    audioEnabled,
    notificationPermission,
    pushSubscribed,
    soundUnlockRequired,
    activeAlertOrderIds,
    lastCreatedOrder,
    audioSupported,
    pushSupported,
    enableAlerts,
    unlockSound,
    runManualAlertTest,
  } = useAdminOrderAlerts();

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchAdminDeliveryPartners());
  }, [dispatch]);

  useEffect(() => {
    if (
      !lastCreatedOrder?._id ||
      handledOrderRef.current === lastCreatedOrder._id
    ) {
      return undefined;
    }

    handledOrderRef.current = lastCreatedOrder._id;
    setSelectedOrder(lastCreatedOrder);
    onToast("New order received.", "info");
    return undefined;
  }, [lastCreatedOrder, onToast]);

  const openActionModal = (mode, order) => {
    setActionMode(mode);
    setActionOrder(order);
  };

  const closeActionModal = () => {
    setActionMode("");
    setActionOrder(null);
    setActionSubmitting(false);
  };

  const handleActionConfirm = async (payload) => {
    if (!actionOrder?._id) {
      return;
    }

    setActionSubmitting(true);

    try {
      const updatedOrder = await dispatch(
        updateOrderStatus({
          id: actionOrder._id,
          ...payload,
        }),
      ).unwrap();

      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }

      if (actionMode === "accept") {
        onToast("Order accepted and customer notified.");
      } else if (actionMode === "reject") {
        onToast("Order rejected and customer notified.");
      } else if (actionMode === "assign") {
        onToast("Delivery partner assigned.");
      } else {
        onToast("Order updated successfully.");
      }

      closeActionModal();
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to update this order."), "error");
      setActionSubmitting(false);
    }
  };

  const handleDirectStatusChange = async (orderId, nextStatus) => {
    try {
      const updatedOrder = await dispatch(
        updateOrderStatus({ id: orderId, status: nextStatus }),
      ).unwrap();

      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);
      }

      onToast(`Order moved to ${nextStatus}.`);
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to update order status."),
        "error",
      );
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col">
      <AdminOrderAlertToolbar
        alertsEnabled={alertsEnabled}
        audioEnabled={audioEnabled}
        notificationPermission={notificationPermission}
        pushSubscribed={pushSubscribed}
        soundUnlockRequired={soundUnlockRequired}
        activeAlertOrderIds={activeAlertOrderIds}
        audioSupported={audioSupported}
        pushSupported={pushSupported}
        onEnableAlerts={async () => {
          await enableAlerts();
          onToast("Background alerts enabled.");
        }}
        onUnlockSound={async () => {
          const unlocked = await unlockSound();
          onToast(
            unlocked
              ? "Alert sound armed for this tab."
              : "Tap once in this tab to allow sound.",
            unlocked ? "success" : "info",
          );
        }}
        onRunManualAlertTest={async () => {
          await runManualAlertTest();
          onToast("Test alert triggered.");
        }}
      />

      {latestOrder && (
        <SurfaceCard className="mb-4 border-gold-200/70 bg-gradient-to-r from-gold-50/70 via-white/70 to-cream-100/70 px-4 py-3 text-sm text-primary-700 shadow-none admin-motion hover:border-gold-300">
          Latest order from{" "}
          <span className="font-semibold">
            {latestOrder.user?.name || "Guest Customer"}
          </span>
          {" | "}
          asked for:{" "}
          <span className="font-semibold">
            {formatRequestedDelivery(latestOrder)}
          </span>
        </SurfaceCard>
      )}

      <div className="grid gap-4">
        {orders?.map((order) => {
          const canAssignDelivery =
            order.status !== "pending" &&
            order.status !== "cancelled" &&
            order.status !== "delivered";
          const isProgressEditable = canEditProgressStatus(order.status);

          return (
            <SurfaceCard
              key={order._id}
              className="p-5 admin-motion hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(18,12,2,0.14)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Order
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-primary-900">
                    {getOrderDisplayCode(order)}
                  </p>
                  <p className="mt-2 text-sm text-primary-700">
                    {order.user?.name || "Guest Customer"}
                  </p>
                  <p className="text-xs text-primary-500">
                    {order.user?.email || "No email"}
                  </p>
                  <p className="text-xs font-semibold text-primary-700">
                    {order.deliveryAddress?.phone ||
                      order.user?.phone ||
                      "No phone"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    tone={getStatusTone(order.status)}
                    className="capitalize"
                  >
                    {order.status}
                  </StatusChip>
                  <StatusChip
                    tone={getPaymentStatusTone(order.paymentStatus)}
                    className="capitalize"
                  >
                    {order.paymentStatus || "pending"}
                  </StatusChip>
                  <StatusChip tone="info">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </StatusChip>
                  <StatusChip tone="accent">
                    Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </StatusChip>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_240px]">
                <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                    Order summary
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-900">
                    {getOrderSummary(order)}
                  </p>
                  <p className="text-xs text-primary-600">
                    Qty: {getOrderItemCount(order)}
                  </p>
                  {order.assignedDeliveryPartner?.name && (
                    <p className="mt-2 text-xs font-semibold text-primary-700">
                      Assigned to: {order.assignedDeliveryPartner.name}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                    Customer asked for
                  </p>
                  <p className="mt-1 text-sm font-semibold text-primary-900">
                    {formatRequestedDelivery(order)}
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                    Estimated delivery
                  </p>
                  <p className="mt-1 text-sm text-primary-700">
                    {formatEstimatedDelivery(order)}
                  </p>
                  {order.status === "cancelled" &&
                    getRejectionReasonLabel(order) && (
                      <p className="mt-2 text-sm text-rose-700">
                        Reason: {getRejectionReasonLabel(order)}
                        {order.rejectionMessage
                          ? ` - ${order.rejectionMessage}`
                          : ""}
                      </p>
                    )}
                </div>

                <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                    Delivery address
                  </p>
                  <p className="mt-1 text-sm text-primary-700">
                    {[
                      order.deliveryAddress?.street,
                      order.deliveryAddress?.landmark,
                      order.deliveryAddress?.city,
                      order.deliveryAddress?.state,
                      order.deliveryAddress?.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ") || "Address not provided"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "pending" && (
                  <ActionButton
                    type="button"
                    variant="success"
                    onClick={() => openActionModal("accept", order)}
                  >
                    Accept
                  </ActionButton>
                )}
                {order.status === "pending" && (
                  <ActionButton
                    type="button"
                    variant="danger"
                    onClick={() => openActionModal("reject", order)}
                  >
                    Reject
                  </ActionButton>
                )}
                {canAssignDelivery && (
                  <ActionButton
                    type="button"
                    variant="secondary"
                    onClick={() => openActionModal("assign", order)}
                  >
                    {order.assignedDeliveryPartner
                      ? "Reassign Delivery"
                      : "Assign to Delivery"}
                  </ActionButton>
                )}
                {isProgressEditable && (
                  <select
                    value={order.status}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      if (!nextValue || nextValue === order.status) return;
                      if (nextValue === "cancelled") {
                        // Backend requires rejectionReason for cancelled status.
                        openActionModal("reject", order);
                        return;
                      }
                      handleDirectStatusChange(order._id, nextValue);
                    }}
                    className="rounded-2xl border border-gold-200/70 bg-white px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
                    aria-label="Update order progress"
                    title="Update order progress"
                  >
                    {getProgressEditOptions().map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                <ActionButton
                  type="button"
                  variant="secondary"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </ActionButton>
              </div>
            </SurfaceCard>
          );
        })}

        {!orders?.length && (
          <SurfaceCard className="p-8 text-center text-primary-600">
            No orders yet.
          </SurfaceCard>
        )}
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleDirectStatusChange}
        onRequestAction={openActionModal}
        onToast={onToast}
      />

      <AdminOrderActionModal
        mode={actionMode}
        order={actionOrder}
        deliveryPartners={deliveryPartners}
        submitting={actionSubmitting}
        onClose={closeActionModal}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
};

export default AdminOrdersPage;
