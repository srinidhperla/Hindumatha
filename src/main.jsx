import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import store from "./store";
import App from "./App";
import "./styles/global/index.css";

if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();

    const reloadGuardKey = "vite-preload-reload-attempted";
    const hasReloaded = sessionStorage.getItem(reloadGuardKey) === "true";

    if (hasReloaded) {
      return;
    }

    sessionStorage.setItem(reloadGuardKey, "true");
    window.location.reload();
  });
}

if (
  "serviceWorker" in navigator &&
  typeof window !== "undefined" &&
  window.location.pathname.startsWith("/admin")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/admin-alert-sw.js").catch(() => null);
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <App />
        </BrowserRouter>
      </Provider>
    </HelmetProvider>
  </React.StrictMode>,
);
