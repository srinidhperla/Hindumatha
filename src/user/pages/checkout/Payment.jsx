import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearCart } from "../../../features/cart/cartSlice";
import {
  clearPaymentOrder,
  createPaymentOrder,
  verifyPaymentAndCreateOrder,
} from "../../../features/orders/orderSlice";
import { showToast } from "../../../features/uiSlice";

const CHECKOUT_STORAGE_KEY = "bakeryPendingCheckout";
const scrollToPageTop = () => {
  window.scrollTo({ top: 0, behavior: "auto" });
};

const loadRazorpayScript = () => {
  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const getPendingCheckout = (locationState) => {
  if (locationState?.orderData) {
    return locationState;
  }

  try {
    const rawValue = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
};

const getSafePaymentUnitPrice = (item) =>
  Number(
    item.price ??
      item.unitPrice ??
      (Number(item.quantity || 0) > 0
        ? Number(item.lineTotal || 0) / Number(item.quantity || 1)
        : 0),
  );

const Payment = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.orders);
  const [checkoutData, setCheckoutData] = useState(() =>
    getPendingCheckout(location.state),
  );
  const [isLaunching, setIsLaunching] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const deliveryDateTimeValue = checkoutData?.orderData?.deliveryDateTime
    ? new Date(checkoutData.orderData.deliveryDateTime)
    : null;
  const hasValidDeliveryDateTime =
    deliveryDateTimeValue instanceof Date &&
    !Number.isNaN(deliveryDateTimeValue.getTime());
  const deliverySummaryLabel =
    checkoutData?.orderData?.deliveryMode === "scheduled" &&
    hasValidDeliveryDateTime
      ? `${deliveryDateTimeValue.toLocaleDateString("en-IN")} | ${deliveryDateTimeValue.toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          },
        )}`
      : "ASAP";

  useEffect(() => {
    scrollToPageTop();
    if (!checkoutData) {
      navigate("/order", { replace: true });
    }
  }, [checkoutData, navigate]);

  useEffect(() => {
    if (isPaid) {
      scrollToPageTop();
    }
  }, [isPaid]);

  useEffect(() => {
    return () => {
      dispatch(clearPaymentOrder());
    };
  }, [dispatch]);

  const handlePayNow = async () => {
    if (!checkoutData?.orderData) {
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
          await dispatch(
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
          setIsPaid(true);
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

  if (isPaid) {
    return (
      <div className="commerce-page--success flex items-center justify-center">
        <div className="commerce-success-card">
          <div className="commerce-success-icon">
            <svg
              className="h-10 w-10 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-black text-primary-800">
            Payment completed
          </h1>
          <p className="mt-3 text-primary-600">
            Your order is confirmed and the bakery has received it.
          </p>
          <div className="commerce-success-box">
            <p className="commerce-price-kicker">Paid total</p>
            <p className="mt-2 text-3xl font-black text-primary-300">
              Rs.{checkoutData.pricing.totalAmount.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="btn-primary w-full"
            >
              View My Orders
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="btn-secondary w-full"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <div className="commerce-shell max-w-4xl">
        <div className="commerce-header">
          <div>
            <p className="commerce-kicker">Online Payment</p>
            <h1 className="commerce-title">Pay securely and confirm order</h1>
            <p className="commerce-copy">
              This page opens Razorpay for real UPI and card payments. The order
              is created only after payment verification succeeds.
            </p>
          </div>
          <Link to="/order" className="btn-secondary">
            Back to checkout
          </Link>
        </div>

        <div className="commerce-grid">
          <section className="commerce-section">
            <div className="commerce-section-body">
              <h2 className="commerce-section-title">Payment details</h2>
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
                        <p className="commerce-summary-name">
                          Item {index + 1}
                        </p>
                        <div className="commerce-meta-chips mt-2">
                          <span className="commerce-chip commerce-chip--muted">
                            {`Option: ${item.size}`}
                          </span>
                          {item.eggType && (
                            <span className="commerce-chip commerce-chip--muted">
                              {`Type: ${item.eggType === "egg" ? "Egg" : "Eggless"}`}
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
                            {`Price: Rs.${getSafePaymentUnitPrice(item).toLocaleString("en-IN")}`}
                          </span>
                        </div>
                      </div>
                      <p className="commerce-summary-price">
                        Rs.
                        {(
                          Number(item.price || 0) * Number(item.quantity || 0)
                        ).toLocaleString("en-IN")}
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
                    : `Pay Rs.${checkoutData.pricing.totalAmount.toLocaleString("en-IN")}`}
                </button>
              </div>
            </div>
          </section>

          <aside className="commerce-sidebar">
            <p className="commerce-sidebar-kicker">Summary</p>
            <h2 className="commerce-sidebar-title">Amount to pay</h2>
            <div className="commerce-sidebar-list">
              <div className="commerce-sidebar-row">
                <span>Subtotal</span>
                <span className="font-semibold text-primary-800">
                  Rs.{checkoutData.pricing.subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="commerce-sidebar-row">
                <span>Delivery Fee</span>
                <span className="font-semibold text-primary-800">
                  Rs.{checkoutData.pricing.deliveryFee.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="commerce-sidebar-row">
                <span>Discount</span>
                <span className="font-semibold text-emerald-700">
                  -Rs.
                  {checkoutData.pricing.discountAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="commerce-sidebar-total">
                <span className="commerce-sidebar-total-label">Total</span>
                <span className="commerce-sidebar-total-value">
                  Rs.{checkoutData.pricing.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
            <div className="commerce-note">
              Use Razorpay test keys first. After that, switch to live keys in
              the backend environment.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Payment;
