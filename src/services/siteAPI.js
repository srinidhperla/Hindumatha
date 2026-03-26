import apiClient from "./apiClient";

export const fetchSite = () => apiClient.get("/site").then((res) => res.data);

export const putSiteSettings = (settingsData) =>
  apiClient.put("/site/settings", settingsData).then((res) => res.data);

export const putCategoryOrder = (categoryOrder) =>
  apiClient.put("/site/category-order", { categoryOrder }).then((res) => res.data);

export const getAlertStatus = () =>
  apiClient.get("/site/alerts/status").then((res) => res.data);

export const postTestAlertEmail = () =>
  apiClient.post("/admin/test-email", {}).then((res) => res.data);

export const getPaymentStatus = () =>
  apiClient.get("/site/payments/status").then((res) => res.data);

export const postGalleryItem = (galleryItemData) =>
  apiClient.post("/site/gallery", galleryItemData).then((res) => res.data);

export const removeGalleryItem = (itemId) =>
  apiClient.delete(`/site/gallery/${itemId}`).then((res) => res.data);

export const postContactMessage = (contactData) =>
  apiClient.post("/site/contact", contactData).then((res) => res.data);
