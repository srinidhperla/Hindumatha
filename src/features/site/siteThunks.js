import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchSite,
  putSiteSettings,
  getAlertStatus,
  postTestAlertEmail,
  getPaymentStatus,
  postGalleryItem,
  removeGalleryItem,
} from "@/services/siteAPI";

const toRejectPayload = (error, fallbackMessage) =>
  error.response?.data || { message: fallbackMessage };

export const fetchSiteContent = createAsyncThunk(
  "site/fetchSiteContent",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchSite();
    } catch (error) {
      return rejectWithValue(
        toRejectPayload(error, "Failed to fetch site content"),
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
        toRejectPayload(error, "Failed to update settings"),
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
        toRejectPayload(error, "Failed to fetch alert status"),
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
        toRejectPayload(error, "Failed to send test alert email"),
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
        toRejectPayload(error, "Failed to fetch payment status"),
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
        toRejectPayload(error, "Failed to add gallery item"),
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
        toRejectPayload(error, "Failed to delete gallery item"),
      );
    }
  },
);
