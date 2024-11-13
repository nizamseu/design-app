// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import canvasReducer from "./slices/canvasSlice";
import activityReducer from "./slices/activitySlice";

export const store = configureStore({
  reducer: {
    canvas: canvasReducer,
    activity: activityReducer,
  },
});
