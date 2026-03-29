const DEFAULT_CLOUDINARY_TRANSFORMS = "f_auto,q_auto,w_800";

const CLOUDINARY_HOST_REGEX = /^https?:\/\/res\.cloudinary\.com\//i;
const CLOUDINARY_UPLOAD_PATH = "/image/upload/";
const LOCAL_GALLERY_PATH_PREFIX = "/images/gallery/";

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

const isLocalGalleryPath = (value = "") =>
  String(value).toLowerCase().startsWith(LOCAL_GALLERY_PATH_PREFIX);

export const normalizeGalleryImageUrl = (imageUrl) => {
  const source = String(imageUrl || "").trim();
  if (!source) {
    return "";
  }

  if (source.startsWith(LOCAL_GALLERY_PATH_PREFIX)) {
    return source.split(/[?#]/, 1)[0];
  }

  if (source.toLowerCase().startsWith("images/gallery/")) {
    return `/${source}`.split(/[?#]/, 1)[0];
  }

  try {
    const parsed = new URL(source);
    if (isLocalGalleryPath(parsed.pathname)) {
      return parsed.pathname;
    }
  } catch {
    return source;
  }

  return source;
};

export const optimizeProductImageUrl = (imageUrl) => {
  const normalized = normalizeGalleryImageUrl(imageUrl);
  if (!normalized || isLocalGalleryPath(normalized)) {
    return normalized;
  }

  return optimizeCloudinaryUploadUrl(normalized, DEFAULT_CLOUDINARY_TRANSFORMS);
};

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
  const normalizedSource = normalizeGalleryImageUrl(sourceUrl);
  if (!normalizedSource) {
    return "";
  }

  if (isLocalGalleryPath(normalizedSource)) {
    return normalizedSource;
  }

  if (CLOUDINARY_HOST_REGEX.test(normalizedSource)) {
    return optimizeCloudinaryUploadUrl(
      normalizedSource,
      DEFAULT_CLOUDINARY_TRANSFORMS,
    );
  }

  const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo")
    .trim()
    .replace(/\s+/g, "");
  const safeWidth = 800;

  return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_${safeWidth}/${encodeURIComponent(normalizedSource)}`;
};
