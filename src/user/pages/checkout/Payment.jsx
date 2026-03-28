import React, { useEffect, useState } from "react";
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
import { DEFAULT_COUPONS, normalizeCouponCode } from "@/utils/orderPricing";
import {
  CHECKOUT_STORAGE_KEY,
  getDeliverySummaryLabel,
  getPendingCheckout,
  getSafePaymentUnitPrice,
  loadRazorpayScript,
  scrollToPageTop,
} from "./paymentHelpers";

const resolveCouponPreviewPricing = ({ couponCode, coupons, basePricing }) => {
  const subtotal = Number(basePricing?.subtotal || 0);
  const baseDeliveryFee = Number(basePricing?.deliveryFee || 0);
  const normalizedCode = normalizeCouponCode(couponCode);
  const sourceCoupons =
    Array.isArray(coupons) && coupons.length ? coupons : DEFAULT_COUPONS;

  if (!normalizedCode) {
    return {
      pricing: {
        subtotal,
        deliveryFee: baseDeliveryFee,
        discountAmount: 0,
        totalAmount: subtotal + baseDeliveryFee,
        appliedCoupon: null,
        couponError: "",
      },
      feedback: "Coupon removed.",
    };
  }

  const coupon = sourceCoupons.find(
    (entry) => normalizeCouponCode(entry?.code || "") === normalizedCode,
  );

  if (!coupon) {
    return {
      pricing: {
        subtotal,
        deliveryFee: baseDeliveryFee,
        discountAmount: 0,
        totalAmount: subtotal + baseDeliveryFee,
        appliedCoupon: null,
        couponError: "Invalid coupon code",
      },
      feedback: "Invalid coupon code. Please try another one.",
    };
  }

  if (coupon.minSubtotal && subtotal < Number(coupon.minSubtotal)) {
    return {
      pricing: {
        subtotal,
        deliveryFee: baseDeliveryFee,
        discountAmount: 0,
        totalAmount: subtotal + baseDeliveryFee,
        appliedCoupon: null,
        couponError: `Coupon requires a minimum subtotal of Rs.${coupon.minSubtotal}`,
      },
      feedback: `Add ${formatINR(Number(coupon.minSubtotal) - subtotal)} more to use ${normalizedCode}.`,
    };
  }

  let discountAmount = 0;
  let deliveryFee = baseDeliveryFee;

  if (coupon.type === "percent") {
    const rawDiscount = Math.round(
      (subtotal * Number(coupon.value || 0)) / 100,
    );
    discountAmount = coupon.maxDiscount
      ? Math.min(rawDiscount, Number(coupon.maxDiscount || 0))
      : rawDiscount;
  } else if (coupon.type === "flat") {
    discountAmount = Math.min(Number(coupon.value || 0), subtotal);
  } else if (coupon.type === "delivery") {
    discountAmount = baseDeliveryFee;
    deliveryFee = 0;
  }

  const totalAmount = Math.max(
    0,
    subtotal - (coupon.type === "delivery" ? 0 : discountAmount) + deliveryFee,
  );

  return {
    pricing: {
      subtotal,
      deliveryFee,
      discountAmount,
      totalAmount,
      appliedCoupon: coupon,
      couponError: "",
    },
    feedback: `Coupon ${normalizedCode} applied. You saved ${formatINR(discountAmount)}.`,
  };
};

const Payment = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);
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

  const deliverySummaryLabel = getDeliverySummaryLabel(checkoutData?.orderData);

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

  const applyCoupon = () => {
    const normalized = normalizeCouponCode(couponInput);
    const { pricing: nextPricing, feedback } = resolveCouponPreviewPricing({
      couponCode: normalized,
      coupons: checkoutData?.availableCoupons,
      basePricing: basePricingSnapshot,
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
