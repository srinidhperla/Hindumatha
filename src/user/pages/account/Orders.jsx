import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { cancelOrder, fetchMyOrders } from "@/features/orders/orderSlice";
import { showToast } from "@/features/uiSlice";
import { downloadInvoicePDF } from "@/services/invoiceService";
import OrderCard from "@/user/pages/account/OrderCard";
import SeoMeta from "@/shared/seo/SeoMeta";
import useUserOrderUpdates from "@/user/hooks/useUserOrderUpdates";

const Orders = () => {
  const dispatch = useDispatch();
  const { myOrders, loading, error } = useSelector((state) => state.orders);

  useUserOrderUpdates();

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleCancelOrder = async (orderId) => {
    const confirmed = window.confirm(
      "Cancel this order now? You can only do this before the bakery confirms it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await dispatch(cancelOrder(orderId)).unwrap();
      dispatch(
        showToast({
          message: response.message || "Order cancelled successfully.",
          type: "success",
        }),
      );
    } catch (cancelError) {
      dispatch(
        showToast({
          message: cancelError?.message || "Failed to cancel order.",
          type: "error",
        }),
      );
    }
  };

  const handleDownloadInvoice = (order) => {
    try {
      downloadInvoicePDF(order);
      dispatch(
        showToast({
          message: "Opening invoice for download...",
          type: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showToast({
          message: "Failed to generate invoice.",
          type: "error",
        }),
      );
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-12">
      <SeoMeta
        title="My Orders | Hindumatha's Cake World"
        description="View your order history, track live status, and download invoices for all your Hindumatha's Cake World purchases."
        path="/orders"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary-600">
            My Orders
          </p>
          <h1 className="mt-3 text-4xl font-black text-primary-900">
            Track your bakery orders
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-primary-700/70">
            Review previous orders, totals, delivery details, and current order
            status.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        ) : myOrders.length === 0 ? (
          <div className="rounded-[2rem] bg-white p-10 text-center shadow-warm">
            <h2 className="text-2xl font-black text-primary-900">
              No orders yet
            </h2>
            <p className="mt-3 text-primary-700/70">
              Once you place an order, it will appear here with live status
              updates.
            </p>
            <Link to="/menu" className="btn-primary mt-8">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {myOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                loading={loading}
                onCancelOrder={handleCancelOrder}
                onDownloadInvoice={handleDownloadInvoice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
