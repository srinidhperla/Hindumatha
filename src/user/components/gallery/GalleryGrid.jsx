import React, { useState } from "react";
import { OptimizedImage } from "@/shared/ui";
import {
  formatGalleryCategoryLabel,
  formatGalleryWeightRange,
  getGalleryItemCategories,
} from "@/utils/galleryItems";

const sortOptions = [
  { value: "latest", label: "Latest first" },
  { value: "title-asc", label: "Name A-Z" },
  { value: "category-asc", label: "Category A-Z" },
  { value: "code-asc", label: "Code order" },
];

const renderChoiceChip = (label, isSelected, onClick, compact = false) => (
  <button
    key={label}
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
      compact ? "min-w-[84px]" : ""
    } ${
      isSelected
        ? "border-[#2f2319] bg-[#2f2319] text-[#fff7e3] shadow-[0_10px_24px_rgba(18,12,2,0.18)]"
        : "border-[rgba(201,168,76,0.22)] bg-white text-primary-800 hover:border-[#c9a84c] hover:bg-[#fff8ec]"
    }`}
  >
    {label}
  </button>
);

const FilterSection = ({ title, children }) => (
  <div className="rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
      {title}
    </p>
    <div className="mt-3 flex flex-wrap gap-2">{children}</div>
  </div>
);

const FilterSheet = ({
  categories,
  selectedCategory,
  onCategoryChange,
  cakeTypeOptions,
  selectedCakeType,
  onCakeTypeChange,
  fondantOptions,
  selectedFondant,
  onFondantChange,
  weightOptions,
  selectedWeight,
  onWeightChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  onClose,
}) => (
  <div className="flex h-full flex-col bg-[#fffaf1]">
    <div className="flex items-center justify-between gap-3 border-b border-[rgba(201,168,76,0.18)] px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a2b]">
          Filters
        </p>
        <h3 className="mt-1 text-xl font-bold text-primary-900">
          Refine your gallery
        </h3>
      </div>
      <div className="flex items-center gap-2">
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-full border border-[rgba(122,92,15,0.24)] bg-white px-4 py-2 text-sm font-semibold text-[#7a5c0f] transition hover:bg-[#fff6e3]"
          >
            Clear
          </button>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(42,31,14,0.12)] bg-white text-primary-900"
          aria-label="Close filters"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
      <FilterSection title="Sort">
        {sortOptions.map((option) =>
          renderChoiceChip(
            option.label,
            sortBy === option.value,
            () => onSortChange(option.value),
          ),
        )}
      </FilterSection>

      <FilterSection title="Category">
        {categories.map((category) =>
          renderChoiceChip(
            formatGalleryCategoryLabel(category),
            selectedCategory === category,
            () => onCategoryChange(category),
          ),
        )}
      </FilterSection>

      <FilterSection title="Cake Type">
        {renderChoiceChip(
          "All",
          !selectedCakeType,
          () => onCakeTypeChange(""),
          true,
        )}
        {cakeTypeOptions.map((option) =>
          renderChoiceChip(
            option,
            selectedCakeType === option,
            () => onCakeTypeChange(option),
            true,
          ),
        )}
      </FilterSection>

      <FilterSection title="Fondant">
        {renderChoiceChip(
          "All",
          !selectedFondant,
          () => onFondantChange(""),
          true,
        )}
        {fondantOptions.map((option) =>
          renderChoiceChip(
            option,
            selectedFondant === option,
            () => onFondantChange(option),
            true,
          ),
        )}
      </FilterSection>

      <FilterSection title="Weight">
        {renderChoiceChip("All", !selectedWeight, () => onWeightChange(""), true)}
        {weightOptions.map((option) =>
          renderChoiceChip(
            option.label,
            selectedWeight === option.value,
            () => onWeightChange(option.value),
            true,
          ),
        )}
      </FilterSection>
    </div>
  </div>
);

const GalleryGrid = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  cakeTypeOptions,
  selectedCakeType,
  onCakeTypeChange,
  fondantOptions,
  selectedFondant,
  onFondantChange,
  weightOptions,
  selectedWeight,
  onWeightChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  filteredItems,
  onOpenCalculator,
  onSelectImage,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <>
      <div className="mb-6">
        <div className="gallery-filter-card w-full p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search cake by name or code"
                className="w-full rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 pl-11 text-sm text-primary-900 shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#f3dfab]"
              />
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[#2f2319] px-4 py-3 text-sm font-semibold text-[#fff7e3] shadow-md transition hover:bg-[#433224]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="gallery-grid">
        {filteredItems.map((item) => (
          <div key={item._id} className="gallery-card group">
            <button
              type="button"
              onClick={() => onSelectImage(item)}
              className="relative block aspect-[4/5] w-full overflow-hidden text-left"
            >
              <OptimizedImage
                src={item.imageUrl}
                alt={item.title}
                width={720}
                height={900}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {item.cakeCode ? (
                <div className="absolute left-3 top-3 rounded-full bg-[rgba(18,12,2,0.86)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fff7e3] shadow-lg">
                  {item.cakeCode}
                </div>
              ) : null}
            </button>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {getGalleryItemCategories(item).map((category, index) => (
                    <span
                      key={`${item._id}-${category}`}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] shadow-sm ${
                        index === 0
                          ? "bg-white text-[#7a5c0f]"
                          : "bg-[#fff5d8] text-primary-900"
                      }`}
                    >
                      {formatGalleryCategoryLabel(category)}
                    </span>
                  ))}
                  {formatGalleryWeightRange(item) ? (
                    <span className="rounded-full bg-[#fff5d8] px-3 py-1 text-[11px] font-semibold text-primary-900 shadow-sm">
                      {formatGalleryWeightRange(item)}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold text-primary-900">
                  {item.title}
                </h3>
                {!item.isProduct && item.price > 0 ? (
                  <p className="text-sm font-medium text-primary-700">
                    {item.priceLabel || "Starting at"} Rs.
                    {Number(item.price || 0).toLocaleString("en-IN")} per kg
                  </p>
                ) : null}
              </div>

              {!item.isProduct ? (
                <button
                  type="button"
                  onClick={() => onOpenCalculator(item)}
                  className="w-full rounded-xl bg-[#fff5d8] px-3 py-2.5 text-sm font-semibold text-primary-900 transition hover:bg-[#ffe9b3]"
                >
                  Calculate
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {!filteredItems.length ? (
        <div className="mt-8 rounded-[28px] border border-dashed border-[rgba(201,168,76,0.45)] bg-white/75 p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-primary-900">
            No cakes match these filters.
          </p>
          <p className="mt-2 text-sm text-primary-600">
            Try another cake type, weight, fondant style, or clear the search.
          </p>
        </div>
      ) : null}

      {isFilterOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(18,12,2,0.58)]">
          <div className="absolute inset-0" onClick={() => setIsFilterOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-0 bg-[#fffaf1] sm:left-auto sm:right-0 sm:w-full sm:max-w-lg">
            <FilterSheet
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              cakeTypeOptions={cakeTypeOptions}
              selectedCakeType={selectedCakeType}
              onCakeTypeChange={onCakeTypeChange}
              fondantOptions={fondantOptions}
              selectedFondant={selectedFondant}
              onFondantChange={onFondantChange}
              weightOptions={weightOptions}
              selectedWeight={selectedWeight}
              onWeightChange={onWeightChange}
              sortBy={sortBy}
              onSortChange={onSortChange}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={onClearFilters}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GalleryGrid;
