import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  cancelOrder,
  fetchMyOrders,
} from "../../../features/orders/orderSlice";
import { showToast } from "../../../features/uiSlice";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../../components/ui/Primitives";

const ORDER_TIMELINE = [
  { key: "pending", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Baking" },
  { key: "ready", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

const getTimelineIndex = (status) =>
  ORDER_TIMELINE.findIndex((step) => step.key === status);

const getStatusLabel = (status) =>
  ORDER_TIMELINE.find((step) => step.key === status)?.label || status;

const getOrderTimelineEvents = (order) => {
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

const getTimelineActorLabel = (actorRole) => {
  if (actorRole === "admin") return "by bakery";
  if (actorRole === "user") return "by you";
  return "automatic";
};

const formatAddress = (deliveryAddress = {}) =>
  [
    deliveryAddress.street,
    deliveryAddress.city,
    deliveryAddress.state,
    deliveryAddress.zipCode,
  ]
    .filter(Boolean)
    .join(", ");

const getPaymentMethodLabel = (paymentMethod) => {
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

const canCancelOrder = (order) => order?.status === "pending";

const Orders = () => {
  const dispatch = useDispatch();
  const { myOrders, loading, error } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Cancel this order now? You can only do this before the bakery confirms it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await dispatch(cancelOrder(orderId)).unwrap();
      dispatch(
        showToast({
          message: response.message || "Order cancelled successfully.",
          type: "success",
        }),
      );
    } catch (cancelError) {
      dispatch(
        showToast({
          message: cancelError?.message || "Failed to cancel order.",
          type: "error",
        }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-600">
            My Orders
          </p>
          <h1 className="mt-3 text-4xl font-black text-primary-900">
            Track your bakery orders
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-primary-700/70">
            Review previous orders, totals, delivery details, and current order
            status.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        ) : myOrders.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-warm">
            <h2 className="text-2xl font-black text-primary-900">
              No orders yet
            </h2>
            <p className="mt-3 text-primary-700/70">
              Once you place an order, it will appear here with live status
              updates.
            </p>
            <Link to="/menu" className="btn-primary mt-8">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {myOrders.map((order) => (
              <SurfaceCard key={order._id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">
                      Order #{order._id.slice(-6).toUpperCase()}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-primary-900">
                      {order.items?.length || 0} item
                      {order.items?.length === 1 ? "" : "s"} ordered
                    </h2>
                    <p className="mt-2 text-sm text-primary-600/70">
                      Placed on {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <StatusChip
                      tone="accent"
                      className="px-4 py-2 text-sm capitalize"
                    >
                      {getStatusLabel(order.status)}
                    </StatusChip>
                    <StatusChip tone="neutral" className="px-4 py-2 text-sm">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </StatusChip>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getPaymentStatusClasses(order.paymentStatus)}`}
                    >
                      Payment {order.paymentStatus || "pending"}
                    </span>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-primary-100 bg-cream-100 p-4">
                  {order.status !== "cancelled" && (
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {ORDER_TIMELINE.map((step, index) => {
                        const activeIndex = getTimelineIndex(order.status);
                        const isActive = activeIndex >= index;
                        const isLast = index === ORDER_TIMELINE.length - 1;

                        return (
                          <div
                            key={`${order._id}-${step.key}`}
                            className="flex items-center gap-3 md:min-w-0 md:flex-1"
                          >
                            <div className="flex w-full items-center gap-3">
                              <div
                                className={`h-3 w-3 shrink-0 rounded-full ${
                                  isActive ? "bg-primary-600" : "bg-primary-200"
                                }`}
                              />
                              <div
                                className={`h-[2px] flex-1 ${
                                  !isLast && activeIndex > index
                                    ? "bg-primary-500"
                                    : !isLast
                                      ? "bg-primary-200"
                                      : "bg-transparent"
                                }`}
                              />
                            </div>
                            <p
                              className={`min-w-[84px] text-sm font-semibold ${
                                isActive
                                  ? "text-primary-900"
                                  : "text-primary-400"
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-primary-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">
                      Timeline events
                    </p>
                    <div className="mt-3 space-y-2">
                      {getOrderTimelineEvents(order).map((event, index) => (
                        <div
                          key={`${order._id}-${event.status}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cream-100 px-3 py-2 text-xs"
                        >
                          <span className="font-semibold text-primary-800">
                            {getStatusLabel(event.status)}
                          </span>
                          <span className="text-primary-600/70">
                            {event.updatedAt
                              ? new Date(event.updatedAt).toLocaleString()
                              : "Time unavailable"}
                          </span>
                          <span className="text-primary-600/70">
                            {getTimelineActorLabel(event.actorRole)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <div className="space-y-3">
                    {(order.items || []).map((item, index) => (
                      <div
                        key={`${order._id}-${item.product?._id || index}`}
                        className="rounded-2xl border border-primary-100 bg-cream-100 px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-primary-900">
                              {item.product?.name || "Product unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-primary-700/70">
                              {item.size || "Default size"} |{" "}
                              {item.flavor || "Default flavor"} | Qty{" "}
                              {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-caramel-600">
                            Rs.
                            {Math.round(
                              (item.price || 0) * (item.quantity || 0),
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <aside className="rounded-2xl border border-primary-100 bg-cream-100 p-4">
                    <div className="space-y-3 text-sm text-primary-700/70">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-semibold text-primary-900">
                          Rs.
                          {Number(order.subtotal || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-primary-900">
                          Rs.
                          {Number(order.deliveryFee || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Discount</span>
                        <span className="font-semibold text-sage-600">
                          -Rs.
                          {Number(order.discountAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                      <div className="border-t border-primary-200 pt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold text-primary-900">
                            Grand Total
                          </span>
                          <span className="text-lg font-black text-caramel-600">
                            Rs.
                            {Number(order.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-primary-700/70">
                      <p className="font-semibold text-primary-900">Delivery</p>
                      <p className="mt-1">
                        {formatAddress(order.deliveryAddress)}
                      </p>
                      <p className="mt-2">
                        {order.deliveryDate
                          ? new Date(order.deliveryDate).toLocaleDateString()
                          : "No date"}
                        {order.deliveryTime ? ` | ${order.deliveryTime}` : ""}
                      </p>
                      {order.couponCode && (
                        <p className="mt-2 font-medium text-caramel-600">
                          Coupon applied: {order.couponCode}
                        </p>
                      )}
                      {order.paymentGatewayPaymentId && (
                        <p className="mt-2 break-all text-xs text-primary-500">
                          Payment ID: {order.paymentGatewayPaymentId}
                        </p>
                      )}
                      {canCancelOrder(order) && (
                        <ActionButton
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={loading}
                          variant="danger"
                          className="mt-4"
                        >
                          {loading ? "Cancelling..." : "Cancel Order"}
                        </ActionButton>
                      )}
                    </div>
                  </aside>
                </div>
              </SurfaceCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
