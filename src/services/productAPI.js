import apiClient from "./apiClient";

export const fetchAllProducts = () =>
  apiClient.get("/products").then((res) => res.data);

export const createNewProduct = (productData) =>
  apiClient.post("/products", productData).then((res) => res.data);

export const updateExistingProduct = (id, productData) =>
  apiClient.put(`/products/${id}`, productData).then((res) => res.data);

export const patchProductInventory = (id, inventoryData) =>
  apiClient
    .patch(`/products/${id}/inventory`, inventoryData)
    .then((res) => res.data);

export const putProductDisplayOrder = ({ category, productIds }) =>
  apiClient
    .put("/products/display-order", { category, productIds })
    .then((res) => res.data);

export const deleteExistingProduct = (id) =>
  apiClient.delete(`/products/${id}`).then((res) => res.data);

export const renameCategoryAPI = (oldName, newName) =>
  apiClient
    .put("/products/batch/category", { oldName, newName })
    .then((res) => res.data);

export const deleteCategoryAPI = (name) =>
  apiClient
    .delete(`/products/batch/category/${encodeURIComponent(name)}`)
    .then((res) => res.data);
