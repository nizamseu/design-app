// src/store/slices/canvasSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

const initialState = {
  elements: [],
  selectedIds: [],
  zoom: 1,
  viewportOffset: { x: 0, y: 0 },
  tool: "select",
  history: {
    past: [],
    present: [],
    future: [],
  },
};

const canvasSlice = createSlice({
  name: "canvas",
  initialState,
  reducers: {
    addElement: (state, action) => {
      const newElement = { ...action.payload, id: nanoid() };
      state.history.past.push([...state.elements]);
      state.elements.push(newElement);
      state.history.future = [];
    },

    updateElement: (state, action) => {
      const index = state.elements.findIndex(
        (el) => el.id === action.payload.id
      );
      if (index !== -1) {
        state.history.past.push([...state.elements]);
        state.elements[index] = action.payload;
        state.history.future = [];
      }
    },

    deleteElements: (state, action) => {
      state.history.past.push([...state.elements]);
      state.elements = state.elements.filter(
        (el) => !action.payload.includes(el.id)
      );
      state.selectedIds = [];
      state.history.future = [];
    },

    setSelectedIds: (state, action) => {
      state.selectedIds = action.payload;
    },

    setZoom: (state, action) => {
      state.zoom = action.payload;
    },

    setViewportOffset: (state, action) => {
      state.viewportOffset = action.payload;
    },

    setTool: (state, action) => {
      state.tool = action.payload;
    },

    undo: (state) => {
      if (state.history.past.length > 0) {
        const previous = state.history.past[state.history.past.length - 1];
        state.history.future.unshift([...state.elements]);
        state.elements = previous;
        state.history.past.pop();
      }
    },

    redo: (state) => {
      if (state.history.future.length > 0) {
        const next = state.history.future[0];
        state.history.past.push([...state.elements]);
        state.elements = next;
        state.history.future.shift();
      }
    },
    reateGroup: (state, action) => {
      const { elementIds, name } = action.payload;
      const groupId = nanoid();

      // Create group element
      const groupElement = {
        id: groupId,
        type: "group",
        name: name || "Group",
        children: [],
        style: {
          visible: true,
          locked: false,
        },
      };

      // Update parent references for grouped elements
      state.elements.forEach((element) => {
        if (elementIds.includes(element.id)) {
          element.parentId = groupId;
        }
      });

      // Add group to elements
      state.elements.push(groupElement);
      state.selectedIds = [groupId];
    },

    ungroup: (state, action) => {
      const groupId = action.payload;
      const group = state.elements.find((el) => el.id === groupId);

      if (group && group.type === "group") {
        // Remove parent references
        state.elements.forEach((element) => {
          if (element.parentId === groupId) {
            delete element.parentId;
          }
        });

        // Remove group element
        state.elements = state.elements.filter((el) => el.id !== groupId);
      }
    },

    reorderElements: (state, action) => {
      const { sourceId, targetId } = action.payload;
      const sourceIndex = state.elements.findIndex((el) => el.id === sourceId);
      const targetIndex = state.elements.findIndex((el) => el.id === targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const [removed] = state.elements.splice(sourceIndex, 1);
        state.elements.splice(targetIndex, 0, removed);
      }
    },

    updateElementParent: (state, action) => {
      const { elementId, newParentId } = action.payload;
      const element = state.elements.find((el) => el.id === elementId);

      if (element) {
        element.parentId = newParentId;
      }
    },
  },
});

export const {
  addElement,
  updateElement,
  deleteElements,
  setSelectedIds,
  setZoom,
  setViewportOffset,
  setTool,
  undo,
  redo,
  createGroup,
  ungroup,
  reorderElements,
  updateElementParent,
} = canvasSlice.actions;

export default canvasSlice.reducer;
