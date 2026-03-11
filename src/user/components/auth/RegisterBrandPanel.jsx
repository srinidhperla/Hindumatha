import React from "react";
import { FiCheck, FiGift, FiBell, FiHeart } from "react-icons/fi";

const RegisterBrandPanel = () => (
  <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
    {/* Decorative shapes */}
    <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-caramel-400/15 blur-3xl" />
    <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-berry-400/10 blur-3xl" />
    <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage-400/10 blur-3xl" />

    <div className="relative z-10 flex w-full flex-col items-center justify-center p-14 text-white">
      {/* Logo */}
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-caramel-400 to-caramel-500 shadow-warm">
        <span className="text-2xl font-bold text-white">H</span>
      </div>

      <h1 className="mb-3 text-center text-4xl font-bold leading-tight">
        Join Our Family!
      </h1>
      <p className="mb-12 max-w-sm text-center text-lg text-cream-200/80 leading-relaxed">
        Create an account to order custom cakes and enjoy exclusive member
        perks.
      </p>

      {/* Features */}
      <div className="w-full max-w-sm space-y-3">
        {[
          {
            icon: <FiCheck className="h-5 w-5" />,
            text: "Easy one-click online ordering",
            color: "from-caramel-400 to-caramel-500",
          },
          {
            icon: <FiGift className="h-5 w-5" />,
            text: "Exclusive member discounts",
            color: "from-berry-400 to-berry-500",
          },
          {
            icon: <FiBell className="h-5 w-5" />,
            text: "Real-time order updates",
            color: "from-sage-400 to-sage-500",
          },
          {
            icon: <FiHeart className="h-5 w-5" />,
            text: "Save favourite flavours",
            color: "from-primary-400 to-primary-500",
          },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 border border-white/10 backdrop-blur-sm"
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${item.color} shadow-md`}
            >
              {item.icon}
            </div>
            <span className="text-sm font-medium text-cream-100">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default RegisterBrandPanel;
