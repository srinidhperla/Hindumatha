import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { OptimizedImage } from "@/shared/ui";

const formatCategoryLabel = (value = "") =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const FeaturedProducts = ({ products }) => {
  const scrollRef = useRef(null);
  const [paused, setPaused] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || products.length <= 1) return;

    let raf;
    const speed = 0.5; // px per frame

    const step = () => {
      if (!paused && container) {
        container.scrollLeft += speed;
        // Loop back when we reach the end
        if (
          container.scrollLeft >=
          container.scrollWidth - container.clientWidth - 1
        ) {
          container.scrollLeft = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [paused, products.length]);

  const scroll = useCallback((dir) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ left: dir * 300, behavior: "smooth" });
  }, []);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f6f0df_0%,#fffaf0_40%,#f2e8d0_100%)] py-14 sm:py-20 lg:py-28">
      <div className="pointer-events-none absolute left-0 top-24 h-40 w-40 rounded-full bg-[#c9a84c2e] blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-44 w-44 rounded-full bg-[#7a5c0f24] blur-3xl" />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14 animate-fadeInUp">
          <span className="inline-block rounded-full border border-[#c9a84c66] bg-white/80 px-4 py-1.5 text-sm font-semibold text-[#8b6914] backdrop-blur-sm mb-4">
            Our Specialties
          </span>
          <h2 className="font-playfair text-2xl font-bold tracking-tight text-[#2a1f0e] sm:text-3xl md:text-4xl mb-3 sm:mb-4">
            Featured Products
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-[#6a5130] sm:text-base">
            Our most popular and beloved creations, baked fresh daily with
            premium ingredients
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative group/carousel">
          {/* Navigation arrows - desktop */}
          <button
            type="button"
            onClick={() => scroll(-1)}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#c9a84c55] bg-white/90 text-[#8b6914] shadow-[0_8px_24px_rgba(18,12,2,0.18)] opacity-0 transition-opacity group-hover/carousel:opacity-100"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 h-10 w-10 items-center justify-center rounded-full border border-[#c9a84c55] bg-white/90 text-[#8b6914] shadow-[0_8px_24px_rgba(18,12,2,0.18)] opacity-0 transition-opacity group-hover/carousel:opacity-100"
            aria-label="Scroll right"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-[1] hidden w-20 bg-gradient-to-r from-[#f6f0df] to-transparent sm:block" />
          <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[1] hidden w-20 bg-gradient-to-l from-[#f2e8d0] to-transparent sm:block" />

          <div
            ref={scrollRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            className="no-scrollbar -mx-5 flex gap-5 overflow-x-auto pb-4 px-5 sm:mx-0 sm:px-0"
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="group max-w-[300px] min-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-[#c9a84c3d] bg-[linear-gradient(180deg,rgba(255,255,255,.92),rgba(255,246,228,.88))] shadow-[0_10px_28px_rgba(18,12,2,0.14)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(18,12,2,0.2)] active:scale-[0.98] sm:min-w-[280px] lg:min-w-[300px]"
              >
                <Link to={`/menu?product=${product._id}`} className="block">
                  <div className="relative overflow-hidden">
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      width={600}
                      height={420}
                      loading="lazy"
                      className="w-full h-44 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full border border-[#c9a84c66] bg-[#120c02c9] px-2.5 py-0.5 text-[10px] font-semibold capitalize text-[#f4dfac] shadow-md backdrop-blur-sm">
                        {formatCategoryLabel(product.category)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/menu?product=${product._id}`}>
                    <h3 className="mb-1 line-clamp-1 text-sm font-bold text-[#2a1f0e] transition-colors group-hover:text-[#8b6914] sm:text-base">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="mb-3 line-clamp-2 text-xs text-[#6a5130]">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-[#c9a84c33] pt-3">
                    <span className="bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] bg-clip-text text-lg font-bold text-transparent">
                      ₹{product.price}
                    </span>
                    <Link
                      to={`/menu?product=${product._id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-3.5 py-1.5 text-xs font-semibold text-white transition-all duration-300 hover:shadow-[0_10px_24px_rgba(122,92,15,0.35)] active:scale-95"
                    >
                      View
                      <FiArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8 sm:mt-12 animate-fadeInUp">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full border border-[#c9a84c66] bg-white/80 px-6 py-3 font-semibold text-[#7a5c0f] transition-all duration-300 hover:bg-[#120c02] hover:text-[#e8d08a] active:scale-95"
          >
            View All Products
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
