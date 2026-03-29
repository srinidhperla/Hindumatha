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
  haversineDistance,
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

const getDeliveryDistanceKm = (checkoutData, normalizedDeliverySettings) => {
  const addressLat = Number(checkoutData?.orderData?.deliveryAddress?.lat);
  const addressLng = Number(checkoutData?.orderData?.deliveryAddress?.lng);
  const storeLat = Number(normalizedDeliverySettings?.storeLocation?.lat);
  const storeLng = Number(normalizedDeliverySettings?.storeLocation?.lng);

  if (
    !Number.isFinite(addressLat) ||
    !Number.isFinite(addressLng) ||
    !Number.isFinite(storeLat) ||
    !Number.isFinite(storeLng)
  ) {
    return 0;
  }

  return haversineDistance(storeLat, storeLng, addressLat, addressLng);
};

const getFreeDeliveryProgress = (subtotal, normalizedDeliverySettings) => {
  const minAmount = Number(normalizedDeliverySettings?.freeDeliveryMinAmount) || 0;
  return {
    enabled: normalizedDeliverySettings?.freeDeliveryEnabled !== false,
    minAmount,
    remainingAmount: Math.max(0, minAmount - (Number(subtotal) || 0)),
  };
};

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
    () => getDeliveryDistanceKm(checkoutData, normalizedLiveDeliverySettings),
    [checkoutData, normalizedLiveDeliverySettings],
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

  return (
    <div className="commerce-page">
      <div className="commerce-shell max-w-5xl">
        <div className="commerce-header">
          <div>
            <p className="commerce-kicker">Final Review</p>
            <h1 className="commerce-title">Review order and place payment</h1>
            <p className="commerce-copy">
              Check items, apply coupon, verify bill details, and complete your
              order.
            </p>
          </div>
          <Link to="/order" className="btn-secondary">
            Back to details
          </Link>
        </div>

        <section className="commerce-section">
          <div className="commerce-section-body">
            <h2 className="commerce-section-title">Review cart items</h2>
            <p className="commerce-section-copy">
              Method: {checkoutData.orderData.paymentMethod.toUpperCase()} |
              Delivery: {deliverySummaryLabel}
            </p>

            <div className="commerce-summary-items">
              {checkoutData.orderData.items.map((item, index) => (
                <div
                  key={`${item.product}-${index}`}
                  className="commerce-summary-item"
                >
                  <div className="commerce-summary-top">
                    <div>
                      <p className="commerce-summary-name">Item {index + 1}</p>
                      <div className="commerce-meta-chips mt-2">
                        <span className="commerce-chip commerce-chip--muted">
                          {`Option: ${item.size}`}
                        </span>
                        {item.eggType && (
                          <span className="commerce-chip commerce-chip--muted">
                            {`Cake Type: ${item.eggType === "egg" ? "Egg" : "Eggless"}`}
                          </span>
                        )}
                        {item.flavor && (
                          <span className="commerce-chip commerce-chip--muted">
                            {`Flavor: ${item.flavor}`}
                          </span>
                        )}
                        <span className="commerce-chip commerce-chip--muted">
                          {`Qty: ${item.quantity}`}
                        </span>
                        <span className="commerce-chip commerce-chip--success">
                          {`Price: ${formatINR(getSafePaymentUnitPrice(item))}`}
                        </span>
                      </div>
                    </div>
                    <p className="commerce-summary-price">
                      {formatINR(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="commerce-note mt-6">
              Contact: {checkoutData.customer?.name} |{" "}
              {checkoutData.customer?.phone}
            </div>
            <div className="commerce-note mt-4">
              Delivery to: {checkoutData.orderData.deliveryAddress.street},{" "}
              {checkoutData.orderData.deliveryAddress.city},{" "}
              {checkoutData.orderData.deliveryAddress.zipCode}
            </div>

            <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
                Coupon
              </p>
              {appliedCoupon ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
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
                    className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(event) => {
                      setCouponInput(event.target.value.toUpperCase());
                      setCouponFeedback("");
                    }}
                    placeholder="Enter coupon code"
                    className="commerce-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="commerce-apply-button"
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

            <PaymentSummaryPanel
              pricing={checkoutData.pricing}
              freeDeliveryProgress={checkoutData.freeDeliveryProgress}
              itemCount={checkoutData.orderData.items?.length || 0}
              totalUnits={(checkoutData.orderData.items || []).reduce(
                (sum, item) => sum + Number(item.quantity || 0),
                0,
              )}
              embedded
            />

            {(error || loading) && (
              <div
                className={`commerce-alert ${error ? "commerce-alert--danger" : "commerce-alert--warning"}`}
              >
                {error || "Preparing secure payment..."}
              </div>
            )}

            <div className="commerce-actions">
              <button
                type="button"
                onClick={handlePayNow}
                disabled={loading || isLaunching}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading || isLaunching
                  ? "Opening Payment..."
                  : checkoutData.orderData.paymentMethod === "cash"
                    ? "Place Cash On Delivery Order"
                    : `Pay ${formatINR(checkoutData.pricing.totalAmount)}`}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Payment;
