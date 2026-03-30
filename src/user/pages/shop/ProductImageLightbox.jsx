import React from "react";
import { OptimizedImage } from "@/shared/ui";

const ProductImageLightbox = ({ isOpen, image, alt, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="product-lightbox"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        className="product-lightbox-close"
        onClick={onClose}
      >
        Close
      </button>
      <OptimizedImage
        src={image}
        alt={alt}
        width={1200}
        height={1200}
        loading="eager"
        maxWidth={1400}
        className="product-lightbox-image"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
};

export default ProductImageLightbox;
