import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  MetricCard,
  LoadingState,
  EmptyState,
} from "@/admin/components/ui/AdminUi";
import AdminOrderActionModal from "@/admin/components/modals/AdminOrderActionModal";
import { ActionButton } from "@/shared/ui/Primitives";
import { fetchOrderAnalytics } from "@/services/orderAPI";
import { updateOrderStatus } from "@/features/orders/orderSlice";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { getOrderSummary, ORDER_STATUS_OPTIONS } from "./adminShared";

const getTodayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getOrderDateKey = (order) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(order.createdAt));

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

const canEditProgressStatus = (status) =>
  ["confirmed", "preparing", "ready"].includes(String(status || ""));

const AdminOverviewPage = ({ onToast = () => {} }) => {
  const dispatch = useDispatch();
  const { orders, loading: ordersLoading } = useSelector(
    (state) => state.orders,
  );
  const { products, loading: productsLoading } = useSelector(
    (state) => state.products,
  );
  const [analytics, setAnalytics] = useState({
    customerCount: 0,
    todayOrders: 0,
    todayRevenue: 0,
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [actionMode, setActionMode] = useState("");
  const [actionOrder, setActionOrder] = useState(null);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      if (mounted) {
        setAnalyticsLoading(true);
      }

      try {
        const response = await fetchOrderAnalytics();
        if (!mounted) {
          return;
        }

        setAnalytics({
          customerCount: Number(response?.customerCount || 0),
          todayOrders: Number(response?.todayOrders || 0),
          todayRevenue: Number(response?.todayRevenue || 0),
        });
      } catch {
        if (!mounted) {
          return;
        }

        const todayKey = getTodayKey();
        const todaysOrders = (orders || []).filter(
          (order) => getOrderDateKey(order) === todayKey,
        );

        setAnalytics({
          customerCount: new Set(
            (orders || []).map((order) => order.user?._id).filter(Boolean),
          ).size,
          todayOrders: todaysOrders.length,
          todayRevenue: todaysOrders
            .filter((order) => order.status !== "cancelled")
            .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
        });
      } finally {
        if (mounted) {
          setAnalyticsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, [orders]);

  const metrics = useMemo(() => {
    const pendingOrders = (orders || []).filter(
      (order) => order.status === "pending",
    ).length;
    const totalRevenue = (orders || [])
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

    return {
      totalRevenue,
      pendingOrders,
      totalOrders: orders?.length || 0,
    };
  }, [orders]);

  const recentOrders = useMemo(
    () =>
      [...(orders || [])]
        .sort(
          (left, right) => new Date(right.createdAt) - new Date(left.createdAt),
        )
        .slice(0, 5),
    [orders],
  );

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
      await dispatch(
        updateOrderStatus({
          id: actionOrder._id,
          ...payload,
        }),
      ).unwrap();

      const successMessage =
        actionMode === "accept"
          ? "Order accepted."
          : actionMode === "reject"
            ? "Order rejected."
            : "Order status updated.";
      onToast(successMessage, "success");
      closeActionModal();
    } catch (error) {
      onToast(error?.message || "Failed to update order.", "error");
      setActionSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (orderId, status) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status })).unwrap();
      onToast(`Order moved to ${status}.`, "success");
    } catch (error) {
      onToast(error?.message || "Failed to update order.", "error");
    }
  };

  if (ordersLoading && !orders.length) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Today's Orders"
          value={analytics.todayOrders}
          subtitle="Orders received today"
          highlight
        />
        <MetricCard
          title="Today's Revenue"
          value={`Rs.${analytics.todayRevenue.toLocaleString("en-IN")}`}
          subtitle="Non-cancelled order value today"
          highlight
        />
        <MetricCard
          title="Pending Orders"
          value={metrics.pendingOrders}
          subtitle={
            metrics.pendingOrders > 3
              ? "Attention needed: more than 3 pending"
              : "Orders waiting for action"
          }
        />
        <MetricCard
          title="Total Customers"
          value={analytics.customerCount}
          subtitle="Customers in the system"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[linear-gradient(165deg,rgba(255,255,255,.95),rgba(255,246,228,.78))] p-6 shadow-[0_10px_22px_rgba(18,12,2,0.12)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-playfair text-lg font-semibold text-[#2a1f0e]">
                Recent Orders
              </h2>
              <p className="mt-1 text-sm text-[#6a5130]">
                Quick triage for the latest five orders.
              </p>
            </div>
            {metrics.pendingOrders > 3 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {metrics.pendingOrders} pending
              </span>
            )}
          </div>

          {recentOrders.length ? (
            <div className="mt-5 space-y-4">
              {recentOrders.map((order) => {
                const isProgressEditable = canEditProgressStatus(order.status);

                return (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/85 p-4 admin-motion hover:-translate-y-0.5 hover:border-[rgba(201,168,76,0.4)] hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a5c0f]">
                          {getOrderDisplayCode(order)}
                        </p>
                        <p className="mt-1 text-base font-semibold text-[#2a1f0e]">
                          {order.user?.name || "Guest Customer"}
                        </p>
                        <p className="mt-1 text-sm text-[#6a5130]">
                          {getOrderSummary(order)}
                        </p>
                        <p className="mt-1 text-xs text-[#8f7859]">
                          Customer asked for: {formatRequestedDelivery(order)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-semibold text-[#5b4312]">
                          Rs.
                          {Number(order.totalAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                        <p className="mt-1 text-sm font-medium capitalize text-[#7a5c0f]">
                          {order.status}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.status === "pending" && (
                        <>
                          <ActionButton
                            type="button"
                            variant="success"
                            onClick={() => openActionModal("accept", order)}
                          >
                            Accept
                          </ActionButton>
                          <ActionButton
                            type="button"
                            variant="danger"
                            onClick={() => openActionModal("reject", order)}
                          >
                            Reject
                          </ActionButton>
                        </>
                      )}
                      {isProgressEditable && (
                        <select
                          value={order.status}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            if (!nextValue || nextValue === order.status) {
                              return;
                            }
                            if (nextValue === "cancelled") {
                              openActionModal("reject", order);
                              return;
                            }
                            handleQuickStatusChange(order._id, nextValue);
                          }}
                          className="rounded-2xl border border-gold-200/70 bg-white px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70"
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No orders yet." />
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(201,168,76,0.3)] bg-[linear-gradient(165deg,rgba(255,255,255,.95),rgba(255,246,228,.78))] p-6 shadow-[0_10px_22px_rgba(18,12,2,0.12)]">
          <h2 className="font-playfair text-lg font-semibold text-[#2a1f0e]">
            Product Summary
          </h2>
          <p className="mt-1 text-sm text-[#6a5130]">
            Quick visibility into the live catalog.
          </p>

          {productsLoading ? (
            <LoadingState />
          ) : products?.length ? (
            <ul className="mt-5 space-y-3">
              {products.slice(0, 6).map((product) => (
                <li
                  key={product._id}
                  className="flex items-center justify-between rounded-xl border border-[rgba(201,168,76,0.22)] bg-white/85 p-3 admin-motion hover:-translate-y-0.5 hover:border-[rgba(201,168,76,0.4)] hover:bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#2a1f0e]">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#6a5130]">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#5b4312]">
                    Rs.{product.price}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState message="Add products to view summary." />
          )}

          <div className="mt-5 rounded-2xl border border-[rgba(201,168,76,0.22)] bg-white/85 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a5c0f]">
              Snapshot
            </p>
            <div className="mt-3 space-y-2 text-sm text-[#6a5130]">
              <p>Total orders: {metrics.totalOrders}</p>
              <p>
                Total revenue: Rs.{metrics.totalRevenue.toLocaleString("en-IN")}
              </p>
              <p>
                Analytics status:{" "}
                {analyticsLoading ? "Refreshing live metrics..." : "Up to date"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AdminOrderActionModal
        mode={actionMode}
        order={actionOrder}
        deliveryPartners={[]}
        submitting={actionSubmitting}
        onClose={closeActionModal}
        onConfirm={handleActionConfirm}
      />
    </div>
  );
};

export default AdminOverviewPage;
