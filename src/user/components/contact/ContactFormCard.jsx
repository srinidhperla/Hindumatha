import React from "react";

const ContactFormCard = ({ formData, status, onChange, onSubmit }) => (
  <div className="contact-form-card animate-fadeInUp anim-delay-2">
    <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-primary-800">
      Send us a Message
    </h2>

    <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-primary-700"
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
            className="w-full rounded-xl border border-cream-300 px-4 py-3 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-primary-700"
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
            className="w-full rounded-xl border border-cream-300 px-4 py-3 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-medium text-primary-700"
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
            className="w-full rounded-xl border border-cream-300 px-4 py-3 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
            placeholder="+91 98765 43210"
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="mb-2 block text-sm font-medium text-primary-700"
          >
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-cream-300 px-4 py-3 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
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
          className="mb-2 block text-sm font-medium text-primary-700"
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
          className="w-full resize-none rounded-xl border border-cream-300 px-4 py-3 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-300"
          placeholder="Tell us about your requirements..."
        />
      </div>

      <button
        type="submit"
        disabled={status.type === "loading"}
        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 sm:py-4 font-semibold text-white transition-all hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 shadow-warm hover:shadow-warm-lg"
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
