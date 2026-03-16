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
  getPortionTypeMeta,
  isProductPurchasable,
  normalizeFlavorOptions,
  normalizeFlavorWeightAvailability,
  normalizeWeightOptions,
} from "../../utils/productOptions";

const buildInventoryPayload = (product, overrides = {}) => {
  const payload = {};
  if (overrides.isAvailable !== undefined) {
    payload.isAvailable = overrides.isAvailable;
  }
  if (overrides.flavorWeightAvailability !== undefined) {
    payload.flavorWeightAvailability = overrides.flavorWeightAvailability;
  }
  return payload;
};

const getTypedRow = (source, typedKey) => {
  if (!source || typeof source !== "object") return null;

  const direct = source?.[typedKey] || source?.get?.(typedKey);
  if (direct && typeof direct === "object") return direct;

  const typedKeyLower = String(typedKey).toLowerCase();
  const entries = Object.entries(source || {});
  const match = entries.find(
    ([key]) => String(key).toLowerCase() === typedKeyLower,
  );
  return match && typeof match[1] === "object" ? match[1] : null;
};

const getTypedKeyName = (source, typedKey) => {
  if (!source || typeof source !== "object") return typedKey;
  const typedKeyLower = String(typedKey).toLowerCase();
  const match = Object.keys(source || {}).find(
    (key) => String(key).toLowerCase() === typedKeyLower,
  );
  return match || typedKey;
};

const getRowValue = (row, label) => {
  if (!row || typeof row !== "object") return undefined;
  if (label in row) return row[label];

  const lower = String(label).toLowerCase();
  if (lower in row) return row[lower];

  const match = Object.entries(row).find(
    ([key]) => String(key).toLowerCase() === lower,
  );
  return match ? match[1] : undefined;
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

  const handleEggTypeToggle = (product, eggType) => {
    const raw = product.flavorWeightAvailability || {};
    const weights = normalizeWeightOptions(product);
    const flavors = normalizeFlavorOptions(product);
    const flavorNames =
      flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
    const otherType = eggType === "egg" ? "eggless" : "egg";
    const hasOtherType =
      otherType === "egg"
        ? product.isEgg !== false
        : product.isEggless === true;

    const anyOn = flavorNames.some((fn) => {
      const typedKey = `${eggType}::${fn}`;
      const row = getTypedRow(raw, typedKey);
      if (!row) return true;
      return weights.some(
        (w) => getRowValue(row, w.label) !== false && getRowValue(row, w.label) !== null,
      );
    });

    const nextMatrix = {};
    // Copy all existing typed keys first
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });
    // Update the toggled egg type
    flavorNames.forEach((fn) => {
      const typedKey = `${eggType}::${fn}`;
      const currentRow = getTypedRow(raw, typedKey) || {};
      const newRow = {};
      weights.forEach((w) => {
        const cur = getRowValue(currentRow, w.label);
        if (cur === null) {
          newRow[w.label] = null;
        } else {
          newRow[w.label] = !anyOn;
        }
      });
      nextMatrix[getTypedKeyName(raw, typedKey)] = newRow;

      // Ensure other egg type has an entry so it's not lost
      if (hasOtherType) {
        const otherKey = `${otherType}::${fn}`;
        if (!nextMatrix[otherKey]) {
          const otherRow = {};
          weights.forEach((w) => {
            otherRow[w.label] = true;
          });
          nextMatrix[otherKey] = otherRow;
        }
      }
    });

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `${eggType}-${product._id}`,
      `${product.name} ${eggType === "egg" ? "Egg" : "Eggless"} is now ${!anyOn ? "ON" : "OFF"}.`,
    );
  };

  const isEggTypeOn = (product, eggType) => {
    const weights = normalizeWeightOptions(product);
    const flavors = normalizeFlavorOptions(product);
    const flavorNames =
      flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
    return flavorNames.some((fn) =>
      weights.some((w) => {
        const v = getTypedAvailability(product, eggType, fn, w.label);
        return v === true;
      }),
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

  const handleTypedFlavorToggle = (product, eggType, flavorName) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const weights = normalizeWeightOptions(product);
    const currentRow = getTypedRow(raw, typedKey) || {};
    const offeredWeights = weights.filter(
      (w) => getRowValue(currentRow, w.label) !== null,
    );
    if (!offeredWeights.length && Object.keys(currentRow).length > 0) return;
    const anyOn =
      offeredWeights.length > 0
        ? offeredWeights.some((w) => getRowValue(currentRow, w.label) !== false)
        : true;
    const newRow = {};
    weights.forEach((w) => {
      const cur = getRowValue(currentRow, w.label);
      if (cur === null) newRow[w.label] = null;
      else newRow[w.label] = !anyOn;
    });

    const nextMatrix = {};
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });
    nextMatrix[getTypedKeyName(raw, typedKey)] = newRow;

    // Ensure other egg type has entries
    const otherType = eggType === "egg" ? "eggless" : "egg";
    const hasOtherType =
      otherType === "egg"
        ? product.isEgg !== false
        : product.isEggless === true;
    if (hasOtherType) {
      const flavors = normalizeFlavorOptions(product);
      const flavorNames =
        flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
      flavorNames.forEach((fn) => {
        const otherKey = `${otherType}::${fn}`;
        if (!nextMatrix[otherKey]) {
          const otherRow = {};
          weights.forEach((w) => {
            otherRow[w.label] = true;
          });
          nextMatrix[otherKey] = otherRow;
        }
      });
    }

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `typed-flavor-${product._id}-${eggType}-${flavorName}`,
      `${flavorName} (${eggType}) updated for ${product.name}.`,
    );
  };

  const isTypedFlavorOn = (product, eggType, flavorName) => {
    const weights = normalizeWeightOptions(product);
    return weights.some((w) => {
      const v = getTypedAvailability(product, eggType, flavorName, w.label);
      return v === true;
    });
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

  const handleFlavorWeightToggleByType = (
    product,
    eggType,
    flavorName,
    weightLabel,
  ) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const existingRow = getTypedRow(raw, typedKey) || {};
    const rawVal = getRowValue(existingRow, weightLabel);
    if (rawVal === null) return;
    const currentValue = rawVal !== undefined ? rawVal !== false : true;

    const nextMatrix = {};
    Object.keys(raw).forEach((key) => {
      if (key.includes("::")) nextMatrix[key] = { ...raw[key] };
    });
    nextMatrix[getTypedKeyName(raw, typedKey)] = {
      ...existingRow,
      [weightLabel]: !currentValue,
    };

    // Ensure other egg type has entries
    const otherType = eggType === "egg" ? "eggless" : "egg";
    const hasOtherType =
      otherType === "egg"
        ? product.isEgg !== false
        : product.isEggless === true;
    if (hasOtherType) {
      const weights = normalizeWeightOptions(product);
      const flavors = normalizeFlavorOptions(product);
      const flavorNames =
        flavors.length > 0 ? flavors.map((f) => f.name) : ["Cake"];
      flavorNames.forEach((fn) => {
        const otherKey = `${otherType}::${fn}`;
        if (!nextMatrix[otherKey]) {
          const otherRow = {};
          weights.forEach((w) => {
            otherRow[w.label] = true;
          });
          nextMatrix[otherKey] = otherRow;
        }
      });
    }

    saveInventory(
      product,
      { flavorWeightAvailability: nextMatrix },
      `fw-${product._id}-${eggType}-${flavorName}-${weightLabel}`,
      `${flavorName} ${weightLabel} (${eggType}) updated for ${product.name}.`,
    );
  };

  const getTypedAvailability = (product, eggType, flavorName, weightLabel) => {
    const raw = product.flavorWeightAvailability || {};
    const typedKey = `${eggType}::${flavorName}`;
    const row = getTypedRow(raw, typedKey);
    const val = getRowValue(row, weightLabel);
    if (val !== undefined) {
      if (val === null) return null;
      return val !== false;
    }
    // No typed key yet — default to ON (not offered yet = available)
    return true;
  };

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
            const isSavingProduct = savingKey === `product-${product._id}`;

            return (
              <div
                key={product._id}
                className="overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-3 sm:p-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <img
                      src={product.images?.[0] || product.image}
                      alt={product.name}
                      className="h-14 w-14 sm:h-20 sm:w-20 rounded-xl sm:rounded-2xl object-cover ring-1 ring-slate-200 flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "";
                        e.target.style.background = "#f1f5f9";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-base sm:text-xl font-bold text-slate-900 truncate">
                            {product.name}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <StatusChip tone="info">
                              {formatCategoryLabel(product.category)}
                            </StatusChip>
                            <StatusChip tone={canOrder ? "success" : "warning"}>
                              {canOrder ? "Live" : "Attention"}
                            </StatusChip>
                          </div>
                        </div>
                        <Toggle
                          checked={product.isAvailable !== false}
                          onClick={() => handleProductToggle(product)}
                          disabled={isSavingProduct}
                          label={`toggle ${product.name}`}
                        />
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs text-slate-400">
                        {flavorOptions.length > 0
                          ? `${availableFlavorCount}/${flavorOptions.length} flavors · `
                          : ""}
                        {weightOptions.length > 0
                          ? `${availableWeightCount}/${weightOptions.length} ${portionTypeMeta.heading.toLowerCase()}`
                          : `No ${portionTypeMeta.heading.toLowerCase()}`}
                      </p>
                    </div>
                  </div>
                </div>

                {(() => {
                  const showEgg = product.isEgg !== false;
                  const showEggless = product.isEggless === true;
                  const hasFlavors = flavorOptions.length > 0;
                  const cols =
                    showEgg && showEggless ? "grid-cols-2" : "grid-cols-1";

                  const renderWeightsOnly = (eggType) => (
                    <div className="space-y-1">
                      {weightOptions.map((w) => {
                        const avail = getTypedAvailability(
                          product,
                          eggType,
                          "Cake",
                          w.label,
                        );
                        if (avail === null) return null;
                        const weightKey = `fw-${product._id}-${eggType}-Cake-${w.label}`;
                        const isOn = avail;
                        const saving = savingKey === weightKey;
                        return (
                          <button
                            key={weightKey}
                            type="button"
                            onClick={() =>
                              handleFlavorWeightToggleByType(
                                product,
                                eggType,
                                "Cake",
                                w.label,
                              )
                            }
                            disabled={saving}
                            className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                              isOn
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-600"
                            }`}
                          >
                            <span>{w.label}</span>
                            <span className="text-[10px] font-semibold">
                              {isOn ? "ON" : "OFF"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );

                  const renderFlavorColumn = (eggType) => (
                    <div className="space-y-3">
                      {flavorOptions.map((option) => {
                        const optionKey = `typed-flavor-${product._id}-${eggType}-${option.name}`;
                        return (
                          <div key={`${eggType}-${option.name}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                                {option.name}
                              </span>
                              <Toggle
                                checked={isTypedFlavorOn(
                                  product,
                                  eggType,
                                  option.name,
                                )}
                                onClick={() =>
                                  handleTypedFlavorToggle(
                                    product,
                                    eggType,
                                    option.name,
                                  )
                                }
                                disabled={savingKey === optionKey}
                                label={`toggle flavor ${option.name} ${eggType}`}
                              />
                            </div>
                            <div className="mt-1.5 space-y-1 pl-2">
                              {weightOptions.map((w) => {
                                const avail = getTypedAvailability(
                                  product,
                                  eggType,
                                  option.name,
                                  w.label,
                                );
                                if (avail === null) return null;
                                const isOn = avail;
                                const saving =
                                  savingKey ===
                                  `fw-${product._id}-${eggType}-${option.name}-${w.label}`;
                                return (
                                  <button
                                    key={`${eggType}-${option.name}-${w.label}`}
                                    type="button"
                                    onClick={() =>
                                      handleFlavorWeightToggleByType(
                                        product,
                                        eggType,
                                        option.name,
                                        w.label,
                                      )
                                    }
                                    disabled={saving}
                                    className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                                      isOn
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-red-200 bg-red-50 text-red-600"
                                    }`}
                                  >
                                    <span>{w.label}</span>
                                    <span className="text-[10px] font-semibold">
                                      {isOn ? "ON" : "OFF"}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );

                  const renderColumn = (eggType, label) => (
                    <div className="p-3 sm:p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-slate-800">
                          {label}
                        </span>
                        <Toggle
                          checked={isEggTypeOn(product, eggType)}
                          onClick={() => handleEggTypeToggle(product, eggType)}
                          disabled={savingKey === `${eggType}-${product._id}`}
                          label={`toggle ${eggType}`}
                        />
                      </div>
                      {hasFlavors
                        ? renderFlavorColumn(eggType)
                        : renderWeightsOnly(eggType)}
                    </div>
                  );

                  if (!showEgg && !showEggless) return null;

                  return (
                    <div className={`grid ${cols} divide-x divide-slate-100`}>
                      {showEgg && renderColumn("egg", "Egg")}
                      {showEggless && renderColumn("eggless", "Eggless")}
                    </div>
                  );
                })()}
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
