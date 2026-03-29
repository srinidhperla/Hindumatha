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
import {
  getErrorMessage,
  ORDER_STATUS_OPTIONS,
  getOrderSummary,
  getOrderItemName,
  getOrderItemShortSummary,
  getOrderItems,
  getOrderSpecialInstructions,
} from "./adminShared";
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

const SORTABLE_COLUMNS = {
  order: "order",
  customer: "customer",
  items: "items",
  status: "status",
  paymentStatus: "paymentStatus",
  paymentMethod: "paymentMethod",
  specialInstructions: "specialInstructions",
  totalAmount: "totalAmount",
  requestedDelivery: "requestedDelivery",
  estimatedDelivery: "estimatedDelivery",
  createdAt: "createdAt",
};

const getSortValue = (order, field) => {
  switch (field) {
    case SORTABLE_COLUMNS.order:
      return getOrderDisplayCode(order);
    case SORTABLE_COLUMNS.customer:
      return order?.user?.name || "";
    case SORTABLE_COLUMNS.items:
      return getOrderSummary(order);
    case SORTABLE_COLUMNS.status:
      return order?.status || "";
    case SORTABLE_COLUMNS.paymentStatus:
      return order?.paymentStatus || "";
    case SORTABLE_COLUMNS.paymentMethod:
      return getPaymentMethodLabel(order?.paymentMethod || "");
    case SORTABLE_COLUMNS.specialInstructions:
      return getOrderSpecialInstructions(order);
    case SORTABLE_COLUMNS.totalAmount:
      return Number(order?.totalAmount || 0);
    case SORTABLE_COLUMNS.requestedDelivery:
      return formatRequestedDelivery(order);
    case SORTABLE_COLUMNS.estimatedDelivery:
      return formatEstimatedDelivery(order);
    case SORTABLE_COLUMNS.createdAt:
      return new Date(order?.createdAt || 0).getTime();
    default:
      return "";
  }
};

const getItemsPreviewRows = (order, maxItems = 2) => {
  const items = getOrderItems(order);

  if (!items.length) {
    return ["Custom Cake"];
  }

  const rows = items.slice(0, maxItems).map((item) => {
    const summary = getOrderItemShortSummary(item, 3);
    return summary
      ? `${getOrderItemName(item)} | ${summary}`
      : getOrderItemName(item);
  });

  if (items.length > maxItems) {
    rows.push(`+${items.length - maxItems} more item(s)`);
  }

  return rows;
};

const AdminOrdersPage = ({ onToast, syncVersion = 0 }) => {
  const dispatch = useDispatch();
  const { orders, deliveryPartners, loading } = useSelector(
    (state) => state.orders,
  );
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [actionMode, setActionMode] = useState("");
  const [actionOrder, setActionOrder] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [sortField, setSortField] = useState(SORTABLE_COLUMNS.createdAt);
  const [sortDirection, setSortDirection] = useState("desc");
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
  }, [dispatch, syncVersion]);

  const sortedOrders = useMemo(() => {
    const directionMultiplier = sortDirection === "asc" ? 1 : -1;
    return [...(orders || [])].sort((left, right) => {
      const leftValue = getSortValue(left, sortField);
      const rightValue = getSortValue(right, sortField);

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * directionMultiplier;
      }

      return (
        String(leftValue || "").localeCompare(String(rightValue || ""), "en", {
          sensitivity: "base",
          numeric: true,
        }) * directionMultiplier
      );
    });
  }, [orders, sortDirection, sortField]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortDirection("asc");
  };

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

      <SurfaceCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-[1880px] divide-y divide-gold-200/60 text-sm">
            <thead className="bg-gold-50/50">
              <tr>
                {[
                  { key: SORTABLE_COLUMNS.order, label: "Order" },
                  { key: SORTABLE_COLUMNS.customer, label: "Customer" },
                  { key: SORTABLE_COLUMNS.items, label: "Items" },
                  {
                    key: SORTABLE_COLUMNS.specialInstructions,
                    label: "Special Instructions",
                  },
                  { key: SORTABLE_COLUMNS.status, label: "Status" },
                  { key: SORTABLE_COLUMNS.paymentStatus, label: "Payment" },
                  { key: SORTABLE_COLUMNS.paymentMethod, label: "Method" },
                  { key: SORTABLE_COLUMNS.totalAmount, label: "Total" },
                  { key: SORTABLE_COLUMNS.requestedDelivery, label: "Requested" },
                  { key: SORTABLE_COLUMNS.estimatedDelivery, label: "Estimated" },
                  { key: SORTABLE_COLUMNS.createdAt, label: "Created" },
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-700"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-primary-900"
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                      {sortField === column.key
                        ? sortDirection === "asc"
                          ? "▲"
                          : "▼"
                        : "↕"}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
                  View Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
                  Assign to Delivery
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">
                  Status Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-200/40 bg-white">
              {sortedOrders.map((order) => {
          const canAssignDelivery =
            order.status !== "pending" &&
            order.status !== "cancelled" &&
            order.status !== "delivered";
          const specialInstructions = getOrderSpecialInstructions(order);
          const isProgressEditable = canEditProgressStatus(order.status);

          return (
                <tr key={order._id} className="align-top hover:bg-gold-50/25">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary-900">
                      {getOrderDisplayCode(order)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-primary-900">
                      {order.user?.name || "Guest Customer"}
                    </p>
                    <p className="text-xs text-primary-500">
                      {order.user?.email || "No email"}
                    </p>
                    <p className="text-xs text-primary-700">
                      {order.deliveryAddress?.phone ||
                        order.user?.phone ||
                        "No phone"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {getItemsPreviewRows(order).map((row, index) => (
                        <p
                          key={`${order._id}-item-preview-${index}`}
                          className="text-xs text-primary-700"
                        >
                          {row}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {specialInstructions ? (
                      <p className="max-w-[260px] text-xs text-primary-700">
                        {specialInstructions}
                      </p>
                    ) : (
                      <span className="text-xs text-primary-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip tone={getStatusTone(order.status)} className="capitalize">
                      {order.status}
                    </StatusChip>
                    {order.status === "cancelled" && getRejectionReasonLabel(order) && (
                      <p className="mt-1 text-xs text-rose-700">
                        {getRejectionReasonLabel(order)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip
                      tone={getPaymentStatusTone(order.paymentStatus)}
                      className="capitalize"
                    >
                      {order.paymentStatus || "pending"}
                    </StatusChip>
                  </td>
                  <td className="px-4 py-3 text-primary-800">
                    {getPaymentMethodLabel(order.paymentMethod)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary-900">
                    Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {formatRequestedDelivery(order)}
                  </td>
                  <td className="px-4 py-3 text-primary-700">
                    {formatEstimatedDelivery(order)}
                  </td>
                  <td className="px-4 py-3 text-xs text-primary-600">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <ActionButton
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedOrder(order)}
                    >
                      View Details
                    </ActionButton>
                  </td>
                  <td className="px-4 py-3">
                    {canAssignDelivery ? (
                      <ActionButton
                        type="button"
                        variant="secondary"
                        onClick={() => openActionModal("assign", order)}
                      >
                        {order.assignedDeliveryPartner
                          ? "Reassign Delivery"
                          : "Assign to Delivery"}
                      </ActionButton>
                    ) : (
                      <span className="text-xs text-primary-500">N/A</span>
                    )}
                    {order.assignedDeliveryPartner?.name && (
                      <p className="mt-1 text-xs text-primary-700">
                        {order.assignedDeliveryPartner.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex min-w-[240px] flex-wrap gap-2">
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
                      {isProgressEditable && (
                        <select
                          value={order.status}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            if (!nextValue || nextValue === order.status) return;
                            if (nextValue === "cancelled") {
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
                    </div>
                  </td>
                </tr>
          );
              })}
            </tbody>
          </table>
        </div>

        {!sortedOrders?.length && (
          <div className="p-8 text-center text-primary-600">No orders yet.</div>
        )}
      </SurfaceCard>

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
