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
  cancelAutoBatch: (batchId) =>
    data(
      apiClient.post(
        `/billing/auto/batches/${encodeURIComponent(batchId)}/cancel`,
      ),
    ),
};

export const billingError = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || fallback;
