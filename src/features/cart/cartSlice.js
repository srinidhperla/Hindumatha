import { createSlice } from "@reduxjs/toolkit";
import {
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
} from "../../utils/productOptions";

const CART_STORAGE_KEY = "cartItems";

const loadCartItems = () => {
  try {
    const storedItems = localStorage.getItem(CART_STORAGE_KEY);
    const parsedItems = storedItems ? JSON.parse(storedItems) : [];
    return Array.isArray(parsedItems) ? parsedItems : [];
  } catch (error) {
    return [];
  }
};

const persistCartItems = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

const resolveDefaultFlavor = (product, selectedFlavor) => {
  const flavors = getAvailableFlavorOptions(product);

  if (!flavors.length) {
    return "";
  }

  const matchedFlavor = flavors.find(
    (option) => option.name === selectedFlavor,
  );
  return matchedFlavor?.name || flavors[0].name;
};

const resolveDefaultWeight = (product, selectedWeight) => {
  const weights = getAvailableWeightOptions(product);

  if (!weights.length) {
    return "";
  }

  const matchedWeight = weights.find(
    (option) => option.label === selectedWeight,
  );
  return matchedWeight?.label || weights[0].label;
};

const createCartIdentity = (productId, selectedFlavor, selectedWeight) =>
  `${productId}::${selectedFlavor || "none"}::${selectedWeight || "none"}`;

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCartItems(),
  },
  reducers: {
    addToCart: (state, action) => {
      const {
        product,
        quantity = 1,
        selectedFlavor,
        selectedWeight,
      } = action.payload;
      const resolvedFlavor = resolveDefaultFlavor(product, selectedFlavor);
      const resolvedWeight = resolveDefaultWeight(product, selectedWeight);
      const identity = createCartIdentity(
        product._id,
        resolvedFlavor,
        resolvedWeight,
      );
      const existingItem = state.items.find(
        (item) => item.identity === identity,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          id: `${product._id}-${Date.now()}`,
          identity,
          product,
          selectedFlavor: resolvedFlavor,
          selectedWeight: resolvedWeight,
          quantity,
        });
      }

      persistCartItems(state.items);
    },
    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const targetItem = state.items.find((item) => item.id === id);

      if (targetItem) {
        targetItem.quantity = Math.max(1, quantity);
      }

      persistCartItems(state.items);
    },
    updateCartItemOptions: (state, action) => {
      const { id, selectedFlavor, selectedWeight } = action.payload;
      const targetItem = state.items.find((item) => item.id === id);

      if (targetItem) {
        const nextFlavor = resolveDefaultFlavor(
          targetItem.product,
          selectedFlavor ?? targetItem.selectedFlavor,
        );
        const nextWeight = resolveDefaultWeight(
          targetItem.product,
          selectedWeight ?? targetItem.selectedWeight,
        );

        targetItem.selectedFlavor = nextFlavor;
        targetItem.selectedWeight = nextWeight;
        targetItem.identity = createCartIdentity(
          targetItem.product._id,
          nextFlavor,
          nextWeight,
        );
      }

      persistCartItems(state.items);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persistCartItems(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      persistCartItems(state.items);
    },
  },
});

export const {
  addToCart,
  updateCartQuantity,
  updateCartItemOptions,
  removeFromCart,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;
