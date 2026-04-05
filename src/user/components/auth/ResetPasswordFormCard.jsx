import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiShield,
} from "react-icons/fi";

const ResetPasswordFormCard = ({
  formData,
  showPassword,
  loading,
  error,
  successMessage,
  passwordError,
  onChange,
  onSubmit,
  onTogglePassword,
}) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-gold-200/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(18,12,2,0.14)] backdrop-blur-md sm:p-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-gold-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
          <FiShield className="h-3.5 w-3.5" />
          Secure Reset
        </div>
        <h2 className="font-playfair text-4xl font-bold text-primary-800">
          Create a new password
        </h2>
        <p className="mt-2 text-sm text-primary-500">
          Choose a strong password so your account stays protected.
        </p>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Password updated</p>
              <p className="mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-primary-700"
            >
              New password
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
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-primary-700"
            >
              Confirm new password
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
                placeholder="Repeat your new password"
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
            {loading ? "Updating password..." : "Update password"}
            {!loading && <FiArrowRight className="h-4 w-4" />}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-primary-400 transition-colors hover:text-primary-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  </div>
);

export default ResetPasswordFormCard;
