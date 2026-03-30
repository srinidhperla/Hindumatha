import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  postOrder,
  postPaymentCreate,
  postPaymentVerify,
  fetchAllOrders,
  fetchAssignedDeliveryOrders,
  fetchDeliveryPartners,
  fetchUserOrders,
  fetchSingleOrder,
  putOrderStatus,
  putDeliveryStatus,
  putCancelOrder,
} from "@/services/orderAPI";

const upsertOrderById = (orders = [], nextOrder) => {
  if (!nextOrder?._id) {
    return orders;
  }

  const existingIndex = orders.findIndex((order) => order._id === nextOrder._id);
  if (existingIndex === -1) {
    return [nextOrder, ...orders];
  }

  const nextOrders = [...orders];
  nextOrders[existingIndex] = nextOrder;
  return nextOrders;
};

const shouldKeepDeliveryOrder = (order) =>
  Boolean(
    (order?.assignedDeliveryPartner?._id || order?.assignedDeliveryPartner) &&
      order?.status !== "cancelled",
  );

// Async thunks
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      return await postOrder(orderData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to create order" },
      );
    }
  },
);

export const createPaymentOrder = createAsyncThunk(
  "orders/createPaymentOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      return await postPaymentCreate(orderData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Payment setup failed" },
      );
    }
  },
);

export const verifyPaymentAndCreateOrder = createAsyncThunk(
  "orders/verifyPaymentAndCreateOrder",
  async (paymentData, { rejectWithValue }) => {
    try {
      return await postPaymentVerify(paymentData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Payment verification failed" },
      );
    }
  },
);

export const fetchOrders = createAsyncThunk(
  "orders/fetchOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllOrders();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch orders" },
      );
    }
  },
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMyOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchUserOrders();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch your orders" },
      );
    }
  },
);

export const fetchDeliveryOrders = createAsyncThunk(
  "orders/fetchDeliveryOrders",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAssignedDeliveryOrders();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch delivery orders" },
      );
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOrderById",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchSingleOrder(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch order" },
      );
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      return await putOrderStatus(id, payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update order status" },
      );
    }
  },
);

export const fetchAdminDeliveryPartners = createAsyncThunk(
  "orders/fetchAdminDeliveryPartners",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchDeliveryPartners();
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to fetch delivery partners" },
      );
    }
  },
);

export const updateAssignedDeliveryStatus = createAsyncThunk(
  "orders/updateAssignedDeliveryStatus",
  async ({ id, deliveryStatus }, { rejectWithValue }) => {
    try {
      return await putDeliveryStatus(id, deliveryStatus);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update delivery status" },
      );
    }
  },
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (id, { rejectWithValue }) => {
    try {
      return await putCancelOrder(id);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to cancel order" },
      );
    }
  },
);

const initialState = {
  orders: [],
  myOrders: [],
  deliveryOrders: [],
  deliveryPartners: [],
  currentOrder: null,
  paymentOrder: null,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPaymentOrder: (state) => {
      state.paymentOrder = null;
    },
    upsertIncomingOrder: (state, action) => {
      state.orders = upsertOrderById(state.orders, action.payload);
      state.myOrders = upsertOrderById(state.myOrders, action.payload);

      if (shouldKeepDeliveryOrder(action.payload)) {
        state.deliveryOrders = upsertOrderById(
          state.deliveryOrders,
          action.payload,
        );
      } else {
        state.deliveryOrders = state.deliveryOrders.filter(
          (order) => order._id !== action.payload?._id,
        );
      }

      if (state.currentOrder?._id === action.payload?._id) {
        state.currentOrder = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = upsertOrderById(state.orders, action.payload);
        state.myOrders = upsertOrderById(state.myOrders, action.payload);
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.error ||
          action.payload?.message ||
          "Failed to create order";
      })
      .addCase(createPaymentOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPaymentOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentOrder = action.payload;
      })
      .addCase(createPaymentOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Failed to prepare payment";
      })
      .addCase(verifyPaymentAndCreateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPaymentAndCreateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = upsertOrderById(state.orders, action.payload);
        state.myOrders = upsertOrderById(state.myOrders, action.payload);
        state.currentOrder = action.payload;
        state.paymentOrder = null;
      })
      .addCase(verifyPaymentAndCreateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message ||
          action.payload?.error ||
          "Failed to verify payment";
      })
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch orders";
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch your orders";
      })
      .addCase(fetchDeliveryOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryOrders = action.payload;
      })
      .addCase(fetchDeliveryOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Failed to fetch delivery orders";
      })
      // Fetch Single Order
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch order";
      })
      // Update Order Status
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.orders = upsertOrderById(state.orders, action.payload);
        state.myOrders = upsertOrderById(state.myOrders, action.payload);
        if (shouldKeepDeliveryOrder(action.payload)) {
          state.deliveryOrders = upsertOrderById(
            state.deliveryOrders,
            action.payload,
          );
        } else {
          state.deliveryOrders = state.deliveryOrders.filter(
            (order) => order._id !== action.payload?._id,
          );
        }
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(fetchAdminDeliveryPartners.fulfilled, (state, action) => {
        state.deliveryPartners = action.payload;
      })
      .addCase(updateAssignedDeliveryStatus.fulfilled, (state, action) => {
        if (shouldKeepDeliveryOrder(action.payload)) {
          state.deliveryOrders = upsertOrderById(
            state.deliveryOrders,
            action.payload,
          );
        } else {
          state.deliveryOrders = state.deliveryOrders.filter(
            (order) => order._id !== action.payload?._id,
          );
        }
        state.orders = upsertOrderById(state.orders, action.payload);
        state.myOrders = upsertOrderById(state.myOrders, action.payload);
        if (state.currentOrder?._id === action.payload._id) {
          state.currentOrder = action.payload;
        }
      })
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const cancelledOrder = action.payload.order;

        state.orders = state.orders.map((order) =>
          order._id === cancelledOrder._id ? cancelledOrder : order,
        );
        state.myOrders = state.myOrders.map((order) =>
          order._id === cancelledOrder._id ? cancelledOrder : order,
        );
        state.deliveryOrders = state.deliveryOrders.map((order) =>
          order._id === cancelledOrder._id ? cancelledOrder : order,
        );
        if (state.currentOrder?._id === cancelledOrder._id) {
          state.currentOrder = cancelledOrder;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to cancel order";
      });
  },
});

export const { clearError, clearPaymentOrder, upsertIncomingOrder } =
  orderSlice.actions;
export default orderSlice.reducer;
