import React, { Suspense, lazy, useEffect } from "react";
import {
  Navigate,
  Routes,
  Route,
  useLocation,
  useParams,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import Navbar from "@/shared/common/Navbar";
import Footer from "@/shared/common/Footer";
import { AdminOrderAlertsProvider } from "@/admin/components/alerts/AdminOrderAlertsProvider";
import UserToast from "@/shared/ui/Toast";
import PageBackBar from "@/shared/common/PageBackBar";
import PrivateRoute from "@/user/components/auth/PrivateRoute";
import AdminRoute from "@/admin/components/routes/AdminRoute";
import DeliveryRoute from "@/delivery/components/routes/DeliveryRoute";
import { getProfile } from "@/features/auth/authSlice";
import { fetchSiteContent } from "@/features/site/siteSlice";
import { fetchProducts } from "@/features/products/productSlice";
import { syncCartProducts, setCurrentUser } from "@/features/cart/cartSlice";
import { getSocketServerUrl } from "@/utils/socketUrl";

const SOCKET_URL = getSocketServerUrl();
const normalizeScope = (scope) =>
  String(scope || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
const PRODUCT_REFRESH_SCOPES = new Set([
  "general",
  "products",
  "product",
  "inventory",
]);
const SITE_REFRESH_SCOPES = new Set([
  "general",
  "settings",
  "delivery",
  "delivery-settings",
  "delivery-timing",
]);

const Home = lazy(() => import("@/user/pages/shop/Home"));
const Menu = lazy(() => import("@/user/pages/shop/Menu"));
const Gallery = lazy(() => import("@/user/pages/shop/Gallery"));
const Contact = lazy(() => import("@/user/pages/shop/Contact"));
const Cart = lazy(() => import("@/user/pages/checkout/Cart"));
const Login = lazy(() => import("@/user/pages/account/Login"));
const Register = lazy(() => import("@/user/pages/account/Register"));
const Order = lazy(() => import("@/user/pages/checkout/Order"));
const Payment = lazy(() => import("@/user/pages/checkout/Payment"));
const OrderConfirmed = lazy(() => import("@/user/pages/OrderConfirmed"));
const Orders = lazy(() => import("@/user/pages/account/Orders"));
const Profile = lazy(() => import("@/user/pages/account/Profile"));
const AdminDashboard = lazy(() => import("@/admin/pages/AdminDashboard"));
const DeliveryDashboard = lazy(() => import("@/delivery/pages/DeliveryDashboard"));

const RouteFallback = () => (
  <div className="mx-auto flex w-full max-w-7xl items-center justify-center px-4 py-12 text-sm font-medium text-primary-500">
    Loading page...
  </div>
);

const ProductRouteRedirect = () => {
  const { id } = useParams();
  const targetPath = id ? `/menu?product=${encodeURIComponent(id)}` : "/menu";
  return <Navigate to={targetPath} replace />;
};

const RouteViewportReset = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const previousMode = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousMode;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, [location.pathname, location.search]);

  return null;
};

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
  const hideFooter = user?.role === "delivery";

  // Ping backend on app load to wake up Render server
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);

    const pingBackend = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "/api";
        await fetch(`${apiUrl}/health`, {
          method: "GET",
          signal: controller.signal,
        });
      } catch {
        // Silently fail - health check is just to wake up server
      } finally {
        window.clearTimeout(timeoutId);
      }
    };
    pingBackend();

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (token && !user && !loading) {
      dispatch(getProfile());
    }
  }, [dispatch, loading, token, user]);

  useEffect(() => {
    // Sync cart to current user whenever user changes
    const cartUserId = user?.id || user?._id || null;
    dispatch(setCurrentUser(cartUserId));
  }, [dispatch, user?._id, user?.id]);

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

  useEffect(() => {
    if (productsLoaded) {
      dispatch(syncCartProducts(products));
    }
  }, [dispatch, products, productsLoaded]);

  useEffect(() => {
    if (!SOCKET_URL) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    const handleSiteSync = (event) => {
      const normalizedScope = normalizeScope(event?.scope);

      if (
        !normalizedScope ||
        PRODUCT_REFRESH_SCOPES.has(normalizedScope)
      ) {
        dispatch(fetchProducts({ force: true }));
      }

      if (!normalizedScope || SITE_REFRESH_SCOPES.has(normalizedScope)) {
        dispatch(fetchSiteContent());
      }
    };

    socket.on("site-data-updated", handleSiteSync);

    return () => {
      socket.off("site-data-updated", handleSiteSync);
      socket.disconnect();
    };
  }, [dispatch]);

  return (
    <AdminOrderAlertsProvider>
      <RouteViewportReset />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <UserToast />
        <main className="flex-grow pt-16 lg:pt-20">
          <PageBackBar />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/products/:id" element={<ProductRouteRedirect />} />
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
                path="/order-confirmed/:orderId"
                element={
                  <PrivateRoute>
                    <OrderConfirmed />
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
              <Route
                path="/delivery/*"
                element={
                  <DeliveryRoute>
                    <DeliveryDashboard />
                  </DeliveryRoute>
                }
              />
            </Routes>
          </Suspense>
        </main>
        {!hideFooter && <Footer />}
      </div>
    </AdminOrderAlertsProvider>
  );
}

export default App;
