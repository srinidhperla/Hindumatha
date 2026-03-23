import React from "react";
import { Link } from "react-router-dom";

const ProductReviewsSection = ({
  isAuthenticated,
  hasReviewed,
  averageRating,
  reviews,
  reviewForm,
  setReviewForm,
  handleReviewSubmit,
}) => (
  <section className="product-related-section">
    <div className="product-related-header">
      <h2 className="product-related-title">Ratings and Reviews</h2>
      <div className="rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700">
        {averageRating} / 5 | {reviews.length} reviews
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
      {reviews.length > 0 ? (
        reviews.map((review, index) => (
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
);

export default ProductReviewsSection;
