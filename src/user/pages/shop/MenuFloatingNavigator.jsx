import React from "react";

const MenuFloatingNavigator = ({
  isOpen,
  categories,
  activeCategory,
  onOpen,
  onClose,
  onSelectCategory,
}) => {
  if (!categories.length) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="menu-floating-nav-trigger"
        aria-expanded={isOpen}
        aria-controls="menu-floating-nav-sheet"
      >
        <span className="menu-floating-nav-trigger-icon" aria-hidden="true">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M7 4v5.5M5.7 4v3.6M8.3 4v3.6M5.7 9.5h2.6M7 9.5V20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.7}
              d="M15.5 4v10.2M18.3 4v16M15.5 14.2c1.55 0 2.8-1.9 2.8-4.25S17.05 4 15.5 4"
            />
          </svg>
        </span>
        <span>Menu</span>
      </button>

      <div
        className={`menu-floating-nav-layer ${
          isOpen
            ? "menu-floating-nav-layer--open"
            : "menu-floating-nav-layer--closed"
        }`}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          className="menu-floating-nav-backdrop"
          onClick={onClose}
          aria-label="Close menu categories"
        />

        <div
          id="menu-floating-nav-sheet"
          className="menu-floating-nav-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menu categories"
        >
          <div className="menu-floating-nav-header">
            <div>
              <p className="menu-floating-nav-kicker">Browse</p>
              <h2 className="menu-floating-nav-title">Menu categories</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="menu-floating-nav-close"
              aria-label="Close menu categories"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            </button>
          </div>

          <div className="menu-floating-nav-list custom-scrollbar">
            {categories.map((category) => {
              const isActive = category === activeCategory;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`menu-floating-nav-item ${
                    isActive
                      ? "menu-floating-nav-item--active"
                      : "menu-floating-nav-item--inactive"
                  }`}
                >
                  <span className="menu-floating-nav-item-label">
                    {category}
                  </span>
                  {isActive && (
                    <span
                      className="menu-floating-nav-item-indicator"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MenuFloatingNavigator;
