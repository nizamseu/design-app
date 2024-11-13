// src/store/slices/activitySlice.js
import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  activities: [
    {
      id: nanoid(),
      name: "Homepage",
      status: "active",
      lastEdited: new Date().toISOString(),
      steps: [
        {
          id: nanoid(),
          title: "Setup layout",
          description: "Create main layout structure",
          completed: true,
        },
        {
          id: nanoid(),
          title: "Add header",
          description: "Design and implement header section",
          completed: true,
        },
        {
          id: nanoid(),
          title: "Add hero section",
          description: "Create compelling hero section",
          completed: false,
        },
      ],
    },
  ],
  currentActivityId: null,
  currentStepIndex: 0,
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    createActivity: (state, action) => {
      const newActivity = {
        id: nanoid(),
        name: action.payload.name,
        status: "active",
        lastEdited: new Date().toISOString(),
        steps: [],
      };
      state.activities.push(newActivity);
      state.currentActivityId = newActivity.id;
    },

    setCurrentActivity: (state, action) => {
      state.currentActivityId = action.payload;
      state.currentStepIndex = 0;
    },

    updateActivity: (state, action) => {
      const { id, updates } = action.payload;
      const activity = state.activities.find((a) => a.id === id);
      if (activity) {
        Object.assign(activity, updates);
        activity.lastEdited = new Date().toISOString();
      }
    },

    addStep: (state, action) => {
      const { activityId, step } = action.payload;
      const activity = state.activities.find((a) => a.id === activityId);
      if (activity) {
        activity.steps.push({
          id: nanoid(),
          ...step,
          completed: false,
        });
      }
    },

    completeStep: (state, action) => {
      const { activityId, stepId } = action.payload;
      const activity = state.activities.find((a) => a.id === activityId);
      if (activity) {
        const step = activity.steps.find((s) => s.id === stepId);
        if (step) {
          step.completed = true;
        }
      }
    },

    nextStep: (state) => {
      const activity = state.activities.find(
        (a) => a.id === state.currentActivityId
      );
      if (activity && state.currentStepIndex < activity.steps.length - 1) {
        state.currentStepIndex += 1;
      }
    },

    previousStep: (state) => {
      if (state.currentStepIndex > 0) {
        state.currentStepIndex -= 1;
      }
    },
  },
});

export const {
  createActivity,
  setCurrentActivity,
  updateActivity,
  addStep,
  completeStep,
  nextStep,
  previousStep,
} = activitySlice.actions;

export default activitySlice.reducer;
