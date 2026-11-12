import React from "react";

/* Compact form pieces for workspace pop-ups and settings screens. A section
 * is a labelled block separated by a hairline — not a card inside a card. */

export const fieldClass = "ws-input";

export const FormSection = ({ title, action, className = "", children }) => (
  <section className={`ws-form-section ${className}`}>
    {(title || action) && (
      <div className="mb-2.5 flex items-center justify-between gap-3">
        {title && <h3 className="ws-eyebrow">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const FormField = ({ label, hint, className = "", children }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-xs font-semibold text-[#5c4a26]">
      {label}
    </span>
    {children}
    {hint && (
      <span className="mt-1 block text-[11px] text-[#8a7a5c]">{hint}</span>
    )}
  </label>
);

/* A small pill with a remove button — selected flavours, tags and the like. */
export const RemovableChip = ({ children, onRemove, label }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-[#e3d7bb] bg-[#faf6ec] py-1 pl-3 pr-1 text-xs font-semibold text-[#1f1709]">
    {children}
    <button
      type="button"
      onClick={onRemove}
      aria-label={label || "Remove"}
      className="flex h-5 w-5 items-center justify-center rounded-full text-[#8a7a5c] hover:bg-[#f1cdc6] hover:text-[#a3271b]"
    >
      ×
    </button>
  </span>
);

/* A dashed "+ label" pill for one-tap suggestions. */
export const SuggestChip = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="rounded-full border border-dashed border-[#d9c48a] px-2.5 py-1 text-xs font-medium text-[#5c4a26] hover:border-[#c9a84c] hover:bg-[#faf6ec]"
  >
    + {children}
  </button>
);
