import { createSlice } from "@reduxjs/toolkit";
import { normalizeDeliverySettings } from "@/utils/deliverySettings";
import defaultSiteContent from "./defaultSiteContent";
import {
  addGalleryItem,
  deleteGalleryItem,
  fetchAlertStatus,
  fetchPaymentStatus,
  fetchSiteContent,
  sendTestAlertEmail,
  updateSiteSettings,
} from "./siteThunks";

const initialState = {
  ...defaultSiteContent,
  loading: false,
  saving: false,
  loaded: false,
  error: null,
};

const siteSlice = createSlice({
  name: "site",
  initialState,
  reducers: {
    clearSiteError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSiteContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSiteContent.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.businessInfo = action.payload.businessInfo || state.businessInfo;
        state.storeHours = action.payload.storeHours || state.storeHours;
        state.deliverySettings = normalizeDeliverySettings(
          action.payload.deliverySettings || state.deliverySettings,
        );
        state.socialLinks = action.payload.socialLinks || state.socialLinks;
        state.coupons = action.payload.coupons || state.coupons;
        state.galleryItems = action.payload.galleryItems || state.galleryItems;
      })
      .addCase(fetchAlertStatus.fulfilled, (state, action) => {
        state.alertStatus = action.payload || state.alertStatus;
      })
      .addCase(fetchPaymentStatus.fulfilled, (state, action) => {
        state.paymentStatus = action.payload || state.paymentStatus;
      })
      .addCase(fetchAlertStatus.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to fetch alert status";
      })
      .addCase(fetchPaymentStatus.rejected, (state, action) => {
        state.error =
          action.payload?.message || "Failed to fetch payment status";
      })
      .addCase(fetchSiteContent.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload?.message || "Failed to fetch site content";
      })
      .addCase(updateSiteSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateSiteSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.businessInfo = action.payload.businessInfo || state.businessInfo;
        state.storeHours = action.payload.storeHours || state.storeHours;
        state.deliverySettings = normalizeDeliverySettings(
          action.payload.deliverySettings || state.deliverySettings,
        );
        state.socialLinks = action.payload.socialLinks || state.socialLinks;
        state.coupons = action.payload.coupons || state.coupons;
      })
      .addCase(updateSiteSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || "Failed to update settings";
      })
      .addCase(sendTestAlertEmail.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(sendTestAlertEmail.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(sendTestAlertEmail.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.payload?.message || "Failed to send test alert email";
      })
      .addCase(addGalleryItem.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addGalleryItem.fulfilled, (state, action) => {
        state.saving = false;
        state.galleryItems.unshift(action.payload);
      })
      .addCase(addGalleryItem.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload?.message || "Failed to add gallery item";
      })
      .addCase(deleteGalleryItem.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteGalleryItem.fulfilled, (state, action) => {
        state.saving = false;
        state.galleryItems = state.galleryItems.filter(
          (item) => item._id !== action.payload,
        );
      })
      .addCase(deleteGalleryItem.rejected, (state, action) => {
        state.saving = false;
        state.error =
          action.payload?.message || "Failed to delete gallery item";
      });
  },
});

export const { clearSiteError } = siteSlice.actions;
export {
  addGalleryItem,
  deleteGalleryItem,
  fetchAlertStatus,
  fetchPaymentStatus,
  fetchSiteContent,
  sendTestAlertEmail,
  updateSiteSettings,
};
export default siteSlice.reducer;
