import React from "react";

const MenuImagePreviewModal = ({ imagePreview, closeImagePreview }) => {
  if (!imagePreview) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closeImagePreview();
        }
      }}
    >
      <button
        type="button"
        onClick={closeImagePreview}
        className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
      >
        Close
      </button>
      <img
        src={imagePreview.src}
        alt={imagePreview.name}
        className="max-h-[88vh] w-auto max-w-[96vw] rounded-xl object-contain shadow-2xl"
      />
    </div>
  );
};

export default MenuImagePreviewModal;
