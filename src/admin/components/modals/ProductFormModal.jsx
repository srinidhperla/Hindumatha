import React from "react";
import Modal from "../../../components/ui/Modal";
import {
  ActionButton,
  StatusChip,
  SurfaceCard,
} from "../../../components/ui/Primitives";
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
  onFlavorWeightAvailabilityChange,
  onImageChange,
  onMoveImage,
  onRemoveImage,
  onSubmit,
  onRenameCategory,
  onDeleteCategory,
}) => {
  const selectedEggTypes = [
    formData.isEgg ? "egg" : null,
    formData.isEggless ? "eggless" : null,
  ].filter(Boolean);
  const flavorRows =
    formData.flavorOptions.length > 0
      ? formData.flavorOptions.map((option) => option.name)
      : ["Cake"];

  const getTypedKey = (eggType, flavorName) => `${eggType}::${flavorName}`;

  const isWeightOn = (eggType, flavorName, weightLabel) => {
    const key = getTypedKey(eggType, flavorName);
    const row = formData.flavorWeightAvailability?.[key] || {};
    return row[weightLabel] !== false && row[weightLabel] !== null;
  };

  const updateTypedWeight = (eggType, flavorName, weightLabel, nextValue) => {
    const key = getTypedKey(eggType, flavorName);
    const current = formData.flavorWeightAvailability || {};
    const nextMatrix = {
      ...current,
      [key]: {
        ...(current[key] || {}),
        [weightLabel]: nextValue ? true : null,
      },
    };
    onFlavorWeightAvailabilityChange(nextMatrix);
  };

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
      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
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

          {formData.weightOptions.length > 0 &&
            Number(formData.price) > 0 &&
            selectedEggTypes.length > 0 && (
              <SurfaceCard className="p-3 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                  Set Prices
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  Set price per weight for each flavor. Toggle OFF to hide that
                  option in inventory.
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
                      className="rounded-xl border border-slate-200 p-3 sm:p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-base font-bold text-slate-900">
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
                                <span className="text-sm font-semibold text-slate-700">
                                  {flavorName}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {formData.weightOptions.map(
                                  (weightOption, index) => {
                                    const computedPrice = Math.round(
                                      (Number(formData.price) || 0) *
                                        (weightOption.multiplier || 1),
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
                                            ? "border-emerald-200 bg-emerald-50"
                                            : "border-red-200 bg-red-50"
                                        }`}
                                      >
                                        <span className="min-w-[60px] text-sm font-semibold text-slate-800">
                                          {weightOption.label}
                                        </span>
                                        <div className="flex flex-1 items-center gap-1">
                                          <span className="text-sm font-medium text-slate-500">
                                            ₹
                                          </span>
                                          <input
                                            type="number"
                                            min="1"
                                            value={computedPrice}
                                            onChange={(event) => {
                                              const newPrice = Number(
                                                event.target.value,
                                              );
                                              const base =
                                                Number(formData.price) || 1;
                                              const newMultiplier =
                                                Math.round(
                                                  (newPrice / base) * 100,
                                                ) / 100;
                                              onWeightFieldChange(
                                                index,
                                                "multiplier",
                                                newMultiplier,
                                              );
                                            }}
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold shadow-sm focus:border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
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
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {weightOn ? "ON" : "OFF"}
                                        </button>
                                      </div>
                                    );
                                  },
                                )}
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
