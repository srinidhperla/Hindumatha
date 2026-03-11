import React from "react";
import { Link } from "react-router-dom";

const GalleryLightbox = ({ item, onClose }) => {
  if (!item) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="group absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-lg transition-colors hover:bg-white"
        >
          <svg
            className="h-6 w-6 text-primary-600 transition-colors group-hover:text-caramel-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="grid md:grid-cols-2">
          <div className="aspect-square md:h-[500px] md:aspect-auto">
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-8 md:p-12">
            <span className="mb-4 inline-block w-fit rounded-full bg-gradient-to-r from-caramel-100 to-primary-100 px-4 py-1.5 text-sm font-semibold text-caramel-700">
              {item.category}
            </span>
            <h2 className="mb-4 text-3xl font-bold text-primary-800">
              {item.title}
            </h2>
            <p className="mb-6 leading-relaxed text-primary-600">
              {item.description}
            </p>
            <div className="mb-8 flex items-center text-primary-500">
              <span className="font-medium">
                {item.likes} people loved this
              </span>
            </div>
            <Link
              to="/menu"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-warm"
            >
              Shop Cakes
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryLightbox;
