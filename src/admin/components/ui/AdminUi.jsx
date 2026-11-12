import React from "react";

export const MetricCard = ({ title, value, subtitle, highlight = false }) => (
  <div
    className={`ws-card px-4 py-3.5 ${
      highlight ? "!border-[rgba(201,168,76,0.55)] !bg-[#faf6ec]" : ""
    }`}
  >
    <p className="ws-eyebrow">{title}</p>
    <p className="mt-1 text-[26px] font-bold leading-tight text-[#1f1709]">
      {value}
    </p>
    {subtitle ? (
      <p className="mt-0.5 truncate text-xs text-[#7d6c4d]">{subtitle}</p>
    ) : null}
  </div>
);

export const LoadingState = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-10 h-10 rounded-full border-4 border-[#f3e4bc] border-t-[#7a5c0f] animate-spin" />
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 text-center">
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8eed2]">
      <svg
        className="w-6 h-6 text-[#8b6914]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v10a2 2 0 01-2 2z"
        />
      </svg>
    </div>
    <p className="text-sm text-[#7d6c4d]">{message}</p>
  </div>
);
