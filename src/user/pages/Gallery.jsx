import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import GalleryHero from "../components/gallery/GalleryHero";
import GalleryGrid from "../components/gallery/GalleryGrid";
import GalleryLightbox from "../components/gallery/GalleryLightbox";
import GalleryCta from "../components/gallery/GalleryCta";

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { businessInfo, galleryItems, socialLinks } = useSelector(
    (state) => state.site,
  );
  const { products } = useSelector((state) => state.products);

  // Get featured products images
  const featuredProductItems = useMemo(
    () =>
      products
        .filter((product) => product.isFeatured)
        .map((product) => ({
          _id: `product-${product._id}`,
          imageUrl: product.images?.[0] || product.image,
          title: product.name,
          category: "Featured",
          likes: 0,
          isProduct: true,
          productId: product._id,
        })),
    [products],
  );

  // Combine gallery items with featured products
  const allItems = useMemo(
    () => [...featuredProductItems, ...galleryItems],
    [featuredProductItems, galleryItems],
  );

  const categories = useMemo(
    () => [
      "All",
      ...(featuredProductItems.length > 0 ? ["Featured"] : []),
      ...new Set(galleryItems.map((item) => item.category).filter(Boolean)),
    ],
    [galleryItems, featuredProductItems],
  );

  const totalLikes = useMemo(
    () => galleryItems.reduce((sum, item) => sum + Number(item.likes || 0), 0),
    [galleryItems],
  );

  const filteredItems = useMemo(
    () =>
      selectedCategory === "All"
        ? allItems
        : allItems.filter((item) => item.category === selectedCategory),
    [allItems, selectedCategory],
  );

  return (
    <div className="gallery-page">
      <GalleryHero
        businessInfo={businessInfo}
        galleryItems={allItems}
        categories={categories}
        totalLikes={totalLikes}
      />

      <div className="gallery-shell">
        <GalleryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          filteredItems={filteredItems}
          onSelectImage={setSelectedImage}
        />

        <GalleryLightbox
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
        />

        <GalleryCta
          businessInfo={businessInfo}
          whatsappUrl={socialLinks.whatsapp}
        />
      </div>
    </div>
  );
};

export default Gallery;
