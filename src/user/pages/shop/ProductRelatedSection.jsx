import React from "react";
import { Link } from "react-router-dom";

const ProductRelatedSection = ({ relatedProducts, categoryLabel }) => {
  if (!relatedProducts.length) {
    return null;
  }

  return (
    <section className="product-related-section">
      <div className="product-related-header">
        <h2 className="product-related-title">More in {categoryLabel}</h2>
        <Link to="/menu" className="product-related-link">
          Back to menu
        </Link>
      </div>
      <div className="product-related-grid">
        {relatedProducts.map((relatedProduct) => (
          <Link
            key={relatedProduct._id}
            to={`/products/${relatedProduct._id}`}
            className="product-related-card"
          >
            <img
              src={relatedProduct.image}
              alt={relatedProduct.name}
              className="product-related-image"
            />
            <div className="product-related-body">
              <h3 className="product-related-name">{relatedProduct.name}</h3>
              <p className="product-related-price">
                Rs.{Number(relatedProduct.price || 0).toLocaleString("en-IN")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ProductRelatedSection;
