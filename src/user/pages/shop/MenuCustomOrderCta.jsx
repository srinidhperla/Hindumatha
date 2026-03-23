import React from "react";
import { Link } from "react-router-dom";

const MenuCustomOrderCta = () => (
  <div className="menu-cta animate-fadeInUp">
    <div>
      <p className="menu-section-kicker text-cream-300">Custom orders</p>
      <h2 className="text-xl sm:text-2xl font-bold text-white md:text-3xl">
        Need a custom cake instead of a listed item?
      </h2>
      <p className="mt-2 sm:mt-3 max-w-2xl text-sm leading-7 text-cream-300 sm:text-base">
        Share theme, weight, flavor, and delivery timing. We will turn it into a
        personalized order instead of forcing you into a fixed menu item.
      </p>
    </div>
    <Link to="/contact" className="menu-cta-button">
      Request custom cake
    </Link>
  </div>
);

export default MenuCustomOrderCta;
