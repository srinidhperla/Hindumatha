import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/features/cart/cartSlice";
import { fetchProducts } from "@/features/products/productSlice";
import { showToast } from "@/features/uiSlice";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  getOrderableFlavors,
  getOrderableWeights,
  isEggTypeAvailable,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "@/utils/productOptions";
import SeoMeta from "@/shared/seo/SeoMeta";
import MenuCategorySections from "./MenuCategorySections";
import MenuControls from "./MenuControls";
import MenuCustomOrderCta from "./MenuCustomOrderCta";
import MenuEmptyState from "./MenuEmptyState";
import MenuFeaturedStrip from "./MenuFeaturedStrip";
import MenuImagePreviewModal from "./MenuImagePreviewModal";
import MenuQuickAddModal from "./MenuQuickAddModal";

const Menu = () => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const [quickAddFlavor, setQuickAddFlavor] = useState("");
  const [quickAddWeight, setQuickAddWeight] = useState("");
  const [quickAddEggType, setQuickAddEggType] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const [imagePreview, setImagePreview] = useState(null);
  const { products, loading } = useSelector((state) => state.products);
  const { businessInfo } = useSelector((state) => state.site);

  // Silently poll products every 15s so inventory changes auto-reflect
  useEffect(() => {
    dispatch(fetchProducts());
    const interval = setInterval(() => dispatch(fetchProducts()), 2000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const normalizedProducts = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        primaryImage: product.images?.[0] || product.image,
        categoryLabel: formatCategoryLabel(product.category),
        portionTypeMeta: getPortionTypeMeta(product.portionType),
        availableFlavors: getAvailableFlavorOptions(product),
        availableWeights: getAvailableWeightOptions(product),
        orderableFlavors: getOrderableFlavors(product),
        orderableWeights: getOrderableWeights(product),
        canOrder: isProductPurchasable(product),
        hasExplicitFlavors: normalizeFlavorOptions(product).length > 0,
      })),
    [products],
  );

  // Products visible on menu: all that aren't master-toggled OFF
  const visibleProducts = useMemo(
    () =>
      normalizedProducts
        .filter((product) => product.isAvailable !== false)
        .filter((product) => product.isAddon !== true),
    [normalizedProducts],
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

  const openQuickAdd = (product) => {
    if (!product.canOrder) return;
    setQuickAddProductId(product._id);
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
  };

  const openImagePreview = (product) => {
    setImagePreview({
      src: product.primaryImage,
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

  // Dynamically compute available weights based on selected flavor + egg type
  const quickAddWeights = useMemo(() => {
    if (!quickAddProduct) return [];
    const flavorForWeightFilter =
      quickAddFlavor || quickAddProduct.availableFlavors[0]?.name || "";
    if (!flavorForWeightFilter) return [];
    return getAvailableWeightOptions(
      quickAddProduct,
      flavorForWeightFilter,
      quickAddEggType,
    );
  }, [quickAddProduct, quickAddFlavor, quickAddEggType]);

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

    if (!quickAddProduct) {
      dispatch(
        showToast({
          message: "Please select a product first.",
          type: "error",
        }),
      );
      return;
    }

    if (needsFlavorSelection && !quickAddFlavor) {
      scrollToQuickAddField("quick-add-flavor");
      dispatch(
        showToast({
          message: "Please choose a flavor.",
          type: "error",
        }),
      );
      return;
    }

    if (needsEggType && !quickAddEggType) {
      scrollToQuickAddField("quick-add-type");
      dispatch(
        showToast({
          message: "Please choose a cake type (Egg or Eggless).",
          type: "error",
        }),
      );
      return;
    }

    if (!quickAddWeight) {
      scrollToQuickAddField("quick-add-weight");
      dispatch(
        showToast({
          message: `Please select ${quickAddPortionMeta.singular.toLowerCase()}.`,
          type: "error",
        }),
      );
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
            <span>{filteredProducts.length}</span> items found
          </p>
        </div>

        {!loading && (
          <MenuFeaturedStrip
            featuredProducts={featuredProducts}
            openImagePreview={openImagePreview}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <MenuEmptyState clearFilters={clearFilters} />
        ) : (
          <MenuCategorySections
            categorySections={categorySections}
            openImagePreview={openImagePreview}
            openQuickAdd={openQuickAdd}
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
          setQuickAddEggType={setQuickAddEggType}
          quickAddFlavor={quickAddFlavor}
          setQuickAddFlavor={setQuickAddFlavor}
          quickAddWeight={quickAddWeight}
          setQuickAddWeight={setQuickAddWeight}
          quickAddQuantity={quickAddQuantity}
          setQuickAddQuantity={setQuickAddQuantity}
          quickAddWeights={quickAddWeights}
          closeQuickAdd={closeQuickAdd}
          handleQuickAdd={handleQuickAdd}
        />
      </div>
    </div>
  );
};

export default Menu;
