import React, { useDeferredValue, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import GalleryGrid from "@/user/components/gallery/GalleryGrid";
import GalleryCalculatorModal from "@/user/components/gallery/GalleryCalculatorModal";
import GalleryLightbox from "@/user/components/gallery/GalleryLightbox";
import GalleryCta from "@/user/components/gallery/GalleryCta";
import SeoMeta from "@/shared/seo/SeoMeta";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";
import {
  attachGalleryItemCodes,
  buildGalleryWeightFilterOptions,
  getGalleryItemCategories,
  matchesGalleryCategoryFilter,
  matchesGalleryWeightFilter,
  normalizeGallerySearchText,
} from "@/utils/galleryItems";

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [calculatorItem, setCalculatorItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const { businessInfo, galleryFieldConfig, galleryItems, socialLinks } =
    useSelector(
    (state) => state.site,
    );
  const { products } = useSelector((state) => state.products);
  const safeProducts = Array.isArray(products) ? products : [];
  const safeGalleryItems = Array.isArray(galleryItems) ? galleryItems : [];
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const visibleGalleryItems = useMemo(() => {
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
  }, [safeGalleryItems]);

  // Get featured products images
  const featuredProductItems = useMemo(
    () =>
      safeProducts
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
        })),
    [safeProducts],
  );

  // Combine gallery items with featured products
  const allItems = useMemo(
    () => attachGalleryItemCodes([...featuredProductItems, ...visibleGalleryItems]),
    [featuredProductItems, visibleGalleryItems],
  );

  const categories = useMemo(
    () => [
      "All",
      ...(featuredProductItems.length > 0 ? ["Featured"] : []),
      ...new Set(visibleGalleryItems.flatMap((item) => getGalleryItemCategories(item))),
    ],
    [featuredProductItems, visibleGalleryItems],
  );

  const weightOptions = useMemo(
    () => buildGalleryWeightFilterOptions(visibleGalleryItems),
    [visibleGalleryItems],
  );

  const filteredItems = useMemo(
    () => {
      const normalizedSearch = normalizeGallerySearchText(deferredSearchTerm);

      const nextItems = allItems.filter((item) => {
        const matchesCategory = matchesGalleryCategoryFilter(
          item,
          selectedCategory,
        );
        const matchesWeight = matchesGalleryWeightFilter(item, selectedWeight);
        const searchCandidates = [
          item.title,
          ...getGalleryItemCategories(item),
          item.cakeCode,
          item.cakeCodeSearch,
          String(item.cakeCodeSearch || "").split("-").pop() || "",
        ];
        const normalizedHaystack = normalizeGallerySearchText(
          searchCandidates.join(" "),
        );
        const matchesSearch =
          !normalizedSearch || normalizedHaystack.includes(normalizedSearch);

        return (
          matchesCategory &&
          matchesWeight &&
          matchesSearch
        );
      });

      return [...nextItems].sort((left, right) => {
        if (sortBy === "title-asc") {
          return String(left.title || "").localeCompare(String(right.title || ""));
        }

        if (sortBy === "category-asc") {
          return String(left.category || "").localeCompare(
            String(right.category || ""),
          );
        }

        if (sortBy === "code-asc") {
          return String(left.cakeCodeSearch || "").localeCompare(
            String(right.cakeCodeSearch || ""),
          );
        }

        return (
          new Date(right.createdAt || 0).getTime() -
          new Date(left.createdAt || 0).getTime()
        );
      });
    },
    [
      allItems,
      deferredSearchTerm,
      selectedCategory,
      selectedWeight,
      sortBy,
    ],
  );

  const hasActiveFilters =
    selectedCategory !== "All" ||
    Boolean(searchTerm.trim()) ||
    Boolean(selectedWeight) ||
    sortBy !== "latest";

  return (
    <div className="gallery-page">
      <SeoMeta
        title="Gallery | Hindumatha's Cake World"
        description="Browse our cake gallery featuring birthdays, weddings, custom designs, and customer favorites from Hindumatha's Cake World."
        path="/gallery"
      />

      <div className="gallery-shell">
        <GalleryGrid
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          weightOptions={weightOptions}
          selectedWeight={selectedWeight}
          onWeightChange={setSelectedWeight}
          sortBy={sortBy}
          onSortChange={setSortBy}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSelectedCategory("All");
            setSearchTerm("");
            setSelectedWeight("");
            setSortBy("latest");
          }}
          totalItems={allItems.length}
          filteredItems={filteredItems}
          onOpenCalculator={setCalculatorItem}
          onSelectImage={setSelectedImage}
        />

        <GalleryLightbox
          item={selectedImage}
          onClose={() => setSelectedImage(null)}
        />

        <GalleryCalculatorModal
          item={calculatorItem}
          galleryFieldConfig={galleryFieldConfig}
          onClose={() => setCalculatorItem(null)}
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
