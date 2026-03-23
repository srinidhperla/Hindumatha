import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "@/features/uiSlice";

const UserToast = () => {
  const dispatch = useDispatch();
  const toast = useSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch(hideToast());
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [dispatch, toast]);

  if (!toast) {
    return null;
  }

  const toneClassName =
    toast.type === "error"
      ? "border-berry-300 bg-berry-600 text-white"
      : toast.type === "info"
        ? "border-primary-200 bg-white text-primary-800"
        : "border-primary-200 bg-primary-700 text-white";

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm sm:right-6 sm:w-full">
      <div
        className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-md backdrop-blur ${toneClassName}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-6">{toast.message}</p>
          <button
            type="button"
            onClick={() => dispatch(hideToast())}
            className="rounded-full p-1 text-current/70 transition hover:bg-white/10 hover:text-current"
          >
            <span className="sr-only">Close toast</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserToast;
