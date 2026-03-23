import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import cartReducer from "@/features/cart/cartSlice";
import productReducer from "@/features/products/productSlice";
import orderReducer from "@/features/orders/orderSlice";
import siteReducer from "@/features/site/siteSlice";
import uiReducer from "@/features/uiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    orders: orderReducer,
    site: siteReducer,
    ui: uiReducer,
  },
});

export default store;

