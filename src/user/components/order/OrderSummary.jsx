import React from "react";

const OrderSummary = ({
  checkoutItems,
  totalUnits,
  pricing,
  step,
  invalidItems,
  onNext,
  onBack,
  loading,
  isAddressVerified,
  isAddressServiceable,
  paymentMethod,
}) => (
  <aside className="commerce-sidebar">
    <p className="commerce-sidebar-kicker">Order Summary</p>
    <h2 className="commerce-sidebar-title">Your checkout</h2>

    <div className="commerce-summary-items">
      {checkoutItems.map((item) => (
        <div key={item.id} className="commerce-summary-item">
          <div className="commerce-summary-top">
            <div>
              <p className="commerce-summary-name">{item.product.name}</p>
              <p className="commerce-summary-copy">
                {item.selectedWeight} • {item.selectedFlavor} • Qty{" "}
                {item.quantity}
              </p>
            </div>
            <p className="commerce-summary-price">
              ₹{item.lineTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="commerce-sidebar-list border-t border-slate-200 pt-5">
      <div className="commerce-sidebar-row">
        <span>Total units</span>
        <span className="font-semibold text-slate-900">{totalUnits}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Product lines</span>
        <span className="font-semibold text-slate-900">
          {checkoutItems.length}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Subtotal</span>
        <span className="font-semibold text-slate-900">
          ₹{pricing.subtotal.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Delivery Fee</span>
        <span className="font-semibold text-slate-900">
          ₹{pricing.deliveryFee.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Discount</span>
        <span className="font-semibold text-emerald-700">
          -₹{pricing.discountAmount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-total">
        <span className="commerce-sidebar-total-label">Total</span>
        <span className="commerce-sidebar-total-value">
          ₹{pricing.totalAmount.toLocaleString("en-IN")}
        </span>
      </div>
    </div>

    {step === 1 && (
      <button
        type="button"
        onClick={onNext}
        disabled={(invalidItems?.length ?? 0) > 0}
        className="btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continue to Checkout
      </button>
    )}

    {step === 2 && (
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary flex-shrink-0"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={
            loading ||
            (invalidItems?.length ?? 0) > 0 ||
            !isAddressVerified ||
            !isAddressServiceable
          }
          className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? paymentMethod === "cash"
              ? "Placing Order…"
              : "Preparing Payment…"
            : paymentMethod === "cash"
              ? "Place Order"
              : "Continue to Payment"}
        </button>
      </div>
    )}

    <div className="commerce-note">
      Delivery address and payment method will apply to the full cart order.
    </div>
  </aside>
);

export default OrderSummary;
