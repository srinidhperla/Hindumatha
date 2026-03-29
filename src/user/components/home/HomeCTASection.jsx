import React from "react";
import { Link } from "react-router-dom";
import { FiMail, FiPhone } from "react-icons/fi";

const HomeCTASection = () => (
  <section className="relative overflow-hidden bg-[linear-gradient(150deg,#120c02_0%,#201509_45%,#34220f_100%)] py-14 sm:py-20 lg:py-28">
    <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-caramel-400/20 rounded-full blur-[80px]" />
    <div className="absolute bottom-0 right-0 w-52 h-52 sm:w-96 sm:h-96 bg-berry-500/10 rounded-full blur-[80px]" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-caramel-500/5 rounded-full blur-[100px]" />
    <div
      className="absolute inset-0 opacity-[0.04]"
      style={{
        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    />

    <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
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
            href="tel:+9194904594990"
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

export default HomeCTASection;
