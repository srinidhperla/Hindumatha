import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EmptyState, LoadingState, MetricCard } from "../components/ui/AdminUi";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
  Toggle,
} from "../../components/ui/Primitives";
import { updateProductInventory } from "../../features/products/productSlice";
import { DEFAULT_PRODUCT_CATEGORIES, getErrorMessage } from "./adminShared";
import {
  formatCategoryLabel,
  getAvailableFlavorOptions,
  getAvailableWeightOptions,
  isProductPurchasable,
  normalizeFlavorOptions,
  normalizeFlavorWeightAvailability,
  normalizeWeightOptions,
} from "../../utils/productOptions";

const buildInventoryPayload = (product, overrides = {}) => {
  const flavorOptions =
    overrides.flavorOptions ?? normalizeFlavorOptions(product);
  const weightOptions =
    overrides.weightOptions ?? normalizeWeightOptions(product);

  return {
    isAvailable: overrides.isAvailable ?? product.isAvailable !== false,
    flavorOptions,
    weightOptions,
    flavorWeightAvailability:
      overrides.flavorWeightAvailability ??
      normalizeFlavorWeightAvailability({
        ...product,
        flavorOptions,
        weightOptions,
      }),
  };
};

const AdminInventoryPage = ({ onToast }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [savingKey, setSavingKey] = useState("");

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

  const saveInventory = async (
    product,
    overrides,
    actionKey,
    successMessage,
  ) => {
    try {
      setSavingKey(actionKey);
      await dispatch(
        updateProductInventory({
          id: product._id,
          inventoryData: buildInventoryPayload(product, overrides),
        }),
      ).unwrap();
      onToast(successMessage);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to update inventory."), "error");
    } finally {
      setSavingKey("");
    }
  };

  const handleProductToggle = (product) => {
    const nextValue = product.isAvailable === false;

    saveInventory(
      product,
      { isAvailable: nextValue },
      `product-${product._id}`,
      `${product.name} is now ${nextValue ? "live" : "paused"}.`,
    );
  };

  const handleFlavorToggle = (product, flavorName) => {
    const flavorOptions = normalizeFlavorOptions(product).map((option) =>
      option.name === flavorName
        ? { ...option, isAvailable: !option.isAvailable }
        : option,
    );

    saveInventory(
      product,
      { flavorOptions },
      `flavor-${product._id}-${flavorName}`,
      `${flavorName} updated for ${product.name}.`,
    );
  };

  const handleFlavorWeightToggle = (product, flavorName, weightLabel) => {
    const matrix = normalizeFlavorWeightAvailability(product);
    const currentValue = matrix?.[flavorName]?.[weightLabel] !== false;
    const nextMatrix = {
      ...matrix,
      [flavorName]: {
        ...(matrix?.[flavorName] || {}),
        [weightLabel]: !currentValue,
      },
    };

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `flavor-weight-${product._id}-${flavorName}-${weightLabel}`,
      `${flavorName} - ${weightLabel} updated for ${product.name}.`,
    );
  };

  const handleWeightToggle = (product, weightLabel) => {
    const weightOptions = normalizeWeightOptions(product).map((option) =>
      option.label === weightLabel
        ? { ...option, isAvailable: !option.isAvailable }
        : option,
    );
    const nextAvailable = weightOptions.find(
      (o) => o.label === weightLabel,
    )?.isAvailable;

    saveInventory(
      product,
      { weightOptions },
      `weight-${product._id}-${weightLabel}`,
      `${weightLabel} is now ${nextAvailable ? "enabled" : "disabled"} for ${product.name}.`,
    );
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Catalog"
          value={summary.totalProducts}
          subtitle="Products tracked in inventory"
        />
        <MetricCard
          title="Live"
          value={summary.liveProducts}
          subtitle="Products customers can order now"
          highlight
        />
        <MetricCard
          title="Paused"
          value={summary.pausedProducts}
          subtitle="Products manually hidden from ordering"
        />
        <MetricCard
          title="Blocked Variants"
          value={summary.blockedVariants}
          subtitle="Flavor and weight options switched off"
        />
      </div>

      <SurfaceCard className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              onClick={() => setSelectedCategory("all")}
              variant={selectedCategory === "all" ? "primary" : "soft"}
              className={`rounded-full ${
                selectedCategory === "all" ? "" : "text-slate-700"
              }`}
            >
              All categories
            </ActionButton>
            {availableCategories.map((category) => (
              <ActionButton
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "primary" : "soft"}
                className="rounded-full"
              >
                {formatCategoryLabel(category)}
              </ActionButton>
            ))}
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search inventory"
            className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200 lg:max-w-xs"
          />
        </div>
      </SurfaceCard>

      {filteredProducts.length ? (
        <div className="space-y-4">
          {filteredProducts.map((product) => {
            const flavorOptions = normalizeFlavorOptions(product);
            const weightOptions = normalizeWeightOptions(product);
            const availableFlavorCount =
              getAvailableFlavorOptions(product).length;
            const availableWeightCount =
              getAvailableWeightOptions(product).length;
            const flavorWeightMatrix =
              normalizeFlavorWeightAvailability(product);
            const canOrder = isProductPurchasable(product);
            const isSavingProduct = savingKey === `product-${product._id}`;

            return (
              <div
                key={product._id}
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-[0_20px_60px_rgba(2,6,23,0.45)]"
              >
                <div className="border-b border-slate-700 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <img
                        src={product.images?.[0] || product.image}
                        alt={product.name}
                        className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-600"
                      />
                      <div>
                        <p className="text-xl font-bold">{product.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusChip tone="info">
                            {formatCategoryLabel(product.category)}
                          </StatusChip>
                          <StatusChip tone={canOrder ? "success" : "warning"}>
                            {canOrder ? "In stock" : "Needs attention"}
                          </StatusChip>
                        </div>
                        <p className="mt-2 text-xs text-slate-300">
                          {availableFlavorCount}/{flavorOptions.length} flavors,{" "}
                          {availableWeightCount}/{weightOptions.length} weights
                          live
                        </p>
                      </div>
                    </div>

                    <Toggle
                      checked={product.isAvailable !== false}
                      onClick={() => handleProductToggle(product)}
                      disabled={isSavingProduct}
                      label={`toggle ${product.name}`}
                    />
                  </div>
                </div>

                <div className="grid gap-4 p-4">
                  <section className="rounded-2xl bg-slate-800/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Flavor Inventory</p>
                      <p className="text-xs text-slate-300">
                        Toggle each weight inside each flavor
                      </p>
                    </div>

                    <div className="space-y-2">
                      {flavorOptions.map((option) => {
                        const optionKey = `flavor-${product._id}-${option.name}`;

                        return (
                          <div
                            key={option.name}
                            className="rounded-xl bg-slate-700 px-3 py-2"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {option.name}
                              </p>
                              <Toggle
                                checked={option.isAvailable}
                                onClick={() =>
                                  handleFlavorToggle(product, option.name)
                                }
                                disabled={savingKey === optionKey}
                                label={`toggle flavor ${option.name}`}
                              />
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {weightOptions.map((weightOption) => (
                                <button
                                  key={`${option.name}-${weightOption.label}`}
                                  type="button"
                                  onClick={() =>
                                    handleFlavorWeightToggle(
                                      product,
                                      option.name,
                                      weightOption.label,
                                    )
                                  }
                                  disabled={
                                    savingKey ===
                                    `flavor-weight-${product._id}-${option.name}-${weightOption.label}`
                                  }
                                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                                    flavorWeightMatrix?.[option.name]?.[
                                      weightOption.label
                                    ] !== false
                                      ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                                      : "border-amber-400 bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {weightOption.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {/* Weight Options - global enable/disable per product */}
                  <section className="rounded-2xl bg-slate-800/80 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Weight Options</p>
                      <p className="text-xs text-slate-300">
                        Click a weight to enable/disable it globally for this
                        product
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weightOptions.map((weightOption) => {
                        const isWeightEnabled =
                          weightOption.isAvailable !== false;
                        const isSavingWeight =
                          savingKey ===
                          `weight-${product._id}-${weightOption.label}`;
                        return (
                          <button
                            key={weightOption.label}
                            type="button"
                            onClick={() =>
                              handleWeightToggle(product, weightOption.label)
                            }
                            disabled={isSavingWeight}
                            title={
                              isWeightEnabled
                                ? "Click to disable this weight"
                                : "Click to enable this weight"
                            }
                            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition disabled:opacity-50 ${
                              isWeightEnabled
                                ? "border-emerald-400 bg-emerald-500 text-white hover:bg-emerald-600"
                                : "border-red-400 bg-red-500 text-white hover:bg-red-600"
                            }`}
                          >
                            {weightOption.label}
                            <span className="ml-1.5 text-[10px] font-normal opacity-80">
                              {isWeightEnabled ? "ON" : "OFF"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Red = disabled (hidden from customers). Green = active.
                    </p>
                  </section>
                </div>
              </div>
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
