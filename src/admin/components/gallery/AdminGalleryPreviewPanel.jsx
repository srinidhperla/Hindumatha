import React from "react";
import { ActionButton, SurfaceCard } from "@/shared/ui/Primitives";

const AdminGalleryPreviewPanel = ({
  imagePreview,
  imageFileName,
  editingItem,
  onImagePick,
}) => (
  <SurfaceCard className="p-4 sm:p-5">
    <div className="overflow-hidden rounded-3xl border border-gold-200/60 bg-[#fff9ea]">
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="Gallery preview"
          className="h-72 w-full object-cover"
        />
      ) : (
        <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-primary-700">
          Add an image to preview the gallery item here.
        </div>
      )}
    </div>

    <div className="mt-4 flex gap-2">
      <ActionButton
        type="button"
        variant="secondary"
        className="flex-1"
        onClick={onImagePick}
      >
        Add Image
      </ActionButton>
    </div>

    <p className="mt-3 text-xs text-primary-700">
      {imageFileName
        ? `Selected image: ${imageFileName}`
        : editingItem
          ? "Current gallery image is active until you upload a new one."
          : "Upload one image to create this gallery item."}
    </p>
  </SurfaceCard>
);

export default AdminGalleryPreviewPanel;
