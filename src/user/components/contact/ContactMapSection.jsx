import React from "react";

const ContactMapSection = () => (
  <div className="mt-10 animate-fadeInUp sm:mt-16">
    <h2 className="font-playfair mb-4 text-center text-xl font-bold text-[#2a1f0e] sm:mb-6 sm:text-2xl">
      Find Us on Map
    </h2>
    <div className="overflow-hidden rounded-2xl border border-[#c9a84c40] bg-white shadow-lg">
      <iframe
        title="Hindumathas Cake World Location"
        src="https://maps.google.com/maps?width=803&height=450&hl=en&q=Hindumathas%20cake%20world&t=&z=14&ie=UTF8&iwloc=B&output=embed"
        width="100%"
        height="350"
        style={{ border: 0 }}
        allowFullScreen=""
        loading="lazy"
        className="rounded-2xl sm:h-[450px]"
      ></iframe>
    </div>
  </div>
);

export default ContactMapSection;
