import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  postOrder,
  postPaymentCreate,
  postPaymentVerify,
  fetchAllOrders,
  fetchUserOrders,
  fetchSingleOrder,
  putOrderStatus,
  putCancelOrder,
} from "@/services/orderAPI";

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
  async ({ id, status }, { rejectWithValue }) => {
    try {
      return await putOrderStatus(id, status);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update order status" },
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
        state.orders.push(action.payload);
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
        state.orders.push(action.payload);
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
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id,
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
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

export const { clearError, clearPaymentOrder } = orderSlice.actions;
export default orderSlice.reducer;
