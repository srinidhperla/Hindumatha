import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { addToCart } from "../../../features/cart/cartSlice";
import {
  addProductReview,
  fetchProductById,
} from "../../../features/products/productSlice";
import { showToast } from "../../../features/uiSlice";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  isProductPurchasable,
} from "../../../utils/productOptions";

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    products,
    product: loadedProduct,
    loading,
    error,
  } = useSelector((state) => state.products);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const product =
    loadedProduct?._id === id
      ? loadedProduct
      : products.find((item) => item._id === id);

  const normalizedProduct = useMemo(() => {
    if (!product) {
      return null;
    }

    const availableFlavors = getAvailableFlavorOptions(product);
    const availableWeights = getAvailableWeightOptions(product);

    return {
      ...product,
      categoryLabel: formatCategoryLabel(product.category),
      availableFlavors,
      availableWeights,
      canOrder: isProductPurchasable(product),
    };
  }, [product]);

  const [selectedFlavor, setSelectedFlavor] = useState(
    normalizedProduct?.availableFlavors?.[0]?.name || "",
  );
  const [selectedWeight, setSelectedWeight] = useState(
    normalizedProduct?.availableWeights?.[0]?.label || "",
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  React.useEffect(() => {
    if (normalizedProduct) {
      setSelectedFlavor(normalizedProduct.availableFlavors[0]?.name || "");
      setSelectedWeight(normalizedProduct.availableWeights[0]?.label || "");
      setQuantity(1);
      setSelectedImage(
        normalizedProduct.images?.[0] || normalizedProduct.image || "",
      );
    }
  }, [normalizedProduct]);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    dispatch(fetchProductById(id));
  }, [dispatch, id]);

  if (!loading && error && !product) {
    return <Navigate to="/menu" replace />;
  }

  if (!normalizedProduct) {
    return (
      <div className="product-page">
        <div className="product-shell py-20 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600 mx-auto" />
        </div>
      </div>
    );
  }

  const galleryImages =
    normalizedProduct.images?.length > 0
      ? normalizedProduct.images
      : [normalizedProduct.image].filter(Boolean);
  const currentUserId = user?._id || user?.id;
  const hasReviewed = (normalizedProduct.reviews || []).some((review) => {
    const reviewUserId = review.user?._id || review.user?.id || review.user;
    return reviewUserId?.toString() === currentUserId?.toString();
  });
  const averageRating = (normalizedProduct.reviews || []).length
    ? (
        normalizedProduct.reviews.reduce(
          (total, review) => total + Number(review.rating || 0),
          0,
        ) / normalizedProduct.reviews.length
      ).toFixed(1)
    : Number(normalizedProduct.rating || 0).toFixed(1);

  const selectedWeightOption =
    normalizedProduct.availableWeights.find(
      (weight) => weight.label === selectedWeight,
    ) || normalizedProduct.availableWeights[0];
  const unitPrice = Math.round(
    Number(normalizedProduct.price || 0) *
      Number(selectedWeightOption?.multiplier || 1),
  );
  const relatedProducts = products
    .filter(
      (item) =>
        item._id !== normalizedProduct._id &&
        item.category === normalizedProduct.category,
    )
    .slice(0, 3);

  const handleAddToCart = (goToCart = false) => {
    if (!normalizedProduct.canOrder) {
      return;
    }

    dispatch(
      addToCart({
        product: normalizedProduct,
        quantity,
        selectedFlavor,
        selectedWeight,
      }),
    );
    dispatch(
      showToast({
        message: `${normalizedProduct.name} added to cart.`,
        type: "success",
      }),
    );

    if (goToCart) {
      navigate("/cart");
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    try {
      await dispatch(
        addProductReview({
          id,
          reviewData: {
            rating: Number(reviewForm.rating),
            comment: reviewForm.comment.trim(),
          },
        }),
      ).unwrap();

      setReviewForm({ rating: 5, comment: "" });
      dispatch(
        showToast({
          message: "Review added successfully.",
          type: "success",
        }),
      );
    } catch (error) {
      dispatch(
        showToast({
          message: error?.message || "Failed to add review.",
          type: "error",
        }),
      );
    }
  };

  return (
    <div className="product-page">
      <div className="product-shell">
        <div className="product-breadcrumbs">
          <Link to="/menu">Menu</Link>
          <span>/</span>
          <span>{normalizedProduct.categoryLabel}</span>
          <span>/</span>
          <span>{normalizedProduct.name}</span>
        </div>

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
                {!normalizedProduct.canOrder && (
                  <span className="product-stock-pill">Out of Stock</span>
                )}
              </div>
              <h1 className="product-title">{normalizedProduct.name}</h1>
              <p className="product-description">
                {normalizedProduct.description}
              </p>
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

              <label className="block">
                <span className="product-field-label">Weight</span>
                <select
                  value={selectedWeight}
                  onChange={(event) => setSelectedWeight(event.target.value)}
                  className="product-select"
                >
                  {normalizedProduct.availableWeights.map((weight) => (
                    <option key={weight.label} value={weight.label}>
                      {weight.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="product-quantity-row">
              <span className="product-field-label">Quantity</span>
              <div className="product-quantity-box">
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
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

        {relatedProducts.length > 0 && (
          <section className="product-related-section">
            <div className="product-related-header">
              <h2 className="product-related-title">
                More in {normalizedProduct.categoryLabel}
              </h2>
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
                    <h3 className="product-related-name">
                      {relatedProduct.name}
                    </h3>
                    <p className="product-related-price">
                      Rs.
                      {Number(relatedProduct.price || 0).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="product-related-section">
          <div className="product-related-header">
            <h2 className="product-related-title">Ratings and Reviews</h2>
            <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
              {averageRating} / 5 | {(normalizedProduct.reviews || []).length}{" "}
              reviews
            </div>
          </div>

          {isAuthenticated ? (
            hasReviewed ? (
              <div className="mb-6 rounded-2xl border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-700">
                You have already reviewed this product.
              </div>
            ) : (
              <form
                onSubmit={handleReviewSubmit}
                className="mb-8 grid gap-4 rounded-2xl border border-cream-100 bg-cream-50 p-4"
              >
                <div className="grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
                  <label>
                    <span className="product-field-label">Rating</span>
                    <select
                      value={reviewForm.rating}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          rating: event.target.value,
                        }))
                      }
                      className="product-select"
                    >
                      {[5, 4, 3, 2, 1].map((ratingValue) => (
                        <option key={ratingValue} value={ratingValue}>
                          {ratingValue} Star{ratingValue === 1 ? "" : "s"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="product-field-label">Comment</span>
                    <textarea
                      rows={3}
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((current) => ({
                          ...current,
                          comment: event.target.value,
                        }))
                      }
                      className="product-select"
                      placeholder="Tell other customers what you liked"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="product-button product-button--primary"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="mb-6 rounded-2xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-primary-600">
              <Link to="/login" className="font-semibold text-primary-600">
                Login
              </Link>{" "}
              to add a review.
            </div>
          )}

          <div className="space-y-4">
            {(normalizedProduct.reviews || []).length > 0 ? (
              normalizedProduct.reviews.map((review, index) => (
                <div
                  key={`${review.user?._id || index}-${review.date || index}`}
                  className="rounded-2xl border border-cream-100 bg-cream-50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-primary-800">
                        {review.user?.name || "Customer"}
                      </p>
                      <p className="text-sm text-primary-500">
                        {new Date(review.date || Date.now()).toLocaleDateString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                    <div className="rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
                      {review.rating}/5
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="mt-3 text-sm leading-6 text-primary-600">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-cream-100 bg-cream-50 px-4 py-8 text-center text-sm text-primary-500">
                No reviews yet. Be the first to rate this product.
              </div>
            )}
          </div>
        </section>
      </div>

      {isImageViewerOpen && (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImageViewerOpen(false)}
        >
          <button
            type="button"
            className="product-lightbox-close"
            onClick={() => setIsImageViewerOpen(false)}
          >
            Close
          </button>
          <img
            src={selectedImage || galleryImages[0]}
            alt={normalizedProduct.name}
            className="product-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
