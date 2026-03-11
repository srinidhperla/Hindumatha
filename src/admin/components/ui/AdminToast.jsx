import React from "react";

const AdminToast = ({ toast, onClose }) => {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-24 z-[60] w-full max-w-sm">
      <div
        className={`rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-sm ${
          toast.type === "error"
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            type="button"
            onClick={onClose}
            className="text-current opacity-70 hover:opacity-100"
          >
            <span className="sr-only">Close</span>
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

export default AdminToast;
