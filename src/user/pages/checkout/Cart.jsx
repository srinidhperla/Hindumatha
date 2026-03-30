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
} from "@/features/cart/cartSlice";
import { fetchProducts } from "@/features/products/productSlice";
import { showToast } from "@/features/uiSlice";
import {
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import SeoMeta from "@/shared/seo/SeoMeta";
import { OptimizedImage } from "@/shared/ui";
import { formatINR } from "@/utils/currency";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";
import CartItemCard from "./CartItemCard";
import { CHECKOUT_STORAGE_KEY } from "./paymentHelpers";

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
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showMoreAddons, setShowMoreAddons] = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const cartItems = useMemo(
    () => items.map((item) => getResolvedCartItem(item)),
    [items],
  );

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const unavailableCount = cartItems.filter((item) => !item.canOrder).length;
  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
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
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "auto" });
    navigate(isAuthenticated ? "/order" : "/login", {
      state: {},
    });
  };

  if (!cartItems.length) {
    return (
      <>
        <SeoMeta
          title="Cart | Hindumatha's Cake World"
          description="Review your cake selections, apply coupons, and proceed to secure checkout at Hindumatha's Cake World."
          path="/cart"
        />
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
      </>
    );
  }

  return (
    <div className="commerce-page commerce-page--cart">
      <SeoMeta
        title="Cart | Hindumatha's Cake World"
        description="Review your cake selections, apply coupons, and proceed to secure checkout at Hindumatha's Cake World."
        path="/cart"
      />
      <div className="commerce-shell max-w-5xl">
        <div className="commerce-header">
          <div>
            <p className="commerce-kicker">Shopping Cart</p>
            <h1 className="commerce-title">Ready to checkout?</h1>
            <p className="commerce-copy max-w-2xl">
              Update items, add extras, apply coupon, and continue to delivery
              details.
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

        <section className="commerce-section">
          <div className="commerce-section-body space-y-8">
            <div className="rounded-3xl border border-primary-200 bg-primary-50/60 p-4 sm:p-5">
              <p className="text-sm font-semibold text-primary-900">
                Cart items ({totalItems})
              </p>
              <p className="mt-1 text-xs text-primary-600">
                Edit quantity, flavor, cake type, and size before checkout.
              </p>
              <div className="mt-4 commerce-list">
                {cartItems.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    dispatch={dispatch}
                    updateCartItemOptions={updateCartItemOptions}
                    updateCartQuantity={updateCartQuantity}
                    removeFromCart={removeFromCart}
                    showToast={showToast}
                  />
                ))}
              </div>
            </div>

            {availableAddons.length > 0 && (
              <div className="rounded-3xl border border-primary-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-500">
                      Quick Add-ons
                    </p>
                    <p className="mt-1 text-sm text-primary-700">
                      Add small extras in one tap.
                    </p>
                  </div>
                  {remainingAddons.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMoreAddons(true)}
                      className="rounded-xl border border-primary-300 bg-white px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-cream-100"
                    >
                      {`View more (${remainingAddons.length})`}
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {inlineAddons.map((addon) => (
                    <div
                      key={addon._id}
                      className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-3"
                    >
                      <OptimizedImage
                        src={addon.images?.[0] || addon.image}
                        alt={addon.name}
                        width={48}
                        height={48}
                        loading="lazy"
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-primary-900">
                          {addon.name}
                        </p>
                        <p className="text-xs text-primary-600">
                          {formatINR(addon.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddAddon(addon)}
                        className="rounded-xl border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
                      >
                        Add
                      </button>
                    </div>
                  ))}
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
                        className="flex items-center gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-3"
                      >
                        <OptimizedImage
                          src={addon.images?.[0] || addon.image}
                          alt={addon.name}
                          width={48}
                          height={48}
                          loading="lazy"
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-primary-900">
                            {addon.name}
                          </p>
                          <p className="text-xs text-primary-600">
                            {formatINR(addon.price)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddAddon(addon)}
                          className="rounded-xl border border-primary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-cream-100"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-primary-200 bg-white p-4 sm:p-5">
              <p className="text-sm font-semibold text-primary-900">
                Quick cart overview
              </p>
              <p className="mt-1 text-sm text-primary-600">
                {cartItems.length} product line{cartItems.length > 1 ? "s" : ""}{" "}
                · {totalItems} total unit{totalItems > 1 ? "s" : ""}
              </p>
              <p className="mt-3 text-xl font-black text-primary-800">
                Current subtotal: {formatINR(subtotal)}
              </p>
              <p className="mt-1 text-xs text-primary-600">
                Full bill, coupon apply, and final review are shown on the next
                page.
              </p>

              {unavailableCount > 0 && (
                <div className="commerce-alert commerce-alert--danger mt-4">
                  {unavailableCount} item
                  {unavailableCount > 1 ? "s are" : " is"} not ready for
                  checkout. Update or remove them first.
                </div>
              )}

              {!isAuthenticated && (
                <div className="commerce-alert commerce-alert--warning mt-4">
                  Sign in before placing the order.
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link to="/menu" className="btn-secondary w-full text-center">
                  Continue Shopping
                </Link>
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={unavailableCount > 0}
                  className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isAuthenticated
                    ? "Proceed to Checkout"
                    : "Login to Checkout"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Cart;
