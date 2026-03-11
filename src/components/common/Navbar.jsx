import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { getAvailableWeightOptions } from "../../utils/productOptions";
import {
  FiShoppingBag,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiGrid,
  FiArrowRight,
} from "react-icons/fi";

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartPreviewItems = cartItems.slice(0, 4).map((item) => {
    const selectedWeightOption = getAvailableWeightOptions(item.product).find(
      (weight) => weight.label === item.selectedWeight,
    );

    return {
      id: item.id,
      name: item.product.name,
      image: item.product.image,
      quantity: item.quantity,
      selectedFlavor: item.selectedFlavor,
      selectedWeight: item.selectedWeight,
      linePrice: Math.round(
        Number(item.product.price || 0) *
          Number(selectedWeightOption?.multiplier || 1) *
          Number(item.quantity || 0),
      ),
    };
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Menu", path: "/menu" },
    { name: "Gallery", path: "/gallery" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-warm border-b border-primary-100"
          : "bg-cream-50/80 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 transition-all duration-300 group-hover:rounded-2xl group-hover:scale-105 shadow-warm">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-lg font-bold tracking-tight text-primary-800">
                  Hindumatha's
                </span>
                <span className="hidden md:inline text-lg font-bold tracking-tight text-primary-800">
                  {" "}
                  Cake World
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-semibold transition-all duration-200 group ${
                  isActive(link.path)
                    ? "text-primary-700"
                    : "text-primary-600/70 hover:text-primary-800"
                }`}
              >
                {link.name}
                <span
                  className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-caramel-400 to-primary-500 transition-all duration-300 ${
                    isActive(link.path) ? "w-6" : "w-0 group-hover:w-6"
                  }`}
                ></span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-2">
            {isAuthenticated ? (
              <>
                {/* Cart with Preview */}
                <Link to="/cart" className="relative group">
                  <span className="relative inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-800">
                    <FiShoppingBag className="h-5 w-5" />
                    <span>Cart</span>
                    {cartCount > 0 && (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-caramel-400 to-caramel-500 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  {/* Cart Preview Dropdown */}
                  <div className="pointer-events-none invisible absolute right-0 top-full z-50 mt-4 w-[380px] translate-y-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-primary-200/60 p-5 opacity-0 shadow-warm-lg transition-all duration-300 group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary-600">
                        Shopping Cart
                      </p>
                      <span className="text-xs font-semibold text-primary-500">
                        {cartCount} {cartCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    {cartPreviewItems.length > 0 ? (
                      <div className="space-y-3">
                        {cartPreviewItems.map((item) => (
                          <div
                            key={item.id}
                            className="grid grid-cols-[52px_1fr_auto] items-center gap-3 rounded-xl bg-cream-100 p-3 transition-colors hover:bg-cream-200"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-12 w-12 rounded-lg object-cover ring-2 ring-primary-100"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-primary-800">
                                {item.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-primary-500">
                                {item.selectedWeight} · {item.selectedFlavor} ·
                                ×{item.quantity}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-caramel-600">
                              ₹{item.linePrice.toLocaleString("en-IN")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-cream-100 px-4 py-6 text-center text-sm text-primary-500">
                        Your cart is empty
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-primary-100 flex justify-end">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:gap-2 transition-all">
                        View Cart <FiArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Order Button */}
                <Link
                  to={cartCount > 0 ? "/cart" : "/menu"}
                  className="rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-warm hover:-translate-y-0.5"
                >
                  {cartCount > 0 ? "Checkout" : "Order Now"}
                </Link>

                {/* Profile */}
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <FiUser className="h-4 w-4" />
                  <span className="hidden xl:inline">Profile</span>
                </Link>

                {/* Admin Dashboard */}
                {user?.role === "admin" && (
                  <Link
                    to="/admin/orders"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    <FiGrid className="h-4 w-4" />
                    <span className="hidden xl:inline">Dashboard</span>
                  </Link>
                )}

                {/* User Avatar & Logout */}
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-primary-200">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-caramel-200 to-caramel-300 ring-2 ring-white shadow-sm">
                    <span className="text-sm font-bold text-primary-800">
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 p-2 text-primary-400 hover:text-berry-600 transition-colors rounded-full hover:bg-berry-50"
                    title="Logout"
                  >
                    <FiLogOut className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-800 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-warm hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to="/cart"
              className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-2 text-sm font-semibold text-primary-700 transition-all hover:bg-cream-100 hover:border-primary-300"
              aria-label="Open cart"
            >
              <FiShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-caramel-400 to-caramel-500 px-1.5 py-0.5 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative p-2 rounded-full text-primary-700 transition-colors hover:bg-cream-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <FiX className="h-5 w-5" />
              ) : (
                <FiMenu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Panel */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out lg:hidden ${
          isMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 border-t border-primary-100 bg-white/95 backdrop-blur-xl px-4 pb-6 pt-4">
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                isActive(link.path)
                  ? "bg-gradient-to-r from-cream-100 to-cream-200 text-primary-800"
                  : "text-primary-600 hover:bg-cream-100 hover:text-primary-800"
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {link.name}
            </Link>
          ))}

          <div className="border-t border-primary-100 pt-4 mt-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={cartCount > 0 ? "/cart" : "/menu"}
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full px-4 py-3 text-center text-white font-semibold bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:shadow-warm transition-all"
                >
                  {cartCount > 0 ? "Checkout" : "Order Now"}
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-primary-600 hover:bg-cream-100 hover:text-primary-800"
                >
                  Profile
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-base font-semibold text-primary-600 hover:bg-cream-100 hover:text-primary-800"
                >
                  My Orders
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-base font-semibold text-primary-600 hover:bg-cream-100 hover:text-primary-800"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-3 text-center text-berry-600 font-semibold border-2 border-berry-200 rounded-full hover:bg-berry-50 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-center rounded-full text-base font-semibold text-primary-700 border-2 border-primary-200 hover:bg-cream-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="px-4 py-3 text-center text-white font-semibold bg-gradient-to-r from-primary-600 to-primary-700 rounded-full hover:shadow-warm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
