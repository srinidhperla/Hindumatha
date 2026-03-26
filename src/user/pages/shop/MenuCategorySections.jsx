import React from "react";
import { Link } from "react-router-dom";
import { isEggTypeAvailable } from "@/utils/productOptions";

const MenuCategorySections = ({
  categorySections,
  openImagePreview,
  openQuickAdd,
  highlightedProductId,
}) => (
  <div className="menu-sections">
    {categorySections.map((section) => (
      <section key={section.category} className="menu-section-block">
        <div className="menu-section-head">
          <div>
            <p className="menu-section-kicker">{section.items.length} items</p>
            <h2 className="menu-section-title">{section.category}</h2>
          </div>
        </div>
        <div className="menu-items-grid">
          {section.items.map((product, productIndex) => (
            <article
              key={product._id}
              id={`menu-product-${product._id}`}
              className={`menu-product-card animate-fadeInUp ${
                highlightedProductId === product._id
                  ? "ring-2 ring-[#c9a84c] ring-offset-2 ring-offset-[#fffaf0]"
                  : ""
              }`}
              style={{ animationDelay: `${Math.min(productIndex, 8) * 60}ms` }}
            >
              <div className="menu-product-image-wrap">
                <button
                  type="button"
                  onClick={() => openImagePreview(product)}
                  className="block h-full w-full"
                >
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="menu-product-image"
                  />
                </button>
                {!product.canOrder && (
                  <span className="menu-product-badge-stock">Out of stock</span>
                )}
              </div>

              <div className="menu-product-body">
                <div className="menu-product-header">
                  <button
                    type="button"
                    onClick={() => openImagePreview(product)}
                    className="menu-product-title"
                  >
                    {product.name}
                  </button>
                  <p className="menu-product-price">
                    ?{Number(product.price || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="menu-product-desc">{product.description}</p>
                <div className="menu-product-meta">
                  {product.isEgg !== false &&
                    isEggTypeAvailable(product, "egg") && (
                      <span className="menu-tag menu-tag--egg">
                        <span className="menu-tag-icon">
                          <span className="h-0 w-0 border-l-[3px] border-r-[3px] border-b-[5px] border-l-transparent border-r-transparent border-b-current" />
                        </span>
                        Egg
                      </span>
                    )}
                  {product.isEggless === true &&
                    isEggTypeAvailable(product, "eggless") && (
                      <span className="menu-tag menu-tag--eggless">
                        <span className="menu-tag-icon">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                        </span>
                        Eggless
                      </span>
                    )}
                  <span className="menu-product-meta-text">
                    {product.orderableFlavors.length > 1 ||
                    product.hasExplicitFlavors
                      ? `${product.orderableFlavors.length} flavors`
                      : ""}
                  </span>
                  {(product.hasExplicitFlavors ||
                    product.orderableFlavors.length > 1) && (
                    <span className="menu-meta-separator">�</span>
                  )}
                  <span className="menu-product-meta-text">
                    {product.orderableWeights.length}{" "}
                    {product.portionTypeMeta.heading.toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="menu-product-side">
                <div className="menu-product-actions-row">
                  <Link to="/cart" className="menu-product-view-cart-btn">
                    View Cart
                  </Link>
                  <button
                    type="button"
                    disabled={!product.canOrder}
                    onClick={() => openQuickAdd(product)}
                    className="menu-product-add-btn"
                  >
                    Add +
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    ))}
  </div>
);

export default MenuCategorySections;
