import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiPhone,
  FiStar,
  FiClock,
  FiUsers,
} from "react-icons/fi";

const HeroSection = ({
  businessInfo,
  establishedYear,
  averageRating,
  categoryCount,
  deliverySettings,
}) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-cream-100 to-primary-50 pt-24 pb-16 lg:pt-32 lg:pb-24">
    {/* Decorative background elements */}
    <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-caramel-200/30 blur-3xl animate-pulse"></div>
    <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-200/20 blur-3xl"></div>
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-berry-100/10 blur-3xl"></div>

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
      {/* Welcome Badge */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/90 backdrop-blur-sm border border-caramel-200 rounded-full text-sm font-semibold text-primary-700 mb-8 shadow-warm">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-caramel-400 to-caramel-500 animate-pulse"></span>
        Welcome to Our Bakery
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-900 mb-6 leading-[1.1] tracking-tight">
        Crafting Sweet{" "}
        <span className="relative inline-block">
          <span className="relative z-10 bg-gradient-to-r from-caramel-500 to-primary-600 bg-clip-text text-transparent">
            Memories
          </span>
          <span className="absolute bottom-2 left-0 w-full h-4 bg-caramel-200/60 -z-0 rounded"></span>
        </span>
        <br />
        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
          Since {establishedYear}
        </span>
      </h1>

      {/* Description */}
      <p className="max-w-2xl mx-auto text-lg sm:text-xl text-primary-700/80 mb-10 leading-relaxed">
        {businessInfo.intro}
      </p>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/menu"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-full shadow-warm hover:shadow-warm-lg transform hover:-translate-y-0.5 transition-all duration-300"
        >
          Explore Our Menu
          <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-full border-2 border-primary-200 hover:border-caramel-400 hover:bg-caramel-50 transition-all duration-300 shadow-soft"
        >
          <FiPhone className="w-5 h-5" />
          Contact Us
        </Link>
      </div>

      {/* Stats Row */}
      <div className="mt-16 flex flex-wrap justify-center items-center gap-6 lg:gap-8">
        {/* Rating */}
        <div className="bg-white/80 backdrop-blur-xl border border-caramel-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4 hover:shadow-warm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-caramel-400 to-caramel-500 flex items-center justify-center shadow-sm">
            <FiStar className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-primary-900">
              {averageRating ? `${averageRating}/5` : "5/5"}
            </p>
            <p className="text-sm text-primary-600">Customer Rating</p>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white/80 backdrop-blur-xl border border-sage-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4 hover:shadow-warm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center shadow-sm">
            <FiUsers className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-primary-900">
              {categoryCount || 6}+
            </p>
            <p className="text-sm text-primary-600">Categories</p>
          </div>
        </div>

        {/* Prep Time */}
        <div className="bg-white/80 backdrop-blur-xl border border-berry-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4 hover:shadow-warm transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-berry-400 to-berry-500 flex items-center justify-center shadow-sm">
            <FiClock className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-primary-900">
              {deliverySettings.prepTimeMinutes || 30} min
            </p>
            <p className="text-sm text-primary-600">Avg. Prep Time</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
