import React from "react";
import { Link } from "react-router-dom";
import { formatINR } from "@/utils/currency";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";

const AddonRow = ({ addon, onAdd }) => (
  <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-cream-100 p-2">
    <img
      src={optimizeProductImageUrl(addon.images?.[0] || addon.image)}
      alt={addon.name}
      width={48}
      height={48}
      loading="lazy"
      className="h-12 w-12 rounded-lg object-cover"
    />
    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-semibold text-primary-900">
        {addon.name}
      </p>
      <p className="text-xs text-primary-600">{formatINR(addon.price)}</p>
    </div>
    <button
      type="button"
      onClick={() => onAdd(addon)}
      className="rounded-lg border border-primary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
    >
      Add
    </button>
  </div>
);

const CartSummarySidebar = ({
  availableAddons,
  inlineAddons,
  remainingAddons,
  showMoreAddons,
  setShowMoreAddons,
  handleAddAddon,
  totalItems,
  cartItemsCount,
  pricing,
  remainingForFreeDelivery,
  couponInput,
  setCouponInput,
  unavailableCount,
  isAuthenticated,
  handleProceed,
  embedded = false,
}) => (
  <aside className={embedded ? "commerce-summary-panel" : "commerce-sidebar"}>
    <p className="commerce-sidebar-kicker">Summary</p>
    <h2 className="commerce-sidebar-title">Checkout preview</h2>

    {availableAddons.length > 0 && (
      <div className="mb-5 rounded-2xl border border-primary-200 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">
          Add-ons
        </p>
        <p className="mt-1 text-xs text-primary-600">
          Optional extras you can add quickly.
        </p>
        <div className="mt-3 space-y-2">
          {inlineAddons.map((addon) => (
            <AddonRow key={addon._id} addon={addon} onAdd={handleAddAddon} />
          ))}
          {remainingAddons.length > 0 && (
            <button
              type="button"
              onClick={() => setShowMoreAddons(true)}
              className="w-full rounded-xl border border-primary-300 bg-white px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-cream-100"
            >
              {`View more products (${remainingAddons.length})`}
            </button>
          )}
        </div>
      </div>
    )}

    {showMoreAddons && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
        <div className="w-full max-w-xl rounded-2xl border border-primary-200 bg-white p-4 shadow-2xl sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold uppercase tracking-wide text-primary-900 sm:text-lg">
              More add-on products
            </h3>
            <button
              type="button"
              onClick={() => setShowMoreAddons(false)}
              className="rounded-lg border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
            >
              Close
            </button>
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {remainingAddons.map((addon) => (
              <AddonRow key={addon._id} addon={addon} onAdd={handleAddAddon} />
            ))}
          </div>
        </div>
      </div>
    )}

    <div className="commerce-sidebar-list">
      <div className="commerce-sidebar-row">
        <span>Total items</span>
        <span className="font-semibold text-primary-800">{totalItems}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Product lines</span>
        <span className="font-semibold text-primary-800">{cartItemsCount}</span>
      </div>
      <div className="commerce-sidebar-row">
        <span>Discount</span>
        <span className="font-semibold text-emerald-700">
          -{formatINR(pricing.discountAmount)}
        </span>
      </div>
      <div className="commerce-sidebar-row">
        <span>
          {remainingForFreeDelivery === 0
            ? "Free Delivery"
            : "Delivery (at checkout)"}
        </span>
        <span className="font-semibold text-primary-800">
          {remainingForFreeDelivery === 0
            ? "Unlocked"
            : `Add ${formatINR(remainingForFreeDelivery)} more for free delivery`}
        </span>
      </div>
      <div className="commerce-sidebar-total">
        <span className="commerce-sidebar-total-label">Grand total</span>
        <span className="commerce-sidebar-total-value">
          {formatINR(pricing.totalAmount)}
        </span>
      </div>
    </div>

    <div className="mt-6 space-y-3">
      <label className="block">
        <span className="commerce-field-label">Coupon Code</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(event) =>
              setCouponInput(event.target.value.toUpperCase())
            }
            placeholder="Enter coupon code"
            className="commerce-input flex-1"
          />
          <button type="button" className="commerce-apply-button">
            Apply
          </button>
        </div>
      </label>
      {pricing.couponError ? (
        <div className="commerce-alert commerce-alert--danger mt-0">
          {pricing.couponError}
        </div>
      ) : pricing.appliedCoupon ? (
        <div className="commerce-alert commerce-alert--success mt-0">
          Applied {pricing.appliedCoupon.code}:{" "}
          {pricing.appliedCoupon.description}
        </div>
      ) : null}
    </div>

    {unavailableCount > 0 && (
      <div className="commerce-alert commerce-alert--danger">
        {unavailableCount} item{unavailableCount > 1 ? "s are" : " is"} not
        ready for checkout. Update or remove them first.
      </div>
    )}

    {!isAuthenticated && (
      <div className="commerce-alert commerce-alert--warning">
        Sign in before placing the order.
      </div>
    )}

    <div className="commerce-actions">
      <button
        type="button"
        onClick={handleProceed}
        disabled={unavailableCount > 0 || Boolean(pricing.couponError)}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isAuthenticated ? "Proceed to Checkout" : "Login to Checkout"}
      </button>
      <Link to="/menu" className="btn-secondary w-full">
        Continue Shopping
      </Link>
    </div>
  </aside>
);

export default CartSummarySidebar;
