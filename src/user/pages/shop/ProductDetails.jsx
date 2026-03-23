import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { addToCart } from "@/features/cart/cartSlice";
import {
  addProductReview,
  fetchProductById,
} from "@/features/products/productSlice";
import { showToast } from "@/features/uiSlice";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getVariantPrice,
  isEggTypeAvailable,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import ProductDetailsHero from "./ProductDetailsHero";
import ProductImageLightbox from "./ProductImageLightbox";
import ProductRelatedSection from "./ProductRelatedSection";
import ProductReviewsSection from "./ProductReviewsSection";

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
      portionTypeMeta: getPortionTypeMeta(product.portionType),
      availableFlavors,
      availableWeights,
      canOrder: isProductPurchasable(product),
      hasExplicitFlavors: normalizeFlavorOptions(product).length > 0,
    };
  }, [product]);

  const [selectedFlavor, setSelectedFlavor] = useState(
    normalizedProduct?.availableFlavors?.[0]?.name || "",
  );
  const [selectedWeight, setSelectedWeight] = useState(
    normalizedProduct?.availableWeights?.[0]?.label || "",
  );
  const [selectedEggType, setSelectedEggType] = useState(() => {
    if (!normalizedProduct) return "";
    const hasEgg =
      normalizedProduct.isEgg !== false &&
      isEggTypeAvailable(normalizedProduct, "egg");
    const hasEggless =
      normalizedProduct.isEggless === true &&
      isEggTypeAvailable(normalizedProduct, "eggless");
    if (hasEgg && !hasEggless) return "egg";
    if (!hasEgg && hasEggless) return "eggless";
    if (hasEgg) return "egg";
    return "";
  });
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  React.useEffect(() => {
    if (normalizedProduct) {
      setSelectedFlavor(
        normalizedProduct.hasExplicitFlavors
          ? normalizedProduct.availableFlavors[0]?.name || ""
          : "",
      );
      const hasEgg =
        normalizedProduct.isEgg !== false &&
        isEggTypeAvailable(normalizedProduct, "egg");
      const hasEggless =
        normalizedProduct.isEggless === true &&
        isEggTypeAvailable(normalizedProduct, "eggless");
      if (hasEgg && !hasEggless) setSelectedEggType("egg");
      else if (!hasEgg && hasEggless) setSelectedEggType("eggless");
      else if (hasEgg) setSelectedEggType("egg");
      else setSelectedEggType("");
      setQuantity(1);
      setSelectedImage(
        normalizedProduct.images?.[0] || normalizedProduct.image || "",
      );
    }
  }, [normalizedProduct]);

  // Dynamically filter weights based on selected flavor + egg type
  const filteredWeights = useMemo(() => {
    if (!normalizedProduct) return [];
    const flavor =
      selectedFlavor || normalizedProduct.availableFlavors[0]?.name || "";
    if (!flavor) return normalizedProduct.availableWeights;
    return getAvailableWeightOptions(
      normalizedProduct,
      flavor,
      selectedEggType,
    );
  }, [normalizedProduct, selectedFlavor, selectedEggType]);

  // Auto-select weight when filtered weights change
  React.useEffect(() => {
    if (!normalizedProduct) return;
    if (filteredWeights.length === 1) {
      setSelectedWeight(filteredWeights[0].label);
    } else if (
      filteredWeights.length > 0 &&
      !filteredWeights.some((w) => w.label === selectedWeight)
    ) {
      setSelectedWeight(filteredWeights[0].label);
    } else if (filteredWeights.length === 0) {
      setSelectedWeight("");
    }
  }, [filteredWeights, normalizedProduct]);

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
    filteredWeights.find((weight) => weight.label === selectedWeight) ||
    filteredWeights[0] ||
    normalizedProduct.availableWeights[0];
  const unitPrice = Math.round(
    getVariantPrice(normalizedProduct, {
      flavorName: selectedFlavor,
      weightLabel: selectedWeightOption?.label || "",
      eggType: selectedEggType,
    }),
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
        selectedFlavor: normalizedProduct.hasExplicitFlavors
          ? selectedFlavor
          : "",
        selectedWeight,
        selectedEggType,
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

        <ProductDetailsHero
          normalizedProduct={normalizedProduct}
          galleryImages={galleryImages}
          selectedImage={selectedImage}
          setSelectedImage={setSelectedImage}
          setIsImageViewerOpen={setIsImageViewerOpen}
          selectedFlavor={selectedFlavor}
          setSelectedFlavor={setSelectedFlavor}
          filteredWeights={filteredWeights}
          selectedWeight={selectedWeight}
          setSelectedWeight={setSelectedWeight}
          selectedEggType={selectedEggType}
          setSelectedEggType={setSelectedEggType}
          quantity={quantity}
          setQuantity={setQuantity}
          unitPrice={unitPrice}
          handleAddToCart={handleAddToCart}
        />

        <ProductRelatedSection
          relatedProducts={relatedProducts}
          categoryLabel={normalizedProduct.categoryLabel}
        />

        <ProductReviewsSection
          isAuthenticated={isAuthenticated}
          hasReviewed={hasReviewed}
          averageRating={averageRating}
          reviews={normalizedProduct.reviews || []}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          handleReviewSubmit={handleReviewSubmit}
        />
      </div>

      <ProductImageLightbox
        isOpen={isImageViewerOpen}
        image={selectedImage || galleryImages[0]}
        alt={normalizedProduct.name}
        onClose={() => setIsImageViewerOpen(false)}
      />
    </div>
  );
};

export default ProductDetails;
