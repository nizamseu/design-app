// src/components/ActivityPanel/ActivityPanel.js
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  FolderIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import {
  setSelectedIds,
  updateElement,
  reorderElements,
} from "@/store/slices/canvasSlice";

const ActivityPanel = () => {
  const dispatch = useDispatch();
  const { elements, selectedIds } = useSelector((state) => state.canvas);
  const [collapsedGroups, setCollapsedGroups] = useState([]);

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleVisibilityToggle = (elementId) => {
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      dispatch(
        updateElement({
          ...element,
          style: {
            ...element.style,
            visible: !element.style.visible,
          },
        })
      );
    }
  };

  const handleLockToggle = (elementId) => {
    const element = elements.find((el) => el.id === elementId);
    if (element) {
      dispatch(
        updateElement({
          ...element,
          style: {
            ...element.style,
            locked: !element.style.locked,
          },
        })
      );
    }
  };

  const handleDragStart = (e, elementId) => {
    e.dataTransfer.setData("text/plain", elementId);
  };

  const handleDrop = (e, targetId) => {
    const sourceId = e.dataTransfer.getData("text/plain");
    if (sourceId !== targetId) {
      // Reorder elements logic
      dispatch(reorderElements({ sourceId, targetId }));
    }
  };

  const renderLayer = (element, level = 0) => {
    const isGroup = element.type === "group";
    const isCollapsed = collapsedGroups.includes(element.id);
    const hasChildren = element.children && element.children.length > 0;
    const isSelected = selectedIds.includes(element.id);

    return (
      <div key={element.id} className="select-none">
        <div
          className={`flex items-center px-2 py-1 hover:bg-gray-100 ${
            isSelected ? "bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          draggable
          onDragStart={(e) => handleDragStart(e, element.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, element.id)}
          onClick={() => dispatch(setSelectedIds([element.id]))}
        >
          <button
            className={`w-4 h-4 mr-1 ${!hasChildren ? "invisible" : ""}`}
            onClick={() => toggleGroup(element.id)}
          >
            {hasChildren &&
              (isCollapsed ? (
                <ChevronRightIcon className="w-4 h-4" />
              ) : (
                <ChevronDownIcon className="w-4 h-4" />
              ))}
          </button>

          {isGroup ? (
            <FolderIcon className="w-4 h-4 mr-2" />
          ) : (
            <DocumentIcon className="w-4 h-4 mr-2" />
          )}

          <span className="flex-1 truncate text-sm">
            {element.name || element.type}
          </span>

          <button
            className="w-6 h-6 hover:bg-gray-200 rounded p-1"
            onClick={() => handleVisibilityToggle(element.id)}
          >
            {element.style?.visible !== false ? (
              <EyeIcon className="w-4 h-4" />
            ) : (
              <EyeSlashIcon className="w-4 h-4" />
            )}
          </button>

          <button
            className="w-6 h-6 hover:bg-gray-200 rounded p-1"
            onClick={() => handleLockToggle(element.id)}
          >
            {element.style?.locked ? (
              <LockClosedIcon className="w-4 h-4" />
            ) : (
              <LockOpenIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="layers-children">
            {element.children.map((child) => renderLayer(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Group elements by their parent relationships
  const groupedElements = elements.reduce((acc, element) => {
    if (!element.parentId) {
      acc.push({
        ...element,
        children: elements.filter((el) => el.parentId === element.id),
      });
    }
    return acc;
  }, []);

  return (
    <div className="absolute left-4 bottom-4 w-64 bg-white rounded-lg shadow-lg">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium">Layers</h3>
        <div className="flex space-x-1">
          <button className="p-1 hover:bg-gray-100 rounded">
            <ChevronDownIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {groupedElements.map((element) => renderLayer(element))}
      </div>

      <div className="p-2 border-t flex justify-between">
        <button
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => {
            dispatch(
              addElement({
                type: "group",
                name: "New Group",
                children: selectedIds.map((id) =>
                  elements.find((el) => el.id === id)
                ),
              })
            );
          }}
        >
          Create Group
        </button>
        <button
          className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
          onClick={() => dispatch(setSelectedIds([]))}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};

export default ActivityPanel;
