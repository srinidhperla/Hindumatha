import apiClient from "./apiClient";

const data = (request) => request.then((response) => response.data);

export const billingAPI = {
  getDashboard: (date) =>
    data(apiClient.get("/billing/dashboard", { params: date ? { date } : {} })),
  getReport: (params) => data(apiClient.get("/billing/reports", { params })),

  getCatalog: () => data(apiClient.get("/billing/catalog")),
  createItem: (payload) => data(apiClient.post("/billing/items", payload)),
  updateItem: (id, payload) =>
    data(apiClient.patch(`/billing/items/${id}`, payload)),

  listCategories: () => data(apiClient.get("/billing/categories")),
  createCategory: (payload) =>
    data(apiClient.post("/billing/categories", payload)),
  updateCategory: (id, payload) =>
    data(apiClient.patch(`/billing/categories/${id}`, payload)),
  deleteCategory: (id) => data(apiClient.delete(`/billing/categories/${id}`)),

  listBills: (params) => data(apiClient.get("/billing/bills", { params })),
  getBill: (id) => data(apiClient.get(`/billing/bills/${id}`)),
  createBill: (payload) => data(apiClient.post("/billing/bills", payload)),
  cancelBill: (id, reason) =>
    data(apiClient.post(`/billing/bills/${id}/cancel`, { reason })),

  previewAuto: (payload) =>
    data(apiClient.post("/billing/auto/preview", payload, { timeout: 60000 })),
  commitAuto: (payload) =>
    data(apiClient.post("/billing/auto/commit", payload, { timeout: 60000 })),
  listAutoBatches: () => data(apiClient.get("/billing/auto/batches")),

  listPurchases: (params) =>
    data(apiClient.get("/billing/purchases", { params })),
  getPurchase: (id) => data(apiClient.get(`/billing/purchases/${id}`)),
  createPurchase: (payload) =>
    data(apiClient.post("/billing/purchases", payload)),
  updatePurchase: (id, payload) =>
    data(apiClient.patch(`/billing/purchases/${id}`, payload)),
  deletePurchase: (id) => data(apiClient.delete(`/billing/purchases/${id}`)),
  // files: the pages of one bill (photos / PDFs / sheets) in order; text:
  // sheet rows read in the browser; read: ask the AI to fill in the bill.
  uploadPurchaseBill: ({ files, text, read }) => {
    const form = new FormData();
    (files || []).forEach((file) => form.append("files", file));
    if (text) form.append("text", text);
    form.append("read", read ? "1" : "0");
    return data(
      apiClient.post("/billing/purchases/upload", form, { timeout: 240000 }),
    );
  },
  listStock: (params) =>
    data(apiClient.get("/billing/purchases/stock", { params })),
  updateStock: (id, payload) =>
    data(apiClient.patch(`/billing/purchases/stock/${id}`, payload)),
  adjustStock: (id, payload) =>
    data(apiClient.post(`/billing/purchases/stock/${id}/adjust`, payload)),
  stockHistory: (id) =>
    data(apiClient.get(`/billing/purchases/stock/${id}/history`)),
  listShortNames: () => data(apiClient.get("/billing/purchases/short-names")),
  saveShortName: (payload) =>
    data(apiClient.post("/billing/purchases/short-names", payload)),
  deleteShortName: (id) =>
    data(apiClient.delete(`/billing/purchases/short-names/${id}`)),
  listLearnedItems: (params) =>
    data(apiClient.get("/billing/purchases/learned-items", { params })),
  updateLearnedItem: (id, payload) =>
    data(apiClient.patch(`/billing/purchases/learned-items/${id}`, payload)),
  deleteLearnedItem: (id) =>
    data(apiClient.delete(`/billing/purchases/learned-items/${id}`)),
  cancelAutoBatch: (batchId) =>
    data(
      apiClient.post(
        `/billing/auto/batches/${encodeURIComponent(batchId)}/cancel`,
      ),
    ),
};

export const billingError = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || fallback;
