import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiClock, FiShoppingBag } from "react-icons/fi";

/**
 * Sits between the hero and the category grid as the primary path into the
 * menu, so visitors can start ordering without scrolling the whole page.
 */
const HomeOrderOnlineCta = () => (
  <section className="mx-auto w-full max-w-7xl px-5 pt-8 sm:px-6 sm:pt-10 lg:px-8">
    <div className="relative overflow-hidden rounded-[1.75rem] border border-[#c9a84c40] bg-[linear-gradient(135deg,#1a1105_0%,#2f2010_52%,#4a3316_100%)] px-5 py-6 shadow-[0_16px_40px_rgba(18,12,2,0.22)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[#c9a84c] opacity-[0.14] blur-2xl"
      />

      <div className="relative flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:text-left">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8d08a] sm:text-xs">
            Fresh from our bakery
          </p>
          <h2 className="font-playfair mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">
            Order Online in Minutes
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#f4dfacc9] sm:text-base">
            Browse the full menu, pick your flavor and size, and check out in a
            few taps.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#f4dfacb0] sm:justify-start sm:text-[13px]">
            <span className="inline-flex items-center gap-1.5">
              <FiClock className="h-3.5 w-3.5" />
              Same-day slots
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FiShoppingBag className="h-3.5 w-3.5" />
              Custom cakes
            </span>
          </div>
        </div>

        <Link
          to="/menu"
          className="group inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f3c623] to-[#c48407] px-7 py-3.5 text-sm font-bold text-[#2a1c05] shadow-[0_10px_26px_rgba(196,132,7,0.34)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105 active:scale-[0.98] sm:w-auto sm:text-base"
        >
          Order Online
          <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  </section>
);

export default HomeOrderOnlineCta;
