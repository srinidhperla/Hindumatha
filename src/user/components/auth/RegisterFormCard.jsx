import React from "react";
import { Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiStar,
} from "react-icons/fi";

const RegisterFormCard = ({
  formData,
  showPassword,
  passwordError,
  passwordStrength,
  loading,
  error,
  onChange,
  onTogglePassword,
  onSubmit,
  getStrengthColor,
  getStrengthText,
}) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-gold-200/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(18,12,2,0.14)] backdrop-blur-md sm:p-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-gold-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
          <FiStar className="h-3.5 w-3.5" />
          New Account
        </div>
        <h2 className="font-playfair text-4xl font-bold text-primary-800">
          Create Account
        </h2>
        <p className="mt-2 text-sm text-primary-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-caramel-600 underline underline-offset-4 hover:text-caramel-700"
          >
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-primary-700"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <FiUser className="h-4 w-4 text-primary-400" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={onChange}
              placeholder="John Doe"
              className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-10 pr-4 text-sm text-primary-800 placeholder-primary-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-primary-700"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <FiMail className="h-4 w-4 text-primary-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={onChange}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-10 pr-4 text-sm text-primary-800 placeholder-primary-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-primary-700"
          >
            Phone Number
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <FiPhone className="h-4 w-4 text-primary-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={onChange}
              placeholder="94965XXXXX"
              className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-10 pr-4 text-sm text-primary-800 placeholder-primary-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-primary-700"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <FiLock className="h-4 w-4 text-primary-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={onChange}
              placeholder="Create a strong password"
              className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-10 pr-11 text-sm text-primary-800 placeholder-primary-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-primary-400 hover:text-primary-600"
            >
              {showPassword ? (
                <FiEyeOff className="h-4 w-4" />
              ) : (
                <FiEye className="h-4 w-4" />
              )}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs text-primary-500">
                  Password strength
                </span>
                <span className="text-xs font-medium text-primary-700">
                  {getStrengthText()}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-200">
                <div
                  className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                  style={{ width: `${(passwordStrength / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-primary-700"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <FiLock className="h-4 w-4 text-primary-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={formData.confirmPassword}
              onChange={onChange}
              placeholder="Repeat your password"
              className="w-full rounded-xl border border-primary-200 bg-white py-3 pl-10 pr-4 text-sm text-primary-800 placeholder-primary-400 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {passwordError && (
            <p className="mt-1 text-xs text-berry-600">{passwordError}</p>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-berry-200 bg-berry-50 px-4 py-3 text-sm text-berry-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || Boolean(passwordError)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 text-sm font-semibold text-white shadow-warm transition-all hover:-translate-y-0.5 hover:shadow-warm-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
          <FiArrowRight className="h-4 w-4" />
        </button>

        <p className="pt-1 text-center text-xs text-primary-400">
          Takes less than a minute. Start ordering with your saved details.
        </p>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/"
          className="text-sm text-primary-400 hover:text-primary-700 transition-colors"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  </div>
);

export default RegisterFormCard;
