import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchSite,
  putSiteSettings,
  getAlertStatus,
  postTestAlertEmail,
  getPaymentStatus,
  postGalleryItem,
  removeGalleryItem,
} from "../../services/siteAPI";
import {
  createDefaultWeeklySchedule,
  normalizeDeliverySettings,
} from "../../utils/deliverySettings";

const defaultSiteContent = {
  businessInfo: {
    storeName: "Hindumatha's Cake World",
    establishedYear: 1976,
    email: "info@hindumathascakes.com",
    phone: "+91 98765 43210",
    address: "123 Main Street, Vizianagaram, Andhra Pradesh",
    intro: "Crafting unforgettable cakes for every celebration since 2010.",
  },
  storeHours: {
    weekdays: "8:00 AM - 9:00 PM",
    weekends: "9:00 AM - 10:00 PM",
  },
  deliverySettings: {
    enabled: true,
    distanceFeeEnabled: true,
    pricePerKm: 20,
    freeDeliveryEnabled: true,
    freeDeliveryMinAmount: 1500,
    maxDeliveryRadiusKm: 3,
    storeLocation: {
      lat: 0,
      lng: 0,
    },
    pauseUntil: null,
    pauseDurationUnit: "hours",
    pauseDurationValue: 0,
    prepTimeMinutes: 45,
    advanceNoticeUnit: "hours",
    advanceNoticeValue: 2,
    timeSlots: ["09:00-12:00", "12:00-15:00", "15:00-18:00", "18:00-21:00"],
    weeklySchedule: createDefaultWeeklySchedule(),
  },
  socialLinks: {
    instagram: "https://instagram.com/yourbakery",
    facebook: "https://facebook.com/yourbakery",
    whatsapp: "https://wa.me/919876543210",
  },
  coupons: [
    {
      _id: "default-coupon-1",
      code: "SWEET10",
      type: "percent",
      value: 10,
      minSubtotal: 500,
      maxDiscount: 250,
      description: "10% off on orders above Rs.500",
      isActive: true,
    },
    {
      _id: "default-coupon-2",
      code: "WELCOME100",
      type: "flat",
      value: 100,
      minSubtotal: 800,
      description: "Rs.100 off on orders above Rs.800",
      isActive: true,
    },
    {
      _id: "default-coupon-3",
      code: "FREEDEL",
      type: "delivery",
      value: 0,
      minSubtotal: 400,
      description: "Free delivery on eligible orders",
      isActive: true,
    },
  ],
  alertStatus: {
    configured: false,
    host: "",
    port: 587,
    secure: false,
    from: "",
    recipient: "",
    reminderIntervalMinutes: 5,
    pendingOrderCount: 0,
  },
  paymentStatus: {
    configured: false,
    gateway: "razorpay",
    keyIdPreview: "",
    hasKeyId: false,
    hasKeySecret: false,
    supportedMethods: ["upi", "card"],
    cashOnDeliveryEnabled: true,
  },
  galleryItems: [],
};

export const fetchSiteContent = createAsyncThunk(
  "site/fetchSiteContent",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSite();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch site content" },
      );
    }
  },
);

export const updateSiteSettings = createAsyncThunk(
  "site/updateSiteSettings",
  async (settingsData, { rejectWithValue }) => {
    try {
      return await putSiteSettings(settingsData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update settings" },
      );
    }
  },
);

export const fetchAlertStatus = createAsyncThunk(
  "site/fetchAlertStatus",
  async (_, { rejectWithValue }) => {
    try {
      return await getAlertStatus();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch alert status" },
      );
    }
  },
);

export const sendTestAlertEmail = createAsyncThunk(
  "site/sendTestAlertEmail",
  async (_, { rejectWithValue }) => {
    try {
      return await postTestAlertEmail();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to send test alert email" },
      );
    }
  },
);

export const fetchPaymentStatus = createAsyncThunk(
  "site/fetchPaymentStatus",
  async (_, { rejectWithValue }) => {
    try {
      return await getPaymentStatus();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch payment status" },
      );
    }
  },
);

export const addGalleryItem = createAsyncThunk(
  "site/addGalleryItem",
  async (galleryItemData, { rejectWithValue }) => {
    try {
      return await postGalleryItem(galleryItemData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to add gallery item" },
      );
    }
  },
);

export const deleteGalleryItem = createAsyncThunk(
  "site/deleteGalleryItem",
  async (itemId, { rejectWithValue }) => {
    try {
      await removeGalleryItem(itemId);
      return itemId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to delete gallery item" },
      );
    }
  },
);

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
export default siteSlice.reducer;
