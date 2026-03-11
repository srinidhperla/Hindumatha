import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { register } from "../../features/auth/authSlice";
import RegisterBrandPanel from "../components/auth/RegisterBrandPanel";
import RegisterFormCard from "../components/auth/RegisterFormCard";

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
    <div className="auth-page">
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
      <RegisterBrandPanel />
    </div>
  );
};

export default Register;
