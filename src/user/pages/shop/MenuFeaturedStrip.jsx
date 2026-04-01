import React from "react";
import { OptimizedImage } from "@/shared/ui";
import { formatINR } from "@/utils/currency";

const MenuFeaturedStrip = ({ featuredProducts, openImagePreview }) => {
  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="menu-featured-strip">
      <div className="menu-section-head">
        <div>
          <p className="menu-section-kicker">Featured</p>
          <h2 className="menu-section-title">Popular picks today</h2>
        </div>
      </div>
      <div className="menu-featured-grid custom-scrollbar">
        {featuredProducts.map((product) => (
          <button
            key={product._id}
            type="button"
            onClick={() => openImagePreview(product)}
            className="menu-featured-card"
          >
            <OptimizedImage
              src={product.primaryImage}
              alt={product.name}
              width={320}
              height={220}
              maxWidth={500}
              loading="lazy"
              className="menu-featured-image"
            />
            <div className="menu-featured-body">
              <span className="menu-featured-category">
                {product.categoryLabel}
              </span>
              <h3>{product.name}</h3>
              <p>Starts at {formatINR(product.price)}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default MenuFeaturedStrip;
