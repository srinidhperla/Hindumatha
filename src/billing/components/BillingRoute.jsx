import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { BILLING_ROLES } from "@/billing/billingShared";

// Counter staff only. Mirrors the role list in the backend's routes/billing.js.
const BillingRoute = ({ children }) => {
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  if (token && !user) {
    return null;
  }

  return isAuthenticated && BILLING_ROLES.includes(user?.role) ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

export default BillingRoute;
