import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useNavigationType } from "react-router-dom";
import GalleryGrid from "@/user/components/gallery/GalleryGrid";
import GalleryCalculatorModal from "@/user/components/gallery/GalleryCalculatorModal";
import GalleryCta from "@/user/components/gallery/GalleryCta";
import SeoMeta from "@/shared/seo/SeoMeta";
import useGalleryItems from "@/user/hooks/useGalleryItems";
import {
  clearGalleryView,
  peekGalleryView,
  saveGalleryView,
} from "./galleryViewState";
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
  const navigationType = useNavigationType();
  // Coming back from a photo (browser Back, or the photo's close button, both
  // of which are a history POP) restores the view the visitor left. Arriving
  // any other way — the navbar, a link — starts the gallery fresh.
  const [restoredView] = useState(() =>
    navigationType === "POP" ? peekGalleryView() : null,
  );
  const [calculatorItem, setCalculatorItem] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState(
    restoredView?.selectedCategories || [],
  );
  const [selectedFondant, setSelectedFondant] = useState(
    restoredView?.selectedFondant || "",
  );
  const [searchTerm, setSearchTerm] = useState(restoredView?.searchTerm || "");
  const [selectedWeight, setSelectedWeight] = useState(
    restoredView?.selectedWeight || "",
  );
  const [sortBy, setSortBy] = useState(restoredView?.sortBy || "latest");
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

  // Put the page back where it was. Two things fight a one-shot scrollTo:
  // App.jsx scrolls every new route to the top, and the grid is not at its
  // full height until the cards have rendered. So keep nudging for a short
  // while until the position holds, and stop the moment the visitor scrolls.
  useEffect(() => {
    if (!isSiteLoaded) {
      return undefined;
    }

    clearGalleryView();

    const target = Number(restoredView?.scrollY || 0);
    if (!target) {
      return undefined;
    }

    const deadline = performance.now() + 2500;
    let frame = 0;
    let settledFrames = 0;
    let cancelled = false;

    const stop = () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };

    const step = () => {
      if (cancelled) {
        return;
      }

      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const reachable = Math.min(target, Math.max(0, maxScroll));

      if (Math.abs(window.scrollY - reachable) > 2) {
        window.scrollTo({ top: reachable, behavior: "auto" });
        settledFrames = 0;
      } else if (reachable === target) {
        settledFrames += 1;
      }

      if (settledFrames < 5 && performance.now() < deadline) {
        frame = window.requestAnimationFrame(step);
      }
    };

    frame = window.requestAnimationFrame(step);
    window.addEventListener("wheel", stop, { passive: true, once: true });
    window.addEventListener("touchstart", stop, { passive: true, once: true });
    window.addEventListener("keydown", stop, { once: true });

    return () => {
      stop();
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [isSiteLoaded, restoredView]);

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
              saveGalleryView({
                selectedCategories,
                selectedFondant,
                searchTerm,
                selectedWeight,
                sortBy,
                scrollY: window.scrollY,
              });
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
