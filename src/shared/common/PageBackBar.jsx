import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const HIDDEN_PATHS = new Set(["/", "/login", "/register"]);

const formatPageLabel = (pathname) => {
  if (pathname.startsWith("/products/")) {
    return "Product Details";
  }

  if (pathname.startsWith("/admin")) {
    return "Admin";
  }

  return pathname
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase()),
    )
    .join(" / ");
};

const PageBackBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  if (HIDDEN_PATHS.has(location.pathname)) {
    return null;
  }

  const label = formatPageLabel(location.pathname) || "Page";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    if (user?.role === "delivery") {
      navigate("/delivery");
      return;
    }

    if (user?.role === "admin") {
      navigate("/admin/orders");
      return;
    }

    navigate("/");
  };

  return (
    <div className="sticky top-[72px] z-30 border-b border-gold-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,243,228,0.9))] backdrop-blur sm:top-[94px] lg:top-[110px]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary-500">
            Navigation
          </p>
          <p className="truncate font-playfair text-sm font-semibold text-primary-900 sm:text-base">
            {label}
          </p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition hover:-translate-y-0.5 hover:border-caramel-300 hover:bg-caramel-50 hover:text-primary-900"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};

export default PageBackBar;
