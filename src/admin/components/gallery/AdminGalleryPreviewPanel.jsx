import React from "react";

const AdminGalleryPreviewPanel = ({
  imagePreview,
  imageFileName,
  onImagePick,
}) => (
  <div>
    <button
      type="button"
      onClick={onImagePick}
      className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-dashed border-[#d9c48a] bg-[#faf6ec] hover:border-[#c9a84c]"
    >
      {imagePreview ? (
        <>
          <img
            src={imagePreview}
            alt="Gallery preview"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-[rgba(18,12,2,0.72)] py-1.5 text-xs font-semibold text-white">
            Change image
          </span>
        </>
      ) : (
        <span className="flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold text-[#5c4a26]">
          <span className="text-2xl leading-none">+</span>
          Add image
        </span>
      )}
    </button>
    {imageFileName && (
      <p className="mt-1.5 truncate text-[11px] text-[#7d6c4d]">
        {imageFileName}
      </p>
    )}
  </div>
);

export default AdminGalleryPreviewPanel;
