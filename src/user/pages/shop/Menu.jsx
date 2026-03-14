import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../../features/cart/cartSlice";
import { fetchProducts } from "../../../features/products/productSlice";
import { showToast } from "../../../features/uiSlice";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getOrderableFlavors,
  getOrderableWeights,
  isEggTypeAvailable,
  isProductPurchasable,
  normalizeFlavorOptions,
} from "../../../utils/productOptions";

const Menu = () => {
  const dispatch = useDispatch();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [quickAddProductId, setQuickAddProductId] = useState(null);
  const [quickAddFlavor, setQuickAddFlavor] = useState("");
  const [quickAddWeight, setQuickAddWeight] = useState("");
  const [quickAddEggType, setQuickAddEggType] = useState("");
  const [quickAddQuantity, setQuickAddQuantity] = useState(1);
  const { products, loading } = useSelector((state) => state.products);
  const { businessInfo, deliverySettings } = useSelector((state) => state.site);

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
    () => normalizedProducts.filter((product) => product.isAvailable !== false),
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
    // For no-flavor products, use the Cake fallback internally
    if (!product.hasExplicitFlavors) {
      setQuickAddFlavor(product.availableFlavors[0]?.name || "Cake");
    } else {
      setQuickAddFlavor("");
    }
    // Determine egg type — auto-select only when just one type exists
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

  // Dynamically compute available weights based on selected flavor + egg type
  const quickAddWeights = useMemo(() => {
    if (!quickAddProduct || !quickAddFlavor) return [];
    return getAvailableWeightOptions(
      quickAddProduct,
      quickAddFlavor,
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

    if (
      !quickAddProduct ||
      !quickAddFlavor ||
      !quickAddWeight ||
      (needsEggType && !quickAddEggType)
    ) {
      dispatch(
        showToast({
          message: "Please choose all required options.",
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
      <div className="menu-shell menu-shell--compact">
        <div className="menu-controls-sticky">
          <div className="menu-search-wrap">
            <svg
              className="menu-search-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search cakes, pastries, breads..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="menu-search-input"
            />
          </div>
          <div className="menu-categories-rail custom-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`menu-category-pill ${
                  selectedCategory === category
                    ? "menu-category-pill--active"
                    : "menu-category-pill--inactive"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="menu-results-bar">
          <p>
            <span>{filteredProducts.length}</span> items found
          </p>
        </div>

        {!loading && featuredProducts.length > 0 && (
          <section className="menu-featured-strip">
            <div className="menu-section-head">
              <div>
                <p className="menu-section-kicker">Featured</p>
                <h2 className="menu-section-title">Popular picks today</h2>
              </div>
            </div>
            <div className="menu-featured-grid custom-scrollbar">
              {featuredProducts.map((product) => (
                <Link
                  key={product._id}
                  to={`/products/${product._id}`}
                  className="menu-featured-card"
                >
                  <img
                    src={product.primaryImage}
                    alt={product.name}
                    className="menu-featured-image"
                  />
                  <div className="menu-featured-body">
                    <span className="menu-featured-category">
                      {product.categoryLabel}
                    </span>
                    <h3>{product.name}</h3>
                    <p>
                      Starts at Rs.
                      {Number(product.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="menu-empty-state">
            <div className="menu-empty-icon">
              <svg
                className="h-12 w-12 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3>No matching items</h3>
            <p>Reset filters and search to see the full bakery menu again.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSearchTerm("");
              }}
              className="menu-clear-button"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="menu-sections">
            {categorySections.map((section) => (
              <section key={section.category} className="menu-section-block">
                <div className="menu-section-head">
                  <div>
                    <p className="menu-section-kicker">
                      {section.items.length} items
                    </p>
                    <h2 className="menu-section-title">{section.category}</h2>
                  </div>
                </div>
                <div className="menu-items-grid">
                  {section.items.map((product) => (
                    <article key={product._id} className="menu-product-card">
                      {/* Text side (left on mobile) */}
                      <div className="menu-product-body">
                        <div className="menu-product-header">
                          <Link
                            to={`/products/${product._id}`}
                            className="menu-product-title"
                          >
                            {product.name}
                          </Link>
                          <p className="menu-product-price">
                            ₹
                            {Number(product.price || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        <p className="menu-product-desc">
                          {product.description}
                        </p>
                        <div className="menu-product-meta">
                          {product.isEgg !== false &&
                            isEggTypeAvailable(product, "egg") && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 ring-1 ring-red-200">
                                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                                Egg
                              </span>
                            )}
                          {product.isEggless === true &&
                            isEggTypeAvailable(product, "eggless") && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600 ring-1 ring-green-200">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                                Eggless
                              </span>
                            )}
                          <span>
                            {product.orderableFlavors.length > 1 ||
                            product.hasExplicitFlavors
                              ? `${product.orderableFlavors.length} flavors`
                              : ""}
                          </span>
                          {(product.hasExplicitFlavors ||
                            product.orderableFlavors.length > 1) && (
                            <span>•</span>
                          )}
                          <span>{product.orderableWeights.length} sizes</span>
                        </div>
                      </div>
                      {/* Image side (right on mobile) + ADD button */}
                      <div className="menu-product-image-wrap">
                        <Link to={`/products/${product._id}`}>
                          <img
                            src={product.primaryImage}
                            alt={product.name}
                            className="menu-product-image"
                          />
                        </Link>
                        {!product.canOrder && (
                          <span className="menu-product-badge-stock">
                            Out of stock
                          </span>
                        )}
                        {/* ADD overlaid at bottom-center of image */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                          <button
                            type="button"
                            disabled={!product.canOrder}
                            onClick={() => openQuickAdd(product)}
                            className="menu-product-add-btn"
                          >
                            ADD{" "}
                            <span className="ml-1 text-[15px] leading-none">
                              +
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="menu-cta animate-fadeInUp">
          <div>
            <p className="menu-section-kicker text-cream-300">Custom orders</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white md:text-3xl">
              Need a custom cake instead of a listed item?
            </h2>
            <p className="mt-2 sm:mt-3 max-w-2xl text-sm leading-7 text-cream-300 sm:text-base">
              Share theme, weight, flavor, and delivery timing. We will turn it
              into a personalized order instead of forcing you into a fixed menu
              item.
            </p>
          </div>
          <Link to="/contact" className="menu-cta-button">
            Request custom cake
          </Link>
        </div>

        {quickAddProduct && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-primary-950/60 backdrop-blur-sm animate-fadeIn"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeQuickAdd();
            }}
          >
            <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-warm sm:p-6 animate-fadeInUp max-h-[90vh] overflow-y-auto">
              {/* Drag handle on mobile */}
              <div className="flex justify-center mb-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-primary-200" />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-primary-500">
                    Required details
                  </p>
                  <h3 className="mt-2 text-xl sm:text-2xl font-bold text-primary-800">
                    Add {quickAddProduct.name}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm leading-6 text-primary-500">
                    Choose the required flavor, weight, and quantity before
                    adding this product to cart.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="rounded-full bg-cream-100 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-cream-200 active:scale-95 transition flex-shrink-0"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {/* Egg type selector — always show so user knows the type */}
                {(() => {
                  const eggOn =
                    quickAddProduct.isEgg !== false &&
                    isEggTypeAvailable(quickAddProduct, "egg");
                  const egglessOn =
                    quickAddProduct.isEggless === true &&
                    isEggTypeAvailable(quickAddProduct, "eggless");
                  if (!eggOn && !egglessOn) return null;
                  return (
                    <label className="block sm:col-span-2">
                      <span className="mb-2 block text-sm font-medium text-primary-700">
                        Type
                      </span>
                      <div className="flex gap-3">
                        {eggOn && (
                          <button
                            type="button"
                            onClick={() => setQuickAddEggType("egg")}
                            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                              quickAddEggType === "egg"
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
                            onClick={() => setQuickAddEggType("eggless")}
                            className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                              quickAddEggType === "eggless"
                                ? "border-green-400 bg-green-50 text-green-700 ring-1 ring-green-300"
                                : "border-primary-200 bg-cream-50 text-primary-600 hover:bg-cream-100"
                            }`}
                          >
                            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-500" />
                            Eggless
                          </button>
                        )}
                      </div>
                    </label>
                  );
                })()}

                {quickAddProduct.hasExplicitFlavors && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-primary-700">
                      Flavor
                    </span>
                    <select
                      value={quickAddFlavor}
                      onChange={(event) =>
                        setQuickAddFlavor(event.target.value)
                      }
                      className="w-full rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-sm text-primary-800 outline-none transition focus:border-primary-600 focus:bg-white focus:ring-1 focus:ring-primary-600"
                    >
                      <option value="">Select flavor</option>
                      {quickAddProduct.availableFlavors.map((flavor) => (
                        <option key={flavor.name} value={flavor.name}>
                          {flavor.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-primary-700">
                    Weight
                  </span>
                  <select
                    value={quickAddWeight}
                    onChange={(event) => setQuickAddWeight(event.target.value)}
                    className="w-full rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-sm text-primary-800 outline-none transition focus:border-primary-600 focus:bg-white focus:ring-1 focus:ring-primary-600"
                  >
                    <option value="">Select weight</option>
                    {quickAddWeights.map((weight) => (
                      <option key={weight.label} value={weight.label}>
                        {weight.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-primary-700">
                    Quantity
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setQuickAddQuantity((current) =>
                          Math.max(1, current - 1),
                        )
                      }
                      className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-lg font-bold text-primary-700 hover:bg-cream-100"
                    >
                      -
                    </button>
                    <div className="min-w-[72px] rounded-xl border border-primary-200 bg-white px-4 py-3 text-center text-base font-bold text-primary-800">
                      {quickAddQuantity}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickAddQuantity((current) => current + 1)
                      }
                      className="rounded-xl border border-primary-200 bg-cream-50 px-4 py-3 text-lg font-bold text-primary-700 hover:bg-cream-100"
                    >
                      +
                    </button>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeQuickAdd}
                  className="inline-flex items-center justify-center rounded-full border border-primary-200 px-5 py-3 font-medium text-primary-700 hover:bg-cream-100 active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickAdd}
                  disabled={
                    !quickAddFlavor ||
                    !quickAddWeight ||
                    (quickAddProduct?.isEgg !== false &&
                      quickAddProduct?.isEggless === true &&
                      isEggTypeAvailable(quickAddProduct, "egg") &&
                      isEggTypeAvailable(quickAddProduct, "eggless") &&
                      !quickAddEggType)
                  }
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-3 font-medium text-white hover:shadow-warm active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-primary-400 disabled:from-cream-200 disabled:to-cream-200 transition-all"
                >
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
