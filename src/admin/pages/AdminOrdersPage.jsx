import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrders, updateOrderStatus } from "@/features/orders/orderSlice";
import { useAdminOrderAlerts } from "../components/alerts/AdminOrderAlertsProvider";
import { LoadingState } from "@/admin/components/ui/AdminUi";
import OrderDetailsModal from "../components/modals/OrderDetailsModal";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import AdminOrderAlertToolbar from "@/admin/components/orders/AdminOrderAlertToolbar";
import {
  ORDER_STATUS_OPTIONS,
  getErrorMessage,
  getOrderItemCount,
  getOrderSummary,
} from "./adminShared";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import {
  getPaymentMethodLabel,
  getPaymentStatusTone,
} from "./adminOrdersHelpers";

const AdminOrdersPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
    notificationsSupported,
    audioSupported,
    pushSupported,
    enableAlerts,
    unlockSound,
    runManualAlertTest,
  } = useAdminOrderAlerts();

  useEffect(() => {
    dispatch(fetchOrders());
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

  const handleStatusChange = async (orderId, status) => {
    try {
      const updatedOrder = await dispatch(
        updateOrderStatus({ id: orderId, status }),
      ).unwrap();

      if (selectedOrder?._id === updatedOrder._id) {
        setSelectedOrder(updatedOrder);

        // Auto-close modal when order is accepted
        if (status === "confirmed") {
          setTimeout(() => setSelectedOrder(null), 800);
        }
      }

      onToast(`Order status updated to ${status}.`);

      // Refresh orders list to ensure all data is fresh
      dispatch(fetchOrders());
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
          Latest order:{" "}
          <span className="font-semibold">
            {latestOrder.user?.name || "Guest Customer"}
          </span>
          {" | "}
          {new Date(latestOrder.createdAt).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
          })}
        </SurfaceCard>
      )}

      <div className="grid gap-4">
        {orders?.map((order) => (
          <SurfaceCard
            key={order._id}
            className="p-5 admin-motion hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(18,12,2,0.14)]"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
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

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-3 admin-motion hover:border-gold-300/70 hover:bg-gold-50/65">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                  Order summary
                </p>
                <p className="mt-1 text-sm font-semibold text-primary-900">
                  {getOrderSummary(order)}
                </p>
                <p className="text-xs text-primary-600">
                  Qty: {getOrderItemCount(order)}
                </p>
                {order.paymentGatewayOrderId && (
                  <p className="mt-2 break-all text-xs text-primary-500">
                    {order.paymentGateway || "gateway"}:{" "}
                    {order.paymentGatewayOrderId}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-gold-200/60 bg-white/80 p-3 admin-motion hover:border-gold-300/70 hover:bg-white/95">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-500">
                  Update status
                </label>
                <select
                  value={order.status}
                  onChange={(event) =>
                    handleStatusChange(order._id, event.target.value)
                  }
                  className="mt-2 block w-full rounded-xl border border-gold-200/70 bg-white px-3 py-2 text-sm text-primary-800 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
                >
                  {ORDER_STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption.value} value={statusOption.value}>
                      {statusOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {order.status === "pending" && (
                <ActionButton
                  type="button"
                  variant="success"
                  onClick={() => handleStatusChange(order._id, "confirmed")}
                >
                  Accept
                </ActionButton>
              )}
              {order.status === "pending" && (
                <ActionButton
                  type="button"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm("Reject and cancel this order?")) {
                      handleStatusChange(order._id, "cancelled");
                    }
                  }}
                >
                  Reject
                </ActionButton>
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
        ))}
        {!orders?.length && (
          <SurfaceCard className="p-8 text-center text-primary-600">
            No orders yet.
          </SurfaceCard>
        )}
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onToast={onToast}
      />
    </div>
  );
};

export default AdminOrdersPage;
