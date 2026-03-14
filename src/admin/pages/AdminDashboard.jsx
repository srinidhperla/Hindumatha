import React, { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminToast from "../components/ui/AdminToast";
import { fetchOrders } from "../../features/orders/orderSlice";
import { fetchProducts } from "../../features/products/productSlice";

const AdminAnalyticsPage = lazy(() => import("./AdminAnalyticsPage"));
const AdminDeliveryTimingPage = lazy(() => import("./AdminDeliveryTimingPage"));
const AdminInventoryPage = lazy(() => import("./AdminInventoryPage"));
const AdminOrdersPage = lazy(() => import("./AdminOrdersPage"));
const AdminOverviewPage = lazy(() => import("./AdminOverviewPage"));
const AdminProductsPage = lazy(() => import("./AdminProductsPage"));
const AdminSettingsPage = lazy(() => import("./AdminSettingsPage"));

const tabs = [
  { name: "Overview", href: "/admin/overview" },
  { name: "Orders", href: "/admin/orders" },
  { name: "Products", href: "/admin/products" },
  { name: "Inventory", href: "/admin/inventory" },
  { name: "Delivery Timing", href: "/admin/delivery-timing" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Settings", href: "/admin/settings" },
];

const AdminPageFallback = () => (
  <div className="rounded-2xl border border-cream-300 bg-white p-10 text-center text-sm font-medium text-primary-500">
    Loading admin page...
  </div>
);

const AdminDashboard = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);

  const { loaded: productsLoaded } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchOrders());
    if (!productsLoaded) {
      dispatch(fetchProducts());
    }
  }, [dispatch, productsLoaded]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <AdminToast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-12 text-center">
        <h1 className="text-3xl font-extrabold text-primary-800 sm:text-4xl">
          Admin Dashboard
        </h1>
      </div>

      <div className="border-b border-cream-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.href}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
                location.pathname === tab.href
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-primary-400 hover:border-cream-400 hover:text-primary-600"
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <Suspense fallback={<AdminPageFallback />}>
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverviewPage />} />
            <Route
              path="orders"
              element={<AdminOrdersPage onToast={showToast} />}
            />
            <Route
              path="products"
              element={<AdminProductsPage onToast={showToast} />}
            />
            <Route
              path="inventory"
              element={<AdminInventoryPage onToast={showToast} />}
            />
            <Route
              path="delivery-timing"
              element={<AdminDeliveryTimingPage onToast={showToast} />}
            />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route
              path="settings"
              element={<AdminSettingsPage onToast={showToast} />}
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;
