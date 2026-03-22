import React from "react";

const getSafeUnitPrice = (item) =>
  Number(
    item.unitPrice ??
      item.price ??
      (Number(item.quantity || 0) > 0
        ? Number(item.lineTotal || 0) / Number(item.quantity || 1)
        : 0),
  );

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
  freeDeliveryProgress,
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
              <div className="commerce-meta-chips mt-2">
                <span className="commerce-chip commerce-chip--muted">
                  {`${item.portionTypeMeta?.singular || "Option"}: ${item.selectedWeight}`}
                </span>
                {item.selectedEggType && (
                  <span className="commerce-chip commerce-chip--muted">
                    {`Type: ${item.selectedEggType === "egg" ? "Egg" : "Eggless"}`}
                  </span>
                )}
                {item.selectedFlavor && (
                  <span className="commerce-chip commerce-chip--muted">
                    {`Flavor: ${item.selectedFlavor}`}
                  </span>
                )}
                <span className="commerce-chip commerce-chip--muted">
                  {`Qty: ${item.quantity}`}
                </span>
                <span className="commerce-chip commerce-chip--success">
                  {`Price: Rs.${getSafeUnitPrice(item).toLocaleString("en-IN")}`}
                </span>
              </div>
            </div>
            <p className="commerce-summary-price">
              ₹{item.lineTotal.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="commerce-sidebar-list border-t border-primary-200 pt-5">
      <div className="commerce-sidebar-row">
        <span>Total units</span>
        <span className="font-semibold text-primary-900">{totalUnits}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Product lines</span>
        <span className="font-semibold text-primary-900">
          {checkoutItems.length}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Subtotal</span>
        <span className="font-semibold text-primary-900">
          ₹{pricing.subtotal.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>
          {pricing.deliveryFee === 0 ? "Free Delivery" : "Delivery (as usual)"}
        </span>
        <span className="font-semibold text-primary-900">
          {pricing.deliveryFee === 0
            ? "Free Delivery"
            : `₹${pricing.deliveryFee.toLocaleString("en-IN")}`}
        </span>
      </div>
      {pricing.deliveryFee > 0 &&
        freeDeliveryProgress?.enabled &&
        freeDeliveryProgress?.remainingAmount > 0 && (
          <div className="commerce-sidebar-row text-xs text-primary-700">
            <span className="font-semibold text-primary-800">
              Add ₹
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
