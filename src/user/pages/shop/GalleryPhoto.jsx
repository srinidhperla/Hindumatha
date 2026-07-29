import React, { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import SeoMeta from "@/shared/seo/SeoMeta";
import useGalleryItems from "@/user/hooks/useGalleryItems";
import { optimizeCloudinaryUploadUrl } from "@/utils/imageOptimization";

// The shared image helper clamps every URL to 800px for bandwidth. This page is
// the full-size view, so it asks Cloudinary for a larger render directly.
const FULL_VIEW_TRANSFORMS = "f_auto,q_auto,w_1600";

const normalizeCode = (value = "") =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/#/g, "");

const GalleryPhoto = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { allItems, isSiteLoaded } = useGalleryItems();

  const item = useMemo(() => {
    const target = normalizeCode(code);

    if (!target) {
      return null;
    }

    return (
      allItems.find(
        (entry) => normalizeCode(entry.cakeCodeSearch) === target,
      ) ||
      allItems.find((entry) => normalizeCode(entry.cakeCode) === target) ||
      null
    );
  }, [allItems, code]);

  const fullSizeImageUrl = useMemo(
    () =>
      item?.imageUrl
        ? optimizeCloudinaryUploadUrl(item.imageUrl, FULL_VIEW_TRANSFORMS)
        : "",
    [item?.imageUrl],
  );

  const handleClose = useCallback(() => {
    // location.key is "default" only on a fresh load (shared link, refresh),
    // where there is no in-app history entry to go back to.
    if (location.key && location.key !== "default") {
      navigate(-1);
      return;
    }

    navigate("/gallery");
  }, [location.key, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const closeButton = (
    <button
      type="button"
      onClick={handleClose}
      className="absolute right-4 top-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white backdrop-blur transition hover:bg-black/75 sm:right-6 sm:top-6"
      aria-label="Close photo"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>
  );

  if (!item) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#0b0705] px-6 text-center">
        {closeButton}
        {!isSiteLoaded ? (
          <>
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-white/25 border-t-white" />
            <p className="mt-4 text-sm text-white/70">Loading photo…</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-white">
              This cake photo is not available.
            </p>
            <button
              type="button"
              onClick={() => navigate("/gallery")}
              className="mt-5 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#0b0705] transition hover:bg-white/90"
            >
              Back to gallery
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0b0705]">
      <SeoMeta
        title={`${item.cakeCode ? `${item.cakeCode} — ` : ""}${item.title || "Cake"} | Hindumatha's Cake World`}
        description={`Full view of ${item.title || "our cake"} from the Hindumatha's Cake World gallery.`}
        path={`/gallery/photo/${item.cakeCodeSearch || ""}`}
      />

      {closeButton}

      <div className="flex min-h-0 flex-1 items-center justify-center p-3 sm:p-6">
        <img
          src={fullSizeImageUrl}
          alt={item.title}
          loading="eager"
          decoding="async"
          onError={(event) => {
            if (item.imageUrl && event.target.src !== item.imageUrl) {
              event.target.src = item.imageUrl;
            }
          }}
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 text-center">
        {item.cakeCode ? (
          <span className="inline-flex rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#ffe9b8]">
            {item.cakeCode}
          </span>
        ) : null}
        <p className="mt-2 text-base font-semibold text-white sm:text-lg">
          {item.title}
        </p>
      </div>
    </div>
  );
};

export default GalleryPhoto;
