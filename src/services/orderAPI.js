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

export const fetchDeliveryPartners = () =>
  apiClient.get("/orders/delivery-partners").then((res) => res.data);

export const fetchUserOrders = () =>
  apiClient.get("/orders/my-orders").then((res) => res.data);

export const fetchAssignedDeliveryOrders = () =>
  apiClient.get("/orders/delivery/my-orders").then((res) => res.data);

export const fetchSingleOrder = (id) =>
  apiClient.get(`/orders/${id}`).then((res) => res.data);

export const putOrderStatus = (id, payload) =>
  apiClient.put(`/orders/${id}/status`, payload).then((res) => res.data);

export const putDeliveryStatus = (id, deliveryStatus) =>
  apiClient
    .put(`/orders/${id}/delivery-status`, { deliveryStatus })
    .then((res) => res.data);

export const putCancelOrder = (id) =>
  apiClient.put(`/orders/${id}/cancel`, {}).then((res) => res.data);
