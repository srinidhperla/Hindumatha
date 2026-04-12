import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/features/cart/cartSlice";
import { fetchProducts } from "@/features/products/productSlice";
import { showToast } from "@/features/uiSlice";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getMenuWeightVariantCount,
  getPortionTypeMeta,
  getOrderableFlavors,
  getOrderableWeights,
  isEggTypeAvailable,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import { isCategoryActive } from "@/utils/categorySettings";
import SeoMeta from "@/shared/seo/SeoMeta";
import { MenuItemSkeleton } from "@/shared/ui/Skeleton";
import MenuCategorySections from "./MenuCategorySections";
import MenuControls from "./MenuControls";
import MenuCustomOrderCta from "./MenuCustomOrderCta";
import MenuEmptyState from "./MenuEmptyState";
import MenuFeaturedStrip from "./MenuFeaturedStrip";
import MenuImagePreviewModal from "./MenuImagePreviewModal";
import MenuQuickAddModal from "./MenuQuickAddModal";

const Menu = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedProductId, setHighlightedProductId] = useState("");
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const [quickAddFlavor, setQuickAddFlavor] = useState("");
  const [quickAddWeight, setQuickAddWeight] = useState("");
  const [quickAddEggType, setQuickAddEggType] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [quickAddErrors, setQuickAddErrors] = useState({
    cakeType: "",
    flavor: "",
    weight: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryScheduled, setRetryScheduled] = useState(false);
  const { products, loading, error } = useSelector((state) => state.products);
  const { categoryOrder = [], categorySettings = [] } = useSelector(
    (state) => state.site,
  );

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (!error || loading) {
      setLoadError(false);
      setRetryScheduled(false);
      return undefined;
    }

    setLoadError(true);

    if (retryCount >= 1 || retryScheduled) {
      return undefined;
    }

    setRetryScheduled(true);
    const retryTimer = window.setTimeout(() => {
      setRetryCount((prev) => prev + 1);
      dispatch(fetchProducts({ force: true }));
    }, 3000);

    return () => window.clearTimeout(retryTimer);
  }, [dispatch, error, loading, retryCount, retryScheduled]);

  const normalizedProducts = useMemo(
    () => {
      const categoryOrderMap = new Map(
        categoryOrder.map((category, index) => [String(category), index]),
      );

      return products
        .map((product) => ({
        ...product,
        primaryImage: optimizeProductImageUrl(product.images?.[0] || product.image),
        image: optimizeProductImageUrl(product.image),
        images: Array.isArray(product.images)
          ? product.images.map((image) => optimizeProductImageUrl(image))
          : product.images,
        categoryLabel: formatCategoryLabel(product.category),
        portionTypeMeta: getPortionTypeMeta(product.portionType),
        availableFlavors: getAvailableFlavorOptions(product),
        availableWeights: getAvailableWeightOptions(product),
        menuWeightVariantCount: getMenuWeightVariantCount(product),
        orderableFlavors: getOrderableFlavors(product),
        orderableWeights: getOrderableWeights(product),
        canOrder: isProductPurchasable(product),
        hasExplicitFlavors: normalizeFlavorOptions(product).length > 0,
        }))
        .sort((left, right) => {
          const leftCategoryOrder = categoryOrderMap.get(left.category) ?? 999;
          const rightCategoryOrder =
            categoryOrderMap.get(right.category) ?? 999;
          if (leftCategoryOrder !== rightCategoryOrder) {
            return leftCategoryOrder - rightCategoryOrder;
          }

          const leftDisplayOrder = Number(left.displayOrder);
          const rightDisplayOrder = Number(right.displayOrder);
          if (
            Number.isFinite(leftDisplayOrder) &&
            Number.isFinite(rightDisplayOrder) &&
            leftDisplayOrder !== rightDisplayOrder
          ) {
            return leftDisplayOrder - rightDisplayOrder;
          }

          return left.name.localeCompare(right.name);
        });
    },
    [categoryOrder, products],
  );

  // Products visible on menu: all that aren't master-toggled OFF
  const visibleProducts = useMemo(
    () =>
      normalizedProducts
        .filter((product) => product.isAvailable !== false)
        .filter((product) => isCategoryActive(categorySettings, product.category))
        .filter((product) => product.isAddon !== true),
    [categorySettings, normalizedProducts],
  );

  // Derive quickAddProduct from latest normalizedProducts so it stays in sync
  const quickAddProduct = useMemo(
    () =>
      quickAddProductId
        ? normalizedProducts.find((p) => p._id === quickAddProductId) || null
        : null,
    [quickAddProductId, normalizedProducts],
  );
  const quickAddPortionMeta =
    quickAddProduct?.portionTypeMeta || getPortionTypeMeta("weight");

  const categories = [
    "All",
    ...new Set(
      visibleProducts.map((product) => product.categoryLabel).filter(Boolean),
    ),
  ];

  useEffect(() => {
    if (selectedCategory !== "All" && !categories.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categories, selectedCategory]);

  const filteredProducts = visibleProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.categoryLabel === selectedCategory;
    const haystack =
      `${product.name} ${product.description} ${product.categoryLabel}`.toLowerCase();
    return matchesCategory && haystack.includes(searchTerm.toLowerCase());
  });

  const featuredProducts = visibleProducts.filter(
    (product) => product.isFeatured && product.canOrder,
  );
  const categorySections = categories
    .filter((category) => category !== "All")
    .map((category) => ({
      category,
      items: filteredProducts.filter(
        (product) => product.categoryLabel === category,
      ),
    }))
    .filter((section) => section.items.length > 0);

  const targetProductId = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("product") || "";
  }, [location.search]);

  const targetSearchTerm = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return query.get("search") || "";
  }, [location.search]);

  useEffect(() => {
    const normalizedSearchTerm = String(targetSearchTerm || "").trim();
    setSearchTerm(normalizedSearchTerm);

    if (normalizedSearchTerm) {
      setSelectedCategory("All");
    }
  }, [targetSearchTerm]);

  useEffect(() => {
    if (!targetProductId) {
      setHighlightedProductId("");
      return;
    }

    const targetProduct = visibleProducts.find(
      (product) => product._id === targetProductId,
    );
    if (!targetProduct) {
      return;
    }

    if (
      targetProduct.categoryLabel &&
      selectedCategory !== "All" &&
      selectedCategory !== targetProduct.categoryLabel
    ) {
      setSelectedCategory(targetProduct.categoryLabel);
    }

    if (searchTerm) {
      setSearchTerm("");
    }

    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(
        `menu-product-${targetProductId}`,
      );
      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedProductId(targetProductId);

      setTimeout(() => {
        setHighlightedProductId((currentId) =>
          currentId === targetProductId ? "" : currentId,
        );
      }, 1800);
    }, 120);

    return () => clearTimeout(scrollTimer);
  }, [
    targetProductId,
    visibleProducts,
    selectedCategory,
    searchTerm,
    setSelectedCategory,
    setSearchTerm,
  ]);

  const openQuickAdd = (product) => {
    if (!product.canOrder) return;
    setQuickAddProductId(product._id);
    setQuickAddErrors({
      cakeType: "",
      flavor: "",
      weight: "",
    });
    // Keep fallback only for internal weight availability filtering.
    if (!product.hasExplicitFlavors) {
      setQuickAddFlavor(product.availableFlavors[0]?.name || "Cake");
    } else {
      setQuickAddFlavor("");
    }
    // Determine egg type � auto-select only when just one type exists
    const hasEgg =
      product.isEgg !== false && isEggTypeAvailable(product, "egg");
    const hasEggless =
      product.isEggless === true && isEggTypeAvailable(product, "eggless");
    if (hasEgg && !hasEggless) setQuickAddEggType("egg");
    else if (!hasEgg && hasEggless) setQuickAddEggType("eggless");
    else setQuickAddEggType("");
    setQuickAddWeight("");
    setQuickAddQuantity(1);
  };

  const closeQuickAdd = () => {
    setQuickAddProductId(null);
    setQuickAddFlavor("");
    setQuickAddWeight("");
    setQuickAddEggType("");
    setQuickAddQuantity(1);
    setQuickAddErrors({
      cakeType: "",
      flavor: "",
      weight: "",
    });
  };

  const openImagePreview = (product) => {
    setImagePreview({
      src: optimizeProductImageUrl(product.images?.[0] || product.image, {
        width: 1400,
      }),
      name: product.name,
    });
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  const clearFilters = () => {
    setSelectedCategory("All");
    setSearchTerm("");
  };

  const scrollToQuickAddField = (targetId) => {
    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const setQuickAddFieldError = (field, message) => {
    setQuickAddErrors((current) => ({
      ...current,
      [field]: message,
    }));
  };

  const clearQuickAddFieldError = (field) => {
    setQuickAddErrors((current) =>
      current[field]
        ? {
            ...current,
            [field]: "",
          }
        : current,
    );
  };

  const handleQuickAddEggTypeSelect = (nextEggType) => {
    setQuickAddEggType(nextEggType);
    clearQuickAddFieldError("cakeType");
  };

  const handleQuickAddFlavorSelect = (nextFlavor) => {
    const needsEggType =
      quickAddProduct?.isEgg !== false && quickAddProduct?.isEggless === true;

    if (needsEggType && !quickAddEggType) {
      setQuickAddFieldError("flavor", "Please select Cake Type first");
      scrollToQuickAddField("quick-add-flavor");
      return;
    }

    setQuickAddFlavor(nextFlavor);
    clearQuickAddFieldError("flavor");
    clearQuickAddFieldError("weight");
  };

  const handleQuickAddWeightSelect = (nextWeight) => {
    const needsEggType =
      quickAddProduct?.isEgg !== false && quickAddProduct?.isEggless === true;

    if (needsEggType && !quickAddEggType) {
      setQuickAddFieldError("weight", "Please select Cake Type first");
      scrollToQuickAddField("quick-add-weight");
      return;
    }

    if (quickAddProduct?.hasExplicitFlavors && !quickAddFlavor) {
      setQuickAddFieldError("weight", "Please select a Flavor first");
      scrollToQuickAddField("quick-add-weight");
      return;
    }

    setQuickAddWeight(nextWeight);
    clearQuickAddFieldError("weight");
  };

  // Dynamically compute available weights based on selected flavor + egg type
  const quickAddWeights = useMemo(() => {
    if (!quickAddProduct) return [];
    if (quickAddProduct.hasExplicitFlavors && !quickAddFlavor) return [];
    const flavorForWeightFilter =
      quickAddFlavor || quickAddProduct.availableFlavors[0]?.name || "";
    if (!flavorForWeightFilter) return [];
    return getAvailableWeightOptions(
      quickAddProduct,
      flavorForWeightFilter,
      quickAddEggType,
    );
  }, [quickAddProduct, quickAddFlavor, quickAddEggType]);

  const quickAddFlavors = useMemo(() => {
    if (!quickAddProduct) {
      return [];
    }

    return getAvailableFlavorOptions(quickAddProduct, quickAddEggType);
  }, [quickAddProduct, quickAddEggType]);

  React.useEffect(() => {
    if (!quickAddProduct?.hasExplicitFlavors || !quickAddFlavor) {
      return;
    }

    const hasSelectedFlavor = quickAddFlavors.some(
      (flavor) => flavor.name === quickAddFlavor,
    );

    if (!hasSelectedFlavor) {
      setQuickAddFlavor("");
      clearQuickAddFieldError("flavor");
      clearQuickAddFieldError("weight");
    }
  }, [quickAddFlavor, quickAddFlavors, quickAddProduct]);

  // Reset weight if current selection is no longer available
  React.useEffect(() => {
    if (!quickAddProduct) return;
    if (
      quickAddWeight &&
      !quickAddWeights.some((w) => w.label === quickAddWeight)
    ) {
      setQuickAddWeight("");
    }
  }, [quickAddWeights, quickAddWeight, quickAddProduct]);

  const handleQuickAdd = () => {
    const hasEgg = quickAddProduct?.isEgg !== false;
    const hasEggless = quickAddProduct?.isEggless === true;
    const needsEggType = hasEgg && hasEggless;
    const needsFlavorSelection = quickAddProduct?.hasExplicitFlavors;
    const needsWeightSelection =
      (quickAddProduct?.availableWeights?.length || 0) > 0;

    if (!quickAddProduct) {
      dispatch(
        showToast({
          message: "Please select a product first.",
          type: "error",
        }),
      );
      return;
    }

    if (needsEggType && !quickAddEggType) {
      setQuickAddErrors({
        cakeType: "Please select Cake Type to continue",
        flavor: "",
        weight: "",
      });
      scrollToQuickAddField("quick-add-type");
      return;
    }

    if (needsFlavorSelection && !quickAddFlavor) {
      setQuickAddErrors({
        cakeType: "",
        flavor: "Please select Flavor to continue",
        weight: "",
      });
      scrollToQuickAddField("quick-add-flavor");
      return;
    }

    if (needsWeightSelection && !quickAddWeight) {
      setQuickAddErrors({
        cakeType: "",
        flavor: "",
        weight: `Please select ${quickAddPortionMeta.singular.replace(
          /^./,
          (char) => char.toUpperCase(),
        )} to continue`,
      });
      scrollToQuickAddField("quick-add-weight");
      return;
    }

    dispatch(
      addToCart({
        product: quickAddProduct,
        quantity: quickAddQuantity,
        selectedFlavor: quickAddFlavor,
        selectedWeight: quickAddWeight,
        selectedEggType: quickAddEggType,
      }),
    );
    dispatch(
      showToast({
        message: `${quickAddProduct.name} added to cart.`,
        type: "success",
      }),
    );
    closeQuickAdd();
  };

  return (
    <div className="menu-page">
      <SeoMeta
        title="Menu | Hindumatha's Cake World"
        description="Explore our cake menu with flavors, weights, egg and eggless options, pastries, and custom celebration cakes."
        path="/menu"
      />
      <div className="menu-shell menu-shell--compact">
        <MenuControls
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />

        <div className="menu-results-bar">
          <p>
            <span>{loading && !products.length ? "Loading" : filteredProducts.length}</span>{" "}
            {loading && !products.length ? "menu items" : "items found"}
          </p>
        </div>

        {!loading && (
          <MenuFeaturedStrip
            featuredProducts={featuredProducts}
            openImagePreview={openImagePreview}
          />
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-sm font-medium text-red-700">
              Failed to load menu after retrying once. Please try again.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoadError(false);
                setRetryCount(0);
                setRetryScheduled(false);
                dispatch(fetchProducts({ force: true }));
              }}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <MenuEmptyState clearFilters={clearFilters} />
        ) : (
          <MenuCategorySections
            categorySections={categorySections}
            openImagePreview={openImagePreview}
            openQuickAdd={openQuickAdd}
            highlightedProductId={highlightedProductId}
          />
        )}

        <MenuCustomOrderCta />

        <MenuImagePreviewModal
          imagePreview={imagePreview}
          closeImagePreview={closeImagePreview}
        />

        <MenuQuickAddModal
          quickAddProduct={quickAddProduct}
          quickAddPortionMeta={quickAddPortionMeta}
          quickAddEggType={quickAddEggType}
          setQuickAddEggType={handleQuickAddEggTypeSelect}
          quickAddFlavor={quickAddFlavor}
          setQuickAddFlavor={handleQuickAddFlavorSelect}
          quickAddFlavors={quickAddFlavors}
          quickAddWeight={quickAddWeight}
          setQuickAddWeight={handleQuickAddWeightSelect}
          quickAddQuantity={quickAddQuantity}
          setQuickAddQuantity={setQuickAddQuantity}
          quickAddWeights={quickAddWeights}
          quickAddErrors={quickAddErrors}
          closeQuickAdd={closeQuickAdd}
          handleQuickAdd={handleQuickAdd}
        />
      </div>
    </div>
  );
};

export default Menu;
