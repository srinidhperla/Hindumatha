import React from "react";
import Modal from "../../../components/ui/Modal";
import { ActionButton, StatusChip } from "../../../components/ui/Primitives";
import ProductBasicsSection from "../products/ProductBasicsSection";
import ProductOptionsSection from "../products/ProductOptionsSection";
import ProductImagesSection from "../products/ProductImagesSection";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200";

const ProductFormModal = ({
  editingProduct,
  formData,
  useCustomCategory,
  customCategory,
  customFlavor,
  customWeightLabel,
  customWeightMultiplier,
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
  onCustomWeightMultiplierChange,
  onAddWeight,
  onRemoveWeight,
  onWeightFieldChange,
  onImageChange,
  onMoveImage,
  onRemoveImage,
  onSubmit,
}) => (
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
    <div className="rounded-[28px_12px_28px_12px] border border-slate-200 bg-white/65 p-2">
      <form id="product-editor-form" onSubmit={onSubmit} className="space-y-5">
        <ProductBasicsSection
          formData={formData}
          inputClassName={inputClassName}
          availableCategories={availableCategories}
          useCustomCategory={useCustomCategory}
          customCategory={customCategory}
          onChange={onChange}
          onCategoryChange={onCategoryChange}
          onCustomCategoryChange={onCustomCategoryChange}
        />

        <ProductOptionsSection
          formData={formData}
          inputClassName={inputClassName}
          availableFlavors={availableFlavors}
          customFlavor={customFlavor}
          customWeightLabel={customWeightLabel}
          customWeightMultiplier={customWeightMultiplier}
          onCustomFlavorChange={onCustomFlavorChange}
          onAddFlavor={onAddFlavor}
          onRemoveFlavor={onRemoveFlavor}
          onAddFlavorOption={onAddFlavorOption}
          onCustomWeightLabelChange={onCustomWeightLabelChange}
          onCustomWeightMultiplierChange={onCustomWeightMultiplierChange}
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
      </form>
    </div>
  </Modal>
);

export default ProductFormModal;
