import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import {
  fetchDeliveryOrders,
  updateAssignedDeliveryStatus,
  upsertIncomingOrder,
} from "@/features/orders/orderSlice";
import { SurfaceCard, ActionButton, StatusChip } from "@/shared/ui/Primitives";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import { buildGoogleMapsSearchUrl, formatAddressText } from "@/utils/mapsLinks";

const API_URL = import.meta.env.VITE_API_URL;

const formatAddress = (address = {}) => formatAddressText(address);

const getItemsSummary = (items = []) =>
  items
    .map((item) => `${item.product?.name || "Product"} x${item.quantity || 0}`)
    .join(", ");

const getMapLink = (order) => buildGoogleMapsSearchUrl(order?.deliveryAddress);

const DeliveryDashboard = () => {
  const dispatch = useDispatch();
  const { deliveryOrders, loading, error } = useSelector((state) => state.orders);
  const { token, user } = useSelector((state) => state.auth);
  const deliveryUserId = String(user?.id || user?._id || "");

  const visibleOrders = useMemo(
    () =>
      (deliveryOrders || []).filter((order) => {
        const assignedId = String(
          order?.assignedDeliveryPartner?._id ||
            order?.assignedDeliveryPartner ||
            "",
        );
        return assignedId && assignedId === deliveryUserId;
      }),
    [deliveryOrders, deliveryUserId],
  );

  useEffect(() => {
    dispatch(fetchDeliveryOrders());
  }, [dispatch]);

  useEffect(() => {
    if (!token || user?.role !== "delivery") {
      return undefined;
    }

    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const handleOrderUpdate = (event) => {
      if (event?.payload?._id) {
        dispatch(upsertIncomingOrder(event.payload));
      }
    };

    socket.on("order-status-updated", handleOrderUpdate);

    return () => {
      socket.off("order-status-updated", handleOrderUpdate);
      socket.disconnect();
    };
  }, [dispatch, token, user?.role]);

  const handleDeliveryUpdate = async (orderId, deliveryStatus) => {
    await dispatch(updateAssignedDeliveryStatus({ id: orderId, deliveryStatus }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-3xl border border-[rgba(201,168,76,0.3)] bg-[linear-gradient(145deg,#120c02_0%,#251a0a_60%,#38240f_100%)] px-6 py-8 text-white shadow-[0_16px_34px_rgba(18,12,2,0.28)] sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel-300/90">
          Delivery Console
        </p>
        <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
          Delivery Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-cream-200/85 sm:text-base">
          View your assigned orders, get customer details, and update delivery progress in real time.
        </p>
      </div>

      {loading && !visibleOrders.length ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : error ? (
        <SurfaceCard className="p-6 text-red-700">{error}</SurfaceCard>
      ) : visibleOrders.length === 0 ? (
        <SurfaceCard className="p-8 text-center text-primary-600">
          No assigned orders right now.
        </SurfaceCard>
      ) : (
        <div className="grid gap-4">
          {visibleOrders.map((order) => (
            <SurfaceCard key={order._id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip tone="accent">
                      Order {getOrderDisplayCode(order)}
                    </StatusChip>
                    <StatusChip tone="info" className="capitalize">
                      {order.deliveryStatus || "pending"}
                    </StatusChip>
                  </div>
                  <h2 className="text-xl font-bold text-primary-900">
                    {order.user?.name || "Customer"}
                  </h2>
                  <p className="text-sm text-primary-700">
                    {formatAddress(order.deliveryAddress)}
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm text-primary-700">
                    <span>{order.user?.phone || order.deliveryAddress?.phone || "No phone"}</span>
                    <span>Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-xs text-primary-500">
                    {getItemsSummary(order.items)}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:min-w-[220px]">
                  <a
                    href={getMapLink(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[rgba(201,168,76,.35)] bg-white px-4 py-2.5 text-sm font-semibold text-[#6a4c16] transition hover:bg-[#f9f2df]"
                  >
                    Open Map Link
                  </a>
                  <ActionButton
                    variant="secondary"
                    onClick={() =>
                      handleDeliveryUpdate(order._id, "outForDelivery")
                    }
                    disabled={order.deliveryStatus === "outForDelivery"}
                  >
                    {order.deliveryStatus === "outForDelivery"
                      ? "Out for Delivery"
                      : "Mark Out for Delivery"}
                  </ActionButton>
                  <ActionButton
                    variant="success"
                    onClick={() => handleDeliveryUpdate(order._id, "delivered")}
                    disabled={order.deliveryStatus === "delivered"}
                  >
                    Mark as Delivered
                  </ActionButton>
                </div>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
