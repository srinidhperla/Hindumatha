import React from "react";

const MenuControls = ({
  searchTerm,
  setSearchTerm,
  categories,
  selectedCategory,
  setSelectedCategory,
}) => (
  <div className="menu-controls-sticky">
    <div className="menu-search-wrap">
      <svg
        className="menu-search-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search cakes, pastries, breads..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        className="menu-search-input"
      />
    </div>
    <div className="menu-categories-rail custom-scrollbar">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => setSelectedCategory(category)}
          className={`menu-category-pill ${
            selectedCategory === category
              ? "menu-category-pill--active"
              : "menu-category-pill--inactive"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  </div>
);

export default MenuControls;
