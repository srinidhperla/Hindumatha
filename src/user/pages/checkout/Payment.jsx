import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearCart } from "@/features/cart/cartSlice";
import {
  createOrder,
  clearError,
  clearPaymentOrder,
  createPaymentOrder,
  verifyPaymentAndCreateOrder,
} from "@/features/orders/orderSlice";
import { showToast } from "@/features/uiSlice";
import PaymentSummaryPanel from "./PaymentSummaryPanel";
import { formatINR } from "@/utils/currency";
import {
  calculateOrderPricing,
  DEFAULT_COUPONS,
  normalizeCouponCode,
} from "@/utils/orderPricing";
import {
  normalizeDeliverySettings,
} from "@/utils/deliverySettings";
import {
  CHECKOUT_STORAGE_KEY,
  getDeliverySummaryLabel,
  getPendingCheckout,
  getSafePaymentUnitPrice,
  loadRazorpayScript,
  scrollToPageTop,
} from "./paymentHelpers";
import { OptimizedImage } from "@/shared/ui";

const resolveCouponPreviewPricing = ({
  couponCode,
  coupons,
  subtotal,
  deliveryDistanceKm,
  deliverySettings,
}) => {
  const normalizedSubtotal = Number(subtotal) || 0;
  const normalizedCode = normalizeCouponCode(couponCode);
  const sourceCoupons = Array.isArray(coupons) ? coupons : DEFAULT_COUPONS;
  const pricing = calculateOrderPricing({
    subtotal: normalizedSubtotal,
    couponCode: normalizedCode,
    coupons: sourceCoupons,
    deliveryDistanceKm,
    deliverySettings,
  });

  if (!normalizedCode) {
    return {
      pricing,
      feedback: "Coupon removed.",
    };
  }

  const coupon = sourceCoupons.find(
    (entry) => normalizeCouponCode(entry?.code || "") === normalizedCode,
  );

  if (!coupon) {
    return {
      pricing,
      feedback: "Invalid coupon code. Please try another one.",
    };
  }

  if (coupon.minSubtotal && normalizedSubtotal < Number(coupon.minSubtotal)) {
    return {
      pricing,
      feedback: `Add ${formatINR(Number(coupon.minSubtotal) - normalizedSubtotal)} more to use ${normalizedCode}.`,
    };
  }

  return {
    pricing,
    feedback: `Coupon ${normalizedCode} applied. You saved ${formatINR(pricing.discountAmount)}.`,
  };
};

const hasPricingChanged = (currentPricing = {}, nextPricing = {}) =>
  Number(currentPricing?.subtotal || 0) !==
    Number(nextPricing?.subtotal || 0) ||
  Number(currentPricing?.deliveryFee || 0) !==
    Number(nextPricing?.deliveryFee || 0) ||
  Number(currentPricing?.discountAmount || 0) !==
    Number(nextPricing?.discountAmount || 0) ||
  Number(currentPricing?.totalAmount || 0) !==
    Number(nextPricing?.totalAmount || 0) ||
  String(currentPricing?.couponError || "") !==
    String(nextPricing?.couponError || "") ||
  normalizeCouponCode(currentPricing?.appliedCoupon?.code || "") !==
    normalizeCouponCode(nextPricing?.appliedCoupon?.code || "");

const hasFreeDeliveryProgressChanged = (currentValue = {}, nextValue = {}) =>
  Boolean(currentValue?.enabled) !== Boolean(nextValue?.enabled) ||
  Number(currentValue?.minAmount || 0) !== Number(nextValue?.minAmount || 0) ||
  Number(currentValue?.remainingAmount || 0) !==
    Number(nextValue?.remainingAmount || 0);

const getDeliveryDistanceKm = (checkoutData) => {
  const persistedDistanceKm = Number(
    checkoutData?.orderData?.deliveryDistanceKm ??
      checkoutData?.checkoutForm?.deliveryDistanceKm,
  );

  if (Number.isFinite(persistedDistanceKm) && persistedDistanceKm >= 0) {
    return persistedDistanceKm;
  }

  return 0;
};

const getFreeDeliveryProgress = (subtotal, normalizedDeliverySettings) => {
  const minAmount = Number(normalizedDeliverySettings?.freeDeliveryMinAmount) || 0;
  return {
    enabled: normalizedDeliverySettings?.freeDeliveryEnabled !== false,
    minAmount,
    remainingAmount: Math.max(0, minAmount - (Number(subtotal) || 0)),
  };
};

const CakePlaceholderIcon = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className={className}
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 10V8a5 5 0 1 1 10 0v2"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 14h.01M12 14h.01M16 14h.01"
    />
  </svg>
);

const getPaymentItemName = (item, index) =>
  String(item?.productName || item?.name || "").trim() || `Item ${index + 1}`;

const getPaymentItemImage = (item) =>
  String(item?.productImage || item?.image || "").trim();

const Payment = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);
  const siteCoupons = useSelector((state) => state.site.coupons);
  const siteDeliverySettings = useSelector((state) => state.site.deliverySettings);
  const liveAvailableCoupons = useMemo(
    () =>
      (Array.isArray(siteCoupons) ? siteCoupons : DEFAULT_COUPONS).filter(
        (coupon) => coupon?.isActive !== false,
      ),
    [siteCoupons],
  );
  const normalizedLiveDeliverySettings = useMemo(
    () => normalizeDeliverySettings(siteDeliverySettings),
    [siteDeliverySettings],
  );
  const [checkoutData, setCheckoutData] = useState(() =>
    getPendingCheckout(location.state),
  );
  const [basePricingSnapshot, setBasePricingSnapshot] = useState(
    () =>
      getPendingCheckout(location.state)?.pricing || {
        subtotal: 0,
        deliveryFee: 0,
        discountAmount: 0,
        totalAmount: 0,
        appliedCoupon: null,
        couponError: "",
      },
  );
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState("");
  const [isLaunching, setIsLaunching] = useState(false);
  const checkoutSubtotal = Number(
    basePricingSnapshot?.subtotal || checkoutData?.pricing?.subtotal || 0,
  );
  const deliveryDistanceKm = useMemo(
    () => getDeliveryDistanceKm(checkoutData),
    [checkoutData],
  );

  const deliverySummaryLabel = getDeliverySummaryLabel(checkoutData?.orderData);
  const appliedCoupon = checkoutData?.pricing?.appliedCoupon || null;

  useEffect(() => {
    scrollToPageTop();
    if (!checkoutData) {
      navigate("/order", { replace: true });
    }
  }, [checkoutData, navigate]);

  useEffect(() => {
    dispatch(clearError());
    return () => {
      dispatch(clearError());
      dispatch(clearPaymentOrder());
    };
  }, [dispatch]);

  useEffect(() => {
    setCouponInput(
      normalizeCouponCode(checkoutData?.orderData?.couponCode || ""),
    );
  }, [checkoutData?.orderData?.couponCode]);

  useEffect(() => {
    if (!checkoutData?.pricing) {
      return;
    }

    // Keep the first pricing snapshot as baseline before local coupon previews.
    if (!basePricingSnapshot?.subtotal && !basePricingSnapshot?.totalAmount) {
      setBasePricingSnapshot(checkoutData.pricing);
    }
  }, [basePricingSnapshot, checkoutData?.pricing]);

  useEffect(() => {
    if (!checkoutData) {
      return;
    }

    try {
      sessionStorage.setItem(
        CHECKOUT_STORAGE_KEY,
        JSON.stringify(checkoutData),
      );
    } catch {
      // Ignore session storage sync failures and keep checkout usable.
    }
  }, [checkoutData]);

  useEffect(() => {
    setCheckoutData((currentCheckoutData) => {
      if (!currentCheckoutData) {
        return currentCheckoutData;
      }

      const currentCouponCode = normalizeCouponCode(
        currentCheckoutData?.orderData?.couponCode || "",
      );
      const nextPricing = resolveCouponPreviewPricing({
        couponCode: currentCouponCode,
        coupons: liveAvailableCoupons,
        subtotal: checkoutSubtotal,
        deliveryDistanceKm,
        deliverySettings: normalizedLiveDeliverySettings,
      }).pricing;
      const nextFreeDeliveryProgress = getFreeDeliveryProgress(
        checkoutSubtotal,
        normalizedLiveDeliverySettings,
      );

      const pricingChanged = hasPricingChanged(
        currentCheckoutData.pricing,
        nextPricing,
      );
      const couponsChanged =
        currentCheckoutData.availableCoupons !== liveAvailableCoupons;
      const freeDeliveryProgressChanged = hasFreeDeliveryProgressChanged(
        currentCheckoutData.freeDeliveryProgress,
        nextFreeDeliveryProgress,
      );

      if (!pricingChanged && !couponsChanged && !freeDeliveryProgressChanged) {
        return currentCheckoutData;
      }

      return {
        ...currentCheckoutData,
        availableCoupons: liveAvailableCoupons,
        pricing: pricingChanged ? nextPricing : currentCheckoutData.pricing,
        freeDeliveryProgress: freeDeliveryProgressChanged
          ? nextFreeDeliveryProgress
          : currentCheckoutData.freeDeliveryProgress,
      };
    });
  }, [
    checkoutSubtotal,
    deliveryDistanceKm,
    liveAvailableCoupons,
    normalizedLiveDeliverySettings,
  ]);

  const applyCoupon = () => {
    const normalized = normalizeCouponCode(couponInput);

    if (
      appliedCoupon &&
      normalized &&
      normalized !== normalizeCouponCode(appliedCoupon.code || "")
    ) {
      setCouponFeedback("Remove the applied coupon to use a different one.");
      return;
    }

    const { pricing: nextPricing, feedback } = resolveCouponPreviewPricing({
      couponCode: normalized,
      coupons: liveAvailableCoupons,
      subtotal: checkoutSubtotal,
      deliveryDistanceKm,
      deliverySettings: normalizedLiveDeliverySettings,
    });

    setCheckoutData((prev) => ({
      ...prev,
      pricing: nextPricing,
      orderData: {
        ...(prev?.orderData || {}),
        couponCode: normalized,
      },
      checkoutForm: {
        ...(prev?.checkoutForm || {}),
        formData: {
          ...(prev?.checkoutForm?.formData || {}),
          couponCode: normalized,
        },
      },
    }));
    setCouponFeedback(feedback);
  };

  const removeCoupon = () => {
    const { pricing: nextPricing, feedback } = resolveCouponPreviewPricing({
      couponCode: "",
      coupons: liveAvailableCoupons,
      subtotal: checkoutSubtotal,
      deliveryDistanceKm,
      deliverySettings: normalizedLiveDeliverySettings,
    });

    setCheckoutData((prev) => ({
      ...prev,
      pricing: nextPricing,
      orderData: {
        ...(prev?.orderData || {}),
        couponCode: "",
      },
      checkoutForm: {
        ...(prev?.checkoutForm || {}),
        formData: {
          ...(prev?.checkoutForm?.formData || {}),
          couponCode: "",
        },
      },
    }));
    setCouponInput("");
    setCouponFeedback(feedback);
  };

  const handlePayNow = async () => {
    if (!checkoutData?.orderData) {
      return;
    }

    if (checkoutData.orderData.paymentMethod === "cash") {
      try {
        const placedOrder = await dispatch(
          createOrder(checkoutData.orderData),
        ).unwrap();

        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
        dispatch(clearCart());
        dispatch(
          showToast({
            message: "Order placed successfully.",
            type: "success",
          }),
        );
        navigate(`/order-confirmed/${placedOrder?._id}`, {
          replace: true,
        });
      } catch (paymentError) {
        dispatch(
          showToast({
            message:
              paymentError?.message ||
              paymentError?.error ||
              "Could not place order.",
            type: "error",
          }),
        );
      }
      return;
    }

    setIsLaunching(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load the payment window");
      }

      const paymentOrder = await dispatch(
        createPaymentOrder(checkoutData.orderData),
      ).unwrap();

      const razorpayInstance = new window.Razorpay({
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Hindumatha Bakery",
        description: `${checkoutData.orderData.paymentMethod.toUpperCase()} payment for bakery order`,
        order_id: paymentOrder.gatewayOrderId,
        prefill: {
          name: checkoutData.customer?.name || user?.name || "",
          email: checkoutData.customer?.email || user?.email || "",
          contact: checkoutData.customer?.phone || user?.phone || "",
        },
        notes: {
          deliveryMode: checkoutData.orderData.deliveryMode || "now",
          deliveryDateTime: checkoutData.orderData.deliveryDateTime || "",
        },
        theme: {
          color: "#db2777",
        },
        handler: async (response) => {
          const placedOrder = await dispatch(
            verifyPaymentAndCreateOrder({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderData: checkoutData.orderData,
            }),
          ).unwrap();

          sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
          dispatch(clearCart());
          dispatch(
            showToast({
              message: "Payment successful and order placed.",
              type: "success",
            }),
          );
          navigate(`/order-confirmed/${placedOrder?._id}`, {
            replace: true,
          });
        },
        modal: {
          ondismiss: () => {
            setIsLaunching(false);
          },
        },
      });

      razorpayInstance.open();
    } catch (paymentError) {
      dispatch(
        showToast({
          message:
            paymentError?.message ||
            paymentError?.error ||
            "Payment could not be started.",
          type: "error",
        }),
      );
    } finally {
      setIsLaunching(false);
    }
  };

  if (!checkoutData) {
    return null;
  }

  const payLabel =
    loading || isLaunching
      ? "Opening Payment..."
      : checkoutData.orderData.paymentMethod === "cash"
        ? "Place COD Order"
        : `Pay ${formatINR(checkoutData.pricing.totalAmount)}`;

  const couponSection = (
    <div className="checkout-coupon">
      <p className="text-xs font-bold uppercase tracking-wide text-caramel-800">
        Coupon
      </p>
      {appliedCoupon ? (
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-800">
              Applied {appliedCoupon.code}
            </p>
            {appliedCoupon.description && (
              <p className="text-xs text-emerald-700">
                {appliedCoupon.description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            className="shrink-0 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-2.5 flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(event) => {
              setCouponInput(event.target.value.toUpperCase());
              setCouponFeedback("");
            }}
            placeholder="Enter coupon code"
            className="checkout-coupon-input"
          />
          <button
            type="button"
            onClick={applyCoupon}
            className="checkout-coupon-apply"
          >
            Apply
          </button>
        </div>
      )}
      {couponFeedback && (
        <p className="mt-2 text-xs font-medium text-primary-700">
          {couponFeedback}
        </p>
      )}
      {checkoutData?.pricing?.couponError && (
        <p className="mt-2 text-xs font-semibold text-red-700">
          {checkoutData.pricing.couponError}
        </p>
      )}
    </div>
  );

  return (
    <div className="cart-page checkout-compact">
      <div className="cart-shell">
        <header className="checkout-head">
          <div className="min-w-0">
            <h1 className="cart-head-title">Final Review</h1>
            <p className="cart-head-sub">
              {checkoutData.orderData.paymentMethod.toUpperCase()} ·{" "}
              {deliverySummaryLabel}
            </p>
          </div>
          <Link to="/order" className="checkout-back">
            Back
          </Link>
        </header>

        <div className="cart-layout">
          <div className="cart-main">
            <section className="cart-panel">
              <div className="cart-panel-head">
                <p className="cart-panel-title">
                  Items ({checkoutData.orderData.items.length})
                </p>
              </div>

              {checkoutData.orderData.items.map((item, index) => {
                const meta = [
                  item.size,
                  item.cakeType || item.eggType
                    ? (item.cakeType || item.eggType) === "egg"
                      ? "Egg"
                      : "Eggless"
                    : "",
                  item.flavor,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={`${item.product}-${index}`}
                    className="checkout-review-row"
                  >
                    <div className="checkout-review-thumb">
                      {getPaymentItemImage(item) ? (
                        <OptimizedImage
                          src={getPaymentItemImage(item)}
                          alt={getPaymentItemName(item, index)}
                          width={128}
                          height={128}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <CakePlaceholderIcon className="h-6 w-6 text-primary-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="checkout-review-name">
                        {getPaymentItemName(item, index)}
                      </p>
                      {meta ? <p className="checkout-review-meta">{meta}</p> : null}
                      <p className="checkout-review-qty">
                        Qty {item.quantity} ×{" "}
                        {formatINR(getSafePaymentUnitPrice(item))}
                      </p>
                    </div>

                    <p className="checkout-review-price">
                      {formatINR(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      )}
                    </p>
                  </div>
                );
              })}
            </section>

            <section className="cart-panel p-3.5 sm:p-5">
              <p className="cart-panel-title mb-2">Delivery to</p>
              <p className="text-sm font-semibold text-primary-900">
                {checkoutData.customer?.name} · {checkoutData.customer?.phone}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-primary-600">
                {checkoutData.orderData.deliveryAddress.street},{" "}
                {checkoutData.orderData.deliveryAddress.city},{" "}
                {checkoutData.orderData.deliveryAddress.zipCode}
              </p>
            </section>

            <section className="cart-panel p-3.5 sm:p-5">{couponSection}</section>
          </div>

          <aside className="cart-aside space-y-3">
            <div className="cart-panel p-3.5 sm:p-5">
              <PaymentSummaryPanel
                pricing={checkoutData.pricing}
                freeDeliveryProgress={checkoutData.freeDeliveryProgress}
                itemCount={checkoutData.orderData.items?.length || 0}
                totalUnits={(checkoutData.orderData.items || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 0),
                  0,
                )}
                paymentMethod={checkoutData.orderData.paymentMethod}
                embedded
              />

              {(error || loading) && (
                <div
                  className={`commerce-alert ${error ? "commerce-alert--danger" : "commerce-alert--warning"}`}
                >
                  {error || "Preparing secure payment..."}
                </div>
              )}

              {/* Desktop keeps the action inline; phones use the sticky bar. */}
              <button
                type="button"
                onClick={handlePayNow}
                disabled={loading || isLaunching}
                className="cart-cta mt-4 hidden w-full lg:block"
              >
                {payLabel}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="cart-paybar">
        <div className="cart-paybar-inner">
          <div className="shrink-0 leading-tight">
            <p className="text-[11px] font-medium text-primary-500">
              Bill total
            </p>
            <p className="text-lg font-black text-primary-900">
              {formatINR(checkoutData.pricing.totalAmount)}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePayNow}
            disabled={loading || isLaunching}
            className="cart-cta"
          >
            {payLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
