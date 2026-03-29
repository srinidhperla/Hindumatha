import React from "react";

const ContactFormCard = ({ formData, status, onChange, onSubmit }) => (
  <div className="contact-form-card animate-fadeInUp anim-delay-2">
    <h2 className="font-playfair mb-4 text-xl font-bold text-[#2a1f0e] sm:mb-6 sm:text-2xl">
      Send us a Message
    </h2>

    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-[#6a4c16]"
          >
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-[#c9a84c55] bg-white/90 px-4 py-3 text-[#2a1f0e] transition-colors focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a84c66]"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#6a4c16]"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-[#c9a84c55] bg-white/90 px-4 py-3 text-[#2a1f0e] transition-colors focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a84c66]"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-[#6a4c16]"
          >
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-[#c9a84c55] bg-white/90 px-4 py-3 text-[#2a1f0e] transition-colors focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a84c66]"
            placeholder="+91 9490459499"
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-[#6a4c16]"
          >
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-[#c9a84c55] bg-white/90 px-4 py-3 text-[#2a1f0e] transition-colors focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a84c66]"
          >
            <option value="">Select a subject</option>
            <option value="order">Place an Order</option>
            <option value="inquiry">General Inquiry</option>
            <option value="custom">Custom Cake Request</option>
            <option value="feedback">Feedback</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-[#6a4c16]"
        >
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={onChange}
          required
          className="w-full resize-none rounded-xl border border-[#c9a84c55] bg-white/90 px-4 py-3 text-[#2a1f0e] transition-colors focus:border-[#8b6914] focus:ring-2 focus:ring-[#c9a84c66]"
          placeholder="Tell us about your requirements..."
        />
      </div>

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] py-3.5 font-semibold text-white shadow-[0_10px_24px_rgba(122,92,15,0.3)] transition-all hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#8b6914] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4"
      >
        {status.type === "loading" ? "Sending..." : "Send Message"}
      </button>

      {status.message && (
        <div
          className={`rounded-xl p-4 ${
            status.type === "success"
              ? "border border-sage-200 bg-sage-50 text-sage-800"
              : status.type === "error"
                ? "border border-berry-200 bg-berry-50 text-berry-800"
                : "bg-cream-100 text-primary-800"
          }`}
        >
          {status.message}
        </div>
      )}
    </form>
  </div>
);

export default ContactFormCard;
