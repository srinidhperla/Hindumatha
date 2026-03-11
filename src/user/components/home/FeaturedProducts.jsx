import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";

const formatCategoryLabel = (value = "") =>
  value
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const FeaturedProducts = ({ products }) => (
  <section className="py-20 lg:py-28 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-sage-100 to-sage-200 text-sage-700 text-sm font-semibold mb-4">
          Our Specialties
        </span>
        <h2 className="text-3xl sm:text-4xl font-bold text-primary-800 mb-4 tracking-tight">
          Featured Products
        </h2>
        <p className="max-w-2xl mx-auto text-primary-500">
          Our most popular and beloved creations, baked fresh daily with premium
          ingredients
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product._id}
            className="group bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-soft hover:shadow-warm border border-cream-100"
          >
            <Link to={`/products/${product._id}`} className="block">
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full bg-primary-700 text-white text-xs font-semibold capitalize shadow-md">
                    {formatCategoryLabel(product.category)}
                  </span>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary-900/0 group-hover:bg-primary-900/10 transition-colors duration-300"></div>
              </div>
            </Link>
            <div className="p-6">
              <Link to={`/products/${product._id}`}>
                <h3 className="text-lg font-bold text-primary-800 mb-2 group-hover:text-caramel-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              <p className="text-primary-500 text-sm mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-cream-100">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-caramel-500 bg-clip-text text-transparent">
                  ₹{product.price}
                </span>
                <Link
                  to={`/products/${product._id}`}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:shadow-warm transition-all duration-300"
                >
                  View
                  <FiArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-primary-600 text-primary-700 font-semibold hover:bg-primary-600 hover:text-white transition-all duration-300"
        >
          View All Products
          <FiArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  </section>
);

export default FeaturedProducts;
