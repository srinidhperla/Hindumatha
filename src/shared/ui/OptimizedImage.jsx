import React from "react";
import { getOptimizedImageAttributes } from "@/utils/imageOptimization";

const OptimizedImage = ({
  src,
  alt,
  maxWidth = 800,
  responsiveWidths,
  sizes,
  loading = "lazy",
  decoding = "async",
  fetchPriority = "auto",
  ...rest
}) => {
  const optimized = getOptimizedImageAttributes(src, {
    width: maxWidth,
    widths: responsiveWidths,
    sizes,
  });

  return (
    <img
      src={optimized.src}
      srcSet={optimized.srcSet || undefined}
      sizes={optimized.sizes}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      {...rest}
    />
  );
};

export default OptimizedImage;
