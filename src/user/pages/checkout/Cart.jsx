import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  addToCart,
  clearCart,
  dismissPriceSyncNotice,
  removeFromCart,
  updateCartItemOptions,
  updateCartQuantity,
} from "../../../features/cart/cartSlice";
import { fetchProducts } from "../../../features/products/productSlice";
import { showToast } from "../../../features/uiSlice";
import {
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "../../../utils/orderPricing";
import { normalizeDeliverySettings } from "../../../utils/deliverySettings";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "../../../utils/productOptions";

const DEFAULT_COUPON_INPUT = "";

const getResolvedCartItem = (item) => {
  const hasExplicitFlavors = normalizeFlavorOptions(item.product).length > 0;
  const availableEggTypes = [
    ...(item.product?.isEgg !== false ? ["egg"] : []),
    ...(item.product?.isEggless === true ? ["eggless"] : []),
  ];
  const selectedEggType = availableEggTypes.includes(item.selectedEggType)
    ? item.selectedEggType
    : availableEggTypes.length === 1
      ? availableEggTypes[0]
      : "";
  const availableFlavors = getAvailableFlavorOptions(item.product);
  const selectedFlavor = hasExplicitFlavors
    ? availableFlavors.find((option) => option.name === item.selectedFlavor)
        ?.name ||
      availableFlavors[0]?.name ||
      ""
    : "";
  const flavorForWeightFilter =
    selectedFlavor || availableFlavors[0]?.name || "";
  const availableWeights = getAvailableWeightOptions(
    item.product,
    flavorForWeightFilter,
    selectedEggType,
  );
  const selectedWeight =
    availableWeights.find((option) => option.label === item.selectedWeight)
      ?.label ||
    availableWeights[0]?.label ||
    "";
  const unitPrice = getVariantPrice(item.product, {
    flavorName: selectedFlavor,
    weightLabel: selectedWeight,
    eggType: selectedEggType,
  });

  return {
    ...item,
    portionTypeMeta: getPortionTypeMeta(item.product?.portionType),
    availableFlavors,
    availableWeights,
    selectedFlavor,
    selectedWeight,
    selectedEggType,
    availableEggTypes,
    hasExplicitFlavors,
    unitPrice,
    lineTotal: unitPrice * item.quantity,
    canOrder:
      isProductPurchasable(item.product) &&
      (!hasExplicitFlavors || Boolean(selectedFlavor)) &&
      (availableEggTypes.length <= 1 || Boolean(selectedEggType)) &&
      Boolean(selectedWeight),
  };
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, priceSyncNoticeVisible, priceSyncUpdatedItemsCount } =
    useSelector((state) => state.cart);
  const { products } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const coupons = useSelector((state) => state.site.coupons);
  const deliverySettings = useSelector((state) => state.site.deliverySettings);
  const [couponInput, setCouponInput] = React.useState(DEFAULT_COUPON_INPUT);
  const [showMoreAddons, setShowMoreAddons] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const cartItems = useMemo(
    () => items.map((item) => getResolvedCartItem(item)),
    [items],
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const unavailableCount = cartItems.filter((item) => !item.canOrder).length;
  const availableCoupons = (coupons?.length ? coupons : DEFAULT_COUPONS).filter(
    (coupon) => coupon.isActive !== false,
  );
  const normalizedDeliverySettings = useMemo(
    () => normalizeDeliverySettings(deliverySettings),
    [deliverySettings],
  );
  const freeDeliveryMinAmount =
    Number(normalizedDeliverySettings?.freeDeliveryMinAmount) || 0;
  const remainingForFreeDelivery = Math.max(
    0,
    freeDeliveryMinAmount - subtotal,
  );
  const pricing = calculateOrderPricing({
    subtotal,
    couponCode: couponInput,
    coupons: availableCoupons,
  });
  const availableAddons = useMemo(
    () =>
      products
        .filter((product) => product.isAddon === true)
        .filter((product) => product.isAvailable !== false)
        .slice(0, 6),
    [products],
  );
  const inlineAddons = useMemo(
    () => availableAddons.slice(0, 1),
    [availableAddons],
  );
  const remainingAddons = useMemo(
    () => availableAddons.slice(1),
    [availableAddons],
  );

  const handleAddAddon = (product) => {
    const availableWeights = getAvailableWeightOptions(product, "", "");
    const availableFlavors = getAvailableFlavorOptions(product);
    const hasExplicitFlavorOptions = normalizeFlavorOptions(product).length > 0;
    const selectedWeight = availableWeights[0]?.label || "";
    const selectedFlavor = hasExplicitFlavorOptions
      ? availableFlavors[0]?.name || ""
      : "";
    const selectedEggType =
      product?.isEgg !== false && product?.isEggless !== true
        ? "egg"
        : product?.isEggless === true && product?.isEgg === false
          ? "eggless"
          : "";

    dispatch(
      addToCart({
        product,
        quantity: 1,
        selectedFlavor,
        selectedWeight,
        selectedEggType,
      }),
    );
    dispatch(
      showToast({
        message: `${product.name} added to cart.`,
        type: "success",
      }),
    );
  };

  const handleProceed = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    navigate(isAuthenticated ? "/order" : "/login", {
      state: {
        couponCode: normalizeCouponCode(couponInput),
      },
    });
  };

  if (!cartItems.length) {
    return (
      <div className="commerce-page--empty">
        <div className="commerce-empty-shell">
          <div className="commerce-empty-card">
            <p className="commerce-kicker">Cart</p>
            <h1 className="mt-4 text-4xl font-black text-primary-800">
              Your cart is empty
            </h1>
            <p className="commerce-copy mt-4">
              Add cakes, choose your favorites, and come back here to review
              everything before checkout.
            </p>
            <Link to="/menu" className="btn-primary mt-8">
              Explore Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page commerce-page--cart">
      <div className="commerce-shell">
        <div className="commerce-header">
          <div>
            <p className="commerce-kicker">Shopping Cart</p>
            <h1 className="commerce-title">
              Review your order like a proper checkout
            </h1>
            <p className="commerce-copy max-w-2xl">
              Update flavors, options, and quantities here. When everything
              looks right, place one order for the whole cart.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="btn-secondary"
          >
            Clear Cart
          </button>
        </div>

        {priceSyncNoticeVisible && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium">
                Prices were updated by admin, please review
                {priceSyncUpdatedItemsCount > 0
                  ? ` (${priceSyncUpdatedItemsCount} item${priceSyncUpdatedItemsCount > 1 ? "s" : ""}).`
                  : "."}
              </p>
              <button
                type="button"
                onClick={() => dispatch(dismissPriceSyncNotice())}
                className="self-start rounded-full border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 sm:self-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        <div className="commerce-grid">
          <div className="commerce-list">
            {cartItems.map((item) => (
              <article key={item.id} className="commerce-card">
                <div className="commerce-card-body">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="commerce-image"
                  />

                  <div className="commerce-main">
                    <div className="commerce-topline">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-caramel-500">
                          {formatCategoryLabel(item.product.category)}
                        </p>
                        <h2 className="mt-2 text-2xl font-black text-primary-800">
                          {item.product.name}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-600">
                          {item.product.description}
                        </p>
                      </div>
                      <div className="commerce-price-box">
                        <p className="commerce-price-kicker">Line Total</p>
                        <p className="commerce-price-value">
                          Rs.{item.lineTotal.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="commerce-variant-grid">
                      {item.availableEggTypes.length > 1 && (
                        <label className="block">
                          <span className="commerce-field-label">
                            Cake Type
                          </span>
                          <select
                            value={item.selectedEggType}
                            onChange={(event) =>
                              dispatch(
                                updateCartItemOptions({
                                  id: item.id,
                                  selectedEggType: event.target.value,
                                }),
                              )
                            }
                            className="commerce-input"
                          >
                            <option value="">Select cake type</option>
                            {item.availableEggTypes.map((eggType) => (
                              <option key={eggType} value={eggType}>
                                {eggType === "egg" ? "Egg" : "Eggless"}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      {item.hasExplicitFlavors && (
                        <label className="block">
                          <span className="commerce-field-label">Flavor</span>
                          <select
                            value={item.selectedFlavor}
                            onChange={(event) =>
                              dispatch(
                                updateCartItemOptions({
                                  id: item.id,
                                  selectedFlavor: event.target.value,
                                }),
                              )
                            }
                            className="commerce-input"
                          >
                            {item.availableFlavors.map((flavor) => (
                              <option key={flavor.name} value={flavor.name}>
                                {flavor.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}

                      <label className="block">
                        <span className="commerce-field-label">
                          {item.portionTypeMeta.heading}
                        </span>
                        <select
                          value={item.selectedWeight}
                          onChange={(event) =>
                            dispatch(
                              updateCartItemOptions({
                                id: item.id,
                                selectedWeight: event.target.value,
                              }),
                            )
                          }
                          className="commerce-input"
                        >
                          {item.availableWeights.map((weight) => (
                            <option key={weight.label} value={weight.label}>
                              {weight.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <div>
                        <span className="commerce-field-label">Quantity</span>
                        <div className="commerce-counter">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(
                                updateCartQuantity({
                                  id: item.id,
                                  quantity: item.quantity - 1,
                                }),
                              )
                            }
                            className="commerce-counter-button"
                          >
                            -
                          </button>
                          <span className="commerce-counter-value">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(
                                updateCartQuantity({
                                  id: item.id,
                                  quantity: item.quantity + 1,
                                }),
                              )
                            }
                            className="commerce-counter-button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="commerce-meta-row">
                      <div className="commerce-meta-chips">
                        {item.selectedEggType && (
                          <span className="commerce-chip commerce-chip--muted">
                            Type:{" "}
                            {item.selectedEggType === "egg" ? "Egg" : "Eggless"}
                          </span>
                        )}
                        <span className="commerce-chip commerce-chip--success">
                          Price: Rs.{item.unitPrice.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={`commerce-chip ${
                            item.canOrder
                              ? "commerce-chip--success"
                              : "commerce-chip--danger"
                          }`}
                        >
                          {item.canOrder ? "Ready for checkout" : "Unavailable"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          dispatch(removeFromCart(item.id));
                          dispatch(
                            showToast({
                              message: `${item.product.name} removed from cart.`,
                              type: "info",
                            }),
                          );
                        }}
                        className="commerce-remove-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="commerce-sidebar">
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
                    <div
                      key={addon._id}
                      className="flex items-center gap-2 rounded-xl border border-primary-100 bg-cream-100 p-2"
                    >
                      <img
                        src={addon.images?.[0] || addon.image}
                        alt={addon.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary-900">
                          {addon.name}
                        </p>
                        <p className="text-xs text-primary-600">
                          Rs.{Number(addon.price || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAddon(addon)}
                        className="rounded-lg border border-primary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
                      >
                        Add
                      </button>
                    </div>
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
                      <div
                        key={addon._id}
                        className="flex items-center gap-2 rounded-xl border border-primary-100 bg-cream-100 p-2"
                      >
                        <img
                          src={addon.images?.[0] || addon.image}
                          alt={addon.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-primary-900">
                            {addon.name}
                          </p>
                          <p className="text-xs text-primary-600">
                            Rs.
                            {Number(addon.price || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddAddon(addon)}
                          className="rounded-lg border border-primary-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="commerce-sidebar-list">
              <div className="commerce-sidebar-row">
                <span>Total items</span>
                <span className="font-semibold text-primary-800">
                  {totalItems}
                </span>
              </div>
              <div className="commerce-sidebar-row">
                <span>Product lines</span>
                <span className="font-semibold text-primary-800">
                  {cartItems.length}
                </span>
              </div>
              <div className="commerce-sidebar-row">
                <span>Discount</span>
                <span className="font-semibold text-emerald-700">
                  -Rs.{pricing.discountAmount.toLocaleString("en-IN")}
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
                    : `Add ₹${remainingForFreeDelivery.toLocaleString("en-IN")} more for free delivery`}
                </span>
              </div>
              <div className="commerce-sidebar-total">
                <span className="commerce-sidebar-total-label">
                  Grand total
                </span>
                <span className="commerce-sidebar-total-value">
                  Rs.{pricing.totalAmount.toLocaleString("en-IN")}
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
                  <button
                    type="button"
                    onClick={() => {
                      /* value updates live via onChange */
                    }}
                    className="commerce-apply-button"
                  >
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
                  ✓ {pricing.appliedCoupon.code}:{" "}
                  {pricing.appliedCoupon.description}
                </div>
              ) : null}
            </div>

            {unavailableCount > 0 && (
              <div className="commerce-alert commerce-alert--danger">
                {unavailableCount} item{unavailableCount > 1 ? "s are" : " is"}{" "}
                not ready for checkout. Update or remove them first.
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
        </div>
      </div>
    </div>
  );
};

export default Cart;
