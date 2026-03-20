import React from "react";

export const MetricCard = ({ title, value, subtitle, highlight = false }) => (
  <div
    className={`rounded-2xl border p-6 shadow-[0_10px_22px_rgba(18,12,2,0.12)] admin-motion hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(18,12,2,0.16)] ${
      highlight
        ? "border-[rgba(201,168,76,0.4)] bg-[linear-gradient(155deg,rgba(255,252,240,.95),rgba(245,230,186,.62))]"
        : "border-[rgba(201,168,76,0.3)] bg-[linear-gradient(165deg,rgba(255,255,255,.95),rgba(255,246,228,.78))]"
    }`}
  >
    <p className="text-sm font-medium text-[#7a5c0f]">{title}</p>
    <p className="mt-3 text-2xl font-bold text-[#2a1f0e]">{value}</p>
    <p className="mt-2 text-sm text-[#6a5130]">{subtitle}</p>
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
    <p className="text-sm text-[#6a5130]">{message}</p>
  </div>
);
