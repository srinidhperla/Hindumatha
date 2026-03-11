import apiClient from "./apiClient";

export const fetchAllProducts = () =>
  apiClient.get("/products").then((res) => res.data);

export const fetchOneProduct = (id) =>
  apiClient.get(`/products/${id}`).then((res) => res.data);

export const createNewProduct = (productData) =>
  apiClient.post("/products", productData).then((res) => res.data);

export const updateExistingProduct = (id, productData) =>
  apiClient.put(`/products/${id}`, productData).then((res) => res.data);

export const patchProductInventory = (id, inventoryData) =>
  apiClient
    .patch(`/products/${id}/inventory`, inventoryData)
    .then((res) => res.data);

export const deleteExistingProduct = (id) =>
  apiClient.delete(`/products/${id}`).then((res) => res.data);

export const postProductReview = (id, reviewData) =>
  apiClient.post(`/products/${id}/reviews`, reviewData).then((res) => res.data);
