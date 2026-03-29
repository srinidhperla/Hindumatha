const DEFAULT_CLOUDINARY_TRANSFORMS = "f_auto,q_auto,w_800";

const CLOUDINARY_HOST_REGEX = /^https?:\/\/res\.cloudinary\.com\//i;
const CLOUDINARY_UPLOAD_PATH = "/image/upload/";

export const optimizeCloudinaryUploadUrl = (
  imageUrl,
  transforms = DEFAULT_CLOUDINARY_TRANSFORMS,
) => {
  const source = String(imageUrl || "").trim();
  if (!source || !CLOUDINARY_HOST_REGEX.test(source)) {
    return source;
  }

  try {
    const parsed = new URL(source);
    const uploadIndex = parsed.pathname.indexOf(CLOUDINARY_UPLOAD_PATH);
    if (uploadIndex < 0) {
      return source;
    }

    const beforeUpload = parsed.pathname.slice(
      0,
      uploadIndex + CLOUDINARY_UPLOAD_PATH.length,
    );
    const afterUpload = parsed.pathname
      .slice(uploadIndex + CLOUDINARY_UPLOAD_PATH.length)
      .replace(/^\/+/, "");

    if (
      afterUpload.startsWith(`${transforms}/`) ||
      (afterUpload.includes("f_auto") &&
        afterUpload.includes("q_auto") &&
        afterUpload.includes("w_800"))
    ) {
      return source;
    }

    parsed.pathname = `${beforeUpload}${transforms}/${afterUpload}`;
    return parsed.toString();
  } catch {
    return source;
  }
};

export const optimizeProductImageUrl = (imageUrl) =>
  optimizeCloudinaryUploadUrl(imageUrl, DEFAULT_CLOUDINARY_TRANSFORMS);

export const normalizeProductImageFields = (product = {}) => {
  const normalizedImages = Array.isArray(product.images)
    ? product.images.map((image) => optimizeProductImageUrl(image))
    : [];
  const normalizedPrimary = optimizeProductImageUrl(
    product.image || normalizedImages[0] || "",
  );

  return {
    ...product,
    image: normalizedPrimary,
    images: normalizedImages.length
      ? normalizedImages
      : [normalizedPrimary].filter(Boolean),
  };
};

export const toCloudinaryFetchUrl = (sourceUrl) => {
  const normalizedSource = String(sourceUrl || "").trim();
  if (!normalizedSource) {
    return "";
  }

  const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo")
    .trim()
    .replace(/\s+/g, "");
  const safeWidth = 800;

  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${safeWidth}/${encodeURIComponent(normalizedSource)}`;
};
