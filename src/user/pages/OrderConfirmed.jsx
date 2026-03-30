import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrderById } from "@/features/orders/orderSlice";
import useUserOrderUpdates from "@/user/hooks/useUserOrderUpdates";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { getStatusLabel } from "@/user/pages/account/orderPageUtils";

const formatAddress = (address = {}) =>
  [address.street, address.landmark, address.city, address.state, address.zipCode]
    .filter(Boolean)
    .join(", ");

const formatRequestedDelivery = (order) => {
  if (order?.deliveryMode === "now") {
    return "Deliver now";
  }

  const deliveryDate = order?.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Scheduled";

  return `${deliveryDate}${order?.deliveryTime ? ` at ${order.deliveryTime}` : ""}`;
};

const formatEstimatedDelivery = (order) => {
  const value = String(order?.estimatedDeliveryTime || "").trim();
  if (!value) {
    return "Bakery will update this after accepting your order.";
  }

  if (value === "custom") {
    return order?.customDeliveryTime || "Custom timing";
  }

  const labels = {
    "15min": "15 minutes",
    "30min": "30 minutes",
    "45min": "45 minutes",
    "1hour": "1 hour",
    "1.5hours": "1.5 hours",
    "2hours": "2 hours",
  };

  return labels[value] || value;
};

const OrderConfirmed = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const { currentOrder, loading, error } = useSelector((state) => state.orders);

  useUserOrderUpdates();

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  const order = useMemo(
    () => (currentOrder?._id === orderId ? currentOrder : null),
    [currentOrder, orderId],
  );

  if (loading && !order) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4 py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-emerald-200 bg-[linear-gradient(155deg,#f7fff8_0%,#ffffff_55%,#eefcf1_100%)] p-6 shadow-[0_20px_50px_rgba(22,101,52,0.12)] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-9 w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Order Confirmed
            </p>
            <h1 className="mt-2 font-playfair text-3xl font-bold text-primary-900 sm:text-4xl">
              Your order was placed successfully
            </h1>
            <p className="mt-3 text-sm leading-7 text-primary-700 sm:text-base">
              We have received your order and will keep you updated in real time once the bakery accepts it, assigns delivery, and marks it out for delivery.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm sm:min-w-[280px]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">
              Order ID
            </p>
            <p className="mt-2 break-all text-xl font-bold text-primary-900">
              {getOrderDisplayCode(order)}
            </p>
            <div className="mt-4 space-y-2 text-sm text-primary-700">
              <p>Requested: {formatRequestedDelivery(order)}</p>
              <p>Estimated: {formatEstimatedDelivery(order)}</p>
              <p>Total: Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-primary-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900">Items ordered</h2>
              <div className="mt-4 space-y-3">
                {(order.items || []).map((item, index) => (
                  <div
                    key={`${order._id}-${item.product?._id || index}`}
                    className="rounded-2xl border border-primary-100 bg-cream-50 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary-900">
                          {item.product?.name || "Product"}
                        </p>
                        <p className="mt-1 text-sm text-primary-700">
                          Qty {item.quantity}
                          {item.size ? ` | ${item.size}` : ""}
                          {item.flavor ? ` | ${item.flavor}` : ""}
                        </p>
                      </div>
                      <p className="font-semibold text-primary-900">
                        Rs.
                        {Math.round(
                          Number(item.price || 0) * Number(item.quantity || 0),
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-primary-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-primary-900">Delivery address</h2>
              <p className="mt-3 text-sm leading-7 text-primary-700">
                {formatAddress(order.deliveryAddress)}
              </p>
              <p className="mt-3 text-sm text-primary-500">
                Contact: {order.deliveryAddress?.phone || order.user?.phone || "Not available"}
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-primary-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-primary-900">Next steps</h2>
            <div className="mt-4 space-y-3 text-sm text-primary-700">
              <p>Bakery status: <span className="font-semibold">{getStatusLabel(order.status)}</span></p>
              <p>Estimated delivery: <span className="font-semibold">{formatEstimatedDelivery(order)}</span></p>
              <p>Delivery request: <span className="font-semibold">{formatRequestedDelivery(order)}</span></p>
            </div>
            <div className="mt-6 grid gap-3">
              <Link
                to="/orders"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(122,92,15,.24)] transition hover:brightness-110"
              >
                Track Order
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center justify-center rounded-2xl border border-[rgba(201,168,76,.35)] bg-white px-4 py-3 text-sm font-semibold text-[#6a4c16] transition hover:bg-[#f9f2df]"
              >
                Continue Shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmed;
