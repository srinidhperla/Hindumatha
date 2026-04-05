import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  forgotPasswordRequest,
  resetPasswordRequest,
  googleLoginUser,
  getProfileData,
  updateProfileData,
} from "@/services/authAPI";

const readStoredToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

const readStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser =
    localStorage.getItem("authUser") || sessionStorage.getItem("authUser");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const persistToken = (token) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem("token", token);
  sessionStorage.removeItem("token");
};

const persistUser = (user) => {
  if (typeof window === "undefined") {
    return;
  }

  const serializedUser = JSON.stringify(user || null);
  localStorage.setItem("authUser", serializedUser);
  sessionStorage.removeItem("authUser");
};

const clearStoredToken = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("authUser");
};

const normalizeStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  const localToken = localStorage.getItem("token");
  const sessionToken = sessionStorage.getItem("token");
  const localUser = localStorage.getItem("authUser");
  const sessionUser = sessionStorage.getItem("authUser");

  if (!localToken && sessionToken) {
    localStorage.setItem("token", sessionToken);
  }

  if (!localUser && sessionUser) {
    localStorage.setItem("authUser", sessionUser);
  }

  if (sessionToken || sessionUser) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("authUser");
  }
};

// Async thunks
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerUser(userData);
      persistToken(data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Registration failed" },
      );
    }
  },
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const data = await loginUser(credentials);
      persistToken(data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Login failed" },
      );
    }
  },
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (googleToken, { rejectWithValue }) => {
    try {
      const data = await googleLoginUser(googleToken);
      persistToken(data.token);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Google login failed" },
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (payload, { rejectWithValue }) => {
    try {
      return await forgotPasswordRequest(payload);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to send reset email" },
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const data = await resetPasswordRequest(payload);
      if (data?.token) {
        persistToken(data.token);
      }
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to reset password" },
      );
    }
  },
);

export const getProfile = createAsyncThunk(
  "auth/getProfile",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfileData();
    } catch (error) {
      return rejectWithValue(
        error.response?.data
          ? {
              ...error.response.data,
              statusCode: error.response.status,
            }
          : { message: "Failed to get profile", statusCode: 0 },
      );
    }
  },
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      return await updateProfileData(profileData);
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Failed to update profile" },
      );
    }
  },
);

normalizeStoredAuth();
const storedToken = readStoredToken();
const storedUser = readStoredUser();

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && storedUser),
  loading: false,
  error: null,
  passwordResetRequestLoading: false,
  passwordResetRequestMessage: "",
  passwordResetRequestError: null,
  passwordResetLoading: false,
  passwordResetMessage: "",
  passwordResetError: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      clearStoredToken();
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordResetState: (state) => {
      state.passwordResetRequestLoading = false;
      state.passwordResetRequestMessage = "";
      state.passwordResetRequestError = null;
      state.passwordResetLoading = false;
      state.passwordResetMessage = "";
      state.passwordResetError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistUser(action.payload.user);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistUser(action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Login failed";
      })
      .addCase(forgotPassword.pending, (state) => {
        state.passwordResetRequestLoading = true;
        state.passwordResetRequestMessage = "";
        state.passwordResetRequestError = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.passwordResetRequestLoading = false;
        state.passwordResetRequestMessage =
          action.payload?.message || "Reset email sent";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.passwordResetRequestLoading = false;
        state.passwordResetRequestError =
          action.payload?.message || "Failed to send reset email";
      })
      .addCase(resetPassword.pending, (state) => {
        state.passwordResetLoading = true;
        state.passwordResetMessage = "";
        state.passwordResetError = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetMessage =
          action.payload?.message || "Password reset successful";
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistUser(action.payload.user);
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.passwordResetLoading = false;
        state.passwordResetError =
          action.payload?.message || "Failed to reset password";
      })
      .addCase(googleLogin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        persistUser(action.payload.user);
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Google login failed";
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        persistUser(action.payload);
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to get profile";
        const statusCode = Number(action.payload?.statusCode || 0);

        if (statusCode === 401 || statusCode === 403) {
          clearStoredToken();
          state.token = null;
          state.isAuthenticated = false;
          state.user = null;
          return;
        }

        // Keep current session data for transient network/server issues.
        state.isAuthenticated = Boolean(state.token && state.user);
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        persistUser(action.payload);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to update profile";
      });
  },
});

export const { logout, clearError, clearPasswordResetState } =
  authSlice.actions;
export default authSlice.reducer;
