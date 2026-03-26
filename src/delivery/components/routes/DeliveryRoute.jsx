import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const DeliveryRoute = ({ children }) => {
  const { isAuthenticated, token, user } = useSelector((state) => state.auth);

  if (token && !user) {
    return null;
  }

  return isAuthenticated && user?.role === "delivery" ? (
    children
  ) : (
    <Navigate to="/login" replace />
  );
};

export default DeliveryRoute;
