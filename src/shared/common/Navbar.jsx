import React, { useMemo, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSearch,
  FiShoppingBag,
  FiUser,
  FiX,
} from "react-icons/fi";
import { logout } from "@/features/auth/authSlice";
import NavbarMegaMenu from "./NavbarMegaMenu";
import NavbarMobileMenu from "./NavbarMobileMenu";

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
  const isDeliveryUser = isAuthenticated && user?.role === "delivery";
  const dashboardPath =
    user?.role === "admin"
      ? "/admin/orders"
      : user?.role === "delivery"
        ? "/delivery"
        : "";
  const brandPath = isDeliveryUser ? "/delivery" : "/";

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
              {!isDeliveryUser &&
                navLinks.map((link) => (
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
              to={brandPath}
              className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2"
            >
              <span className="font-playfair text-lg font-bold text-[#2a1f0e] sm:text-xl lg:text-2xl">
                Hindumatha
              </span>
            </Link>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {!isDeliveryUser && (
                <>
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
                </>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6a4c16] lg:inline-flex"
                  >
                    <FiUser className="mr-1.5 h-4 w-4" />
                    Profile
                  </Link>
                  {dashboardPath && (
                    <Link
                      to={dashboardPath}
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

        <NavbarMegaMenu
          megaOpenKey={megaOpenKey}
          megaCards={megaCards}
          onMouseEnter={() => setMegaOpenKey(megaOpenKey)}
          onMouseLeave={() => setMegaOpenKey("")}
        />

        <NavbarMobileMenu
          isMobileMenuOpen={isMobileMenuOpen}
          navLinks={navLinks}
          cartCount={cartCount}
          isAuthenticated={isAuthenticated}
          user={user}
          isDeliveryUser={isDeliveryUser}
          dashboardPath={dashboardPath}
          onLogout={onLogout}
          closeMenu={() => setIsMobileMenuOpen(false)}
        />
      </div>
    </header>
  );
};

export default Navbar;
