import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { clearPasswordResetState, resetPassword } from "@/features/auth/authSlice";
import ResetPasswordFormCard from "@/user/components/auth/ResetPasswordFormCard";
import SeoMeta from "@/shared/seo/SeoMeta";

const ResetPassword = () => {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { passwordResetLoading, passwordResetMessage, passwordResetError } =
    useSelector((state) => state.auth);

  useEffect(() => {
    if (!passwordResetMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/login");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, passwordResetMessage]);

  useEffect(() => {
    return () => {
      dispatch(clearPasswordResetState());
    };
  }, [dispatch]);

  const invalidToken = useMemo(() => !String(token).trim(), [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextData = { ...formData, [name]: value };
    setFormData(nextData);

    if (
      nextData.confirmPassword &&
      nextData.password !== nextData.confirmPassword
    ) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (invalidToken) {
      setPasswordError("This password reset link is invalid.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    dispatch(
      resetPassword({
        token,
        password: formData.password,
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f1de_0%,#fff9ef_52%,#f2e6cc_100%)] py-8 sm:py-10">
      <SeoMeta
        title="Reset Password | Hindumatha's Cake World"
        description="Choose a new password for your Hindumatha's Cake World account."
        path="/reset-password"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.75rem] border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(145deg,#120c02_0%,#251a0a_50%,#38240f_100%)] p-6 text-white shadow-[0_16px_34px_rgba(18,12,2,0.28)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel-300/90">
            Reset Password
          </p>
          <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
            Set a fresh password
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cream-200/85 sm:text-base">
            Choose a password you&apos;ll remember easily and keep your account secure.
          </p>
        </div>

        <ResetPasswordFormCard
          formData={formData}
          showPassword={showPassword}
          loading={passwordResetLoading}
          error={
            invalidToken
              ? "This password reset link is invalid."
              : passwordResetError
          }
          successMessage={passwordResetMessage}
          passwordError={passwordError}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />
      </div>
    </div>
  );
};

export default ResetPassword;
