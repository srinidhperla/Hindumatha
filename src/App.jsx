import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import { AdminOrderAlertsProvider } from "./admin/components/alerts/AdminOrderAlertsProvider";
import UserToast from "./components/ui/Toast";
import PageBackBar from "./components/common/PageBackBar";
import PrivateRoute from "./components/auth/PrivateRoute";
import AdminRoute from "./admin/components/routes/AdminRoute";
import { getProfile } from "./features/auth/authSlice";
import { fetchSiteContent } from "./features/site/siteSlice";
import { fetchProducts } from "./features/products/productSlice";

const Home = lazy(() => import("./user/pages/Home"));
const Menu = lazy(() => import("./user/pages/shop/Menu"));
const Gallery = lazy(() => import("./user/pages/Gallery"));
const Contact = lazy(() => import("./user/pages/Contact"));
const Cart = lazy(() => import("./user/pages/checkout/Cart"));
const Login = lazy(() => import("./user/pages/Login"));
const Register = lazy(() => import("./user/pages/Register"));
const Order = lazy(() => import("./user/pages/checkout/Order"));
const Payment = lazy(() => import("./user/pages/checkout/Payment"));
const Orders = lazy(() => import("./user/pages/account/Orders"));
const Profile = lazy(() => import("./user/pages/account/Profile"));
const ProductDetails = lazy(() => import("./user/pages/shop/ProductDetails"));
const AdminDashboard = lazy(() => import("./admin/pages/AdminDashboard"));

const RouteFallback = () => (
  <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-12 text-sm font-medium text-primary-500">
    Loading page...
  </div>
);

function App() {
  const dispatch = useDispatch();
  const { token, user, loading } = useSelector((state) => state.auth);
  const {
    products,
    loading: productsLoading,
    loaded: productsLoaded,
  } = useSelector((state) => state.products);
  const { loaded: siteLoaded, loading: siteLoading } = useSelector(
    (state) => state.site,
  );

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, loading, token, user]);

  useEffect(() => {
    if (!siteLoaded && !siteLoading) {
      dispatch(fetchSiteContent());
    }
  }, [dispatch, siteLoaded, siteLoading]);

  useEffect(() => {
    if (!productsLoaded && !productsLoading) {
      dispatch(fetchProducts());
    }
  }, [dispatch, productsLoaded, productsLoading]);

  return (
    <AdminOrderAlertsProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <UserToast />
        <main className="flex-grow pt-16 lg:pt-20">
          <PageBackBar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/order"
                element={
                  <PrivateRoute>
                    <Order />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payment"
                element={
                  <PrivateRoute>
                    <Payment />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Orders />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </AdminOrderAlertsProvider>
  );
}

export default App;
