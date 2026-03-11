import React, { useState } from "react";
import { useSelector } from "react-redux";
import ContactInfoStack from "../components/contact/ContactInfoStack";
import ContactFormCard from "../components/contact/ContactFormCard";
import ContactMapSection from "../components/contact/ContactMapSection";

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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus({
        type: "success",
        message: "Thank you for your message! We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to send message. Please try again later.",
      });
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-shell pt-0 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-cream-100">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>
      </section>

      <div className="contact-shell -mt-10">
        <div className="contact-grid">
          <ContactInfoStack
            businessInfo={businessInfo}
            storeHours={storeHours}
            socialLinks={socialLinks}
          />
          <ContactFormCard
            formData={formData}
            status={status}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>

        <ContactMapSection />
      </div>
    </div>
  );
};

export default Contact;
