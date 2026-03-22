import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { logout } from "../../features/auth/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { businessInfo } = useSelector((state) => state.site);
  const { products } = useSelector((state) => state.products);
  const cartItems = useSelector((state) => state.cart.items);

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [megaOpenKey, setMegaOpenKey] = useState("");

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = useMemo(
    () => [
      { label: "Home", path: "/" },
      { label: "Menu", path: "/menu", mega: true },
      { label: "Gallery", path: "/gallery", mega: true },
      { label: "Contact", path: "/contact" },
    ],
    [],
  );

  const megaCards = useMemo(() => {
    return products.slice(0, 5).map((product) => ({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0],
    }));
  }, [products]);

  const isActive = (path) => location.pathname === path;

  const onLogout = () => {
    dispatch(logout());
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`relative border-b transition-all duration-300 ${
          isScrolled
            ? "border-[rgba(201,168,76,0.28)] bg-[rgba(16,11,3,0.76)]"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-3 py-2 sm:px-6 lg:px-8">
          <div className="relative flex h-14 items-center justify-between rounded-2xl border border-[rgba(201,168,76,0.28)] bg-[linear-gradient(160deg,rgba(255,255,255,.86),rgba(255,246,228,.72))] px-3 shadow-[0_10px_24px_rgba(18,12,2,0.16)] backdrop-blur-xl lg:h-[72px] lg:px-6">
            <nav className="hidden items-center gap-1 lg:flex">
              {navLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.mega && setMegaOpenKey(link.label)}
                  onMouseLeave={() => link.mega && setMegaOpenKey("")}
                >
                  <Link
                    to={link.path}
                    className={`group relative inline-flex px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${"text-[#5b4312] hover:text-[#120c02]"} ${isActive(link.path) ? "text-[#8b6914]" : ""}`}
                  >
                    {link.label}
                    <span
                      className={`absolute bottom-1 left-3 right-3 h-[1.5px] origin-center bg-[#c9a84c] transition-transform duration-300 ${
                        isActive(link.path)
                          ? "scale-x-100"
                          : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                </div>
              ))}
            </nav>

            <Link
              to="/"
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"
            >
              <span className="font-playfair text-lg font-bold text-[#2a1f0e] sm:text-xl lg:text-2xl">
                Hindumatha
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsSearchOpen((value) => !value)}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] bg-white text-[#8b6914] transition lg:inline-flex"
                aria-label="Toggle search"
              >
                <FiSearch className="h-4 w-4" />
              </button>

              <div
                className={`hidden overflow-hidden rounded-full border transition-all duration-300 lg:flex ${
                  isSearchOpen ? "w-52 px-3" : "w-0 px-0 border-transparent"
                } border-[rgba(201,168,76,0.35)] bg-white`}
              >
                <input
                  type="text"
                  placeholder="Search cakes"
                  className="w-full bg-transparent py-2 text-xs text-[#2a1f0e] outline-none"
                />
              </div>

              <Link
                to="/cart"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] bg-white text-[#8b6914] transition"
                aria-label="Open cart"
              >
                <FiShoppingBag className="h-4 w-4" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[#c9a84c] px-1 text-[9px] font-bold text-[#120c02]">
                    {cartCount}
                  </span>
                )}
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6a4c16] lg:inline-flex"
                  >
                    <FiUser className="mr-1.5 h-4 w-4" />
                    Profile
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      to="/admin/orders"
                      className="hidden rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white lg:inline-flex"
                    >
                      <FiGrid className="mr-1.5 h-4 w-4" />
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="hidden rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6a4c16] lg:inline-flex"
                  >
                    <FiLogOut className="mr-1.5 h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="hidden px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6a4c16] lg:inline-flex"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="hidden rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white lg:inline-flex"
                  >
                    Get Started
                  </Link>
                </>
              )}

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(201,168,76,0.35)] bg-white text-[#8b6914] lg:hidden"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <FiX className="h-5 w-5" />
                ) : (
                  <FiMenu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {megaOpenKey && (
          <div
            className="absolute inset-x-0 top-full hidden border-b border-[rgba(201,168,76,0.35)] bg-[rgba(255,255,255,0.94)] backdrop-blur-2xl lg:block"
            onMouseEnter={() => setMegaOpenKey(megaOpenKey)}
            onMouseLeave={() => setMegaOpenKey("")}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-[220px_1fr_220px] gap-6 px-8 py-7">
              <div>
                <p className="font-playfair text-2xl text-[#2a1f0e]">
                  {megaOpenKey}
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8b6914]">
                  Handcrafted fresh every day
                </p>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {megaCards.map((card) => (
                  <Link
                    to={`/products/${card.id}`}
                    key={card.id}
                    className="overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.35)] bg-white"
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      className="h-20 w-full object-cover"
                    />
                    <div className="px-2 py-2">
                      <p className="line-clamp-1 text-[11px] font-semibold text-[#2a1f0e]">
                        {card.name}
                      </p>
                      <p className="text-[10px] text-[#8b6914]">
                        Rs.{card.price}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[rgba(201,168,76,0.35)] bg-[#120c02] p-3 text-white">
                <img
                  src="https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=500&auto=format&fit=crop&q=80"
                  alt="Featured promo"
                  className="h-28 w-full rounded-xl object-cover"
                />
                <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[#e8d08a]">
                  Today's Feature
                </p>
                <p className="font-playfair text-lg">Wedding Collection</p>
              </div>
            </div>
          </div>
        )}

        <div
          className={`overflow-hidden border-t border-[rgba(201,168,76,0.2)] bg-white/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
            isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 px-4 py-4">
            <div className="mb-2 grid grid-cols-3 gap-2 rounded-xl border border-[rgba(201,168,76,0.25)] bg-[#f8f1dd] p-2">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
              >
                <FiHome className="h-3.5 w-3.5" /> Home
              </Link>
              <Link
                to="/menu"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
              >
                Order
              </Link>
              <Link
                to="/cart"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
              >
                Cart ({cartCount})
              </Link>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6a4c16] hover:bg-[#f9f4e8]"
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6a4c16] hover:bg-[#f9f4e8]"
                >
                  Profile
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6a4c16] hover:bg-[#f9f4e8]"
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-2 w-full rounded-full border border-[rgba(201,168,76,0.35)] px-3 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#8b6914]"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-[rgba(201,168,76,0.35)] px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] text-[#8b6914]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
