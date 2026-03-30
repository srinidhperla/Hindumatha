import React from "react";
import { Link } from "react-router-dom";
import { CLOUDINARY_GALLERY_IMAGES } from "@/constants/galleryCloudinaryImages";

const GalleryCta = ({ businessInfo, whatsappUrl }) => (
  <div className="gallery-cta">
    <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(145deg,#120c02_0%,#241708_45%,#3a2510_100%)]"></div>
    <div
      className="absolute inset-0 rounded-3xl bg-cover bg-center opacity-20 mix-blend-overlay"
      style={{ backgroundImage: `url('${CLOUDINARY_GALLERY_IMAGES.cake1}')` }}
    ></div>
    <div className="relative p-12 text-center md:p-16">
      <h2 className="font-playfair mb-4 text-3xl font-bold text-white md:text-4xl">
        Want a Custom Design from {businessInfo.storeName}?
      </h2>
      <p className="mx-auto mb-8 max-w-xl text-lg text-[#f4dfacc9]">
        Share your theme, flavor, and celebration details with us and we will
        turn it into a custom cake plan.
      </p>
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-full border border-[#c9a84c66] bg-white/95 px-8 py-4 font-semibold text-[#7a5c0f] transition-all duration-300 hover:-translate-y-1 hover:bg-white"
        >
          Get in Touch
        </Link>
        <a
          href={whatsappUrl}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:brightness-110"
        >
          WhatsApp Us
        </a>
      </div>
    </div>
  </div>
);

export default GalleryCta;
