import React from "react";
import { Link } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";

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
  <div className="flex flex-1 items-center justify-center overflow-y-auto bg-gradient-to-br from-cream-50 to-cream-100 p-6 sm:p-10">
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <div className="mb-8 flex justify-center lg:hidden">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-md">
            <span className="text-white font-bold text-lg">H</span>
          </div>
          <span className="text-xl font-bold text-primary-800">
            Hindumatha's
          </span>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary-800">
          Welcome back
        </h2>
        <p className="mt-2 text-primary-500">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 py-3.5 font-semibold text-white shadow-warm transition-all hover:shadow-warm-lg hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <FiArrowRight className="h-5 w-5" />}
        </button>

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
      </form>
    </div>
  </div>
);

export default LoginFormCard;
