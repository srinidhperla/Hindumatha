import React from "react";

const GalleryGrid = ({
  categories,
  selectedCategory,
  onCategoryChange,
  filteredItems,
  onSelectImage,
}) => (
  <>
    <div className="gallery-filter-wrap">
      <div className="gallery-filter-card">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`gallery-filter-pill ${
              selectedCategory === category
                ? "gallery-filter-pill--active"
                : "gallery-filter-pill--inactive"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>

    <div className="gallery-grid">
      {filteredItems.map((item, index) => (
        <div
          key={item._id}
          className={`gallery-card ${index === 0 ? "sm:col-span-2 sm:row-span-2" : ""}`}
          onClick={() => onSelectImage(item)}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="aspect-square overflow-hidden">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
        </div>
      ))}
    </div>
  </>
);

export default GalleryGrid;
