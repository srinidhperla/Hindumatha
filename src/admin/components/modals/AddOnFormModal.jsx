import React, { useRef } from "react";
import Modal from "@/shared/ui/Modal";
import { ActionButton } from "@/shared/ui/Primitives";
import { FormField, fieldClass } from "@/shared/workspace/Form";

/* Add or edit a cart add-on (party popper, candles…). An add-on is a product
 * with a single price and one picture, so it gets this short form rather
 * than the full product editor with flavours, sizes and price tables. */
const AddOnFormModal = ({
  formData,
  isEditing = false,
  isSubmitting = false,
  onChange,
  onImageChange,
  onSubmit,
  onClose,
}) => {
  const fileInputRef = useRef(null);

  return (
    <Modal
      title={isEditing ? "Edit Addon" : "Add Addon"}
      onClose={onClose}
      maxWidthClassName="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <ActionButton type="button" onClick={onClose} variant="secondary">
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form="addon-editor-form"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : isEditing
                ? "Update Addon"
                : "Save Addon"}
          </ActionButton>
        </div>
      }
    >
      <form
        id="addon-editor-form"
        onSubmit={onSubmit}
        className="grid gap-3 sm:grid-cols-[112px_minmax(0,1fr)]"
      >
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative block aspect-square w-28 overflow-hidden rounded-xl border border-dashed border-[#d9c48a] bg-[#faf6ec] hover:border-[#c9a84c]"
          >
            {formData.imagePreview ? (
              <>
                <img
                  src={formData.imagePreview}
                  alt="Addon"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-[rgba(18,12,2,0.72)] py-1 text-[11px] font-semibold text-white">
                  Change
                </span>
              </>
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold text-[#5c4a26]">
                <span className="text-xl leading-none">+</span>
                Add image
              </span>
            )}
          </button>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
            <FormField label="Name">
              <input
                name="name"
                value={formData.name}
                onChange={onChange}
                placeholder="Birthday topper"
                className={fieldClass}
                required
              />
            </FormField>
            <FormField label="Price (₹)">
              <input
                type="number"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={onChange}
                className={fieldClass}
                required
              />
            </FormField>
          </div>
          <FormField label="Description">
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={onChange}
              className={fieldClass}
              required
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
};

export default AddOnFormModal;
