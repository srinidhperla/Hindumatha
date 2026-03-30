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
  getOrderStatusLabel,
  getOrderSummary,
  getOrderItemName,
  getOrderItemOptionEntries,
  getOrderItems,
  getOrderSpecialInstructions,
} from "./adminShared";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import {
  getPaymentMethodLabel,
  getPaymentStatusLabel,
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

const canEditProgressStatus = () => true;

const getProgressEditOptions = () => ORDER_STATUS_OPTIONS;

const getNextProgressStatus = (status) => {
  const normalizedStatus = String(status || "").toLowerCase();

  switch (normalizedStatus) {
    case "pending":
      return "confirmed";
    case "confirmed":
      return "preparing";
    case "preparing":
      return "ready";
    case "ready":
      return "delivered";
    default:
      return "";
  }
};

const getStatusButtonClasses = (status) => {
  switch (getStatusTone(status)) {
    case "success":
      return "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100";
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100";
    case "danger":
      return "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100";
    default:
      return "border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100";
  }
};

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

const getItemsPreviewRows = (order) => {
  const items = getOrderItems(order);

  if (!items.length) {
    return ["Custom Cake\nQty: 1"];
  }

  return items.map((item) => {
    const optionLines = getOrderItemOptionEntries(item).map(
      (entry) => `${entry.label}: ${entry.value}`,
    );
    const parsedQty = Number(item?.quantity);
    const quantity = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;

    return [getOrderItemName(item), ...optionLines, `Qty: ${quantity}`].join(
      "\n",
    );
  });
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
  const [statusEditorOrderId, setStatusEditorOrderId] = useState("");
  const [sortField, setSortField] = useState(SORTABLE_COLUMNS.createdAt);
  const [sortDirection, setSortDirection] = useState("desc");
  const statusEditorRefs = useRef({});
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

  useEffect(() => {
    if (!statusEditorOrderId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const select = statusEditorRefs.current?.[statusEditorOrderId];
      if (!select) {
        return;
      }

      select.focus();

      if (typeof select.showPicker === "function") {
        try {
          select.showPicker();
          return;
        } catch {
          // Fallback to focus/click below when showPicker is unavailable.
        }
      }

      try {
        select.click();
      } catch {
        // Some browsers do not allow programmatic opening of native selects.
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [statusEditorOrderId]);

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

      setStatusEditorOrderId("");
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

      setStatusEditorOrderId("");
      onToast(`Order moved to ${nextStatus}.`);
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to update order status."),
        "error",
      );
    }
  };

  const handleStatusSelection = (order, nextStatus) => {
    if (!nextStatus || nextStatus === order.status) {
      return;
    }

    if (nextStatus === "cancelled") {
      openActionModal("reject", order);
      return;
    }

    if (nextStatus === "confirmed" && !String(order?.estimatedDeliveryTime || "").trim()) {
      openActionModal("accept", order);
      return;
    }

    handleDirectStatusChange(order._id, nextStatus);
  };

  const handleAdvanceStatus = (order) => {
    const nextStatus = getNextProgressStatus(order?.status);

    if (!nextStatus) {
      return;
    }

    if (
      nextStatus === "confirmed" &&
      !String(order?.estimatedDeliveryTime || "").trim()
    ) {
      openActionModal("accept", order);
      return;
    }

    handleDirectStatusChange(order._id, nextStatus);
  };

  if (loading && !orders.length) {
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
          <table className="min-w-[1760px] divide-y divide-gold-200/60 text-sm">
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
                  { key: SORTABLE_COLUMNS.paymentStatus, label: "Payment" },
                  { key: SORTABLE_COLUMNS.paymentMethod, label: "Method" },
                  { key: SORTABLE_COLUMNS.totalAmount, label: "Total" },
                  { key: SORTABLE_COLUMNS.requestedDelivery, label: "Requested" },
                  { key: SORTABLE_COLUMNS.estimatedDelivery, label: "Estimated" },
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
                          ? "[^]"
                          : "[v]"
                        : "[^v]"}
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
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-primary-900"
                    onClick={() => toggleSort(SORTABLE_COLUMNS.status)}
                  >
                    Status
                    {sortField === SORTABLE_COLUMNS.status
                      ? sortDirection === "asc"
                        ? "[^]"
                        : "[v]"
                      : "[^v]"}
                  </button>
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
                          className="whitespace-pre-line text-xs text-primary-700"
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
                    <StatusChip
                      tone={getPaymentStatusTone(order.paymentStatus)}
                      className="capitalize"
                    >
                      {getPaymentStatusLabel(order.paymentStatus)}
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
                    <div className="flex min-w-[240px] items-start gap-2">
                      {statusEditorOrderId === order._id && isProgressEditable ? (
                        <select
                          ref={(node) => {
                            if (node) {
                              statusEditorRefs.current[order._id] = node;
                            } else {
                              delete statusEditorRefs.current[order._id];
                            }
                          }}
                          value={order.status}
                          onChange={(event) => {
                            handleStatusSelection(order, event.target.value);
                          }}
                          className="min-h-[42px] min-w-[150px] rounded-full border border-gold-200/70 bg-white px-4 py-2 text-sm font-semibold text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
                          aria-label="Update order progress"
                          title="Update order progress"
                        >
                          {getProgressEditOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdvanceStatus(order)}
                          disabled={!getNextProgressStatus(order.status)}
                          className={`inline-flex min-h-[42px] items-center rounded-full border px-4 py-2 text-sm font-semibold admin-motion disabled:cursor-not-allowed disabled:opacity-70 ${getStatusButtonClasses(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </button>
                      )}
                      {isProgressEditable && (
                        <button
                          type="button"
                          onClick={() =>
                            setStatusEditorOrderId((current) =>
                              current === order._id ? "" : order._id,
                            )
                          }
                          className="inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-gold-200/70 bg-white text-primary-700 shadow-sm admin-motion hover:border-gold-400 hover:bg-gold-50"
                          aria-label="Edit status"
                          title="Edit status"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className="h-4 w-4"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 20h4l10-10a2 2 0 1 0-4-4L4 16v4Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m12 6 4 4"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {order.status === "cancelled" && getRejectionReasonLabel(order) && (
                      <p className="mt-1 text-xs text-rose-700">
                        {getRejectionReasonLabel(order)}
                      </p>
                    )}
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

