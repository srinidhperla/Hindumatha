import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiPhone,
  FiStar,
  FiClock,
  FiUsers,
} from "react-icons/fi";

const SPARKLES = [
  { top: "12%", left: "8%", size: 4, delay: 0 },
  { top: "20%", right: "12%", size: 3, delay: 1.2 },
  { top: "55%", left: "4%", size: 5, delay: 0.6 },
  { top: "65%", right: "6%", size: 3, delay: 1.8 },
  { top: "80%", left: "18%", size: 4, delay: 2.4 },
  { top: "35%", right: "20%", size: 3, delay: 0.3 },
  { top: "75%", right: "25%", size: 4, delay: 1.5 },
  { top: "15%", left: "30%", size: 3, delay: 2.1 },
];

const HeroSection = ({
  businessInfo,
  establishedYear,
  averageRating,
  categoryCount,
  deliverySettings,
}) => (
  <section className="relative overflow-hidden bg-gradient-to-br from-cream-50 via-cream-100 to-primary-50 pt-24 pb-16 lg:pt-32 lg:pb-24">
    {/* Gradient mesh overlay */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(217,119,6,0.08),transparent_60%),radial-gradient(ellipse_at_80%_20%,rgba(168,85,247,0.06),transparent_50%),radial-gradient(ellipse_at_50%_80%,rgba(244,114,182,0.05),transparent_50%)]" />

    {/* Decorative background blobs with float animation */}
    <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-caramel-200/30 blur-3xl hero-float-slow" />
    <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-primary-200/20 blur-3xl hero-float-reverse" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-berry-100/10 blur-3xl hero-float-slow" />

    {/* Floating geometric accents */}
    <div className="absolute top-28 right-[15%] w-16 h-16 rounded-2xl border-2 border-caramel-300/30 rotate-12 hero-float-slow hidden lg:block" />
    <div className="absolute bottom-32 left-[10%] w-10 h-10 rounded-full bg-gradient-to-br from-caramel-300/40 to-caramel-400/20 hero-float-reverse hidden lg:block" />
    <div className="absolute top-[40%] right-[8%] w-6 h-6 rounded-full bg-primary-300/30 hero-float-slow hidden lg:block" />
    <div className="absolute top-[30%] left-[5%] w-20 h-20 rounded-3xl border border-primary-200/20 -rotate-6 hero-float-reverse hidden lg:block" />

    {/* Animated ring accent */}
    <div className="absolute top-[18%] right-[22%] hidden lg:block">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-caramel-300/25 hero-spin-slow" />
    </div>

    {/* Floating sparkle dots */}
    {SPARKLES.map((s, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-caramel-400/50 hero-sparkle hidden sm:block"
        style={{
          top: s.top,
          left: s.left,
          right: s.right,
          width: s.size,
          height: s.size,
          animationDelay: `${s.delay}s`,
        }}
      />
    ))}

    {/* Shimmer line */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="hero-shimmer absolute top-0 left-0 w-full h-full" />
    </div>

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
      {/* Welcome Badge */}
      <div className="animate-fadeInUp inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-caramel-200/60 rounded-full text-sm font-semibold text-primary-700 mb-8 shadow-warm hero-glass">
        <span className="w-2 h-2 rounded-full bg-gradient-to-r from-caramel-400 to-caramel-500 animate-pulse" />
        Welcome to Hindumatha's Cake World
      </div>

      {/* Main Heading with staggered entrance */}
      <h1 className="animate-fadeInUp anim-delay-1 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-900 mb-6 leading-[1.1] tracking-tight">
        <span className="hero-text-reveal inline-block">Crafting Sweet</span>{" "}
        <span
          className="relative inline-block hero-text-reveal"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="relative z-10 bg-gradient-to-r from-caramel-500 via-primary-500 to-caramel-600 bg-clip-text text-transparent bg-[length:200%_auto] hero-gradient-shift">
            Memories
          </span>
          <span className="absolute bottom-2 left-0 w-full h-4 bg-caramel-200/60 -z-0 rounded hero-underline-grow" />
        </span>
        <br />
        <span
          className="hero-text-reveal text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent"
          style={{ animationDelay: "0.5s" }}
        >
          Since {establishedYear}
        </span>
      </h1>

      {/* Description inside glass panel */}
      <div className="animate-fadeInUp anim-delay-2 hero-glass-panel max-w-2xl mx-auto mb-10 px-6 py-4 rounded-2xl">
        <p className="text-lg sm:text-xl text-primary-700/80 leading-relaxed">
          {businessInfo.intro}
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="animate-fadeInUp anim-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/menu"
          className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-full shadow-warm hover:shadow-warm-lg transform hover:-translate-y-1 hover:scale-[1.03] transition-all duration-300 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            Explore Our Menu
            <FiArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-caramel-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <Link
          to="/contact"
          className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/70 backdrop-blur-md text-primary-700 font-semibold rounded-full border-2 border-primary-200 hover:border-caramel-400 hover:bg-caramel-50 transform hover:-translate-y-0.5 transition-all duration-300 shadow-soft"
        >
          <FiPhone className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
          Contact Us
        </Link>
      </div>

      {/* Stats Row with staggered pop-in */}
      <div className="mt-16 flex flex-wrap justify-center items-center gap-6 lg:gap-8">
        {/* Rating */}
        <div className="animate-fadeInUp anim-delay-3 hero-stat-card bg-white/70 backdrop-blur-xl border border-caramel-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-caramel-400 to-caramel-500 flex items-center justify-center shadow-sm hero-icon-glow-caramel">
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
        <div className="animate-fadeInUp anim-delay-4 hero-stat-card bg-white/70 backdrop-blur-xl border border-sage-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage-400 to-sage-500 flex items-center justify-center shadow-sm hero-icon-glow-sage">
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
        <div className="animate-fadeInUp anim-delay-5 hero-stat-card bg-white/70 backdrop-blur-xl border border-berry-200/50 rounded-2xl shadow-soft px-5 py-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-berry-400 to-berry-500 flex items-center justify-center shadow-sm hero-icon-glow-berry">
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

    {/* Bottom wave divider */}
    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
      <svg
        className="relative block w-full h-8 sm:h-12"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 L1200,60 L0,60 Z"
          className="fill-white/40"
        />
        <path
          d="M0,40 C300,60 600,20 900,40 C1050,50 1150,30 1200,40 L1200,60 L0,60 Z"
          className="fill-white/60"
        />
      </svg>
    </div>
  </section>
);

export default HeroSection;
