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
  <div className="flex min-h-full w-full flex-1 flex-col justify-center bg-gradient-to-br from-cream-50 to-cream-100 px-6 py-10 lg:px-12">
    {/* Mobile logo */}
    <div className="mb-8 flex justify-center lg:hidden">
      <Link to="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
          <span className="text-lg font-bold text-white">H</span>
        </div>
        <span className="text-xl font-bold text-primary-800">Hindumatha's</span>
      </Link>
    </div>

    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-primary-800">Create Account</h2>
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
              placeholder="+91 98765 43210"
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 text-sm font-semibold text-white shadow-warm transition-all hover:shadow-warm-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
          <FiArrowRight className="h-4 w-4" />
        </button>
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
