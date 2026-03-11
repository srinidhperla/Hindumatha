import React from "react";

export const MetricCard = ({ title, value, subtitle, highlight = false }) => (
  <div
    className={`rounded-2xl border p-6 shadow-sm transition-all duration-200 ${
      highlight
        ? "border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50"
        : "border-gray-100 bg-white"
    }`}
  >
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-3 text-2xl font-bold text-gray-900">{value}</p>
    <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
  </div>
);

export const LoadingState = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin" />
  </div>
);

export const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-40 text-center">
    <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mb-3">
      <svg
        className="w-6 h-6 text-pink-400"
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
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);
