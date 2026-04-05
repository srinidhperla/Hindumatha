import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiKey, FiMail, FiShield } from "react-icons/fi";

const ForgotPasswordFormCard = ({
  email,
  loading,
  error,
  successMessage,
  onChange,
  onSubmit,
}) => (
  <div className="mx-auto w-full max-w-7xl">
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-gold-200/70 bg-[linear-gradient(165deg,rgba(255,255,255,0.96),rgba(249,241,224,0.92))] p-6 shadow-[0_24px_60px_rgba(18,12,2,0.14)] backdrop-blur-md sm:p-8">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-200/80 bg-gold-50/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-700">
          <FiShield className="h-3.5 w-3.5" />
          Password Help
        </div>
        <h2 className="font-playfair text-4xl font-bold tracking-tight text-primary-900">
          Reset your password
        </h2>
        <p className="mt-3 text-sm text-primary-600">
          Enter the email linked to your account and we&apos;ll send a secure reset link.
        </p>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Check your email</p>
              <p className="mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
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
                value={email}
                onChange={onChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-primary-200 bg-white py-3.5 pl-12 pr-4 text-primary-800 placeholder-primary-400 transition-all duration-200 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-berry-200 bg-berry-50 px-4 py-3 text-sm text-berry-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#7a5c0f] to-[#c9a84c] py-3.5 font-semibold text-white shadow-[0_12px_28px_rgba(122,92,15,0.28)] transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_16px_34px_rgba(122,92,15,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending link..." : "Send reset link"}
            {!loading && <FiArrowRight className="h-5 w-5" />}
          </button>
        </form>
      )}

      <div className="mt-6 grid gap-3 rounded-2xl border border-gold-100 bg-white/80 p-4 text-sm text-primary-600">
        <div className="flex items-start gap-3">
          <FiKey className="mt-0.5 h-4 w-4 shrink-0 text-caramel-600" />
          <p>Reset links expire in 60 minutes and can be used only once.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          to="/login"
          className="font-medium text-primary-500 transition-colors hover:text-primary-800"
        >
          Back to login
        </Link>
        <Link
          to="/register"
          className="font-semibold text-caramel-600 underline underline-offset-4 hover:text-caramel-700"
        >
          Need an account?
        </Link>
      </div>
    </div>
  </div>
);

export default ForgotPasswordFormCard;
