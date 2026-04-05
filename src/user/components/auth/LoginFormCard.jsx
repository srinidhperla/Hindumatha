import React from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiUserPlus,
  FiStar,
} from "react-icons/fi";

const LoginFormCard = ({
  formData,
  showPassword,
  loading,
  error,
  googleEnabled,
  googleButtonRef,
  onChange,
  onSubmit,
  onTogglePassword,
}) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-gold-200/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(249,241,224,0.92))] p-6 shadow-[0_24px_60px_rgba(18,12,2,0.14)] backdrop-blur-md sm:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-gold-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
          <FiStar className="h-3.5 w-3.5" />
          Member Login
        </div>
        <h2 className="font-playfair text-4xl font-bold tracking-tight text-primary-900">
          Welcome back
        </h2>
        <p className="mt-3 text-primary-600">
          New here?{" "}
          <Link
            to="/register"
            className="font-semibold text-caramel-600 hover:text-caramel-700 hover:underline underline-offset-4 transition-all"
          >
            Create an account
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-primary-700"
          >
            Email address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-primary-400">
              <FiMail className="h-5 w-5" />
            </span>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={onChange}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-primary-200 bg-white py-3.5 pl-12 pr-4 text-primary-800 placeholder-primary-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-primary-700"
          >
            Password
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-primary-400">
              <FiLock className="h-5 w-5" />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={onChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-primary-200 bg-white py-3.5 pl-12 pr-12 text-primary-800 placeholder-primary-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-primary-400 hover:text-primary-600 transition-colors"
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-caramel-600 transition-colors hover:text-caramel-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-berry-200 bg-berry-50 px-4 py-3 text-sm text-berry-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] py-3.5 font-semibold text-white shadow-[0_12px_28px_rgba(122,92,15,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_16px_34px_rgba(122,92,15,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <FiArrowRight className="h-5 w-5" />}
        </button>

        <Link
          to="/register"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gold-200 bg-white/90 py-3.5 font-semibold text-[#7a5c0f] transition-all hover:-translate-y-0.5 hover:border-[#c9a84c] hover:bg-[#fff7e8]"
        >
          <FiUserPlus className="h-5 w-5" />
          Sign up
        </Link>

        {/* Google login */}
        {googleEnabled && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-cream-50 px-3 font-medium text-primary-400 tracking-wider">
                  or continue with
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <div
                ref={googleButtonRef}
                className="w-full overflow-hidden rounded-xl border border-primary-200 bg-white"
              />
            </div>
          </>
        )}

        {!googleEnabled && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-cream-50 px-3 font-medium text-primary-400 tracking-wider">
                Hindumatha's Cake World
              </span>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-primary-400">
          Secure login with modern encryption and privacy-first protection.
        </p>
      </form>
    </div>
  </div>
);

export default LoginFormCard;
