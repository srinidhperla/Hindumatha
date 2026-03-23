import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { googleLogin, login } from "@/features/auth/authSlice";
import LoginFormCard from "@/user/components/auth/LoginFormCard";
import SeoMeta from "@/shared/seo/SeoMeta";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const googleButtonRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated, user } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate(user?.role === "admin" ? "/admin" : "/");
    }
  }, [isAuthenticated, navigate, user]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    const initializeGoogleButton = () => {
      if (
        cancelled ||
        !window.google?.accounts?.id ||
        !googleButtonRef.current
      ) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response?.credential) {
            return;
          }
          dispatch(googleLogin(response.credential));
        },
      });

      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "signin_with",
        width: 320,
      });
    };

    if (window.google?.accounts?.id) {
      initializeGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    const scriptId = "google-identity-services";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", initializeGoogleButton);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", initializeGoogleButton);
    };
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f1de_0%,#fff9ef_52%,#f2e6cc_100%)] py-8 sm:py-10">
      <SeoMeta
        title="Login | Hindumatha's Cake World"
        description="Sign in to your Hindumatha's Cake World account to track orders, manage delivery addresses, and checkout faster."
        path="/login"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.75rem] border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(145deg,#120c02_0%,#251a0a_50%,#38240f_100%)] p-6 text-white shadow-[0_16px_34px_rgba(18,12,2,0.28)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel-300/90">
            Account Access
          </p>
          <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
            Welcome Back to Hindumatha's
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cream-200/85 sm:text-base">
            Sign in to track orders, manage saved addresses, and place your next
            custom cake request quickly.
          </p>
        </div>

        <LoginFormCard
          formData={formData}
          showPassword={showPassword}
          loading={loading}
          error={error}
          googleEnabled={Boolean(GOOGLE_CLIENT_ID)}
          googleButtonRef={googleButtonRef}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
        />
      </div>
    </div>
  );
};

export default Login;
