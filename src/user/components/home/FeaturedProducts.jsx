import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

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
    <section className="py-14 sm:py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-14 animate-fadeInUp">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-sage-100 to-sage-200 text-sage-700 text-sm font-semibold mb-4">
            Our Specialties
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-800 mb-3 sm:mb-4 tracking-tight">
            Featured Products
          </h2>
          <p className="max-w-2xl mx-auto text-primary-500 text-sm sm:text-base">
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
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-warm items-center justify-center text-primary-700 hover:bg-primary-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white shadow-warm items-center justify-center text-primary-700 hover:bg-primary-50 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
            className="flex gap-5 overflow-x-auto pb-4 no-scrollbar -mx-5 px-5 sm:mx-0 sm:px-0"
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="min-w-[260px] sm:min-w-[280px] lg:min-w-[300px] max-w-[300px] flex-shrink-0 group bg-white rounded-2xl overflow-hidden hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 shadow-soft hover:shadow-warm border border-cream-100"
              >
                <Link to={`/products/${product._id}`} className="block">
                  <div className="relative overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-44 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-700/90 text-white text-[10px] font-semibold capitalize shadow-md backdrop-blur-sm">
                        {formatCategoryLabel(product.category)}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
                <div className="p-4">
                  <Link to={`/products/${product._id}`}>
                    <h3 className="text-sm sm:text-base font-bold text-primary-800 mb-1 group-hover:text-caramel-600 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-primary-500 text-xs mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-cream-100">
                    <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-caramel-500 bg-clip-text text-transparent">
                      ₹{product.price}
                    </span>
                    <Link
                      to={`/products/${product._id}`}
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:shadow-warm active:scale-95 transition-all duration-300"
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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary-600 text-primary-700 font-semibold hover:bg-primary-600 hover:text-white active:scale-95 transition-all duration-300"
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
