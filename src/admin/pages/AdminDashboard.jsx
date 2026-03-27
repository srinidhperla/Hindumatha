import React, { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import AdminToast from "@/admin/components/ui/AdminToast";
import { fetchOrders } from "@/features/orders/orderSlice";
import { fetchProducts } from "@/features/products/productSlice";
import {
  fetchAlertStatus,
  fetchPaymentStatus,
  fetchSiteContent,
} from "@/features/site/siteThunks";

const API_URL = import.meta.env.VITE_API_URL;

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
  <div className="rounded-2xl border border-[rgba(201,168,76,0.3)] bg-white/90 p-10 text-center text-sm font-medium text-[#6a4c16]">
    Loading admin page...
  </div>
);

const AdminDashboard = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [toast, setToast] = useState(null);
  const [syncVersion, setSyncVersion] = useState(0);
  const { token, user } = useSelector((state) => state.auth);

  const { loaded: productsLoaded } = useSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchSiteContent());
    dispatch(fetchAlertStatus());
    dispatch(fetchPaymentStatus());
    if (!productsLoaded) {
      dispatch(fetchProducts());
    }
  }, [dispatch, productsLoaded]);

  useEffect(() => {
    if (!token || user?.role !== "admin") {
      return undefined;
    }

    const socket = io(API_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const refreshAdminData = (scope = "") => {
      const normalizedScope = String(scope || "").toLowerCase();

      if (!normalizedScope || normalizedScope === "orders") {
        dispatch(fetchOrders());
      }

      if (
        !normalizedScope ||
        normalizedScope === "products" ||
        normalizedScope === "inventory"
      ) {
        dispatch(fetchProducts({ force: true }));
      }

      if (!normalizedScope || normalizedScope === "settings") {
        dispatch(fetchSiteContent());
        dispatch(fetchAlertStatus());
        dispatch(fetchPaymentStatus());
      }

      setSyncVersion((current) => current + 1);
    };

    const handleAdminSync = (event) => {
      refreshAdminData(event?.scope);
    };

    // Keep legacy order events in sync too.
    const handleOrderEvent = () => {
      refreshAdminData("orders");
    };

    socket.on("admin-data-updated", handleAdminSync);
    socket.on("order-created", handleOrderEvent);
    socket.on("order-status-updated", handleOrderEvent);

    return () => {
      socket.off("admin-data-updated", handleAdminSync);
      socket.off("order-created", handleOrderEvent);
      socket.off("order-status-updated", handleOrderEvent);
      socket.disconnect();
    };
  }, [dispatch, token, user?.role]);

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
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminToast toast={toast} onClose={() => setToast(null)} />

      <div className="mb-8 rounded-3xl border border-[rgba(201,168,76,0.3)] bg-[linear-gradient(155deg,rgba(18,12,2,.96),rgba(45,31,13,.94))] px-6 py-8 text-center shadow-[0_14px_30px_rgba(18,12,2,0.28)] sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#e8d08a]">
          Operations Center
        </p>
        <h1 className="font-playfair mt-2 text-3xl font-extrabold text-white sm:text-4xl">
          Admin Dashboard
        </h1>
      </div>

      <div className="rounded-2xl border border-[rgba(201,168,76,0.28)] bg-white/85 p-2 shadow-[0_10px_22px_rgba(18,12,2,0.1)] backdrop-blur-sm">
        <nav
          className="flex gap-2 overflow-x-auto no-scrollbar"
          aria-label="Tabs"
        >
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              to={tab.href}
              className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold admin-motion ${
                location.pathname === tab.href
                  ? "bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] text-white shadow-[0_8px_16px_rgba(122,92,15,0.26)]"
                  : "text-[#6a4c16] hover:bg-[#f8f0da]"
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
            <Route
              path="overview"
              element={
                <AdminOverviewPage onToast={showToast} syncVersion={syncVersion} />
              }
            />
            <Route
              path="orders"
              element={
                <AdminOrdersPage onToast={showToast} syncVersion={syncVersion} />
              }
            />
            <Route
              path="products"
              element={
                <AdminProductsPage onToast={showToast} syncVersion={syncVersion} />
              }
            />
            <Route
              path="inventory"
              element={
                <AdminInventoryPage onToast={showToast} syncVersion={syncVersion} />
              }
            />
            <Route
              path="delivery-timing"
              element={<AdminDeliveryTimingPage syncVersion={syncVersion} />}
            />
            <Route
              path="analytics"
              element={<AdminAnalyticsPage syncVersion={syncVersion} />}
            />
            <Route
              path="settings"
              element={
                <AdminSettingsPage onToast={showToast} syncVersion={syncVersion} />
              }
            />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
};

export default AdminDashboard;
