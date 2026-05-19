import React, { useState } from "react";
import { OptimizedImage } from "@/shared/ui";
import {
  formatGalleryCategoryLabel,
  formatGalleryWeightRange,
} from "@/utils/galleryItems";

const sortOptions = [
  { value: "latest", label: "Latest first" },
  { value: "title-asc", label: "Name A-Z" },
  { value: "category-asc", label: "Category A-Z" },
  { value: "code-asc", label: "Code order" },
];

const FilterPanel = ({
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
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between gap-3 border-b border-[rgba(201,168,76,0.18)] pb-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a7a2b]">
          Filter cakes
        </p>
        <h3 className="mt-1 text-xl font-bold text-primary-900">
          Refine results
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
        {onClose ? (
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
        ) : null}
      </div>
    </div>

    <div className="mt-4 space-y-4 overflow-y-auto pr-1">
      <label className="block rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
          Sort
        </span>
        <select
          value={sortBy}
          onChange={(event) => onSortChange(event.target.value)}
          className="w-full rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 text-sm text-primary-900 shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#f3dfab]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
          Category
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`gallery-filter-pill ${
                selectedCategory === category
                  ? "gallery-filter-pill--active"
                  : "gallery-filter-pill--inactive"
              }`}
            >
              {formatGalleryCategoryLabel(category)}
            </button>
          ))}
        </div>
      </div>

      <label className="block rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
          Cake Type
        </span>
        <select
          value={selectedCakeType}
          onChange={(event) => onCakeTypeChange(event.target.value)}
          className="w-full rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 text-sm text-primary-900 shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#f3dfab]"
        >
          <option value="">All cake types</option>
          {cakeTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
          Fondant
        </span>
        <select
          value={selectedFondant}
          onChange={(event) => onFondantChange(event.target.value)}
          className="w-full rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 text-sm text-primary-900 shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#f3dfab]"
        >
          <option value="">All fondant styles</option>
          {fondantOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block rounded-[28px] border border-[rgba(201,168,76,0.18)] bg-white/88 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
          Weight
        </span>
        <select
          value={selectedWeight}
          onChange={(event) => onWeightChange(event.target.value)}
          className="w-full rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white px-4 py-3 text-sm text-primary-900 shadow-sm focus:border-[#c9a84c] focus:outline-none focus:ring-2 focus:ring-[#f3dfab]"
        >
          <option value="">All weights</option>
          {weightOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

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
                placeholder="Search by cake name or code"
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
              onClick={() => setIsFilterDrawerOpen(true)}
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
        {filteredItems.map((item, index) => (
          <div
            key={item._id}
            className={`gallery-card group ${index === 0 ? "xl:col-span-2" : ""}`}
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <button
              type="button"
              onClick={() => onSelectImage(item)}
              className="relative block aspect-square w-full overflow-hidden text-left"
            >
              <OptimizedImage
                src={item.imageUrl}
                alt={item.title}
                width={720}
                height={720}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {item.cakeCode ? (
                <div className="absolute left-3 top-3 rounded-full bg-[rgba(18,12,2,0.86)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#fff7e3] shadow-lg">
                  {item.cakeCode}
                </div>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(18,12,2,0.82)] via-[rgba(18,12,2,0.34)] to-transparent p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a5c0f] shadow-md">
                    {formatGalleryCategoryLabel(item.category)}
                  </span>
                  {formatGalleryWeightRange(item) ? (
                    <span className="rounded-full bg-[#fff5d8] px-3 py-1 text-[11px] font-semibold text-primary-900 shadow-md">
                      Weight {formatGalleryWeightRange(item)}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>

            <div className="space-y-4 p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">
                  {item.title}
                </h3>
                {!item.isProduct && item.price > 0 ? (
                  <p className="mt-2 text-sm font-medium text-primary-700">
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

      {isFilterDrawerOpen ? (
        <div className="fixed inset-0 z-50 bg-[rgba(18,12,2,0.55)]">
          <div
            className="absolute inset-0"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden bg-[#fffaf1] p-4 shadow-[-18px_0_40px_rgba(18,12,2,0.24)]">
            <FilterPanel
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
              onClose={() => setIsFilterDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GalleryGrid;
