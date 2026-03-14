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
    <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-b from-primary-50 via-cream-50 to-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-0 w-60 h-60 bg-caramel-200/30 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-sage-200/20 rounded-full blur-[80px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-16 animate-fadeInUp">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-caramel-200/60 text-caramel-700 text-sm font-semibold mb-4 shadow-sm">
            Why Us
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-800 mb-3 sm:mb-4 tracking-tight">
            Why Choose Us?
          </h2>
          <p className="max-w-2xl mx-auto text-primary-500 text-sm sm:text-base">
            We take pride in delivering the best quality cakes with exceptional
            service
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={`animate-fadeInUp anim-delay-${idx + 1} bg-white/70 backdrop-blur-xl rounded-2xl p-5 sm:p-8 text-center group hover:-translate-y-2 active:scale-[0.97] transition-all duration-300 shadow-soft hover:shadow-warm-lg border border-white/80`}
            >
              <div
                className={`w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-5 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <feature.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.iconColor}`}
                />
              </div>
              <h3 className="text-sm sm:text-lg font-bold text-primary-800 mb-1 sm:mb-2">
                {feature.title}
              </h3>
              <p className="text-primary-500 text-xs sm:text-sm leading-relaxed hidden sm:block">
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
  <section className="py-14 sm:py-20 lg:py-28 bg-white relative overflow-hidden">
    {/* Subtle background pattern */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage:
          "radial-gradient(circle, #5c3d2e 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />
    <div className="absolute top-20 right-0 w-80 h-80 bg-caramel-100/40 rounded-full blur-[100px]" />
    <div className="absolute bottom-20 left-0 w-72 h-72 bg-berry-100/30 rounded-full blur-[100px]" />

    <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
        {/* Image Side */}
        <div className="relative animate-fadeInUp">
          <div className="relative rounded-2xl overflow-hidden shadow-warm">
            <img
              src="/images/gallery/cake3.jpg"
              alt="About Hindumatha's Cake World"
              className="w-full h-[280px] sm:h-[400px] lg:h-[500px] object-cover"
            />
            {/* Overlay stats card */}
            <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-warm-lg border border-white/60">
              <div className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary-600 to-caramel-500 bg-clip-text text-transparent">
                {yearsExperience}+
              </div>
              <div className="text-primary-500 text-xs sm:text-sm font-medium">
                Years Experience
              </div>
            </div>
          </div>
          {/* Decorative elements - hidden on very small screens */}
          <div className="hidden sm:block absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-caramel-200 to-caramel-300 rounded-full opacity-60 blur-xl" />
          <div className="hidden sm:block absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-berry-200 to-berry-300 rounded-full opacity-40 blur-xl" />
        </div>

        {/* Content Side */}
        <div className="animate-fadeInUp anim-delay-2">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 text-sm font-semibold mb-4">
            About Us
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-800 mb-4 sm:mb-6 tracking-tight">
            Baking Happiness at {businessInfo.storeName}
          </h2>
          <p className="text-base sm:text-lg text-primary-600 mb-4 sm:mb-6 leading-relaxed">
            {businessInfo.intro}
          </p>
          <p className="text-sm sm:text-base text-primary-500 mb-6 sm:mb-8 leading-relaxed">
            We currently serve {products.length || 0} live products across{" "}
            {categoryCount || 0} categories, with every order prepared around
            your selected flavor, weight, and occasion.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="text-center p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-cream-200/60 shadow-soft">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {products.length || 0}+
              </div>
              <div className="text-[10px] sm:text-xs text-primary-500 mt-1 font-medium">
                Products
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-cream-200/60 shadow-soft">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-caramel-500 to-caramel-600 bg-clip-text text-transparent">
                {categoryCount || 0}+
              </div>
              <div className="text-[10px] sm:text-xs text-primary-500 mt-1 font-medium">
                Categories
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-cream-200/60 shadow-soft">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-berry-500 to-berry-600 bg-clip-text text-transparent">
                {averageRating ? `${averageRating}★` : "5★"}
              </div>
              <div className="text-[10px] sm:text-xs text-primary-500 mt-1 font-medium">
                Rating
              </div>
            </div>
          </div>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-full shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
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
    <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-b from-cream-50 via-cream-100/50 to-cream-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-60 h-60 bg-berry-200/20 rounded-full blur-[80px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-caramel-200/20 rounded-full blur-[80px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-16 animate-fadeInUp">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-berry-200/60 text-berry-700 text-sm font-semibold mb-4 shadow-sm">
            Testimonials
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-800 mb-3 sm:mb-4 tracking-tight">
            What Our Customers Say
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on md+ */}
        <div className="-mx-5 px-5 sm:mx-0 sm:px-0">
          <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory no-scrollbar">
            {testimonials.map((t, idx) => (
              <div
                key={t.initials}
                className={`animate-fadeInUp anim-delay-${idx + 1} min-w-[280px] sm:min-w-[300px] md:min-w-0 snap-start bg-white/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 group hover:-translate-y-2 active:scale-[0.98] transition-all duration-300 shadow-soft hover:shadow-warm-lg border border-white/80`}
              >
                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-caramel-400 text-caramel-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-primary-600 mb-5 sm:mb-6 leading-relaxed text-xs sm:text-sm">
                  "{t.text}"
                </p>

                {/* Author */}
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br ${t.color} text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-md flex-shrink-0`}
                  >
                    {t.initials}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-sm sm:text-base text-primary-800">
                      {t.name}
                    </div>
                    <div className="text-xs text-primary-500">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-14 sm:py-20 lg:py-28 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
    {/* Decorative elements */}
    <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-caramel-400/20 rounded-full blur-[80px]" />
    <div className="absolute bottom-0 right-0 w-52 h-52 sm:w-96 sm:h-96 bg-berry-500/10 rounded-full blur-[80px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-caramel-500/5 rounded-full blur-[100px]" />
    {/* Subtle dot pattern */}
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
      {/* Glass container */}
      <div className="max-w-3xl mx-auto bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 lg:p-16 text-center">
        <h2 className="animate-fadeInUp text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 tracking-tight">
          Ready to Order Your Dream Cake?
        </h2>
        <p className="animate-fadeInUp anim-delay-1 max-w-2xl mx-auto text-base sm:text-lg text-cream-200/80 mb-8 sm:mb-10">
          Contact us today to discuss your custom cake requirements. We'll make
          your special moments even sweeter!
        </p>
        <div className="animate-fadeInUp anim-delay-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-caramel-500 to-caramel-600 text-white font-semibold rounded-full shadow-lg shadow-caramel-500/30 hover:shadow-caramel-500/50 transform active:scale-[0.97] hover:-translate-y-0.5 transition-all duration-300"
          >
            <FiMail className="w-5 h-5" />
            Contact Us
          </Link>
          <a
            href="tel:+919876543210"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 active:scale-[0.97] transition-all duration-300"
          >
            <FiPhone className="w-5 h-5" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  </section>
);

export { WhyChooseUs, AboutSection, TestimonialsSection, CTASection };
