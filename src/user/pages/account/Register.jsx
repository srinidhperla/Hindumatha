import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register } from "@/features/auth/authSlice";
import RegisterFormCard from "@/user/components/auth/RegisterFormCard";
import SeoMeta from "@/shared/seo/SeoMeta";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formError, setFormError] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;
    return strength;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (formError) {
      setFormError("");
    }
    const nextFormData = { ...formData, [name]: value };
    setFormData(nextFormData);

    if (name === "password") {
      setPasswordStrength(checkPasswordStrength(value));
    }

    if (
      nextFormData.confirmPassword &&
      nextFormData.password !== nextFormData.confirmPassword
    ) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      setFormError("Name, email, and phone number are required.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    dispatch(
      register({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password: formData.password,
      }),
    );
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-red-500";
    if (passwordStrength === 2) return "bg-yellow-500";
    if (passwordStrength === 3) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength === 2) return "Fair";
    if (passwordStrength === 3) return "Good";
    return "Strong";
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f1de_0%,#fff9ef_52%,#f2e6cc_100%)] py-8 sm:py-10">
      <SeoMeta
        title="Register | Hindumatha's Cake World"
        description="Create your Hindumatha's Cake World account to save addresses, place orders quickly, and receive order updates."
        path="/register"
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[1.75rem] border border-[rgba(201,168,76,0.35)] bg-[linear-gradient(145deg,#120c02_0%,#251a0a_50%,#38240f_100%)] p-6 text-white shadow-[0_16px_34px_rgba(18,12,2,0.28)] sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-caramel-300/90">
            Create Profile
          </p>
          <h1 className="mt-2 font-playfair text-3xl font-bold sm:text-4xl">
            Join Hindumatha's Cake World
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-cream-200/85 sm:text-base">
            Register once to order faster, save your delivery details, and
            receive updates for every celebration order.
          </p>
        </div>

        <RegisterFormCard
          formData={formData}
          showPassword={showPassword}
          passwordError={passwordError}
          passwordStrength={passwordStrength}
          loading={loading}
          error={formError || error}
          onChange={handleChange}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          onSubmit={handleSubmit}
          getStrengthColor={getStrengthColor}
          getStrengthText={getStrengthText}
        />
      </div>
    </div>
  );
};

export default Register;
