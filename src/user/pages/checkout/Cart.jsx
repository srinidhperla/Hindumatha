import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  clearCart,
  removeFromCart,
  updateCartItemOptions,
  updateCartQuantity,
} from "../../../features/cart/cartSlice";
import { updateProfile } from "../../../features/auth/authSlice";
import { showToast } from "../../../features/uiSlice";
import {
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "../../../utils/orderPricing";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getVariantPrice,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "../../../utils/productOptions";
import { normalizeUserSavedAddresses } from "../../components/order/orderHelpers";
import AddressPickerModal from "../../../components/address/AddressPickerModal";

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
  const { items } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const coupons = useSelector((state) => state.site.coupons);
  const [couponInput, setCouponInput] = React.useState(DEFAULT_COUPON_INPUT);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [pickerKey, setPickerKey] = useState(0);

  const savedAddresses = useMemo(
    () => normalizeUserSavedAddresses(user),
    [user],
  );
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // Auto-select default address on mount / user change
  useEffect(() => {
    if (!savedAddresses.length) {
      setSelectedAddressId("");
      return;
    }
    const defaultAddr =
      savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
    if (defaultAddr) setSelectedAddressId(defaultAddr.id);
  }, [savedAddresses]);

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
  const pricing = calculateOrderPricing({
    subtotal,
    couponCode: couponInput,
    coupons: availableCoupons,
  });

  const selectedAddress = savedAddresses.find(
    (a) => a.id === selectedAddressId,
  );

  const handleAddressPickerSave = async (addressData) => {
    const normalizedAddress = {
      label: addressData.label || "Home",
      street: addressData.street || "",
      city: addressData.city || "Vizianagaram",
      state: addressData.state || "Andhra Pradesh",
      zipCode: addressData.zipCode || "",
      phone: addressData.phone || "",
      landmark: addressData.landmark || "",
      placeId: addressData.placeId || "",
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      formattedAddress: addressData.formattedAddress || "",
      isDefault: true,
    };

    const existingPayload = savedAddresses.map((a) => ({
      label: a.label,
      street: a.street,
      city: a.city,
      state: a.state || "Andhra Pradesh",
      zipCode: a.zipCode,
      phone: a.phone,
      landmark: a.landmark || "",
      placeId: a.placeId || "",
      latitude: a.latitude,
      longitude: a.longitude,
      formattedAddress: a.formattedAddress || "",
      isDefault: false,
    }));

    let nextAddresses;
    if (editingAddress) {
      const editIdx = savedAddresses.findIndex(
        (a) => a.id === editingAddress.id,
      );
      nextAddresses = existingPayload.map((a, i) =>
        i === editIdx ? normalizedAddress : a,
      );
    } else {
      nextAddresses = [...existingPayload, normalizedAddress];
    }

    try {
      await dispatch(updateProfile({ savedAddresses: nextAddresses })).unwrap();
      dispatch(
        showToast({
          message: editingAddress ? "Address updated." : "Address added.",
          type: "success",
        }),
      );
    } catch (err) {
      dispatch(
        showToast({
          message: err?.message || "Failed to save address.",
          type: "error",
        }),
      );
    } finally {
      setShowAddressPicker(false);
      setEditingAddress(null);
    }
  };

  const handleProceed = () => {
    navigate(isAuthenticated ? "/order" : "/login", {
      state: {
        couponCode: normalizeCouponCode(couponInput),
        selectedAddressId: selectedAddressId || undefined,
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
              Update flavors, weights, and quantities here. When everything
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
                          <span className="commerce-field-label">Type</span>
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
                            <option value="">Select type</option>
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
                        <span className="commerce-field-label">Weight</span>
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
                        <span className="commerce-chip commerce-chip--muted">
                          Unit: Rs.{item.unitPrice.toLocaleString("en-IN")}
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
                        className="rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
            {/* Delivery Address Section */}
            {isAuthenticated && (
              <div className="mb-6 rounded-2xl border border-cream-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-primary-800">
                    Delivery address
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(null);
                      setPickerKey((k) => k + 1);
                      setShowAddressPicker(true);
                    }}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-800"
                  >
                    + Add new
                  </button>
                </div>

                {savedAddresses.length > 0 ? (
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? "border-primary-400 bg-primary-50"
                              : "border-cream-200 bg-cream-50 hover:border-primary-200"
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? "border-primary-600"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-primary-800">
                              {addr.label}
                              {addr.isDefault && (
                                <span className="ml-1.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-semibold text-sage-700">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-primary-600">
                              {[addr.street, addr.city, addr.zipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddress(addr);
                              setPickerKey((k) => k + 1);
                              setShowAddressPicker(true);
                            }}
                            className="flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-semibold text-primary-500 hover:bg-primary-100"
                          >
                            Edit
                          </button>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(null);
                      setPickerKey((k) => k + 1);
                      setShowAddressPicker(true);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50/50 p-3 text-left transition hover:border-primary-400"
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                      <svg
                        className="h-4 w-4 text-primary-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary-700">
                        Add delivery address
                      </p>
                      <p className="text-xs text-primary-500">
                        Tap to add your first address
                      </p>
                    </div>
                  </button>
                )}
              </div>
            )}

            <p className="commerce-sidebar-kicker">Summary</p>
            <h2 className="commerce-sidebar-title">Checkout preview</h2>

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
                <span>Delivery fee</span>
                <span className="font-semibold text-primary-800">
                  Rs.{pricing.deliveryFee.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="commerce-sidebar-row">
                <span>Discount</span>
                <span className="font-semibold text-emerald-700">
                  -Rs.{pricing.discountAmount.toLocaleString("en-IN")}
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
                    className="rounded-2xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
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
                <div className="commerce-alert commerce-alert--warning mt-0 border-emerald-200 bg-emerald-50 text-emerald-700">
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

      <AddressPickerModal
        key={pickerKey}
        isOpen={showAddressPicker}
        onClose={() => {
          setShowAddressPicker(false);
          setEditingAddress(null);
        }}
        onSave={handleAddressPickerSave}
        initialAddress={editingAddress}
      />
    </div>
  );
};

export default Cart;
