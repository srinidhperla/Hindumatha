import React from "react";
import { FiUsers, FiHeart, FiTruck, FiStar } from "react-icons/fi";

const LoginBrandPanel = () => (
  <div className="relative hidden overflow-hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
    {/* Decorative gradient overlays */}
    <div className="absolute inset-0 bg-gradient-to-br from-caramel-500/10 via-transparent to-berry-500/10" />
    <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-caramel-400/10 blur-3xl" />
    <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-berry-400/10 blur-3xl" />

    <div className="relative z-10 flex w-full flex-col items-center justify-center p-14 text-white">
      {/* Logo */}
      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-caramel-400 to-caramel-500 shadow-warm">
        <span className="text-white font-bold text-3xl">H</span>
      </div>

      <h1 className="mb-3 text-center text-4xl font-bold leading-tight tracking-tight">
        Welcome Back
      </h1>
      <p className="mb-12 max-w-sm text-center text-lg text-cream-200/80 leading-relaxed">
        Sign in to order custom cakes, track your orders and manage your
        account.
      </p>

      {/* Stats */}
      <div className="mb-10 flex w-full max-w-sm items-center justify-between">
        {[
          {
            icon: FiUsers,
            value: "5,000+",
            label: "Customers",
            color: "from-caramel-400 to-caramel-500",
          },
          {
            icon: FiStar,
            value: "100+",
            label: "Varieties",
            color: "from-sage-400 to-sage-500",
          },
          {
            icon: FiStar,
            value: "4.9★",
            label: "Rating",
            color: "from-berry-400 to-berry-500",
          },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-md`}
            >
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs text-cream-300/60">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="w-full max-w-sm space-y-3">
        {[
          { icon: FiTruck, text: "Fast delivery within 4 km radius" },
          { icon: FiHeart, text: "Custom cakes for every occasion" },
          { icon: FiStar, text: "Fresh baked, made to order" },
        ].map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-5 py-4 backdrop-blur-sm"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-caramel-500/20">
              <item.icon className="w-4 h-4 text-caramel-300" />
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

export default LoginBrandPanel;
