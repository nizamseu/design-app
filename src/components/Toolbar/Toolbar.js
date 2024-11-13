// src/components/Toolbar/Toolbar.js
import { useDispatch, useSelector } from "react-redux";
import { setTool } from "@/store/slices/canvasSlice";
import {
  CursorArrowRaysIcon,
  Square2StackIcon,
  CircleStackIcon,
  PencilIcon,
  PhotoIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  StarIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  SwatchIcon,
  DocumentDuplicateIcon,
  CodeBracketIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

const Toolbar = () => {
  const dispatch = useDispatch();
  const { tool } = useSelector((state) => state.canvas);

  const toolGroups = [
    {
      title: "Basic",
      tools: [
        { id: "select", icon: CursorArrowRaysIcon, title: "Select (V)" },
        { id: "hand", icon: ArrowsRightLeftIcon, title: "Hand Tool (H)" },
      ],
    },
    {
      title: "Shapes",
      tools: [
        { id: "rectangle", icon: Square2StackIcon, title: "Rectangle (R)" },
        { id: "circle", icon: CircleStackIcon, title: "Circle (O)" },
        { id: "line", icon: ArrowsRightLeftIcon, title: "Line (L)" },
        { id: "arrow", icon: ArrowsRightLeftIcon, title: "Arrow (A)" },
        { id: "triangle", icon: CubeIcon, title: "Triangle (T)" },
        { id: "star", icon: StarIcon, title: "Star (S)" },
        { id: "polygon", icon: Squares2X2Icon, title: "Polygon (P)" },
      ],
    },
    {
      title: "Content",
      tools: [
        { id: "text", icon: PencilIcon, title: "Text (T)" },
        { id: "image", icon: PhotoIcon, title: "Image (I)" },
        { id: "comment", icon: ChatBubbleLeftIcon, title: "Comment (C)" },
      ],
    },
    {
      title: "Drawing",
      tools: [
        { id: "pen", icon: PencilIcon, title: "Pen (P)" },
        { id: "pencil", icon: PencilIcon, title: "Pencil (B)" },
        { id: "brush", icon: SwatchIcon, title: "Brush (B)" },
      ],
    },
    {
      title: "Components",
      tools: [
        { id: "frame", icon: Square2StackIcon, title: "Frame (F)" },
        {
          id: "component",
          icon: DocumentDuplicateIcon,
          title: "Component (K)",
        },
        { id: "code", icon: CodeBracketIcon, title: "Code Block" },
      ],
    },
  ];

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-2 space-y-4">
      {toolGroups.map((group) => (
        <div key={group.title} className="space-y-2">
          <div className="text-xs text-gray-500 px-2">{group.title}</div>
          <div className="grid grid-cols-2 gap-1">
            {group.tools.map((toolItem) => (
              <button
                key={toolItem.id}
                className={`p-2 rounded-lg ${
                  tool === toolItem.id
                    ? "bg-blue-100 text-blue-600"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => dispatch(setTool(toolItem.id))}
                title={toolItem.title}
              >
                <toolItem.icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toolbar;
