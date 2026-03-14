import React from "react";

const Modal = ({
  title,
  badge,
  onClose,
  children,
  footer,
  className = "",
  maxWidthClassName = "max-w-5xl",
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-0 sm:p-3">
    <div
      className={`max-h-[95vh] sm:max-h-[92vh] w-full ${maxWidthClassName} overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 md:p-6 shadow-2xl ${className}`}
    >
      <div className="mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {title ? (
            <h2 className="text-lg sm:text-2xl font-bold text-slate-900">
              {title}
            </h2>
          ) : null}
          {badge}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="sticky bottom-0 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  </div>
);

export default Modal;
