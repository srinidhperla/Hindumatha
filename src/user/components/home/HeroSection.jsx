import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiSearch, FiTruck } from "react-icons/fi";
import { OptimizedImage } from "@/shared/ui";
import { formatCategoryLabel } from "@/utils/productOptions";
import { heroSlides } from "@/user/components/home/heroContent";

const HERO_IMAGE_SIZES =
  "(max-width: 768px) 800px, (max-width: 1200px) 1200px, 1600px";

const HERO_IMAGE_WIDTHS = [800, 1200, 1600];
const FALLBACK_TYPED_WORDS = [
  "Birthday Cakes",
  "Wedding Tiers",
  "Chocolate Dreams",
  "Custom Creations",
  "Eggless Delights",
];
const FALLBACK_QUICK_TAGS = [
  "Birthday",
  "Wedding",
  "Cupcakes",
  "Chocolate",
  "Photo Cakes",
  "Eggless",
];

const pickRandomValues = (values, count) => {
  const uniqueValues = Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  );

  if (uniqueValues.length <= count) {
    return uniqueValues;
  }

  const shuffled = [...uniqueValues];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, count);
};

const HeroSection = ({
  businessInfo,
  categoryCount,
  deliverySettings,
  products = [],
}) => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [query, setQuery] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const liveProducts = useMemo(
    () =>
      (Array.isArray(products) ? products : []).filter(
        (product) => product?.isAddon !== true && product?.isAvailable !== false,
      ),
    [products],
  );

  const categoryTerms = useMemo(
    () =>
      pickRandomValues(
        liveProducts.map((product) => formatCategoryLabel(product?.category)),
        4,
      ),
    [liveProducts],
  );

  const cakeNameTerms = useMemo(
    () => pickRandomValues(liveProducts.map((product) => product?.name), 4),
    [liveProducts],
  );

  const typedWords = useMemo(() => {
    const dynamicWords = pickRandomValues(
      [...categoryTerms.map((category) => `${category} Cakes`), ...cakeNameTerms],
      8,
    );
    return dynamicWords.length > 0 ? dynamicWords : FALLBACK_TYPED_WORDS;
  }, [cakeNameTerms, categoryTerms]);

  const quickTags = useMemo(() => {
    const dynamicTags = pickRandomValues([...categoryTerms, ...cakeNameTerms], 6);
    return dynamicTags.length > 0 ? dynamicTags : FALLBACK_QUICK_TAGS;
  }, [cakeNameTerms, categoryTerms]);

  const deliveryRadiusKm =
    Number(deliverySettings?.maxDeliveryRadiusKm) ||
    Number(deliverySettings?.deliveryRadiusKm) ||
    4;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 5500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!typedWords.length) {
      return undefined;
    }

    const word = typedWords[wordIndex % typedWords.length] || "";
    if (!word) {
      return undefined;
    }

    const speed = isDeleting ? 60 : 90;

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        const next = word.slice(0, typedText.length + 1);
        setTypedText(next);

        if (next === word) {
          window.setTimeout(() => setIsDeleting(true), 1200);
        }
        return;
      }

      const next = word.slice(0, typedText.length - 1);
      setTypedText(next);

      if (!next) {
        setIsDeleting(false);
        setWordIndex((current) => (current + 1) % Math.max(typedWords.length, 1));
      }
    }, speed);

    return () => window.clearTimeout(timeout);
  }, [isDeleting, typedText, typedWords, wordIndex]);

  const jumpToSlide = (index) => setActiveSlide(index);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery) {
      navigate("/menu");
      return;
    }

    const params = new URLSearchParams();
    params.set("search", nextQuery);
    navigate(`/menu?${params.toString()}`);
  };

  return (
    <section className="relative h-[540px] overflow-hidden sm:h-[600px] lg:h-[86svh]">
      {heroSlides.map((slide, index) => {
        return (
        <div
          key={slide.image}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === activeSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <OptimizedImage
            src={slide.image}
            alt={slide.alt}
            width={1600}
            height={900}
            maxWidth={800}
            responsiveWidths={HERO_IMAGE_WIDTHS}
            sizes={HERO_IMAGE_SIZES}
            loading="eager"
            fetchPriority="high"
            className={`h-full w-full object-cover transition-transform duration-[8000ms] ${
              index === activeSlide ? "scale-100" : "scale-105"
            }`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(18,12,2,.9)_0%,rgba(18,12,2,.52)_44%,rgba(18,12,2,.12)_100%)]" />
        </div>
        );
      })}

      <div className="absolute inset-0 z-10 flex flex-col justify-center px-4 pb-10 pt-20 sm:px-8 sm:pb-12 sm:pt-24 lg:px-12 lg:pb-10">
        <div className="max-w-3xl">
          <div className="animate-fadeInUp mb-4 inline-flex items-center gap-2">
            <span className="h-px w-5 bg-[#c9a84c]" />
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#e8d08a]">
              {businessInfo?.storeName || "Hyderabad's Finest Artisan Bakery"}
            </span>
            <span className="h-px w-5 bg-[#c9a84c]" />
          </div>

          <h1 className="animate-fadeInUp anim-delay-1 font-serif text-[2.4rem] leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            <em className="text-[#c9a84c] not-italic">Crafted</em> with
            <br />
            Pure Gold Love
          </h1>

          <p className="home-typed-line animate-fadeInUp anim-delay-2 mt-3 min-h-8 italic text-white/75">
            We bake <span className="home-typed-caret">{typedText || " "}</span>
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="animate-fadeInUp anim-delay-3 mt-6 flex max-w-[520px] items-center gap-2 rounded-[28px] border border-[#c9a84c4d] bg-white/95 px-3 py-2 shadow-2xl backdrop-blur sm:rounded-[40px] sm:px-5"
          >
            <FiSearch className="h-4 w-4 text-[#c9a84c]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search cakes, flavours, occasions..."
              className="h-10 w-full border-none bg-transparent text-[13px] text-[#2a1f0e] outline-none sm:text-sm"
            />
            <div className="h-6 w-px bg-black/10" />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:brightness-110 sm:px-5 sm:text-xs"
            >
              Find <FiArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="animate-fadeInUp anim-delay-4 mt-5 flex flex-wrap gap-2">
            {quickTags.map((tag, index) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className={`rounded-2xl border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition hover:scale-105 ${
                  index < 3
                    ? "border-[#c9a84c80] bg-[#c9a84c38] text-[#e8d08a]"
                    : "border-white/25 bg-white/10 text-white/85"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute right-5 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
        <div className="animate-fadeInUp rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c33] text-[#e8d08a]">
              *
            </span>
            <div>
              <p className="text-xs font-bold">Freshly Baked Daily</p>
              <p className="text-[10px] text-white/70">Made to order</p>
            </div>
          </div>
        </div>
        <div className="animate-fadeInUp anim-delay-1 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c33]">
              <FiTruck className="h-5 w-5 text-[#e8d08a]" />
            </span>
            <div>
              <p className="text-xs font-bold">Same Day Delivery</p>
              <p className="text-[10px] text-white/70">
                Within {deliveryRadiusKm} km
              </p>
            </div>
          </div>
        </div>
        <div className="animate-fadeInUp anim-delay-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-white backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a84c33] text-[#e8d08a]">
              *
            </span>
            <div>
              <p className="text-xs font-bold text-[#e8d08a]">Today's Offer</p>
              <p className="text-[10px] text-white/70">
                {categoryCount || 6}+ cake categories
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-4 z-20 flex items-center gap-2 sm:bottom-6 sm:left-10">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => jumpToSlide(index)}
            className={`h-1.5 w-7 origin-left rounded-full transition-transform duration-300 ${
              index === activeSlide
                ? "scale-x-100 bg-[#c9a84c]"
                : "scale-x-[0.22] bg-white/40"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 z-20 font-serif text-sm text-white/45 sm:bottom-5 sm:right-10">
        <strong className="text-2xl text-white">
          {String(activeSlide + 1).padStart(2, "0")}
        </strong>{" "}
        / {String(heroSlides.length).padStart(2, "0")}
      </div>

      <style>{`
        .home-typed-line {
          font-size: 1.125rem;
          line-height: 1.75rem;
        }

        @media (min-width: 640px) {
          .home-typed-line {
            font-size: 1.5rem;
            line-height: 2rem;
          }
        }

        .home-typed-caret {
          display: inline-flex;
          align-items: center;
          min-width: 16ch;
          will-change: opacity;
        }

        .home-typed-caret::after {
          content: "";
          display: inline-block;
          margin-left: 0.2em;
          width: 2px;
          height: 1em;
          background: #c9a84c;
          opacity: 1;
          will-change: opacity;
          animation: homeCaretBlink 0.9s linear infinite;
        }

        @keyframes homeCaretBlink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

