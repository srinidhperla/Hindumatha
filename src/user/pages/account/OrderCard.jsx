import React, { useState } from "react";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import { getOrderDisplayCode } from "@/utils/orderDisplay";
import {
  ORDER_TIMELINE,
  canCancelOrder,
  formatEstimatedDelivery,
  formatAddress,
  formatRequestedDelivery,
  getRejectionReasonLabel,
  getOrderTimelineEvents,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
  getPaymentStatusClasses,
  getStatusLabel,
  getTimelineActorLabel,
  isTimelineStepActive,
  isTimelineStepConnectorActive,
} from "@/user/pages/account/orderPageUtils";

const OrderCard = ({ order, loading, onCancelOrder, onDownloadInvoice }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemCount = order.items?.length || 0;

  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary-600">
            Order {getOrderDisplayCode(order)}
          </p>
          <h2 className="mt-2 text-2xl font-black text-primary-900">
            {itemCount} item{itemCount === 1 ? "" : "s"} ordered
          </h2>
          <p className="mt-2 text-sm text-primary-600/70">
            Placed on {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StatusChip tone="accent" className="px-4 py-2 text-sm capitalize">
            {getStatusLabel(order.status)}
          </StatusChip>
          <StatusChip tone="neutral" className="px-4 py-2 text-sm">
            {getPaymentMethodLabel(order.paymentMethod)}
          </StatusChip>
          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${getPaymentStatusClasses(order.paymentStatus)}`}
          >
            Payment {getPaymentStatusLabel(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-primary-100 bg-cream-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            Total
          </p>
          <p className="mt-2 text-xl font-black text-caramel-600">
            Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-cream-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            Requested
          </p>
          <p className="mt-2 text-sm font-semibold text-primary-900">
            {formatRequestedDelivery(order)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-cream-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            Estimated
          </p>
          <p className="mt-2 text-sm font-semibold text-primary-900">
            {formatEstimatedDelivery(order)}
          </p>
        </div>

        <div className="rounded-2xl border border-primary-100 bg-cream-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">
            Delivery
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-primary-700/80">
            {formatAddress(order.deliveryAddress)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <ActionButton
          type="button"
          variant="secondary"
          onClick={() => setIsExpanded((current) => !current)}
        >
          {isExpanded ? "Hide Details" : "View Details"}
        </ActionButton>
        {canCancelOrder(order) && !isExpanded && (
          <ActionButton
            type="button"
            onClick={() => onCancelOrder(order._id)}
            disabled={loading}
            variant="danger"
          >
            {loading ? "Cancelling..." : "Cancel Order"}
          </ActionButton>
        )}
      </div>

      {isExpanded && (
        <>
          <div className="mt-6 rounded-2xl border border-primary-100 bg-cream-100 p-4">
            {order.status !== "cancelled" && (
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                {ORDER_TIMELINE.map((step, index) => {
                  const isActive = isTimelineStepActive(order.status, index);
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
                            !isLast &&
                            isTimelineStepConnectorActive(order.status, index)
                              ? "bg-primary-500"
                              : !isLast
                                ? "bg-primary-200"
                                : "bg-transparent"
                          }`}
                        />
                      </div>
                      <p
                        className={`min-w-[84px] text-sm font-semibold ${
                          isActive ? "text-primary-900" : "text-primary-400"
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
                        {item.flavor || "Default flavor"} | Qty {item.quantity}
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
                    Rs.{Number(order.subtotal || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-primary-900">
                    Rs.{Number(order.deliveryFee || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-sage-600">
                    -Rs.{Number(order.discountAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="border-t border-primary-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-primary-900">
                      Grand Total
                    </span>
                    <span className="text-lg font-black text-caramel-600">
                      Rs.{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-primary-700/70">
                <p className="font-semibold text-primary-900">Delivery</p>
                <p className="mt-1">{formatAddress(order.deliveryAddress)}</p>
                <p className="mt-2">
                  Requested: {formatRequestedDelivery(order)}
                </p>
                <p className="mt-2">
                  Estimated: {formatEstimatedDelivery(order)}
                </p>
                {order.assignedDeliveryPartner?.name && (
                  <p className="mt-2">
                    Delivery partner: {order.assignedDeliveryPartner.name}
                  </p>
                )}
                {order.status === "cancelled" && order.rejectionReason && (
                  <p className="mt-2 text-red-600">
                    Reason: {getRejectionReasonLabel(order.rejectionReason)}
                    {order.rejectionMessage ? ` - ${order.rejectionMessage}` : ""}
                  </p>
                )}
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
                    onClick={() => onCancelOrder(order._id)}
                    disabled={loading}
                    variant="danger"
                    className="mt-4"
                  >
                    {loading ? "Cancelling..." : "Cancel Order"}
                  </ActionButton>
                )}
                <button
                  type="button"
                  onClick={() => onDownloadInvoice(order)}
                  className="mt-3 w-full rounded-lg border-2 border-caramel-400 bg-white px-4 py-2 font-semibold text-caramel-700 transition hover:bg-caramel-50"
                >
                  Download Invoice
                </button>
              </div>
            </aside>
          </div>
        </>
      )}
    </SurfaceCard>
  );
};

export default OrderCard;
