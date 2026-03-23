import React from "react";
import { Link } from "react-router-dom";

const NavbarMegaMenu = ({
  megaOpenKey,
  megaCards,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!megaOpenKey) {
    return null;
  }

  return (
    <div
      className="absolute inset-x-0 top-full hidden border-b border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.94)] backdrop-blur-2xl lg:block"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr_220px] gap-6 px-8 py-7">
        <div>
          <p className="font-playfair text-2xl text-[#2a1f0e]">{megaOpenKey}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8b6914]">
            Handcrafted fresh every day
          </p>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {megaCards.map((card) => (
            <Link
              to={`/products/${card.id}`}
              key={card.id}
              className="overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white"
            >
              <img
                src={card.image}
                alt={card.name}
                className="h-20 w-full object-cover"
              />
              <div className="px-2 py-2">
                <p className="line-clamp-1 text-[11px] font-semibold text-[#2a1f0e]">
                  {card.name}
                </p>
                <p className="text-[10px] text-[#8b6914]">Rs.{card.price}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[#120c02] p-3 text-white">
          <img
            src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500&auto=format&fit=crop&q=80"
            alt="Featured promo"
            className="h-28 w-full rounded-xl object-cover"
          />
          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#e8d08a]">
            Today's Feature
          </p>
          <p className="font-playfair text-lg">Wedding Collection</p>
        </div>
      </div>
    </div>
  );
};

export default NavbarMegaMenu;
