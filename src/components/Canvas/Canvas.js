import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Image,
  Transformer,
} from "react-konva";
import {
  addElement,
  updateElement,
  setSelectedIds,
} from "@/store/slices/canvasSlice";

const Canvas = () => {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [newElementStart, setNewElementStart] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 }); // Default sizes
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");

  const dispatch = useDispatch();
  const { elements, selectedIds, zoom, viewportOffset, tool } = useSelector(
    (state) => state.canvas
  );

  // Handle window resize and initial dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Only run on client side
    if (typeof window !== "undefined") {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  // Text editing overlay
  const TextEditor = ({ text, position, onSubmit }) => {
    return (
      <div
        style={{
          position: "absolute",
          left: position.x,
          top: position.y,
          zIndex: 1000,
        }}
      >
        <textarea
          autoFocus
          defaultValue={text}
          onChange={(e) => setEditingText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(editingText);
              setIsEditing(false);
            }
          }}
          onBlur={() => {
            onSubmit(editingText);
            setIsEditing(false);
          }}
          className="p-2 border border-blue-500 rounded shadow-lg"
        />
      </div>
    );
  };

  const handleStageMouseDown = (e) => {
    if (e.target === e.target.getStage()) {
      dispatch(setSelectedIds([]));

      if (tool !== "select") {
        const pos = e.target.getStage().getPointerPosition();
        setIsDrawing(true);
        setNewElementStart({
          x: pos.x,
          y: pos.y,
        });
      }
    }
  };

  const handleStageMouseMove = (e) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool !== "select" && newElementStart) {
      const width = pos.x - newElementStart.x;
      const height = pos.y - newElementStart.y;

      const newElement = {
        type: tool,
        position: {
          x: newElementStart.x,
          y: newElementStart.y,
        },
        size: {
          width: Math.abs(width),
          height: Math.abs(height),
        },
        style: {
          fill: tool === "text" ? "transparent" : "#4299e1",
          stroke: "#2b6cb0",
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
      };

      // Remove previous temporary shape
      stage.findOne("#tempShape")?.destroy();
      const layer = stage.findOne("Layer");

      // Create temporary shape based on tool
      switch (tool) {
        case "rectangle":
          const tempRect = new Konva.Rect({
            id: "tempShape",
            ...newElement.position,
            ...newElement.size,
            ...newElement.style,
          });
          layer.add(tempRect);
          break;
        case "circle":
          const tempCircle = new Konva.Circle({
            id: "tempShape",
            ...newElement.position,
            radius: Math.max(Math.abs(width), Math.abs(height)) / 2,
            ...newElement.style,
          });
          layer.add(tempCircle);
          break;
        case "text":
          const tempText = new Konva.Text({
            id: "tempShape",
            ...newElement.position,
            ...newElement.size,
            text: "Double click to edit",
            fill: "#000000",
            fontSize: 16,
          });
          layer.add(tempText);
          break;
      }

      layer.batchDraw();
    }
  };

  const handleStageMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (tool !== "select" && newElementStart) {
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();

      const width = pos.x - newElementStart.x;
      const height = pos.y - newElementStart.y;

      const newElement = {
        id: `element-${Date.now()}`,
        type: tool,
        position: {
          x: newElementStart.x,
          y: newElementStart.y,
        },
        size: {
          width: Math.abs(width),
          height: Math.abs(height),
        },
        style: {
          fill: tool === "text" ? "transparent" : "#4299e1",
          stroke: "#2b6cb0",
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        },
        content: tool === "text" ? "Double click to edit" : null,
      };

      stage.findOne("#tempShape")?.destroy();
      dispatch(addElement(newElement));
      setNewElementStart(null);
    }
  };

  const handleElementSelect = (e) => {
    if (tool !== "select") return;

    const id = e.target.id();
    if (id) {
      dispatch(setSelectedIds([id]));
    }
  };

  const handleTransform = (id) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const node = transformerRef.current?.nodes()?.[0];
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    dispatch(
      updateElement({
        ...element,
        position: {
          x: node.x(),
          y: node.y(),
        },
        size: {
          width: node.width() * scaleX,
          height: node.height() * scaleY,
        },
        style: {
          ...element.style,
          rotation: node.rotation(),
        },
      })
    );
  };

  const handleTextDblClick = (e, element) => {
    if (tool !== "select") return;

    const stage = stageRef.current;
    const textPosition = stage.getPointerPosition();

    setIsEditing(true);
    setEditingText(element.content);

    dispatch(
      updateElement({
        ...element,
        position: {
          x: textPosition.x,
          y: textPosition.y,
        },
      })
    );
  };

  const handleTextSubmit = (element, newText) => {
    dispatch(
      updateElement({
        ...element,
        content: newText,
      })
    );
  };

  const renderElement = (element) => {
    const isSelected = selectedIds.includes(element.id);
    const commonProps = {
      id: element.id,
      x: element.position.x,
      y: element.position.y,
      width: element.size.width,
      height: element.size.height,
      fill: element.style.fill,
      stroke: element.style.stroke,
      strokeWidth: element.style.strokeWidth,
      opacity: element.style.opacity,
      rotation: element.style.rotation,
      draggable: tool === "select",
      onClick: handleElementSelect,
      onTransformEnd: () => handleTransform(element.id),
    };

    switch (element.type) {
      case "rectangle":
        return <Rect key={element.id} {...commonProps} />;
      case "circle":
        return (
          <Circle
            key={element.id}
            {...commonProps}
            radius={Math.min(element.size.width, element.size.height) / 2}
          />
        );
      case "text":
        return (
          <Text
            key={element.id}
            {...commonProps}
            text={element.content}
            fontSize={16}
            fill="#000000"
            onDblClick={(e) => handleTextDblClick(e, element)}
          />
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (transformerRef.current) {
      const nodes = selectedIds
        .map((id) => stageRef.current?.findOne(`#${id}`))
        .filter(Boolean);
      transformerRef.current.nodes(nodes);
    }
  }, [selectedIds]);

  return (
    <div className="w-full h-full overflow-hidden bg-gray-100 relative">
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scale={{ x: zoom, y: zoom }}
        position={viewportOffset}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {elements.map(renderElement)}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              const minSize = 5;
              if (newBox.width < minSize || newBox.height < minSize) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>
      </Stage>
      {isEditing && (
        <TextEditor
          text={editingText}
          position={stageRef.current?.getPointerPosition() || { x: 0, y: 0 }}
          onSubmit={(newText) => {
            const selectedElement = elements.find((el) =>
              selectedIds.includes(el.id)
            );
            if (selectedElement) {
              handleTextSubmit(selectedElement, newText);
            }
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
