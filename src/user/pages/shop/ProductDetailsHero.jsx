import React from "react";
import { isEggTypeAvailable } from "@/utils/productOptions";

const ProductDetailsHero = ({
  normalizedProduct,
  galleryImages,
  selectedImage,
  setSelectedImage,
  setIsImageViewerOpen,
  selectedFlavor,
  setSelectedFlavor,
  filteredWeights,
  selectedWeight,
  setSelectedWeight,
  selectedEggType,
  setSelectedEggType,
  quantity,
  setQuantity,
  unitPrice,
  handleAddToCart,
}) => (
  <section className="product-hero-card">
    <div className="product-media-panel">
      <img
        src={selectedImage || galleryImages[0]}
        alt={normalizedProduct.name}
        className="product-hero-image"
        onClick={() => setIsImageViewerOpen(true)}
      />
      {galleryImages.length > 1 && (
        <div className="product-thumbnail-grid">
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`product-thumbnail-button ${
                (selectedImage || galleryImages[0]) === image
                  ? "product-thumbnail-button--active"
                  : ""
              }`}
            >
              <img
                src={image}
                alt={`${normalizedProduct.name} ${index + 1}`}
                className="product-thumbnail-image"
              />
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="product-content-panel">
      <div className="product-header-stack">
        <div className="product-badges-row">
          <span className="product-category-pill">
            {normalizedProduct.categoryLabel}
          </span>
          {normalizedProduct.isEgg !== false &&
            isEggTypeAvailable(normalizedProduct, "egg") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                Egg
              </span>
            )}
          {normalizedProduct.isEggless === true &&
            isEggTypeAvailable(normalizedProduct, "eggless") && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600 ring-1 ring-green-200">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                Eggless
              </span>
            )}
          {!normalizedProduct.canOrder && (
            <span className="product-stock-pill">Out of Stock</span>
          )}
        </div>
        <h1 className="product-title">{normalizedProduct.name}</h1>
        <p className="product-description">{normalizedProduct.description}</p>
      </div>

      <div className="product-price-card">
        <p className="product-price-label">Selected price</p>
        <p className="product-price-value">
          Rs.{unitPrice.toLocaleString("en-IN")}
        </p>
        <p className="product-price-note">
          Base price starts at Rs.
          {Number(normalizedProduct.price || 0).toLocaleString("en-IN")}
        </p>
      </div>

      <div className="product-option-grid">
        {normalizedProduct.hasExplicitFlavors && (
          <label className="block">
            <span className="product-field-label">Flavor</span>
            <select
              value={selectedFlavor}
              onChange={(event) => setSelectedFlavor(event.target.value)}
              className="product-select"
            >
              {normalizedProduct.availableFlavors.map((flavor) => (
                <option key={flavor.name} value={flavor.name}>
                  {flavor.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block">
          <span className="product-field-label">
            {normalizedProduct.portionTypeMeta.heading}
          </span>
          <select
            value={selectedWeight}
            onChange={(event) => setSelectedWeight(event.target.value)}
            className="product-select"
          >
            {filteredWeights.map((weight) => (
              <option key={weight.label} value={weight.label}>
                {weight.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(() => {
        const eggOn =
          normalizedProduct.isEgg !== false &&
          isEggTypeAvailable(normalizedProduct, "egg");
        const egglessOn =
          normalizedProduct.isEggless === true &&
          isEggTypeAvailable(normalizedProduct, "eggless");
        if (!eggOn && !egglessOn) return null;
        return (
          <div className="mt-4">
            <span className="product-field-label">Cake Type</span>
            <div className="mt-2 flex gap-3">
              {eggOn && (
                <button
                  type="button"
                  onClick={() => setSelectedEggType("egg")}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    selectedEggType === "egg"
                      ? "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-300"
                      : "border-primary-200 bg-cream-50 text-primary-600 hover:bg-cream-100"
                  }`}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-red-500" />
                  Egg
                </button>
              )}
              {egglessOn && (
                <button
                  type="button"
                  onClick={() => setSelectedEggType("eggless")}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    selectedEggType === "eggless"
                      ? "border-green-400 bg-green-50 text-green-700 ring-1 ring-green-300"
                      : "border-primary-200 bg-cream-50 text-primary-600 hover:bg-cream-100"
                  }`}
                >
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                  Eggless
                </button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="product-quantity-row">
        <span className="product-field-label">Quantity</span>
        <div className="product-quantity-box">
          <button
            type="button"
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
            className="product-quantity-button"
          >
            -
          </button>
          <span className="product-quantity-value">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((current) => current + 1)}
            className="product-quantity-button"
          >
            +
          </button>
        </div>
      </div>

      <div className="product-actions-row">
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!normalizedProduct.canOrder}
          className="product-button product-button--secondary"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(true)}
          disabled={!normalizedProduct.canOrder}
          className="product-button product-button--primary"
        >
          Buy Now
        </button>
      </div>
    </div>
  </section>
);

export default ProductDetailsHero;
