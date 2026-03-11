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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3">
    <div
      className={`max-h-[92vh] w-full ${maxWidthClassName} overflow-y-auto rounded-[32px_14px_32px_14px] border border-slate-200 bg-slate-50 p-4 shadow-2xl sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {title ? (
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
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
