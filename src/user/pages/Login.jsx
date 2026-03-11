import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { googleLogin, login } from "../../features/auth/authSlice";
import LoginBrandPanel from "../components/auth/LoginBrandPanel";
import LoginFormCard from "../components/auth/LoginFormCard";

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
    <div className="auth-page">
      <LoginBrandPanel />
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
  );
};

export default Login;
