import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchAllProducts,
  fetchOneProduct,
  createNewProduct,
  updateExistingProduct,
  patchProductInventory,
  deleteExistingProduct,
  postProductReview,
} from "../../services/productAPI";

const getErrorPayload = (error, fallbackMessage) =>
  error.response?.data || { message: fallbackMessage };

// Async Thunks
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllProducts();
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to fetch products"),
      );
    }
  },
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      return await fetchOneProduct(id);
    } catch (error) {
      return rejectWithValue(getErrorPayload(error, "Failed to fetch product"));
    }
  },
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      return await createNewProduct(productData);
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to create product"),
      );
    }
  },
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, productData }, { rejectWithValue }) => {
    try {
      return await updateExistingProduct(id, productData);
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to update product"),
      );
    }
  },
);

export const updateProductInventory = createAsyncThunk(
  "products/updateProductInventory",
  async ({ id, inventoryData }, { rejectWithValue }) => {
    try {
      return await patchProductInventory(id, inventoryData);
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to update product inventory"),
      );
    }
  },
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id, { rejectWithValue }) => {
    try {
      await deleteExistingProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to delete product"),
      );
    }
  },
);

export const addProductReview = createAsyncThunk(
  "products/addProductReview",
  async ({ id, reviewData }, { rejectWithValue }) => {
    try {
      return await postProductReview(id, reviewData);
    } catch (error) {
      return rejectWithValue(getErrorPayload(error, "Failed to add review"));
    }
  },
);

const initialState = {
  products: [],
  product: null,
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch products";
      })
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to fetch product";
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(action.payload);
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        if (state.product?._id === action.payload._id) {
          state.product = action.payload;
        }
      })
      .addCase(updateProductInventory.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (product) => product._id === action.payload._id,
        );

        if (index !== -1) {
          state.products[index] = action.payload;
        }

        if (state.product?._id === action.payload._id) {
          state.product = action.payload;
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      })
      .addCase(addProductReview.fulfilled, (state, action) => {
        state.product = action.payload;

        const index = state.products.findIndex(
          (product) => product._id === action.payload._id,
        );

        if (index !== -1) {
          state.products[index] = action.payload;
        }
      });
  },
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;
