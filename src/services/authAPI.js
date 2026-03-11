import apiClient from "./apiClient";

export const registerUser = (userData) =>
  apiClient.post("/auth/register", userData).then((res) => res.data);

export const loginUser = (credentials) =>
  apiClient.post("/auth/login", credentials).then((res) => res.data);

export const googleLoginUser = (token) =>
  apiClient.post("/auth/google-login", { token }).then((res) => res.data);

export const getProfileData = () =>
  apiClient.get("/auth/profile").then((res) => res.data);

export const updateProfileData = (profileData) =>
  apiClient.put("/auth/profile", profileData).then((res) => res.data);
