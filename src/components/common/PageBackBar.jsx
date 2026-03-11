import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const HIDDEN_PATHS = new Set(["/"]);

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

  if (HIDDEN_PATHS.has(location.pathname)) {
    return null;
  }

  const label = formatPageLabel(location.pathname) || "Page";

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/");
  };

  return (
    <div className="sticky top-16 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur lg:top-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
            Navigation
          </p>
          <p className="truncate text-sm font-semibold text-slate-800 sm:text-base">
            {label}
          </p>
        </div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-600"
        >
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};

export default PageBackBar;
