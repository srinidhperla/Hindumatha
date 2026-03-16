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

const hasExplicitFlavors = (product) =>
  (Array.isArray(product?.flavorOptions) && product.flavorOptions.length > 0) ||
  (Array.isArray(product?.flavors) && product.flavors.length > 0);

const resolveDefaultFlavor = (product, selectedFlavor) => {
  if (!hasExplicitFlavors(product)) {
    return "";
  }

  const flavors = getAvailableFlavorOptions(product);

  if (!flavors.length) {
    return "";
  }

  const matchedFlavor = flavors.find(
    (option) => option.name === selectedFlavor,
  );
  return matchedFlavor?.name || flavors[0].name;
};

const resolveDefaultWeight = (
  product,
  selectedWeight,
  selectedFlavor = "",
  selectedEggType = "",
) => {
  const weights = getAvailableWeightOptions(
    product,
    selectedFlavor,
    selectedEggType,
  );

  if (!weights.length) {
    return "";
  }

  const matchedWeight = weights.find(
    (option) => option.label === selectedWeight,
  );
  return matchedWeight?.label || weights[0].label;
};

const createCartIdentity = (
  productId,
  selectedFlavor,
  selectedWeight,
  selectedEggType,
) =>
  `${productId}::${selectedFlavor || "none"}::${selectedWeight || "none"}::${selectedEggType || "none"}`;

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
        selectedEggType,
      } = action.payload;
      const resolvedFlavor = resolveDefaultFlavor(product, selectedFlavor);
      const resolvedEggType = selectedEggType || "";
      const resolvedWeight = resolveDefaultWeight(
        product,
        selectedWeight,
        resolvedFlavor,
        resolvedEggType,
      );
      const identity = createCartIdentity(
        product._id,
        resolvedFlavor,
        resolvedWeight,
        resolvedEggType,
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
          selectedEggType: resolvedEggType,
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
      const { id, selectedFlavor, selectedWeight, selectedEggType } =
        action.payload;
      const targetItem = state.items.find((item) => item.id === id);

      if (targetItem) {
        const nextEggType = selectedEggType ?? targetItem.selectedEggType ?? "";
        const nextFlavor = resolveDefaultFlavor(
          targetItem.product,
          selectedFlavor ?? targetItem.selectedFlavor,
        );
        const nextWeight = resolveDefaultWeight(
          targetItem.product,
          selectedWeight ?? targetItem.selectedWeight,
          nextFlavor,
          nextEggType,
        );

        targetItem.selectedFlavor = nextFlavor;
        targetItem.selectedWeight = nextWeight;
        targetItem.selectedEggType = nextEggType;
        targetItem.identity = createCartIdentity(
          targetItem.product._id,
          nextFlavor,
          nextWeight,
          nextEggType,
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
