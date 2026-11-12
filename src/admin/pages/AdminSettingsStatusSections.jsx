import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";

export const PaymentGatewayStatusSection = ({ paymentStatus }) => {
  return (
    <SurfaceCard className="p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#1f1709]">
            Payment Gateway Status
          </h2>
          <p className="mt-1 text-sm text-[#5c4a26]">
            Online UPI and card payments use Razorpay. Cash on delivery stays
            enabled even if online keys are missing.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Gateway
          </p>
          <p className="mt-2 text-sm font-semibold uppercase text-[#1f1709]">
            {paymentStatus.gateway || "razorpay"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Online Payments
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${paymentStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
          >
            {paymentStatus.configured ? "Ready" : "Keys missing"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Key ID
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-[#1f1709]">
            {paymentStatus.keyIdPreview || "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Methods
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1f1709]">
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
          <h2 className="text-lg font-semibold text-[#1f1709]">
            Alert Email Status
          </h2>
          <p className="mt-1 text-sm text-[#5c4a26]">
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
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Email Provider
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${alertStatus.configured ? "text-emerald-700" : "text-amber-700"}`}
          >
            {alertStatus.configured ? "Configured" : "Not configured"}
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7d6c4d]">
            {alertStatus.provider || "none"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Recipients
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-[#1f1709]">
            {(alertStatus.recipients || []).length
              ? alertStatus.recipients.join(", ")
              : alertStatus.recipient || "No recipient configured"}
          </p>
          <p className="mt-1 text-xs text-[#7d6c4d]">
            Source: {alertStatus.recipientSource || "unknown"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            From
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-[#1f1709]">
            {alertStatus.from || "Not configured"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Sender
          </p>
          <p className="mt-2 break-all text-sm font-semibold text-[#1f1709]">
            {alertStatus.resendFrom || alertStatus.from || "Not configured"}
          </p>
          {alertStatus.configurationHint ? (
            <p className="mt-1 text-xs text-amber-700">
              {alertStatus.configurationHint}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Missing Fields
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1f1709]">
            {(alertStatus.missingResendFields || []).length
              ? alertStatus.missingResendFields.join(", ")
              : "None"}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Recipient Count
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1f1709]">
            {alertStatus.recipientCount || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-[#ebe1cb] bg-[#faf6ec] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5c4a26]">
            Pending Orders
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1f1709]">
            {alertStatus.pendingOrderCount || 0}
          </p>
        </div>
      </div>
    </SurfaceCard>
  );
};
