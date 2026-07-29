import React, { useEffect, useMemo } from "react";
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
  const hasWeightOptions = getAvailableWeightOptions(item.product).length > 0;
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
    hasWeightOptions,
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
      (!hasWeightOptions || Boolean(selectedWeight)),
  };
};

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, priceSyncNoticeVisible, priceSyncUpdatedItemsCount } =
    useSelector((state) => state.cart);
  const { products } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);

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
        .slice(0, 8),
    [products],
  );

  const handleAddAddon = (product) => {
    const availableWeights = getAvailableWeightOptions(product, "", "");
    const availableFlavors = getAvailableFlavorOptions(product);
    const hasExplicitFlavorOptions = normalizeFlavorOptions(product).length > 0;

    dispatch(
      addToCart({
        product,
        quantity: 1,
        selectedFlavor: hasExplicitFlavorOptions
          ? availableFlavors[0]?.name || ""
          : "",
        selectedWeight: availableWeights[0]?.label || "",
        selectedEggType:
          product?.isEgg !== false && product?.isEggless !== true
            ? "egg"
            : product?.isEggless === true && product?.isEgg === false
              ? "eggless"
              : "",
      }),
    );
    dispatch(
      showToast({ message: `${product.name} added to cart.`, type: "success" }),
    );
  };

  const handleProceed = () => {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    window.scrollTo({ top: 0, behavior: "auto" });
    navigate(isAuthenticated ? "/order" : "/login", { state: {} });
  };

  const seo = (
    <SeoMeta
      title="Cart | Hindumatha's Cake World"
      description="Review your cake selections, apply coupons, and proceed to secure checkout at Hindumatha's Cake World."
      path="/cart"
    />
  );

  if (!cartItems.length) {
    return (
      <>
        {seo}
        <div className="commerce-page--empty">
          <div className="commerce-empty-shell">
            <div className="commerce-empty-card">
              <p className="commerce-kicker">Cart</p>
              <h1 className="mt-4 text-3xl font-black text-primary-800 sm:text-4xl">
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

  const checkoutBlocked = unavailableCount > 0;
  const ctaLabel = isAuthenticated ? "Proceed to Checkout" : "Login to Checkout";

  const billSummary = (
    <div className="cart-panel p-3.5 sm:p-5">
      <p className="cart-panel-title mb-2">Bill Summary</p>

      <div className="cart-bill-row">
        <span>
          Item total ({totalItems} item{totalItems > 1 ? "s" : ""})
        </span>
        <span className="font-semibold text-primary-900">
          {formatINR(subtotal)}
        </span>
      </div>
      <div className="cart-bill-row">
        <span>Delivery &amp; charges</span>
        <span className="text-primary-500">Calculated next</span>
      </div>

      <div className="cart-bill-total">
        <span>To pay</span>
        <span>{formatINR(subtotal)}</span>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-primary-500">
        Coupons, delivery charges and the final bill are applied on the next
        step.
      </p>

      {checkoutBlocked ? (
        <div className="cart-note mt-3 bg-berry-50 text-berry-700">
          {unavailableCount} item{unavailableCount > 1 ? "s are" : " is"} not
          ready for checkout. Fix or remove {unavailableCount > 1 ? "them" : "it"}{" "}
          to continue.
        </div>
      ) : null}

      {!isAuthenticated ? (
        <div className="cart-note mt-3 bg-caramel-50 text-caramel-800">
          Sign in before placing the order.
        </div>
      ) : null}

      <div className="mt-4 hidden gap-2 lg:grid">
        <button
          type="button"
          onClick={handleProceed}
          disabled={checkoutBlocked}
          className="cart-cta"
        >
          {ctaLabel}
        </button>
        <Link
          to="/menu"
          className="rounded-xl border border-primary-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-primary-700 transition hover:bg-cream-100"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );

  return (
    <div className="cart-page">
      {seo}

      <div className="cart-shell">
        <header className="cart-head">
          <div className="min-w-0">
            <h1 className="cart-head-title">Your Cart</h1>
            <p className="cart-head-sub">
              {totalItems} item{totalItems > 1 ? "s" : ""} · {cartItems.length}{" "}
              product{cartItems.length > 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(clearCart())}
            className="cart-clear"
          >
            Clear Cart
          </button>
        </header>

        {priceSyncNoticeVisible ? (
          <div className="mb-3 flex items-start justify-between gap-3 rounded-xl border border-caramel-200 bg-caramel-50 px-3.5 py-2.5">
            <p className="text-xs font-medium text-caramel-900 sm:text-sm">
              Prices were updated by admin, please review
              {priceSyncUpdatedItemsCount > 0
                ? ` (${priceSyncUpdatedItemsCount} item${priceSyncUpdatedItemsCount > 1 ? "s" : ""}).`
                : "."}
            </p>
            <button
              type="button"
              onClick={() => dispatch(dismissPriceSyncNotice())}
              className="shrink-0 text-xs font-bold text-caramel-800 underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="cart-layout">
          <div className="cart-main">
            <section className="cart-panel">
              <div className="cart-panel-head">
                <p className="cart-panel-title">
                  Items ({cartItems.length})
                </p>
                <Link
                  to="/menu"
                  className="text-xs font-semibold text-caramel-700 underline underline-offset-2 sm:text-sm"
                >
                  + Add more
                </Link>
              </div>

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
            </section>

            {availableAddons.length > 0 ? (
              <section className="cart-panel">
                <div className="cart-panel-head">
                  <div>
                    <p className="cart-panel-title">Add extras</p>
                    <p className="mt-0.5 text-xs text-primary-600">
                      Candles, cards and more in one tap
                    </p>
                  </div>
                </div>
                <div className="cart-addon-strip pt-3.5">
                  {availableAddons.map((addon) => (
                    <div key={addon._id} className="cart-addon-card">
                      <OptimizedImage
                        src={addon.images?.[0] || addon.image}
                        alt={addon.name}
                        width={160}
                        height={160}
                        loading="lazy"
                        className="cart-addon-img"
                      />
                      <p className="cart-addon-name">{addon.name}</p>
                      <p className="text-xs font-bold text-primary-900">
                        {formatINR(addon.price)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddAddon(addon)}
                        className="cart-addon-add"
                      >
                        ADD
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="cart-aside">{billSummary}</aside>
        </div>
      </div>

      <div className="cart-paybar">
        <div className="cart-paybar-inner">
          <div className="shrink-0 leading-tight">
            <p className="text-[11px] font-medium text-primary-500">To pay</p>
            <p className="text-lg font-black text-primary-900">
              {formatINR(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleProceed}
            disabled={checkoutBlocked}
            className="cart-cta"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
