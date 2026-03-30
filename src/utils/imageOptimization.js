import { resolveCloudinaryGalleryImage } from "@/constants/galleryCloudinaryImages";

const DEFAULT_IMAGE_WIDTH = 800;
const DEFAULT_RESPONSIVE_WIDTHS = [320, 480, 640, 800];
const CLOUDINARY_UPLOAD_MARKER = "/image/upload/";
const CLOUDINARY_FETCH_MARKER = "/image/fetch/";
const CLOUDINARY_HOST_REGEX = /^https?:\/\/res\.cloudinary\.com\//i;
const LOCAL_GALLERY_PATH_PREFIX = "/images/gallery/";

const isCloudinaryTransformSegment = (segment = "") =>
  /(?:^|,)(?:a|ar|b|bo|c|co|dpr|e|f|fl|g|h|o|q|r|t|w|x|y|z)_[^,]+/i.test(
    String(segment || ""),
  );

const buildCloudinaryTransforms = (width = DEFAULT_IMAGE_WIDTH) =>
  `f_auto,q_auto,c_limit,w_${Math.max(1, Number(width) || DEFAULT_IMAGE_WIDTH)}`;

const injectCloudinaryTransforms = (source, transforms) => {
  if (!source || !CLOUDINARY_HOST_REGEX.test(source)) {
    return source;
  }

  try {
    const parsed = new URL(source);
    const marker = parsed.pathname.includes(CLOUDINARY_UPLOAD_MARKER)
      ? CLOUDINARY_UPLOAD_MARKER
      : parsed.pathname.includes(CLOUDINARY_FETCH_MARKER)
        ? CLOUDINARY_FETCH_MARKER
        : "";

    if (!marker) {
      return source;
    }

    const markerIndex = parsed.pathname.indexOf(marker);
    const beforeMarker = parsed.pathname.slice(
      0,
      markerIndex + marker.length,
    );
    const remainingParts = parsed.pathname
      .slice(markerIndex + marker.length)
      .split("/")
      .filter(Boolean);

    if (
      remainingParts.length > 0 &&
      isCloudinaryTransformSegment(remainingParts[0])
    ) {
      remainingParts.shift();
    }

    parsed.pathname = `${beforeMarker}${transforms}/${remainingParts.join("/")}`;
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

const resolveBaseImageUrl = (imageUrl) => {
  const source = String(imageUrl || "").trim();
  if (!source) {
    return "";
  }

  return resolveCloudinaryGalleryImage(normalizeGalleryImageUrl(source));
};

export const optimizeCloudinaryUploadUrl = (
  imageUrl,
  transforms = buildCloudinaryTransforms(DEFAULT_IMAGE_WIDTH),
) => injectCloudinaryTransforms(String(imageUrl || "").trim(), transforms);

export const optimizeImageUrl = (
  imageUrl,
  { width = DEFAULT_IMAGE_WIDTH } = {},
) => {
  const resolvedSource = resolveBaseImageUrl(imageUrl);
  if (!resolvedSource || isLocalGalleryPath(resolvedSource)) {
    return resolvedSource;
  }

  if (CLOUDINARY_HOST_REGEX.test(resolvedSource)) {
    return optimizeCloudinaryUploadUrl(
      resolvedSource,
      buildCloudinaryTransforms(width),
    );
  }

  return resolvedSource;
};

export const optimizeProductImageUrl = (
  imageUrl,
  options = {},
) => optimizeImageUrl(imageUrl, options);

export const getOptimizedImageAttributes = (
  imageUrl,
  {
    width = DEFAULT_IMAGE_WIDTH,
    widths = DEFAULT_RESPONSIVE_WIDTHS,
    sizes = "",
  } = {},
) => {
  const src = optimizeImageUrl(imageUrl, { width });
  const uniqueWidths = Array.from(
    new Set(
      (Array.isArray(widths) ? widths : [])
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry) && entry > 0),
    ),
  ).sort((left, right) => left - right);

  const canBuildResponsiveSet =
    Boolean(src) && CLOUDINARY_HOST_REGEX.test(src) && uniqueWidths.length > 0;

  return {
    src,
    srcSet: canBuildResponsiveSet
      ? uniqueWidths
          .map(
            (candidateWidth) =>
              `${optimizeImageUrl(src, { width: candidateWidth })} ${candidateWidth}w`,
          )
          .join(", ")
      : "",
    sizes: sizes || undefined,
  };
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

export const normalizeSiteImageFields = (siteContent = {}) => ({
  ...siteContent,
  galleryItems: Array.isArray(siteContent.galleryItems)
    ? siteContent.galleryItems.map((item) => ({
        ...item,
        imageUrl: optimizeImageUrl(item.imageUrl),
      }))
    : [],
});

export const toCloudinaryFetchUrl = (
  sourceUrl,
  { width = DEFAULT_IMAGE_WIDTH } = {},
) => {
  const normalizedSource = resolveBaseImageUrl(sourceUrl);
  if (!normalizedSource || isLocalGalleryPath(normalizedSource)) {
    return normalizedSource;
  }

  if (CLOUDINARY_HOST_REGEX.test(normalizedSource)) {
    return optimizeCloudinaryUploadUrl(
      normalizedSource,
      buildCloudinaryTransforms(width),
    );
  }

  const cloudName = String(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "")
    .trim()
    .replace(/\s+/g, "");

  if (!cloudName) {
    return normalizedSource;
  }

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${buildCloudinaryTransforms(width)}/${encodeURIComponent(normalizedSource)}`;
};
