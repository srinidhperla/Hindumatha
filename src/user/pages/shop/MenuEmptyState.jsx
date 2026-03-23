import React from "react";

const MenuEmptyState = ({ clearFilters }) => (
  <div className="menu-empty-state">
    <div className="menu-empty-icon">
      <svg
        className="h-12 w-12 text-primary-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3>No matching items</h3>
    <p>Reset filters and search to see the full bakery menu again.</p>
    <button type="button" onClick={clearFilters} className="menu-clear-button">
      Clear filters
    </button>
  </div>
);

export default MenuEmptyState;
