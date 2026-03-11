import apiClient from "./apiClient";

export const postOrder = (orderData) =>
  apiClient.post("/orders", orderData).then((res) => res.data);

export const postPaymentCreate = (orderData) =>
  apiClient.post("/orders/payment/create", orderData).then((res) => res.data);

export const postPaymentVerify = (paymentData) =>
  apiClient.post("/orders/payment/verify", paymentData).then((res) => res.data);

export const fetchAllOrders = () =>
  apiClient.get("/orders").then((res) => res.data);

export const fetchOrderAnalytics = (params = {}) =>
  apiClient.get("/orders/analytics", { params }).then((res) => res.data);

export const fetchUserOrders = () =>
  apiClient.get("/orders/my-orders").then((res) => res.data);

export const fetchSingleOrder = (id) =>
  apiClient.get(`/orders/${id}`).then((res) => res.data);

export const putOrderStatus = (id, status) =>
  apiClient.put(`/orders/${id}/status`, { status }).then((res) => res.data);

export const putCancelOrder = (id) =>
  apiClient.put(`/orders/${id}/cancel`, {}).then((res) => res.data);
