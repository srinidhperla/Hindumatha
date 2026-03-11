import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    toast: null,
  },
  reducers: {
    showToast: (state, action) => {
      state.toast = {
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || "success",
      };
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const { showToast, hideToast } = uiSlice.actions;
export default uiSlice.reducer;
