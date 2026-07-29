import React, { useDeferredValue, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import GalleryGrid from "@/user/components/gallery/GalleryGrid";
import GalleryCalculatorModal from "@/user/components/gallery/GalleryCalculatorModal";
import GalleryCta from "@/user/components/gallery/GalleryCta";
import SeoMeta from "@/shared/seo/SeoMeta";
import useGalleryItems from "@/user/hooks/useGalleryItems";
import {
  buildGalleryWeightFilterOptions,
  getGalleryItemCategories,
  getGalleryItemSelections,
  matchesGalleryCategoryFilter,
  matchesGalleryOptionFilter,
  matchesGalleryWeightFilter,
  normalizeGallerySearchText,
} from "@/utils/galleryItems";

const Gallery = () => {
  const navigate = useNavigate();
  const [calculatorItem, setCalculatorItem] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFondant, setSelectedFondant] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const { businessInfo, galleryFieldConfig, socialLinks } = useSelector(
    (state) => state.site,
  );
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const { allItems, visibleGalleryItems, featuredProductItems, isSiteLoaded } =
    useGalleryItems();

  const categories = useMemo(
    () => [
      ...(featuredProductItems.length > 0 ? ["Featured"] : []),
      ...new Set(visibleGalleryItems.flatMap((item) => getGalleryItemCategories(item))),
    ],
    [featuredProductItems, visibleGalleryItems],
  );

  const weightOptions = useMemo(
    () => buildGalleryWeightFilterOptions(visibleGalleryItems),
    [visibleGalleryItems],
  );
  const fondantOptions = useMemo(
    () =>
      Array.from(
        new Set(
          visibleGalleryItems.flatMap((item) =>
            getGalleryItemSelections(item, "fondantOptions"),
          ),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [visibleGalleryItems],
  );

  const filteredItems = useMemo(
    () => {
      const normalizedSearch = normalizeGallerySearchText(deferredSearchTerm);

      const nextItems = allItems.filter((item) => {
        const matchesCategory = matchesGalleryCategoryFilter(
          item,
          selectedCategories,
        );
        const matchesFondant = matchesGalleryOptionFilter(
          item,
          "fondantOptions",
          selectedFondant,
        );
        const matchesWeight = matchesGalleryWeightFilter(item, selectedWeight);
        const searchCandidates = [
          item.title,
          ...getGalleryItemCategories(item),
          item.cakeCode,
          item.cakeCodeSearch,
          String(item.cakeCodeSearch || "").split("-").pop() || "",
          ...getGalleryItemSelections(item, "fondantOptions"),
        ];
        const normalizedHaystack = normalizeGallerySearchText(
          searchCandidates.join(" "),
        );
        const matchesSearch =
          !normalizedSearch || normalizedHaystack.includes(normalizedSearch);

        return (
          matchesCategory &&
          matchesFondant &&
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
      selectedCategories,
      selectedFondant,
      selectedWeight,
      sortBy,
    ],
  );

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
          selectedCategories={selectedCategories}
          selectedFondant={selectedFondant}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          fondantOptions={fondantOptions}
          weightOptions={weightOptions}
          selectedWeight={selectedWeight}
          sortBy={sortBy}
          onApplyFilters={({
            selectedCategories: nextSelectedCategories = [],
            selectedFondant: nextSelectedFondant = "",
            selectedWeight: nextSelectedWeight = "",
            sortBy: nextSortBy = "latest",
          }) => {
            setSelectedCategories(nextSelectedCategories);
            setSelectedFondant(nextSelectedFondant);
            setSelectedWeight(nextSelectedWeight);
            setSortBy(nextSortBy);
          }}
          totalItems={allItems.length}
          filteredItems={filteredItems}
          isLoading={!isSiteLoaded}
          onOpenCalculator={setCalculatorItem}
          onSelectImage={(item) => {
            if (item?.cakeCodeSearch) {
              navigate(`/gallery/photo/${item.cakeCodeSearch}`);
            }
          }}
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
