import React from "react";
import { Helmet } from "react-helmet-async";
import { CLOUDINARY_GALLERY_IMAGES } from "@/constants/galleryCloudinaryImages";

const DEFAULT_BASE_URL = "https://www.hindumathascakes.com";
const DEFAULT_OG_IMAGE_PATH = CLOUDINARY_GALLERY_IMAGES.cake1;

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return DEFAULT_BASE_URL;
  }

  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const toAbsoluteUrl = (baseUrl, pathOrUrl = "") => {
  if (!pathOrUrl) {
    return `${baseUrl}/`;
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return pathOrUrl.startsWith("/")
    ? `${baseUrl}${pathOrUrl}`
    : `${baseUrl}/${pathOrUrl}`;
};

const SeoMeta = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE_PATH,
  type = "website",
  noIndex = false,
  jsonLd,
}) => {
  const baseUrl = normalizeBaseUrl(import.meta.env.VITE_SITE_URL);
  const canonicalUrl = toAbsoluteUrl(baseUrl, path);
  const imageUrl = toAbsoluteUrl(baseUrl, image);

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
};

export default SeoMeta;
