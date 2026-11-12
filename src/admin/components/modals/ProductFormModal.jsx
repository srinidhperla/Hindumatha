import React from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton } from "@/shared/ui/Primitives";
import { FormSection } from "@/shared/workspace/Form";
import ProductBasicsSection from "../products/ProductBasicsSection";
import ProductOptionsSection from "../products/ProductOptionsSection";
import ProductImagesSection from "../products/ProductImagesSection";
import { getPortionTypeMeta } from "@/utils/productOptions";
import { useProductFormPricing } from "./useProductFormPricing";

const ProductFormModal = ({
  editingProduct,
  formData,
  useCustomCategory,
  customCategory,
  customFlavor,
  customWeightLabel,
  imageItems,
  isSubmitting,
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
  const hasWeightOptions = formData.weightOptions.length > 0;

  return (
    <Modal
      title={editingProduct ? "Edit Product" : "Add Product"}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="product-editor-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : editingProduct
                ? "Update Product"
                : "Create Product"}
          </ActionButton>
        </div>
      }
    >
      <form id="product-editor-form" onSubmit={onSubmit} className="ws-form">
        <ProductBasicsSection
          formData={formData}
          hasWeightOptions={hasWeightOptions}
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

        {hasWeightOptions && selectedEggTypes.length > 0 && (
          <FormSection title={`Price per ${portionTypeMeta.singular}`}>
            <div
              className={`grid gap-x-6 gap-y-4 ${
                selectedEggTypes.length === 2 ? "md:grid-cols-2" : ""
              }`}
            >
              {selectedEggTypes.map((eggType) => (
                <div key={eggType}>
                  <p className="mb-1.5 text-sm font-bold text-[#1f1709]">
                    {eggType === "egg" ? "Egg" : "Eggless"}
                  </p>

                  <div className="space-y-3">
                    {flavorRows.map((flavorName) => (
                      <div key={`${eggType}-${flavorName}`}>
                        {(flavorRows.length > 1 ||
                          formData.flavorOptions.length > 0) && (
                          <p className="mb-1 text-xs font-semibold text-[#7d6c4d]">
                            {formData.flavorOptions.length
                              ? flavorName
                              : fallbackFlavorLabel}
                          </p>
                        )}

                        <div className="divide-y divide-[#f3ecdb] rounded-xl border border-[#ebe1cb]">
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
                                className={`flex items-center gap-2 px-2.5 py-1.5 ${
                                  weightOn ? "" : "bg-[#faf6ec]"
                                }`}
                              >
                                <span
                                  className={`min-w-0 flex-1 truncate text-sm font-medium ${
                                    weightOn
                                      ? "text-[#1f1709]"
                                      : "text-[#a8936a] line-through"
                                  }`}
                                >
                                  {weightOption.label}
                                </span>
                                <span className="text-sm text-[#7d6c4d]">
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
                                  aria-label={`Price for ${weightOption.label}`}
                                  className="ws-input !h-8 w-24 text-right font-semibold"
                                />
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
                                  className={`w-11 rounded-full py-1 text-[11px] font-bold ${
                                    weightOn
                                      ? "bg-emerald-50 text-emerald-700"
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FormSection>
        )}
      </form>
    </Modal>
  );
};

export default ProductFormModal;
