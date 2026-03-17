import { createSlice } from "@reduxjs/toolkit";
import {
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getVariantPrice,
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

const createUnavailableSnapshot = (existingProduct = {}) => ({
  ...existingProduct,
  isAvailable: false,
});

const resolveComparableSelection = (item, productSnapshot) => {
  const selectedFlavor = resolveDefaultFlavor(
    productSnapshot,
    item?.selectedFlavor || "",
  );
  const selectedEggType = item?.selectedEggType || "";
  const selectedWeight = resolveDefaultWeight(
    productSnapshot,
    item?.selectedWeight || "",
    selectedFlavor,
    selectedEggType,
  );

  return {
    flavorName: selectedFlavor,
    eggType: selectedEggType,
    weightLabel: selectedWeight,
  };
};

const resolveComparableUnitPrice = (item, productSnapshot) => {
  if (!productSnapshot) {
    return Number(item?.product?.price || 0);
  }

  const selection = resolveComparableSelection(item, productSnapshot);
  return Number(getVariantPrice(productSnapshot, selection) || 0);
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadCartItems(),
    priceSyncNoticeVisible: false,
    priceSyncUpdatedItemsCount: 0,
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
      state.priceSyncNoticeVisible = false;
      state.priceSyncUpdatedItemsCount = 0;
      persistCartItems(state.items);
    },
    dismissPriceSyncNotice: (state) => {
      state.priceSyncNoticeVisible = false;
      state.priceSyncUpdatedItemsCount = 0;
    },
    syncCartProducts: (state, action) => {
      const productCatalog = Array.isArray(action.payload)
        ? action.payload
        : [];
      const productLookup = productCatalog.reduce((accumulator, product) => {
        if (product?._id) {
          accumulator[product._id] = product;
        }
        return accumulator;
      }, {});

      let priceSyncUpdatedItemsCount = 0;

      state.items = state.items.map((item) => {
        const productId = item?.product?._id;
        if (!productId) {
          return item;
        }

        const latestProduct = productLookup[productId];
        const nextProduct =
          latestProduct || createUnavailableSnapshot(item.product);
        const previousUnitPrice = resolveComparableUnitPrice(
          item,
          item.product,
        );
        const nextUnitPrice = resolveComparableUnitPrice(item, nextProduct);

        if (Math.abs(previousUnitPrice - nextUnitPrice) > 0.5) {
          priceSyncUpdatedItemsCount += 1;
        }

        return {
          ...item,
          product: nextProduct,
        };
      });

      if (priceSyncUpdatedItemsCount > 0) {
        state.priceSyncNoticeVisible = true;
        state.priceSyncUpdatedItemsCount = priceSyncUpdatedItemsCount;
      }

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
  dismissPriceSyncNotice,
  syncCartProducts,
} = cartSlice.actions;
export default cartSlice.reducer;
