import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  EmptyState,
  LoadingState,
  MetricCard,
} from "@/admin/components/ui/AdminUi";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
  Toggle,
} from "@/shared/ui/Primitives";
import { DEFAULT_PRODUCT_CATEGORIES, getErrorMessage } from "./adminShared";
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
import { updateProductDisplayOrder } from "@/features/products/productSlice";
import {
  updateSiteCategoryOrder,
  updateSiteSettings,
} from "@/features/site/siteThunks";
import {
  isCategoryActive,
  normalizeCategorySettings,
} from "@/utils/categorySettings";

const CategoryCard = ({
  category,
  count,
  children,
  sortable = false,
  saving = false,
  categoryIsActive = true,
  onToggleCategoryVisibility,
  categoryToggleSaving = false,
}) => {
  const sortableApi = useSortable({ id: category, disabled: !sortable });
  const style = sortable
    ? {
        transform: CSS.Transform.toString(sortableApi.transform),
        transition: sortableApi.transition,
        opacity: sortableApi.isDragging ? 0.65 : 1,
      }
    : undefined;

  return (
    <div ref={sortable ? sortableApi.setNodeRef : undefined} style={style}>
      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-gold-200/50 bg-white/70 px-4 py-3 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              {sortable ? (
                <button
                  type="button"
                  {...sortableApi.attributes}
                  {...sortableApi.listeners}
                  className="cursor-grab text-xl font-bold leading-none text-primary-500 active:cursor-grabbing"
                  title="Drag category"
                >
                  {"\u2261"}
                </button>
              ) : (
                <span className="text-xl font-bold leading-none text-primary-300">
                  {"\u2261"}
                </span>
              )}
              <div>
                <p className="text-base font-semibold text-primary-900">
                  {formatCategoryLabel(category)}
                </p>
                <p className="text-xs text-primary-500">
                  {count} product{count === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusChip tone={categoryIsActive ? "success" : "warning"}>
                {categoryIsActive ? "Live" : "Hidden"}
              </StatusChip>
              <Toggle
                checked={categoryIsActive}
                onClick={onToggleCategoryVisibility}
                disabled={saving || categoryToggleSaving}
                label={`toggle ${category} category visibility`}
                size="compact"
              />
              {sortable && (
                <StatusChip tone="info">Category order enabled</StatusChip>
              )}
              {(saving || categoryToggleSaving) && (
                <StatusChip tone="accent">Saving...</StatusChip>
              )}
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4">{children}</div>
      </SurfaceCard>
    </div>
  );
};

const sortProducts = (products = []) =>
  [...products].sort((left, right) => {
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

const AdminInventoryPage = ({ onToast, syncVersion = 0 }) => {
  const dispatch = useDispatch();
  const { products, loading } = useSelector((state) => state.products);
  const { categoryOrder = [], categorySettings = [] } = useSelector(
    (state) => state.site,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [savingCategoryOrder, setSavingCategoryOrder] = useState(false);
  const [savingProductCategory, setSavingProductCategory] = useState("");
  const [savingCategoryVisibility, setSavingCategoryVisibility] = useState("");
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const availableCategories = useMemo(() => {
    const ordered = [];
    const seen = new Set();

    [
      ...categoryOrder,
      ...DEFAULT_PRODUCT_CATEGORIES,
      ...categorySettings.map((entry) => entry?.name),
    ].forEach((category) => {
      const normalized = String(category || "").trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      ordered.push(normalized);
    });

    products.forEach((product) => {
      const normalized = String(product.category || "").trim();
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      ordered.push(normalized);
    });

    return ordered;
  }, [categoryOrder, categorySettings, products, syncVersion]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          selectedCategory === "all" || product.category === selectedCategory;

        return matchesSearch && matchesCategory;
      }),
    [products, searchTerm, selectedCategory],
  );

  const groupedProducts = useMemo(() => {
    const groups = new Map();

    availableCategories.forEach((category) => {
      groups.set(category, []);
    });

    filteredProducts.forEach((product) => {
      const list = groups.get(product.category) || [];
      list.push(product);
      groups.set(product.category, list);
    });

    for (const [category, list] of groups.entries()) {
      groups.set(category, sortProducts(list));
    }

    return groups;
  }, [availableCategories, filteredProducts]);

  const visibleCategories = useMemo(
    () =>
      availableCategories.filter((category) => {
        const count = groupedProducts.get(category)?.length || 0;
        if (selectedCategory !== "all" && category !== selectedCategory) {
          return false;
        }
        return count > 0;
      }),
    [availableCategories, groupedProducts, selectedCategory],
  );

  const categoryReorderEnabled =
    selectedCategory === "all" &&
    !searchTerm.trim() &&
    visibleCategories.length > 1;

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

  const handleCategoryDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id || !categoryReorderEnabled) {
      return;
    }

    const activeIndex = visibleCategories.indexOf(String(active.id));
    const overIndex = visibleCategories.indexOf(String(over.id));

    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    const reorderedVisibleCategories = arrayMove(
      visibleCategories,
      activeIndex,
      overIndex,
    );
    const hiddenCategories = availableCategories.filter(
      (category) => !visibleCategories.includes(category),
    );

    try {
      setSavingCategoryOrder(true);
      await dispatch(
        updateSiteCategoryOrder([
          ...reorderedVisibleCategories,
          ...hiddenCategories,
        ]),
      ).unwrap();
      onToast("Category order saved.");
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to save category order."), "error");
    } finally {
      setSavingCategoryOrder(false);
    }
  };

  const handleProductDragEnd = async (category, categoryProducts, event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = categoryProducts.findIndex((p) => p._id === active.id);
    const overIndex = categoryProducts.findIndex((p) => p._id === over.id);

    if (activeIndex === -1 || overIndex === -1) {
      return;
    }

    const reorderedProducts = arrayMove(categoryProducts, activeIndex, overIndex);

    try {
      setSavingProductCategory(category);
      await dispatch(
        updateProductDisplayOrder({
          category,
          productIds: reorderedProducts.map((product) => product._id),
        }),
      ).unwrap();
      onToast(`Saved product order for ${formatCategoryLabel(category)}.`);
    } catch (error) {
      onToast(getErrorMessage(error, "Failed to save product order."), "error");
    } finally {
      setSavingProductCategory("");
    }
  };

  const handleCategoryVisibilityToggle = async (category) => {
    const nextCategorySettings = normalizeCategorySettings(
      availableCategories,
      categorySettings,
    ).map((entry) =>
      entry.name === category
        ? { ...entry, isActive: !isCategoryActive(categorySettings, category) }
        : entry,
    );

    try {
      setSavingCategoryVisibility(category);
      await dispatch(
        updateSiteSettings({ categorySettings: nextCategorySettings }),
      ).unwrap();
      onToast(
        `${formatCategoryLabel(category)} category is now ${isCategoryActive(nextCategorySettings, category) ? "live" : "hidden"}.`,
      );
    } catch (error) {
      onToast(
        getErrorMessage(error, "Failed to update category visibility."),
        "error",
      );
    } finally {
      setSavingCategoryVisibility("");
    }
  };

  const renderProductCards = (category, categoryProducts) => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => handleProductDragEnd(category, categoryProducts, event)}
    >
      <SortableContext
        items={categoryProducts.map((product) => product._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3 sm:space-y-4">
          {categoryProducts.map((product) => {
            const flavorOptions = normalizeFlavorOptions(product);
            const weightOptions = normalizeWeightOptions(product);
            const portionTypeMeta = getPortionTypeMeta(product.portionType);

            return (
              <AdminInventoryProductCard
                key={product._id}
                product={product}
                canOrder={isProductPurchasable(product)}
                flavorOptions={flavorOptions}
                weightOptions={weightOptions}
                portionTypeMeta={portionTypeMeta}
                availableFlavorCount={getAvailableFlavorOptions(product).length}
                availableWeightCount={getAvailableWeightOptions(product).length}
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
      </SortableContext>
    </DndContext>
  );

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
              className={`rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm ${
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
                className="rounded-full px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm"
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

        <div className="mt-3 text-xs text-primary-600">
          {categoryReorderEnabled
            ? "Drag categories and products to save menu order instantly."
            : "Category drag is available when All categories is selected and search is cleared."}
        </div>
      </SurfaceCard>

      {visibleCategories.length ? (
        categoryReorderEnabled ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={visibleCategories}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {visibleCategories.map((category) => {
                  const categoryProducts = groupedProducts.get(category) || [];

                  return (
                    <CategoryCard
                      key={category}
                      category={category}
                      count={categoryProducts.length}
                      sortable
                      categoryIsActive={isCategoryActive(
                        categorySettings,
                        category,
                      )}
                      onToggleCategoryVisibility={() =>
                        handleCategoryVisibilityToggle(category)
                      }
                      categoryToggleSaving={savingCategoryVisibility === category}
                      saving={
                        savingCategoryOrder || savingProductCategory === category
                      }
                    >
                      {renderProductCards(category, categoryProducts)}
                    </CategoryCard>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-4">
            {visibleCategories.map((category) => {
              const categoryProducts = groupedProducts.get(category) || [];

              return (
                <CategoryCard
                  key={category}
                  category={category}
                  count={categoryProducts.length}
                  categoryIsActive={isCategoryActive(categorySettings, category)}
                  onToggleCategoryVisibility={() =>
                    handleCategoryVisibilityToggle(category)
                  }
                  categoryToggleSaving={savingCategoryVisibility === category}
                  saving={savingProductCategory === category}
                >
                  {renderProductCards(category, categoryProducts)}
                </CategoryCard>
              );
            })}
          </div>
        )
      ) : (
        <SurfaceCard className="p-8">
          <EmptyState message="No products match the current inventory filters." />
        </SurfaceCard>
      )}
    </div>
  );
};

export default AdminInventoryPage;
