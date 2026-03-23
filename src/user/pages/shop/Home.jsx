import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiArrowUp, FiMessageCircle } from "react-icons/fi";
import HeroSection from "@/user/components/home/HeroSection";
import FeaturedProducts from "@/user/components/home/FeaturedProducts";
import SeoMeta from "@/shared/seo/SeoMeta";
import {
  WhyChooseUs,
  AboutSection,
  TestimonialsSection,
  CTASection,
} from "@/user/components/home/HomeSections";

const getAverageRating = (products = []) => {
  const ratedProducts = products.filter(
    (product) => product.isAddon !== true && Number(product.rating) > 0,
  );

  if (!ratedProducts.length) {
    return null;
  }

  const totalRating = ratedProducts.reduce(
    (sum, product) => sum + Number(product.rating || 0),
    0,
  );

  return (totalRating / ratedProducts.length).toFixed(1);
};

const Home = () => {
  const { businessInfo, deliverySettings, socialLinks } = useSelector(
    (state) => state.site,
  );
  const { products } = useSelector((state) => state.products);
  const [showTopButton, setShowTopButton] = useState(false);
  const storefrontProducts = products.filter(
    (product) => product.isAddon !== true,
  );
  const featuredProducts = storefrontProducts.slice(0, 8);
  const currentYear = new Date().getFullYear();
  const establishedYear = Number(businessInfo.establishedYear) || 1976;
  const yearsExperience = Math.max(1, currentYear - establishedYear);
  const averageRating = getAverageRating(storefrontProducts);
  const categoryCount = new Set(
    storefrontProducts.map((product) => product.category).filter(Boolean),
  ).size;

  useEffect(() => {
    const onScroll = () => setShowTopButton(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappLink =
    businessInfo?.socialLinks?.whatsapp || "https://wa.me/919876543210";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: "Hindumatha's Cake World",
    image: "https://www.hindumathascakes.com/images/gallery/cake1.jpg",
    address: {
      "@type": "PostalAddress",
      streetAddress: "123 Main Street",
      addressLocality: "Vizianagaram",
      addressRegion: "Andhra Pradesh",
      addressCountry: "IN",
    },
    telephone: "+91 98765 43210",
    email: "info@hindumathascakes.com",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    sameAs: [
      socialLinks?.instagram,
      socialLinks?.facebook,
      socialLinks?.whatsapp,
    ].filter(Boolean),
    url: "https://www.hindumathascakes.com",
  };

  return (
    <div className="home-page bg-cream-50 relative">
      <SeoMeta
        title="Hindumatha's Cake World | Fresh Custom Cakes in Vizianagaram"
        description="Order handcrafted cakes, pastries, and celebration desserts from Hindumatha's Cake World in Vizianagaram. Fresh bakes, custom designs, and fast local delivery."
        path="/"
        jsonLd={structuredData}
      />
      <HeroSection
        businessInfo={businessInfo}
        establishedYear={establishedYear}
        averageRating={averageRating}
        categoryCount={categoryCount}
        deliverySettings={deliverySettings}
      />
      <FeaturedProducts products={featuredProducts} />
      <WhyChooseUs />
      <AboutSection
        businessInfo={businessInfo}
        products={storefrontProducts}
        categoryCount={categoryCount}
        yearsExperience={yearsExperience}
        averageRating={averageRating}
      />
      <TestimonialsSection />
      <CTASection />

      <a
        href={whatsappLink}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a84c66] bg-[linear-gradient(160deg,#120c02,#2a1f0e)] text-[#e8d08a] shadow-[0_12px_28px_rgba(18,12,2,0.38)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(18,12,2,0.44)] sm:bottom-6 sm:right-6 sm:h-12 sm:w-12"
      >
        <FiMessageCircle className="h-5 w-5" />
      </a>

      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-[calc(max(1rem,env(safe-area-inset-bottom))+3.25rem)] right-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#c9a84c66] bg-white text-[#7a5c0f] shadow-lg transition-all duration-300 hover:-translate-y-1 sm:bottom-[5.5rem] sm:right-6 sm:h-11 sm:w-11 ${
          showTopButton
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <FiArrowUp className="h-4.5 w-4.5" />
      </button>
    </div>
  );
};

export default Home;
