import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import {
  FiBarChart2,
  FiFileText,
  FiGrid,
  FiPackage,
  FiPlusCircle,
  FiSettings,
  FiZap,
} from "react-icons/fi";
import WorkspaceShell from "@/shared/workspace/WorkspaceShell";
import AdminToast from "@/admin/components/ui/AdminToast";
import { BILLING_MANAGER_ROLES } from "@/billing/billingShared";

const BillingDashboardPage = lazy(() => import("./BillingDashboardPage"));
const BillingPosPage = lazy(() => import("./BillingPosPage"));
const BillingAutoPage = lazy(() => import("./BillingAutoPage"));
const BillingBillsPage = lazy(() => import("./BillingBillsPage"));
const BillingItemsPage = lazy(() => import("./BillingItemsPage"));
const BillingReportsPage = lazy(() => import("./BillingReportsPage"));

const tabs = [
  { name: "Dashboard", href: "/billing/dashboard", icon: FiGrid },
  { name: "New Bill", href: "/billing/new", icon: FiPlusCircle },
  {
    name: "Auto Billing",
    href: "/billing/auto",
    icon: FiZap,
    managerOnly: true,
  },
  { name: "Bills", href: "/billing/bills", icon: FiFileText },
  { name: "Items", href: "/billing/items", icon: FiPackage },
  { name: "Reports", href: "/billing/reports", icon: FiBarChart2 },
];

const adminLink = { name: "Admin", href: "/admin", icon: FiSettings };

const PageFallback = () => (
  <div className="rounded-2xl border border-[rgba(201,168,76,0.3)] bg-white/90 p-10 text-center text-sm font-medium text-[#6a4c16]">
    Loading billing page...
  </div>
);

const BillingLayout = () => {
  const { user } = useSelector((state) => state.auth);
  const canManage = BILLING_MANAGER_ROLES.includes(user?.role);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
  }, []);

  const visibleTabs = tabs.filter((tab) => canManage || !tab.managerOnly);
  const pageProps = { onToast: showToast, canManage };

  return (
    <WorkspaceShell
      section="Billing"
      tabs={visibleTabs}
      switchTo={user?.role === "admin" ? adminLink : null}
      actions={
        <Link
          to="/billing/new"
          className="rounded-xl bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-3.5 py-2 text-sm font-bold text-white admin-motion hover:brightness-110"
        >
          + New Bill
        </Link>
      }
    >
      <AdminToast toast={toast} onClose={() => setToast(null)} />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={<BillingDashboardPage {...pageProps} />}
          />
          <Route path="new" element={<BillingPosPage {...pageProps} />} />
          <Route
            path="auto"
            element={
              canManage ? (
                <BillingAutoPage {...pageProps} />
              ) : (
                <Navigate to="/billing/dashboard" replace />
              )
            }
          />
          <Route path="bills" element={<BillingBillsPage {...pageProps} />} />
          <Route path="items" element={<BillingItemsPage {...pageProps} />} />
          <Route
            path="reports"
            element={<BillingReportsPage {...pageProps} />}
          />
          <Route
            path="*"
            element={<Navigate to="/billing/dashboard" replace />}
          />
        </Routes>
      </Suspense>
    </WorkspaceShell>
  );
};

export default BillingLayout;
