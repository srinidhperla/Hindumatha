import React from "react";
import AdminDashboard from "@/admin/pages/AdminDashboard";
import { AdminOrderAlertsProvider } from "@/admin/components/alerts/AdminOrderAlertsProvider";

const AdminDashboardWithAlerts = () => (
  <AdminOrderAlertsProvider>
    <AdminDashboard />
  </AdminOrderAlertsProvider>
);

export default AdminDashboardWithAlerts;

