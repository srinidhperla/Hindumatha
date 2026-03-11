import React from "react";

const GalleryHero = ({
  businessInfo,
  galleryItems,
  categories,
  totalLikes,
}) => (
  <section className="gallery-hero">
    <div className="absolute inset-0 bg-[url('/images/gallery/cake3.jpg')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
    <div className="absolute top-0 left-0 h-96 w-96 animate-pulse rounded-full bg-caramel-400 opacity-30 mix-blend-multiply blur-3xl filter"></div>
    <div className="animation-delay-2000 absolute bottom-0 right-0 h-96 w-96 animate-pulse rounded-full bg-primary-400 opacity-30 mix-blend-multiply blur-3xl filter"></div>

    <div className="gallery-shell text-center">
      <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
        Our Creations
      </span>
      <h1 className="mb-6 text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
        Cake Gallery
      </h1>
      <p className="mx-auto mb-8 max-w-2xl text-xl text-cream-100">
        Browse signature creations from {businessInfo.storeName} and get
        inspired for your next celebration.
      </p>

      <div className="mt-8 flex items-center justify-center space-x-8">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {galleryItems.length}
          </div>
          <div className="text-sm text-cream-200">Gallery Items</div>
        </div>
        <div className="h-12 w-px bg-cream-300/30"></div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{totalLikes}</div>
          <div className="text-sm text-cream-200">Total Likes</div>
        </div>
        <div className="h-12 w-px bg-cream-300/30"></div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white">
            {categories.length - 1}
          </div>
          <div className="text-sm text-cream-200">Categories</div>
        </div>
      </div>
    </div>
  </section>
);

export default GalleryHero;
