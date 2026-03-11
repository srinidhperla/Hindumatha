import React from "react";

const toneMap = {
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const Alert = ({ children, tone = "info", className = "" }) => (
  <div
    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${toneMap[tone] || toneMap.info} ${className}`}
  >
    {children}
  </div>
);

export default Alert;
