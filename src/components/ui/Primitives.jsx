import React from "react";

const join = (...tokens) => tokens.filter(Boolean).join(" ");

export const SurfaceCard = ({ className = "", children }) => (
  <div
    className={join(
      "rounded-3xl border border-primary-100 bg-white/95 shadow-warm",
      className,
    )}
  >
    {children}
  </div>
);

export const StatusChip = ({ tone = "neutral", children, className = "" }) => {
  const toneMap = {
    neutral: "bg-cream-200 text-primary-700",
    success: "bg-sage-100 text-sage-700",
    warning: "bg-caramel-100 text-caramel-800",
    danger: "bg-berry-100 text-berry-700",
    info: "bg-primary-100 text-primary-700",
    accent: "bg-caramel-100 text-caramel-700",
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
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-300 shadow-warm",
    secondary:
      "border border-primary-200 bg-white text-primary-700 hover:bg-cream-100 focus:ring-primary-200",
    soft: "bg-cream-100 text-primary-700 hover:bg-cream-200 focus:ring-primary-200",
    success: "bg-sage-600 text-white hover:bg-sage-500 focus:ring-sage-300",
    danger: "bg-berry-600 text-white hover:bg-berry-500 focus:ring-berry-300",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={join(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55",
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
      "relative inline-flex h-8 w-14 items-center rounded-full p-1 transition",
      checked ? "bg-sage-500" : "bg-primary-200",
      disabled ? "opacity-60" : "",
    )}
  >
    <span className="sr-only">{label || "toggle"}</span>
    <span
      className={join(
        "h-6 w-6 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-6" : "translate-x-0",
      )}
    />
  </button>
);
