import React from "react";

const PaymentSummaryPanel = ({ pricing, freeDeliveryProgress }) => (
  <aside className="commerce-sidebar">
    <p className="commerce-sidebar-kicker">Summary</p>
    <h2 className="commerce-sidebar-title">Amount to pay</h2>
    <div className="commerce-sidebar-list">
      <div className="commerce-sidebar-row">
        <span>Subtotal</span>
        <span className="font-semibold text-primary-800">
          Rs.{pricing.subtotal.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>
          {pricing.deliveryFee === 0 ? "Free Delivery" : "Delivery (as usual)"}
        </span>
        <span className="font-semibold text-primary-800">
          {pricing.deliveryFee === 0
            ? "Free Delivery"
            : `Rs.${pricing.deliveryFee.toLocaleString("en-IN")}`}
        </span>
      </div>
      {pricing.deliveryFee > 0 &&
        freeDeliveryProgress?.enabled &&
        freeDeliveryProgress?.remainingAmount > 0 && (
          <div className="commerce-sidebar-row text-xs text-primary-700">
            <span className="font-semibold text-primary-800">
              Add ?
              {Number(freeDeliveryProgress.remainingAmount).toLocaleString(
                "en-IN",
              )}{" "}
              more for free delivery
            </span>
          </div>
        )}
      <div className="commerce-sidebar-row">
        <span>Discount</span>
        <span className="font-semibold text-emerald-700">
          -Rs.{pricing.discountAmount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-total">
        <span className="commerce-sidebar-total-label">Total</span>
        <span className="commerce-sidebar-total-value">
          Rs.{pricing.totalAmount.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
    <div className="commerce-note">
      Use Razorpay test keys first. After that, switch to live keys in the
      backend environment.
    </div>
  </aside>
);

export default PaymentSummaryPanel;
