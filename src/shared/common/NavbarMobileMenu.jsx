import React from "react";
import { Link } from "react-router-dom";
import { FiHome } from "react-icons/fi";

const NavbarMobileMenu = ({
  isMobileMenuOpen,
  navLinks,
  cartCount,
  isAuthenticated,
  user,
  isDeliveryUser,
  dashboardPath,
  onLogout,
  closeMenu,
}) => (
  <div
    className={`overflow-hidden border-t border-[rgba(201,168,76,0.2)] bg-white/95 backdrop-blur-xl transition-all duration-300 lg:hidden ${
      isMobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
    }`}
  >
    <div className="space-y-1 px-4 py-4">
      {isDeliveryUser ? (
        <div className="mb-2 grid grid-cols-2 gap-2 rounded-xl border border-[rgba(201,168,76,0.25)] bg-[#f8f1dd] p-2">
          <Link
            to={dashboardPath || "/delivery"}
            onClick={closeMenu}
            className="flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={closeMenu}
            className="flex items-center justify-center rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
          >
            Profile
          </Link>
        </div>
      ) : (
        <div className="mb-2 grid grid-cols-3 gap-2 rounded-xl border border-[rgba(201,168,76,0.25)] bg-[#f8f1dd] p-2">
          <Link
            to="/"
            onClick={closeMenu}
            className="flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
          >
            <FiHome className="h-3.5 w-3.5" /> Home
          </Link>
          <Link
            to="/menu"
            onClick={closeMenu}
            className="flex items-center justify-center rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
          >
            Order
          </Link>
          <Link
            to="/cart"
            onClick={closeMenu}
            className="flex items-center justify-center rounded-lg bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a5c0f]"
          >
            Cart ({cartCount})
          </Link>
        </div>
      )}

      {!isDeliveryUser &&
        navLinks.map((link) => (
        <Link
          key={link.label}
          to={link.path}
          onClick={closeMenu}
          className="block rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6a4c16] hover:bg-[#f9f4e8]"
        >
          {link.label}
        </Link>
        ))}
      {isAuthenticated ? (
        <>
          <Link
            to="/profile"
            onClick={closeMenu}
            className="block rounded-xl px-3 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#6a4c16] hover:bg-[#f9f4e8]"
          >
            Profile
          </Link>
          {dashboardPath && (
            <Link
              to={dashboardPath}
              onClick={closeMenu}
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
            onClick={closeMenu}
            className="rounded-full border border-[rgba(201,168,76,0.35)] px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] text-[#8b6914]"
          >
            Login
          </Link>
          <Link
            to="/register"
            onClick={closeMenu}
            className="rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-3 py-2 text-center text-sm font-semibold uppercase tracking-[0.1em] text-white"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  </div>
);

export default NavbarMobileMenu;
