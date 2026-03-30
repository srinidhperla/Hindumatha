import React from "react";
import Modal from "@/shared/ui/Modal";
import { OptimizedImage } from "@/shared/ui";
import { ActionButton, StatusChip } from "@/shared/ui/Primitives";

const inputClassName =
  "mt-1 block w-full rounded-xl border border-gold-200/70 bg-white/85 px-3 py-2.5 text-sm text-primary-800 shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-200/70";

const AddOnFormModal = ({
  formData,
  onChange,
  onImageChange,
  onSubmit,
  onClose,
}) => (
  <Modal
    title="Add Addon"
    badge={<StatusChip tone="accent">Cart upsell</StatusChip>}
    onClose={onClose}
    maxWidthClassName="max-w-2xl"
    footer={
      <div className="flex justify-end gap-3">
        <ActionButton type="button" onClick={onClose} variant="secondary">
          Cancel
        </ActionButton>
        <ActionButton type="submit" form="addon-editor-form" variant="primary">
          Save Addon
        </ActionButton>
      </div>
    }
  >
    <form id="addon-editor-form" onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-primary-700">Name</span>
        <input
          name="name"
          value={formData.name}
          onChange={onChange}
          placeholder="Example: Birthday topper"
          className={inputClassName}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-primary-700">Price</span>
        <input
          type="number"
          name="price"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={onChange}
          placeholder="99"
          className={inputClassName}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-primary-700">
          Description
        </span>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={onChange}
          placeholder="Short addon description"
          className={inputClassName}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-primary-700">Image</span>
        <input
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className={inputClassName}
          required
        />
      </label>

      {formData.imagePreview && (
        <div className="overflow-hidden rounded-2xl border border-gold-200/70 bg-white/80 p-2">
          <OptimizedImage
            src={formData.imagePreview}
            alt="Addon preview"
            width={720}
            height={440}
            loading="lazy"
            className="h-44 w-full rounded-xl object-cover"
          />
        </div>
      )}
    </form>
  </Modal>
);

export default AddOnFormModal;
