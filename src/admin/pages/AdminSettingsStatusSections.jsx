import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";

export const PaymentGatewayStatusSection = ({ paymentStatus }) => {
  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">
            Payment Gateway Status
          </h2>
          <p className="mt-1 text-sm text-primary-600">
            Online UPI and card payments use Razorpay. Cash on delivery stays
            enabled even if online keys are missing.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Gateway
          </p>
          <p className="mt-2 text-sm font-semibold uppercase text-primary-900">
            {paymentStatus.gateway || "razorpay"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Online Payments
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${paymentStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
          >
            {paymentStatus.configured ? "Ready" : "Keys missing"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Key ID
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-primary-900">
            {paymentStatus.keyIdPreview || "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Methods
          </p>
          <p className="mt-2 text-sm font-semibold text-primary-900">
            {(paymentStatus.supportedMethods || []).join(", ").toUpperCase()}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
};

export const AlertEmailStatusSection = ({ alertStatus, onSendTestEmail }) => {
  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-900">
            Alert Email Status
          </h2>
          <p className="mt-1 text-sm text-primary-600">
            Pending orders trigger an immediate alert email and then repeat
            every {alertStatus.reminderIntervalMinutes || 5} minutes until
            accepted.
          </p>
        </div>
        <ActionButton
          type="button"
          onClick={onSendTestEmail}
          variant="secondary"
        >
          Send Test Email
        </ActionButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            SMTP
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${alertStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
          >
            {alertStatus.configured ? "Configured" : "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Recipient
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-primary-900">
            {alertStatus.recipient || "No recipient configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            From
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-primary-900">
            {alertStatus.from || "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-gold-200/60 bg-gold-50/45 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            Pending Orders
          </p>
          <p className="mt-2 text-sm font-semibold text-primary-900">
            {alertStatus.pendingOrderCount || 0}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
};
