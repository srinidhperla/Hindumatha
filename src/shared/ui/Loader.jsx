import React from "react";

const Loader = ({ label = "Loading...", className = "" }) => (
  <div className={`flex items-center justify-center gap-3 py-6 ${className}`}>
    <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    <span className="text-sm font-medium text-primary-600">{label}</span>
  </div>
);

export default Loader;
