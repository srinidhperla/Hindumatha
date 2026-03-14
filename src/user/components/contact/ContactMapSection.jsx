import React from "react";

const ContactMapSection = () => (
  <div className="mt-10 sm:mt-16 animate-fadeInUp">
    <h2 className="mb-4 sm:mb-6 text-center text-xl sm:text-2xl font-bold text-primary-800">
      Find Us on Map
    </h2>
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
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
