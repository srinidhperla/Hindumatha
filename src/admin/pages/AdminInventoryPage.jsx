import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  EmptyState,
  LoadingState,
  MetricCard,
} from "@/admin/components/ui/AdminUi";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";
import { DEFAULT_PRODUCT_CATEGORIES } from "./adminShared";
import useAdminInventoryToggles from "@/admin/hooks/useAdminInventoryToggles";
import AdminInventoryProductCard from "./AdminInventoryProductCard";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  getPortionTypeMeta,
  isProductPurchasable,
  normalizeFlavorOptions,
  normalizeWeightOptions,
} from "@/utils/productOptions";

const AdminInventoryPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const {
    savingKey,
    handleProductToggle,
    handleEggTypeToggle,
    handleTypedFlavorToggle,
    handleFlavorWeightToggleByType,
    getTypedAvailability,
    isTypedFlavorOn,
    isEggTypeOn,
  } = useAdminInventoryToggles({ dispatch, onToast });

  const availableCategories = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_PRODUCT_CATEGORIES,
          ...products.map((product) => product.category).filter(Boolean),
        ]),
      ),
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      [...products]
        .filter((product) => {
          const matchesSearch = product.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
          const matchesCategory =
            selectedCategory === "all" || product.category === selectedCategory;

          return matchesSearch && matchesCategory;
        })
        .sort((left, right) => {
          const leftLive = isProductPurchasable(left) ? 0 : 1;
          const rightLive = isProductPurchasable(right) ? 0 : 1;

          if (leftLive !== rightLive) {
            return leftLive - rightLive;
          }

          return left.name.localeCompare(right.name);
        }),
    [products, searchTerm, selectedCategory],
  );

  const summary = useMemo(() => {
    const liveProducts = products.filter((product) =>
      isProductPurchasable(product),
    ).length;
    const pausedProducts = products.filter(
      (product) => product.isAvailable === false,
    ).length;
    const blockedVariants = products.reduce(
      (total, product) =>
        total +
        normalizeFlavorOptions(product).filter(
          (option) => option.isAvailable === false,
        ).length +
        normalizeWeightOptions(product).filter(
          (option) => option.isAvailable === false,
        ).length,
      0,
    );

    return {
      totalProducts: products.length,
      liveProducts,
      pausedProducts,
      blockedVariants,
    };
  }, [products]);

  if (loading && !products.length) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard
          title="Catalog"
          value={summary.totalProducts}
          subtitle="Total products"
        />
        <MetricCard
          title="Live"
          value={summary.liveProducts}
          subtitle="Orderable now"
          highlight
        />
        <MetricCard
          title="Paused"
          value={summary.pausedProducts}
          subtitle="Hidden from menu"
        />
        <MetricCard
          title="Blocked"
          value={summary.blockedVariants}
          subtitle="Options switched off"
        />
      </div>

      <SurfaceCard className="p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <ActionButton
              onClick={() => setSelectedCategory("all")}
              variant={selectedCategory === "all" ? "primary" : "soft"}
              className={`rounded-full text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 ${
                selectedCategory === "all" ? "" : "text-slate-700"
              }`}
            >
              All
            </ActionButton>
            {availableCategories.map((category) => (
              <ActionButton
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "primary" : "soft"}
                className="rounded-full text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2"
              >
                {formatCategoryLabel(category)}
              </ActionButton>
            ))}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search inventory..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 lg:max-w-xs"
          />
        </div>
      </SurfaceCard>

      {filteredProducts.length ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredProducts.map((product) => {
            const flavorOptions = normalizeFlavorOptions(product);
            const weightOptions = normalizeWeightOptions(product);
            const portionTypeMeta = getPortionTypeMeta(product.portionType);
            const availableFlavorCount =
              getAvailableFlavorOptions(product).length;
            const availableWeightCount =
              getAvailableWeightOptions(product).length;
            const canOrder = isProductPurchasable(product);
            return (
              <AdminInventoryProductCard
                key={product._id}
                product={product}
                canOrder={canOrder}
                flavorOptions={flavorOptions}
                weightOptions={weightOptions}
                portionTypeMeta={portionTypeMeta}
                availableFlavorCount={availableFlavorCount}
                availableWeightCount={availableWeightCount}
                savingKey={savingKey}
                onProductToggle={handleProductToggle}
                onEggTypeToggle={handleEggTypeToggle}
                onTypedFlavorToggle={handleTypedFlavorToggle}
                onFlavorWeightToggleByType={handleFlavorWeightToggleByType}
                getTypedAvailability={getTypedAvailability}
                isTypedFlavorOn={isTypedFlavorOn}
                isEggTypeOn={isEggTypeOn}
              />
            );
          })}
        </div>
      ) : (
        <SurfaceCard className="p-8">
          <EmptyState message="No products match the current inventory filters." />
        </SurfaceCard>
      )}
    </div>
  );
};

export default AdminInventoryPage;
