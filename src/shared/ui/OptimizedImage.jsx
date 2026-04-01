import React from "react";
import { getOptimizedImageAttributes } from "@/utils/imageOptimization";

const OptimizedImage = ({
  src,
  alt,
  maxWidth = 800,
  width = 800,
  height = 800,
  responsiveWidths,
  sizes,
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
  onError,
  ...rest
}) => {
  const originalImageUrl = String(src || "").trim();
  const optimized = getOptimizedImageAttributes(src, {
    width: maxWidth,
    widths: responsiveWidths,
    sizes,
  });

  const handleError = (event) => {
    if (originalImageUrl) {
      event.target.src = originalImageUrl;
    }
    onError?.(event);
  };

  return (
    <img
      width={width}
      height={height}
      src={optimized.src}
      srcSet={optimized.srcSet || undefined}
      sizes={optimized.sizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      onError={handleError}
      {...rest}
    />
  );
};

export default OptimizedImage;
