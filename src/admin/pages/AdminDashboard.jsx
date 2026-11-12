import React, { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import {
  FiBarChart2,
  FiBox,
  FiClock,
  FiCreditCard,
  FiGrid,
  FiImage,
  FiPackage,
  FiSettings,
  FiShoppingBag,
} from "react-icons/fi";
import WorkspaceShell from "@/shared/workspace/WorkspaceShell";
import { io } from "socket.io-client";
import AdminToast from "@/admin/components/ui/AdminToast";
import { fetchOrders } from "@/features/orders/orderSlice";
import { fetchProducts } from "@/features/products/productSlice";
import {
  fetchAlertStatus,
  fetchPaymentStatus,
  fetchSiteContent,
} from "@/features/site/siteThunks";
import { getSocketServerUrl } from "@/utils/socketUrl";

const SOCKET_URL = getSocketServerUrl();
const normalizeScope = (scope) =>
  String(scope || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
const SITE_REFRESH_SCOPES = new Set([
  "general",
  "settings",
  "delivery",
  "delivery-settings",
  "delivery-timing",
]);

const AdminAnalyticsPage = lazy(() => import("./AdminAnalyticsPage"));
const AdminDeliveryTimingPage = lazy(() => import("./AdminDeliveryTimingPage"));
const AdminGalleryPage = lazy(() => import("./AdminGalleryPage"));
const AdminInventoryPage = lazy(() => import("./AdminInventoryPage"));
const AdminOrdersPage = lazy(() => import("./AdminOrdersPage"));
const AdminOverviewPage = lazy(() => import("./AdminOverviewPage"));
const AdminProductsPage = lazy(() => import("./AdminProductsPage"));
const AdminSettingsPage = lazy(() => import("./AdminSettingsPage"));

const tabs = [
  { name: "Overview", href: "/admin/overview", icon: FiGrid },
  { name: "Orders", href: "/admin/orders", icon: FiShoppingBag },
  { name: "Products", href: "/admin/products", icon: FiPackage },
  { name: "Gallery", href: "/admin/gallery", icon: FiImage },
  { name: "Inventory", href: "/admin/inventory", icon: FiBox },
  { name: "Delivery Timing", href: "/admin/delivery-timing", icon: FiClock },
  { name: "Analytics", href: "/admin/analytics", icon: FiBarChart2 },
  { name: "Settings", href: "/admin/settings", icon: FiSettings },
];

const billingLink = { name: "Billing", href: "/billing", icon: FiCreditCard };

const AdminPageFallback = () => (
  <div className="rounded-2xl border border-[#ebe1cb] bg-white p-10 text-center text-sm font-medium text-[#6a4c16]">
    Loading admin page...
  </div>
);

const AdminDashboard = () => {
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

    const socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const refreshAdminData = (scope = "") => {
      const normalizedScope = normalizeScope(scope);

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

      if (!normalizedScope || SITE_REFRESH_SCOPES.has(normalizedScope)) {
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
    <WorkspaceShell section="Admin" tabs={tabs} switchTo={billingLink}>
      <AdminToast toast={toast} onClose={() => setToast(null)} />
      <Suspense fallback={<AdminPageFallback />}>
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />
          <Route
            path="overview"
            element={
              <AdminOverviewPage
                onToast={showToast}
                syncVersion={syncVersion}
              />
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
              <AdminProductsPage
                onToast={showToast}
                syncVersion={syncVersion}
              />
            }
          />
          <Route
            path="gallery"
            element={
              <AdminGalleryPage onToast={showToast} syncVersion={syncVersion} />
            }
          />
          <Route
            path="inventory"
            element={
              <AdminInventoryPage
                onToast={showToast}
                syncVersion={syncVersion}
              />
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
              <AdminSettingsPage
                onToast={showToast}
                syncVersion={syncVersion}
              />
            }
          />
        </Routes>
      </Suspense>
    </WorkspaceShell>
  );
};

export default AdminDashboard;
