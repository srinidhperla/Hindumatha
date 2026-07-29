import { useMemo } from "react";
import { useSelector } from "react-redux";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";
import {
  attachGalleryItemCodes,
  getGalleryItemCategories,
} from "@/utils/galleryItems";

// Shared derivation for the gallery grid and the full-screen photo page so both
// resolve the exact same cake codes.
const useGalleryItems = () => {
  const { galleryItems, loaded: isSiteLoaded } = useSelector(
    (state) => state.site,
  );
  const { products } = useSelector((state) => state.products);

  const visibleGalleryItems = useMemo(() => {
    const safeGalleryItems = Array.isArray(galleryItems) ? galleryItems : [];
    const seenKeys = new Set();

    return [...safeGalleryItems]
      .sort(
        (left, right) =>
          new Date(right?.createdAt || 0).getTime() -
          new Date(left?.createdAt || 0).getTime(),
      )
      .filter((item) => {
        const signature = [
          String(item?.title || "").trim().toLowerCase(),
          String(item?.imageUrl || "").trim().toLowerCase(),
          getGalleryItemCategories(item).join("|").toLowerCase(),
        ].join("::");

        if (seenKeys.has(signature)) {
          return false;
        }

        seenKeys.add(signature);
        return true;
      });
  }, [galleryItems]);

  const featuredProductItems = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : [];

    return safeProducts
      .filter((product) => product.isFeatured)
      .filter((product) => product.isAddon !== true)
      .map((product) => ({
        _id: `product-${product._id}`,
        imageUrl: optimizeProductImageUrl(product.images?.[0] || product.image),
        title: product.name,
        category: "Featured",
        categories: ["Featured"],
        likes: 0,
        isProduct: true,
        productId: product._id,
      }));
  }, [products]);

  const allItems = useMemo(
    () => attachGalleryItemCodes([...featuredProductItems, ...visibleGalleryItems]),
    [featuredProductItems, visibleGalleryItems],
  );

  return {
    allItems,
    visibleGalleryItems,
    featuredProductItems,
    isSiteLoaded,
  };
};

export default useGalleryItems;
