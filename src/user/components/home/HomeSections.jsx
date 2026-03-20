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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#120c02_0%,#1b1307_48%,#251909_100%)] py-14 sm:py-20 lg:py-28">
      {/* Decorative blobs */}
      <div className="absolute top-10 left-0 h-60 w-60 rounded-full bg-[#c9a84c2e] blur-[80px]" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#e8d08a22] blur-[80px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-16 animate-fadeInUp">
          <span className="mb-4 inline-block rounded-full border border-[#c9a84c55] bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#e8d08a] backdrop-blur-sm shadow-sm">
            Why Us
          </span>
          <h2 className="mb-3 font-playfair text-2xl font-bold tracking-tight text-white sm:mb-4 sm:text-3xl md:text-4xl">
            Why Choose Us?
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-white/70 sm:text-base">
            We take pride in delivering the best quality cakes with exceptional
            service
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={`animate-fadeInUp anim-delay-${idx + 1} group rounded-2xl border border-[#c9a84c3d] bg-[linear-gradient(155deg,rgba(255,255,255,.15),rgba(255,255,255,.05))] p-5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_34px_rgba(0,0,0,0.34)] active:scale-[0.97] sm:p-8`}
            >
              <div
                className={`w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-5 bg-gradient-to-br ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <feature.icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${feature.iconColor}`}
                />
              </div>
              <h3 className="mb-1 text-sm font-bold text-[#f4dfac] sm:mb-2 sm:text-lg">
                {feature.title}
              </h3>
              <p className="hidden text-xs leading-relaxed text-white/70 sm:block sm:text-sm">
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
  <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8f1e0_0%,#fffaf0_55%,#f3e7cc_100%)] py-14 sm:py-20 lg:py-28">
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
          <span className="mb-4 inline-block rounded-full border border-[#c9a84c66] bg-white/85 px-4 py-1.5 text-sm font-semibold text-[#8b6914]">
            About Us
          </span>
          <h2 className="mb-4 font-playfair text-2xl font-bold tracking-tight text-[#2a1f0e] sm:mb-6 sm:text-3xl md:text-4xl">
            Baking Happiness at {businessInfo.storeName}
          </h2>
          <p className="mb-4 text-base leading-relaxed text-[#624a2a] sm:mb-6 sm:text-lg">
            {businessInfo.intro}
          </p>
          <p className="mb-6 text-sm leading-relaxed text-[#6a5130] sm:mb-8 sm:text-base">
            We currently serve {products.length || 0} live products across{" "}
            {categoryCount || 0} categories, with every order prepared around
            your selected flavor, weight, and occasion.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="rounded-xl border border-[#c9a84c40] bg-white/70 p-3 text-center shadow-[0_8px_20px_rgba(18,12,2,0.09)] backdrop-blur-sm sm:p-4">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                {products.length || 0}+
              </div>
              <div className="mt-1 text-[10px] font-medium text-[#6a5130] sm:text-xs">
                Products
              </div>
            </div>
            <div className="rounded-xl border border-[#c9a84c40] bg-white/70 p-3 text-center shadow-[0_8px_20px_rgba(18,12,2,0.09)] backdrop-blur-sm sm:p-4">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-caramel-500 to-caramel-600 bg-clip-text text-transparent">
                {categoryCount || 0}+
              </div>
              <div className="mt-1 text-[10px] font-medium text-[#6a5130] sm:text-xs">
                Categories
              </div>
            </div>
            <div className="rounded-xl border border-[#c9a84c40] bg-white/70 p-3 text-center shadow-[0_8px_20px_rgba(18,12,2,0.09)] backdrop-blur-sm sm:p-4">
              <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-berry-500 to-berry-600 bg-clip-text text-transparent">
                {averageRating ? `${averageRating}★` : "5★"}
              </div>
              <div className="mt-1 text-[10px] font-medium text-[#6a5130] sm:text-xs">
                Rating
              </div>
            </div>
          </div>

          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(122,92,15,0.32)] active:scale-95"
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
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#1b1307_0%,#120c02_100%)] py-14 sm:py-20 lg:py-28">
      {/* Decorative elements */}
      <div className="absolute left-1/4 top-0 h-60 w-60 rounded-full bg-[#c9a84c26] blur-[80px]" />
      <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-[#e8d08a1f] blur-[80px]" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-10 sm:mb-16 animate-fadeInUp">
          <span className="mb-4 inline-block rounded-full border border-[#c9a84c55] bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#e8d08a] backdrop-blur-sm shadow-sm">
            Testimonials
          </span>
          <h2 className="mb-3 font-playfair text-2xl font-bold tracking-tight text-white sm:mb-4 sm:text-3xl md:text-4xl">
            What Our Customers Say
          </h2>
        </div>

        {/* Horizontal scroll on mobile, grid on md+ */}
        <div className="-mx-5 px-5 sm:mx-0 sm:px-0">
          <div className="flex md:grid md:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-0 snap-x snap-mandatory no-scrollbar">
            {testimonials.map((t, idx) => (
              <div
                key={t.initials}
                className={`animate-fadeInUp anim-delay-${idx + 1} min-w-[280px] snap-start rounded-2xl border border-[#c9a84c3b] bg-[linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.05))] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_16px_34px_rgba(0,0,0,0.36)] active:scale-[0.98] sm:min-w-[300px] sm:p-8 md:min-w-0`}
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
                <p className="mb-5 text-xs leading-relaxed text-white/75 sm:mb-6 sm:text-sm">
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
                    <div className="text-sm font-semibold text-[#f4dfac] sm:text-base">
                      {t.name}
                    </div>
                    <div className="text-xs text-white/65">{t.location}</div>
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
  <section className="relative overflow-hidden bg-[linear-gradient(150deg,#120c02_0%,#201509_45%,#34220f_100%)] py-14 sm:py-20 lg:py-28">
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
      <div className="mx-auto max-w-3xl rounded-3xl border border-[#c9a84c4d] bg-[linear-gradient(160deg,rgba(255,255,255,.1),rgba(255,255,255,.04))] p-8 text-center backdrop-blur-xl sm:p-12 lg:p-16">
        <h2 className="animate-fadeInUp mb-4 font-playfair text-2xl font-bold tracking-tight text-white sm:mb-6 sm:text-3xl md:text-4xl">
          Ready to Order Your Dream Cake?
        </h2>
        <p className="animate-fadeInUp anim-delay-1 mx-auto mb-8 max-w-2xl text-base text-[#f4dfaccc] sm:mb-10 sm:text-lg">
          Contact us today to discuss your custom cake requirements. We'll make
          your special moments even sweeter!
        </p>
        <div className="animate-fadeInUp anim-delay-2 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-7 py-3.5 font-semibold text-white shadow-lg shadow-[#7a5c0f66] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[#7a5c0f99] active:scale-[0.97] sm:px-8 sm:py-4"
          >
            <FiMail className="w-5 h-5" />
            Contact Us
          </Link>
          <a
            href="tel:+919876543210"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#c9a84c66] bg-[#120c02ba] px-7 py-3.5 font-semibold text-[#f4dfac] backdrop-blur-sm transition-all duration-300 hover:bg-[#120c02] active:scale-[0.97] sm:px-8 sm:py-4"
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
