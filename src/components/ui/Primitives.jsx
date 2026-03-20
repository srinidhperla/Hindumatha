import React from "react";

const join = (...tokens) => tokens.filter(Boolean).join(" ");

export const SurfaceCard = ({ className = "", children }) => (
  <div
    className={join(
      "rounded-3xl border border-[rgba(201,168,76,0.3)] bg-[linear-gradient(165deg,rgba(255,255,255,.95),rgba(255,246,228,.82))] shadow-[0_12px_28px_rgba(18,12,2,0.12)]",
      className,
    )}
  >
    {children}
  </div>
);

export const StatusChip = ({ tone = "neutral", children, className = "" }) => {
  const toneMap = {
    neutral: "border border-[rgba(201,168,76,.3)] bg-[#f9f2df] text-[#6a4c16]",
    success: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border border-amber-200 bg-amber-50 text-amber-700",
    danger: "border border-rose-200 bg-rose-50 text-rose-700",
    info: "border border-sky-200 bg-sky-50 text-sky-700",
    accent: "border border-[rgba(201,168,76,.32)] bg-[#efe1b8] text-[#6a4c16]",
  };

  return (
    <span
      className={join(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneMap[tone] || toneMap.neutral,
        className,
      )}
    >
      {children}
    </span>
  );
};

export const ActionButton = ({
  type = "button",
  variant = "primary",
  className = "",
  disabled = false,
  children,
  ...props
}) => {
  const variantMap = {
    primary:
      "bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] text-white hover:brightness-110 focus:ring-[#c9a84c66] shadow-[0_10px_20px_rgba(122,92,15,.3)]",
    secondary:
      "border border-[rgba(201,168,76,.35)] bg-white text-[#6a4c16] hover:bg-[#f9f2df] focus:ring-[#c9a84c55]",
    soft: "bg-[#f9f2df] text-[#6a4c16] hover:bg-[#f3e4bc] focus:ring-[#c9a84c55]",
    success: "bg-sage-600 text-white hover:bg-sage-500 focus:ring-sage-300",
    danger: "bg-berry-600 text-white hover:bg-berry-500 focus:ring-berry-300",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={join(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold admin-motion focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
        variantMap[variant] || variantMap.primary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Toggle = ({ checked, onClick, disabled = false, label }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={checked}
    className={join(
      "relative inline-flex h-8 w-14 items-center rounded-full p-1 admin-motion",
      checked ? "bg-sage-500" : "bg-primary-200",
      disabled ? "opacity-60" : "",
    )}
  >
    <span className="sr-only">{label || "toggle"}</span>
    <span
      className={join(
        "h-6 w-6 rounded-full bg-white shadow-sm admin-motion-transform",
        checked ? "translate-x-6" : "translate-x-0",
      )}
    />
  </button>
);
