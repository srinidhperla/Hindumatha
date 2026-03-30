import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { optimizeProductImageUrl } from "@/utils/imageOptimization";

const pickRandomItem = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)] || null;
};

const getProductImagePool = (product) => {
  const images = Array.isArray(product?.images) ? product.images : [];
  return [product?.image, ...images]
    .map((image) => optimizeProductImageUrl(image))
    .filter(Boolean);
};

const HomeCategoryGrid = ({ products = [] }) => {
  const tiles = useMemo(() => {
    const liveProducts = (Array.isArray(products) ? products : []).filter(
      (product) => product?.isAddon !== true && product?.isAvailable !== false,
    );

    const productTiles = liveProducts
      .map((product) => {
        const randomImage = pickRandomItem(getProductImagePool(product));
        if (!product?._id || !randomImage) return null;

        return {
          key: String(product._id),
          label: String(product?.name || "").trim() || "Cake",
          image: randomImage,
          productId: product._id,
        };
      })
      .filter(Boolean);

    const shuffledTiles = [...productTiles];
    for (let index = shuffledTiles.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffledTiles[index], shuffledTiles[randomIndex]] = [
        shuffledTiles[randomIndex],
        shuffledTiles[index],
      ];
    }

    const cappedTiles = shuffledTiles.slice(0, 24);
    if (cappedTiles.length >= 6) {
      const fullRowsCount = Math.floor(cappedTiles.length / 6) * 6;
      return cappedTiles.slice(0, fullRowsCount);
    }

    return cappedTiles;
  }, [products]);

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7efdd_0%,#fff8ea_60%,#f3e5c7_100%)] py-9 sm:py-11">
      <div className="pointer-events-none absolute -left-10 top-3 h-36 w-36 rounded-full bg-[#c9a84c33] blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-2 h-44 w-44 rounded-full bg-[#e8d08a2f] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-4 text-center sm:mb-5">
          <p className="inline-flex items-center rounded-full border border-[#c9a84c66] bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b6914] sm:text-xs">
            Explore Categories
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {tiles.map((tile) => (
            <Link
              key={tile.key}
              to={`/menu?product=${tile.productId}`}
              className="group rounded-2xl border border-[#d9c79d] bg-white/85 p-2.5 shadow-[0_10px_20px_rgba(18,12,2,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_26px_rgba(18,12,2,0.12)]"
            >
              <img
                src={tile.image}
                alt={tile.label}
                width={240}
                height={240}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-[#3b2b14] sm:text-sm">
                {tile.label}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HomeCategoryGrid;
