import React from "react";
import { useSelector } from "react-redux";
import HeroSection from "../components/home/HeroSection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import {
  WhyChooseUs,
  AboutSection,
  TestimonialsSection,
  CTASection,
} from "../components/home/HomeSections";

const getAverageRating = (products = []) => {
  const ratedProducts = products.filter(
    (product) => Number(product.rating) > 0,
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
  const { businessInfo, deliverySettings } = useSelector((state) => state.site);
  const { products } = useSelector((state) => state.products);
  const featuredProducts = products.slice(0, 8);
  const currentYear = new Date().getFullYear();
  const establishedYear = Number(businessInfo.establishedYear) || 1976;
  const yearsExperience = Math.max(1, currentYear - establishedYear);
  const averageRating = getAverageRating(products);
  const categoryCount = new Set(
    products.map((product) => product.category).filter(Boolean),
  ).size;

  return (
    <div className="home-page bg-cream-50">
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
        products={products}
        categoryCount={categoryCount}
        yearsExperience={yearsExperience}
        averageRating={averageRating}
      />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default Home;
