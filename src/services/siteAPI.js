import apiClient from "./apiClient";

// Image uploads run through server-side sharp compression + Cloudinary, which
// routinely takes far longer than the default client timeout.
const UPLOAD_TIMEOUT_MS = 180000;

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
  apiClient
    .post("/site/gallery", galleryItemData, { timeout: UPLOAD_TIMEOUT_MS })
    .then((res) => res.data);

export const putGalleryItem = (itemId, galleryItemData) =>
  apiClient
    .put(`/site/gallery/${itemId}`, galleryItemData, {
      timeout: UPLOAD_TIMEOUT_MS,
    })
    .then((res) => res.data);

export const removeGalleryItem = (itemId) =>
  apiClient.delete(`/site/gallery/${itemId}`).then((res) => res.data);

export const getGalleryImagesBackup = () =>
  apiClient
    .get("/site/gallery/backup", {
      responseType: "blob",
      timeout: UPLOAD_TIMEOUT_MS,
    })
    .then((res) => res.data);

export const postGalleryImagesRestore = (archiveFormData) =>
  apiClient
    .post("/site/gallery/restore", archiveFormData, {
      timeout: UPLOAD_TIMEOUT_MS,
    })
    .then((res) => res.data);

export const postContactMessage = (contactData) =>
  apiClient.post("/site/contact", contactData).then((res) => res.data);
