// src/hooks/useKeyboardShortcuts.js
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  undo,
  redo,
  deleteElements,
  setTool,
} from "@/store/slices/canvasSlice";

export const useKeyboardShortcuts = (selectedIds) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command/Control + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(undo());
      }

      // Command/Control + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        dispatch(redo());
      }

      // Delete or Backspace to remove selected elements
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          dispatch(deleteElements(selectedIds));
        }
      }

      // V for select tool
      if (e.key === "v") {
        dispatch(setTool("select"));
      }

      // R for rectangle tool
      if (e.key === "r") {
        dispatch(setTool("rectangle"));
      }

      // C for circle tool
      if (e.key === "c") {
        dispatch(setTool("circle"));
      }

      // T for text tool
      if (e.key === "t") {
        dispatch(setTool("text"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch, selectedIds]);
};
