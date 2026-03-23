import React from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton, StatusChip, SurfaceCard } from "@/shared/ui/Primitives";
import ProductBasicsSection from "../products/ProductBasicsSection";
import ProductOptionsSection from "../products/ProductOptionsSection";
import ProductImagesSection from "../products/ProductImagesSection";
import { getPortionTypeMeta } from "@/utils/productOptions";
import { useProductFormPricing } from "./useProductFormPricing";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

const ProductFormModal = ({
  editingProduct,
  formData,
  useCustomCategory,
  customCategory,
  customFlavor,
  customWeightLabel,
  imageItems,
  availableCategories,
  availableFlavors,
  onClose,
  onChange,
  onCategoryChange,
  onCustomCategoryChange,
  onCustomFlavorChange,
  onAddFlavor,
  onRemoveFlavor,
  onAddFlavorOption,
  onCustomWeightLabelChange,
  onPortionTypeChange,
  onAddWeight,
  onRemoveWeight,
  onWeightFieldChange,
  onFlavorWeightAvailabilityChange,
  onVariantPricesChange,
  onImageChange,
  onMoveImage,
  onRemoveImage,
  onSubmit,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const {
    selectedEggTypes,
    flavorRows,
    fallbackFlavorLabel,
    getTypedPrice,
    isWeightOn,
    updateTypedPrice,
    updateTypedWeight,
  } = useProductFormPricing({
    formData,
    onVariantPricesChange,
    onFlavorWeightAvailabilityChange,
  });
  const portionTypeMeta = getPortionTypeMeta(formData.portionType);

  return (
    <Modal
      title={editingProduct ? "Edit Product" : "Add New Product"}
      badge={<StatusChip tone="info">Easy mobile editor</StatusChip>}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <ActionButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="product-editor-form"
            variant="primary"
          >
            {editingProduct ? "Update Product" : "Create Product"}
          </ActionButton>
        </div>
      }
    >
      <div className="rounded-2xl border border-gold-200/50 bg-gradient-to-br from-gold-50/40 via-white/65 to-cream-100/45 p-3 sm:p-4">
        <form
          id="product-editor-form"
          onSubmit={onSubmit}
          className="space-y-5"
        >
          <ProductBasicsSection
            formData={formData}
            inputClassName={inputClassName}
            availableCategories={availableCategories}
            useCustomCategory={useCustomCategory}
            customCategory={customCategory}
            onChange={onChange}
            onCategoryChange={onCategoryChange}
            onCustomCategoryChange={onCustomCategoryChange}
            onRenameCategory={onRenameCategory}
            onDeleteCategory={onDeleteCategory}
          />

          <ProductOptionsSection
            formData={formData}
            inputClassName={inputClassName}
            availableFlavors={availableFlavors}
            customFlavor={customFlavor}
            customWeightLabel={customWeightLabel}
            onCustomFlavorChange={onCustomFlavorChange}
            onAddFlavor={onAddFlavor}
            onRemoveFlavor={onRemoveFlavor}
            onAddFlavorOption={onAddFlavorOption}
            onCustomWeightLabelChange={onCustomWeightLabelChange}
            onPortionTypeChange={onPortionTypeChange}
            onAddWeight={onAddWeight}
            onRemoveWeight={onRemoveWeight}
            onWeightFieldChange={onWeightFieldChange}
          />

          <ProductImagesSection
            imageItems={imageItems}
            formData={formData}
            onImageChange={onImageChange}
            onMoveImage={onMoveImage}
            onRemoveImage={onRemoveImage}
          />

          {formData.weightOptions.length > 0 && selectedEggTypes.length > 0 && (
            <SurfaceCard className="p-3 sm:p-5">
              <h3 className="text-base sm:text-lg font-semibold text-primary-900">
                Set Prices
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-primary-600">
                Set price per {portionTypeMeta.singular} for each flavor. Toggle
                OFF to hide that option in inventory.
              </p>

              <div
                className={`mt-4 grid gap-4 ${
                  selectedEggTypes.length === 2
                    ? "lg:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {selectedEggTypes.map((eggType) => (
                  <div
                    key={eggType}
                    className="rounded-xl border border-gold-200/60 bg-white/70 p-3 sm:p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-base font-bold text-primary-900">
                        {eggType === "egg" ? "Egg" : "Eggless"}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {flavorRows.map((flavorName) => {
                        return (
                          <div
                            key={`${eggType}-${flavorName}`}
                            className="space-y-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary-700">
                                {formData.flavorOptions.length
                                  ? flavorName
                                  : fallbackFlavorLabel}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {formData.weightOptions.map((weightOption) => {
                                const resolvedPrice = getTypedPrice(
                                  eggType,
                                  flavorName,
                                  weightOption,
                                );
                                const weightOn = isWeightOn(
                                  eggType,
                                  flavorName,
                                  weightOption.label,
                                );

                                return (
                                  <div
                                    key={`${eggType}-${flavorName}-${weightOption.label}`}
                                    className={`flex items-center gap-3 rounded-xl border p-2.5 sm:p-3 ${
                                      weightOn
                                        ? "border-gold-200/70 bg-gold-50/55"
                                        : "border-rose-200/70 bg-rose-50/55"
                                    }`}
                                  >
                                    <span className="min-w-[60px] text-sm font-semibold text-primary-800">
                                      {weightOption.label}
                                    </span>
                                    <div className="flex flex-1 items-center gap-1">
                                      <span className="text-sm font-medium text-primary-600">
                                        ₹
                                      </span>
                                      <input
                                        type="number"
                                        min="1"
                                        disabled={!weightOn}
                                        value={resolvedPrice}
                                        onChange={(event) => {
                                          updateTypedPrice(
                                            eggType,
                                            flavorName,
                                            weightOption.label,
                                            event.target.value,
                                          );
                                        }}
                                        className={`w-full rounded-xl border border-gold-200/70 px-3 py-2 text-sm font-semibold text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70 ${
                                          weightOn
                                            ? "bg-white/90"
                                            : "cursor-not-allowed bg-primary-100 text-primary-400"
                                        }`}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateTypedWeight(
                                          eggType,
                                          flavorName,
                                          weightOption.label,
                                          !weightOn,
                                        )
                                      }
                                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        weightOn
                                          ? "bg-gold-100 text-primary-700"
                                          : "bg-rose-100 text-rose-700"
                                      }`}
                                    >
                                      {weightOn ? "ON" : "OFF"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SurfaceCard>
          )}
        </form>
      </div>
    </Modal>
  );
};

export default ProductFormModal;
