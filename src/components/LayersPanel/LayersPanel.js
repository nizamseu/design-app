// src/components/LayersPanel/LayersPanel.js
import { useSelector, useDispatch } from "react-redux";
import {
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/24/outline";

const LayersPanel = () => {
  const dispatch = useDispatch();
  const elements = useSelector((state) => state.canvas.elements);

  return (
    <div className="p-4">
      <div className="space-y-1">
        {elements.map((element) => (
          <div
            key={element.id}
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg group"
          >
            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
              {element.visible ? (
                <EyeIcon className="w-4 h-4" />
              ) : (
                <EyeSlashIcon className="w-4 h-4" />
              )}
            </button>

            <span className="flex-1 text-sm truncate">{element.type}</span>

            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded">
              {element.locked ? (
                <LockClosedIcon className="w-4 h-4" />
              ) : (
                <LockOpenIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}

        {elements.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No elements yet. Start creating!
          </div>
        )}
      </div>
    </div>
  );
};

export default LayersPanel;
