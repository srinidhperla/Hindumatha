import React, { useMemo, useState } from "react";
import { formatINR } from "@/utils/currency";

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
  embedded = false,
}) => {
  const [showMoreProducts, setShowMoreProducts] = useState(false);

  const { regularItems, addOnItems } = useMemo(() => {
    const regular = [];
    const addOns = [];

    checkoutItems.forEach((item) => {
      if (item?.product?.isAddon) {
        addOns.push(item);
      } else {
        regular.push(item);
      }
    });

    return { regularItems: regular, addOnItems: addOns };
  }, [checkoutItems]);

  const firstAddOn = addOnItems[0] ?? null;
  const remainingAddOnItems = addOnItems.slice(1);
  const inlineItems = firstAddOn ? [...regularItems, firstAddOn] : regularItems;

  const renderSummaryItem = (item) => (
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
                {`Cake Type: ${item.selectedEggType === "egg" ? "Egg" : "Eggless"}`}
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
              {`Price: ${formatINR(getSafeUnitPrice(item))}`}
            </span>
          </div>
        </div>
        <p className="commerce-summary-price">{formatINR(item.lineTotal)}</p>
      </div>
    </div>
  );

  return (
    <aside className={embedded ? "commerce-summary-panel" : "commerce-sidebar"}>
      <p className="commerce-sidebar-kicker">Order Summary</p>
      <h2 className="commerce-sidebar-title">Your checkout</h2>

      <div className="commerce-summary-items">
        {inlineItems.map(renderSummaryItem)}
        {remainingAddOnItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMoreProducts(true)}
            className="btn-secondary mt-2 w-full"
          >
            {`View more products (${remainingAddOnItems.length})`}
          </button>
        )}
      </div>

      {showMoreProducts && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary-900">
                Additional products
              </h3>
              <button
                type="button"
                onClick={() => setShowMoreProducts(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {remainingAddOnItems.map(renderSummaryItem)}
            </div>
          </div>
        </div>
      )}

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
            {formatINR(pricing.subtotal)}
          </span>
        </div>
        <div className="commerce-sidebar-row">
          <span>
            {pricing.deliveryFee === 0
              ? "Free Delivery"
              : "Delivery (as usual)"}
          </span>
          <span className="font-semibold text-primary-900">
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
};

export default OrderSummary;
