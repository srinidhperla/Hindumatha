import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearPasswordResetState, forgotPassword } from "@/features/auth/authSlice";
import ForgotPasswordFormCard from "@/user/components/auth/ForgotPasswordFormCard";
import SeoMeta from "@/shared/seo/SeoMeta";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const {
    passwordResetRequestLoading,
    passwordResetRequestMessage,
    passwordResetRequestError,
  } = useSelector((state) => state.auth);

  useEffect(() => {
    return () => {
      dispatch(clearPasswordResetState());
    };
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(
      forgotPassword({
        email: email.trim().toLowerCase(),
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f1de_0%,#fff9ef_52%,#f2e6cc_100%)] py-8 sm:py-10">
      <SeoMeta
        title="Forgot Password | Hindumatha's Cake World"
        description="Reset your Hindumatha's Cake World account password securely."
        path="/forgot-password"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.75rem] border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(145deg,#120c02_0%,#251a0a_50%,#38240f_100%)] p-6 text-white shadow-[0_16px_34px_rgba(18,12,2,0.28)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel-300/90">
            Account Recovery
          </p>
          <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
            Let&apos;s get you back in
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cream-200/85 sm:text-base">
            We&apos;ll email you a secure reset link so you can get back to orders quickly.
          </p>
        </div>

        <ForgotPasswordFormCard
          email={email}
          loading={passwordResetRequestLoading}
          error={passwordResetRequestError}
          successMessage={passwordResetRequestMessage}
          onChange={(event) => setEmail(event.target.value)}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
