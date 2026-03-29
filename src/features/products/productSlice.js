import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchAllProducts,
  createNewProduct,
  updateExistingProduct,
  patchProductInventory,
  putProductDisplayOrder,
  deleteExistingProduct,
  renameCategoryAPI,
  deleteCategoryAPI,
} from "@/services/productAPI";
import { normalizeProductImageFields } from "@/utils/imageOptimization";

const getErrorPayload = (error, fallbackMessage) =>
  error.response?.data || { message: fallbackMessage };

// Async Thunks
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (options = {}, { rejectWithValue }) => {
    try {
      return await fetchAllProducts();
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to fetch products"),
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { products } = getState();
      if (options?.force) {
        return true;
      }
      return !products.loading && !products.loaded;
    },
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

export const renameCategory = createAsyncThunk(
  "products/renameCategory",
  async ({ oldName, newName }, { rejectWithValue, dispatch }) => {
    try {
      const result = await renameCategoryAPI(oldName, newName);
      dispatch(fetchProducts());
      return result;
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to rename category"),
      );
    }
  },
);

export const deleteCategory = createAsyncThunk(
  "products/deleteCategory",
  async (name, { rejectWithValue, dispatch }) => {
    try {
      const result = await deleteCategoryAPI(name);
      dispatch(fetchProducts());
      return result;
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to delete category"),
      );
    }
  },
);

export const updateProductDisplayOrder = createAsyncThunk(
  "products/updateProductDisplayOrder",
  async ({ category, productIds }, { rejectWithValue }) => {
    try {
      return await putProductDisplayOrder({ category, productIds });
    } catch (error) {
      return rejectWithValue(
        getErrorPayload(error, "Failed to save product order"),
      );
    }
  },
);

const initialState = {
  products: [],
  loading: false,
  loaded: false,
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
        // Only show spinner on first load; subsequent refreshes are silent
        if (state.products.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.products = Array.isArray(action.payload)
          ? action.payload.map((product) => normalizeProductImageFields(product))
          : [];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.error = action.payload?.message || "Failed to fetch products";
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.products.push(normalizeProductImageFields(action.payload));
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (p) => p._id === action.payload._id,
        );
        if (index !== -1) {
          state.products[index] = normalizeProductImageFields(action.payload);
        }
      })
      .addCase(updateProductInventory.fulfilled, (state, action) => {
        const index = state.products.findIndex(
          (product) => product._id === action.payload._id,
        );

        if (index !== -1) {
          state.products[index] = normalizeProductImageFields(action.payload);
        }
      })
      .addCase(updateProductDisplayOrder.fulfilled, (state, action) => {
        const updatedProducts = Array.isArray(action.payload?.products)
          ? action.payload.products.map((product) =>
              normalizeProductImageFields(product),
            )
          : [];
        const updatedMap = new Map(
          updatedProducts.map((product) => [product._id, product]),
        );

        state.products = state.products.map((product) =>
          updatedMap.get(product._id) || product,
        );
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearError } = productSlice.actions;
export default productSlice.reducer;
