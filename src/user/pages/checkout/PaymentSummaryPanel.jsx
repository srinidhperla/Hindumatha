import React from "react";
import { formatINR } from "@/utils/currency";

const PaymentSummaryPanel = ({
  pricing,
  freeDeliveryProgress,
  itemCount = 0,
  totalUnits = 0,
  embedded = false,
}) => (
  <aside className={embedded ? "commerce-summary-panel" : "commerce-sidebar"}>
    <p className="commerce-sidebar-kicker">Summary</p>
    <h2 className="commerce-sidebar-title">Amount to pay</h2>
    <div className="commerce-sidebar-list">
      <div className="commerce-sidebar-row">
        <span>Total units</span>
        <span className="font-semibold text-primary-800">{totalUnits}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Product lines</span>
        <span className="font-semibold text-primary-800">{itemCount}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Subtotal</span>
        <span className="font-semibold text-primary-800">
          {formatINR(pricing.subtotal)}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>
          {pricing.deliveryFee === 0 ? "Free Delivery" : "Delivery (as usual)"}
        </span>
        <span className="font-semibold text-primary-800">
          {pricing.deliveryFee === 0
            ? "Free Delivery"
            : formatINR(pricing.deliveryFee)}
        </span>
      </div>
      {pricing.deliveryFee > 0 &&
        freeDeliveryProgress?.enabled &&
        freeDeliveryProgress?.remainingAmount > 0 && (
          <div className="commerce-sidebar-row text-xs text-primary-700">
            <span className="font-semibold text-primary-800">
              Add {formatINR(freeDeliveryProgress.remainingAmount)} more for
              free delivery
            </span>
          </div>
        )}
      <div className="commerce-sidebar-row">
        <span>Discount</span>
        <span className="font-semibold text-emerald-700">
          -{formatINR(pricing.discountAmount)}
        </span>
      </div>
      <div className="commerce-sidebar-total">
        <span className="commerce-sidebar-total-label">Total</span>
        <span className="commerce-sidebar-total-value">
          {formatINR(pricing.totalAmount)}
        </span>
      </div>
    </div>
    <div className="commerce-note">
      Secure Razorpay checkout will open in the next step for UPI and card
      payments.
    </div>
  </aside>
);

export default PaymentSummaryPanel;
