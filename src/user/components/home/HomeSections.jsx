import React from "react";
import { Link } from "react-router-dom";
import {
  FiStar,
  FiClock,
  FiHeart,
  FiCheckCircle,
  FiArrowRight,
  FiMail,
  FiPhone,
} from "react-icons/fi";

const WhyChooseUs = () => {
  const features = [
    {
      icon: FiStar,
      title: "Premium Quality",
      description:
        "We use only the finest and freshest ingredients in all our products",
      color: "from-caramel-400 to-caramel-500",
      iconColor: "text-white",
    },
    {
      icon: FiClock,
      title: "On-Time Delivery",
      description:
        "We ensure your orders are delivered fresh and on time, every time",
      color: "from-sage-400 to-sage-500",
      iconColor: "text-white",
    },
    {
      icon: FiHeart,
      title: "Made with Love",
      description: "Every cake is crafted with passion and attention to detail",
      color: "from-berry-400 to-berry-500",
      iconColor: "text-white",
    },
    {
      icon: FiCheckCircle,
      title: "100% Satisfaction",
      description:
        "Your satisfaction is our priority. We guarantee quality in every bite",
      color: "from-primary-500 to-primary-600",
      iconColor: "text-white",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-cream-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-caramel-100 to-caramel-200 text-caramel-700 text-sm font-semibold mb-4">
            Why Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-4 tracking-tight">
            Why Choose Us?
          </h2>
          <p className="max-w-2xl mx-auto text-primary-500">
            We take pride in delivering the best quality cakes with exceptional
            service
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-8 text-center group hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-warm border border-cream-100"
            >
              <div
                className={`w-14 h-14 mx-auto mb-5 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-md`}
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-bold text-primary-800 mb-2">
                {feature.title}
              </h3>
              <p className="text-primary-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutSection = ({
  businessInfo,
  products,
  categoryCount,
  yearsExperience,
  averageRating,
}) => (
  <section className="py-20 lg:py-28 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Image Side */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden shadow-warm">
            <img
              src="/images/gallery/cake3.jpg"
              alt="About Hindumatha's Cake World"
              className="w-full h-[400px] lg:h-[500px] object-cover"
            />
            {/* Overlay stats card */}
            <div className="absolute -bottom-6 -right-6 lg:bottom-8 lg:right-8 bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-warm border border-cream-100">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-caramel-500 bg-clip-text text-transparent">
                {yearsExperience}+
              </div>
              <div className="text-primary-500 text-sm font-medium">
                Years Experience
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-caramel-200 to-caramel-300 rounded-full opacity-60 blur-xl"></div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-berry-200 to-berry-300 rounded-full opacity-40 blur-xl"></div>
        </div>

        {/* Content Side */}
        <div>
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-semibold mb-4">
            About Us
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-6 tracking-tight">
            Baking Happiness at {businessInfo.storeName}
          </h2>
          <p className="text-lg text-primary-600 mb-6 leading-relaxed">
            {businessInfo.intro}
          </p>
          <p className="text-primary-500 mb-8 leading-relaxed">
            We currently serve {products.length || 0} live products across{" "}
            {categoryCount || 0} categories, with every order prepared around
            your selected flavor, weight, and occasion.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 border border-cream-200">
              <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {products.length || 0}+
              </div>
              <div className="text-xs text-primary-500 mt-1 font-medium">
                Products
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 border border-cream-200">
              <div className="text-2xl font-bold bg-gradient-to-r from-caramel-500 to-caramel-600 bg-clip-text text-transparent">
                {categoryCount || 0}+
              </div>
              <div className="text-xs text-primary-500 mt-1 font-medium">
                Categories
              </div>
            </div>
            <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cream-50 to-cream-100 border border-cream-200">
              <div className="text-2xl font-bold bg-gradient-to-r from-berry-500 to-berry-600 bg-clip-text text-transparent">
                {averageRating ? `${averageRating}★` : "5★"}
              </div>
              <div className="text-xs text-primary-500 mt-1 font-medium">
                Rating
              </div>
            </div>
          </div>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-full shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            View Our Gallery
            <FiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => {
  const testimonials = [
    {
      initials: "PR",
      name: "Priya Reddy",
      location: "Vizianagaram",
      text: "The wedding cake was absolutely stunning! Everyone at the reception couldn't stop talking about how delicious it was. Thank you for making our day special!",
      color: "from-caramel-400 to-caramel-500",
    },
    {
      initials: "RK",
      name: "Rajesh Kumar",
      location: "Visakhapatnam",
      text: "Best bakery in town! I order birthday cakes for my kids every year from here. The taste is always consistent and the designs are creative.",
      color: "from-sage-400 to-sage-500",
    },
    {
      initials: "SL",
      name: "Sunita Lakshmi",
      location: "Srikakulam",
      text: "Ordered a custom cake for my anniversary and it exceeded all expectations. The attention to detail and taste was phenomenal. Highly recommend!",
      color: "from-berry-400 to-berry-500",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-berry-100 to-berry-200 text-berry-700 text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-4 tracking-tight">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.initials}
              className="bg-white rounded-2xl p-8 group hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-warm border border-cream-100"
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <FiStar
                    key={i}
                    className="w-4 h-4 fill-caramel-400 text-caramel-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-primary-600 mb-6 leading-relaxed text-sm">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-bold text-sm shadow-md`}
                >
                  {t.initials}
                </div>
                <div className="ml-3">
                  <div className="font-semibold text-primary-800">{t.name}</div>
                  <div className="text-xs text-primary-500">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-20 lg:py-28 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
    {/* Decorative elements */}
    <div className="absolute top-0 left-0 w-64 h-64 bg-caramel-400/20 rounded-full blur-3xl"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-berry-500/10 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-sage-400/20 rounded-full blur-2xl"></div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight">
        Ready to Order Your Dream Cake?
      </h2>
      <p className="max-w-2xl mx-auto text-lg text-cream-200 mb-10">
        Contact us today to discuss your custom cake requirements. We'll make
        your special moments even sweeter!
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/contact"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-full shadow-warm hover:shadow-warm-lg transform hover:-translate-y-0.5 transition-all duration-300"
        >
          <FiMail className="w-5 h-5" />
          Contact Us
        </Link>
        <a
          href="tel:+919876543210"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white font-semibold rounded-full border-2 border-white/30 hover:bg-white hover:text-primary-700 transition-all duration-300"
        >
          <FiPhone className="w-5 h-5" />
          Call Now
        </a>
      </div>
    </div>
  </section>
);

export { WhyChooseUs, AboutSection, TestimonialsSection, CTASection };
