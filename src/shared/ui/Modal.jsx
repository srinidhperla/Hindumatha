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
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(18,12,2,0.72)] p-0 backdrop-blur-sm sm:items-center sm:p-3">
    <div
      className={`max-h-[95vh] w-full ${maxWidthClassName} overflow-y-auto rounded-t-3xl border border-gold-200/70 bg-[linear-gradient(155deg,rgba(255,255,255,0.98),rgba(253,247,234,0.96))] p-4 shadow-[0_34px_70px_rgba(18,12,2,0.34)] sm:max-h-[92vh] sm:rounded-3xl sm:p-5 md:p-6 ${className}`}
    >
      <div className="mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {title ? (
            <h2 className="font-playfair text-lg font-bold text-primary-900 sm:text-2xl">
              {title}
            </h2>
          ) : null}
          {badge}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-primary-200 bg-white px-3 py-1.5 text-sm font-semibold text-primary-700 transition hover:border-caramel-300 hover:bg-caramel-50"
          >
            Close
          </button>
        ) : null}
      </div>
      {children}
      {footer ? (
        <div className="sticky bottom-0 mt-5 rounded-2xl border border-primary-200 bg-white/95 p-3 backdrop-blur">
          {footer}
        </div>
      ) : null}
    </div>
  </div>
);

export default Modal;
