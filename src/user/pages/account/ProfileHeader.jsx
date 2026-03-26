import React from "react";
import { Link } from "react-router-dom";

const ProfileHeader = ({ user }) => {
  const isDeliveryUser = user?.role === "delivery";
  const isAdminUser = user?.role === "admin";
  const title = isDeliveryUser
    ? "Delivery Profile"
    : isAdminUser
      ? "Admin Profile"
      : "My Profile";

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(150deg,#120c02_0%,#1f1408_42%,#33210f_100%)] p-6 text-white shadow-[0_16px_32px_rgba(18,12,2,0.28)] sm:p-10">
      <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-[#c9a84c33] blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#e8d08a1f] blur-3xl" />
      <div className="relative z-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#c9a84c66] bg-[#f4dfac1f] text-2xl font-black text-[#f4dfac] shadow-lg backdrop-blur-sm sm:h-20 sm:w-20 sm:text-3xl">
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#e8d08a]">
            {title}
          </p>
          <h1 className="font-playfair truncate text-2xl font-black sm:text-3xl">
            {user?.name || "Your Profile"}
          </h1>
          <p className="mt-1 text-sm text-[#f4dfacbf]">{user?.email || ""}</p>
        </div>
        <div className="flex self-start gap-2 sm:self-center sm:gap-3">
          {isDeliveryUser ? (
            <Link
              to="/delivery"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
            >
              Delivery Dashboard
            </Link>
          ) : isAdminUser ? (
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
            >
              Admin Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/orders"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a84c66] bg-[#f4dfac1a] px-4 py-2 text-sm font-medium text-[#f4dfac] backdrop-blur-sm transition-all hover:bg-[#f4dfac2b] active:scale-95"
              >
                My Orders
              </Link>
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:brightness-110 active:scale-95"
              >
                Go to Cart
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
