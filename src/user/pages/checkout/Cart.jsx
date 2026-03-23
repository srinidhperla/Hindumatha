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
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "@/utils/orderPricing";
import { normalizeDeliverySettings } from "@/utils/deliverySettings";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import SeoMeta from "@/shared/seo/SeoMeta";
import CartItemCard from "./CartItemCard";
import CartSummarySidebar from "./CartSummarySidebar";

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

          <CartSummarySidebar
            availableAddons={availableAddons}
            inlineAddons={inlineAddons}
            remainingAddons={remainingAddons}
            showMoreAddons={showMoreAddons}
            setShowMoreAddons={setShowMoreAddons}
            handleAddAddon={handleAddAddon}
            totalItems={totalItems}
            cartItemsCount={cartItems.length}
            pricing={pricing}
            remainingForFreeDelivery={remainingForFreeDelivery}
            couponInput={couponInput}
            setCouponInput={setCouponInput}
            unavailableCount={unavailableCount}
            isAuthenticated={isAuthenticated}
            handleProceed={handleProceed}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;
