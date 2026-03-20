import React, { useState } from "react";
import { useSelector } from "react-redux";
import ContactInfoStack from "../components/contact/ContactInfoStack";
import ContactFormCard from "../components/contact/ContactFormCard";
import ContactMapSection from "../components/contact/ContactMapSection";
import { postContactMessage } from "../../services/siteAPI";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const { businessInfo, storeHours, socialLinks } = useSelector(
    (state) => state.site,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Sending message..." });

    try {
      await postContactMessage(formData);
      setStatus({
        type: "success",
        message: "Thank you for your message! We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Failed to send message. Please try again later.",
      });
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        {/* Decorative blurs */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-caramel-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-52 h-52 bg-berry-500/15 rounded-full blur-3xl" />

        <div className="contact-shell pt-0 text-center relative z-10">
          <h1 className="font-playfair animate-fadeInUp mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl md:text-5xl">
            Get in Touch
          </h1>
          <p className="animate-fadeInUp anim-delay-1 mx-auto max-w-2xl text-base text-[#f4dfacc9] sm:text-xl">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>
      </section>

      <div className="contact-shell -mt-8 sm:-mt-10">
        <div className="contact-grid">
          <ContactFormCard
            formData={formData}
            status={status}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
          <ContactInfoStack
            businessInfo={businessInfo}
            storeHours={storeHours}
            socialLinks={socialLinks}
          />
        </div>

        <ContactMapSection />
      </div>
    </div>
  );
};

export default Contact;
