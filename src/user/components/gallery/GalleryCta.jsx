import React from "react";
import { Link } from "react-router-dom";

const GalleryCta = ({ businessInfo, whatsappUrl }) => (
  <div className="gallery-cta">
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-600 to-caramel-500"></div>
    <div className="absolute inset-0 rounded-3xl bg-[url('/images/gallery/cake1.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
    <div className="relative p-12 text-center md:p-16">
      <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
        Want a Custom Design from {businessInfo.storeName}?
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-lg text-cream-100">
        Share your theme, flavor, and celebration details with us and we will
        turn it into a custom cake plan.
      </p>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-semibold text-primary-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-warm"
        >
          Get in Touch
        </Link>
        <a
          href={whatsappUrl}
          className="inline-flex items-center justify-center rounded-full bg-sage-500 px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-sage-600 hover:shadow-warm"
        >
          WhatsApp Us
        </a>
      </div>
    </div>
  </div>
);

export default GalleryCta;
