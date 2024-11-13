// src/components/Canvas/Canvas.js
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Line,
  Arrow,
  RegularPolygon,
  Star,
  Transformer,
} from "react-konva";
import Konva from "konva";
import {
  addElement,
  updateElement,
  setSelectedIds,
  deleteElements,
  bringToFront,
  sendToBack,
  moveUp,
  moveDown,
  updateViewportOffset,
  updateZoom,
} from "@/store/slices/canvasSlice";
import { Maximize2, Minus, Plus, ZoomOut, ZoomOutIcon } from "lucide-react";

const Canvas = () => {
  // Refs
  const stageRef = useRef(null);
  const transformerRef = useRef(null);

  // State
  const [isDrawing, setIsDrawing] = useState(false);
  const [newElementStart, setNewElementStart] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState("");
  const [linePoints, setLinePoints] = useState([]);
  const [selectionRect, setSelectionRect] = useState(null);
  const [lastPointerPosition, setLastPointerPosition] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastCenter, setLastCenter] = useState(null);
  // Redux
  const dispatch = useDispatch();
  const { elements, selectedIds, zoom, viewportOffset, tool } = useSelector(
    (state) => state.canvas
  );

  const handleWheel = (e) => {
    // Get the native event from Konva's event object
    const evt = e.evt;

    // Only handle zooming when Ctrl/Cmd is pressed
    if (evt.ctrlKey) {
      // Prevent browser zoom
      evt.preventDefault();

      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();

      const mousePointTo = {
        x: (pointer.x - viewportOffset.x) / oldScale,
        y: (pointer.y - viewportOffset.y) / oldScale,
      };

      // Determine zoom direction and calculate new scale
      const zoomSpeed = 1.1;
      const newScale =
        evt.deltaY > 0 ? oldScale / zoomSpeed : oldScale * zoomSpeed;

      // Limit zoom range
      const minZoom = 0.1;
      const maxZoom = 5;
      const boundedScale = Math.min(Math.max(newScale, minZoom), maxZoom);

      // Calculate new viewport offset
      const newPos = {
        x: pointer.x - mousePointTo.x * boundedScale,
        y: pointer.y - mousePointTo.y * boundedScale,
      };

      // Update Redux state
      dispatch(updateZoom(boundedScale));
      dispatch(updateViewportOffset(newPos));
    }
  };

  const handleZoomToFit = () => {
    if (!elements.length || !stageRef.current) return;

    // Calculate bounding box of all elements
    const bbox = elements.reduce(
      (box, element) => {
        const eleX = element.position?.x || 0;
        const eleY = element.position?.y || 0;
        const eleWidth = element.size?.width || 0;
        const eleHeight = element.size?.height || 0;

        return {
          x1: Math.min(box.x1, eleX),
          y1: Math.min(box.y1, eleY),
          x2: Math.max(box.x2, eleX + eleWidth),
          y2: Math.max(box.y2, eleY + eleHeight),
        };
      },
      { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
    );

    // Add padding
    const padding = 50;
    bbox.x1 -= padding;
    bbox.y1 -= padding;
    bbox.x2 += padding;
    bbox.y2 += padding;

    const boxWidth = bbox.x2 - bbox.x1;
    const boxHeight = bbox.y2 - bbox.y1;

    // Calculate scale to fit
    const scaleX = dimensions.width / boxWidth;
    const scaleY = dimensions.height / boxHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in more than 100%

    // Center the content
    const newX = (dimensions.width - boxWidth * scale) / 2 - bbox.x1 * scale;
    const newY = (dimensions.height - boxHeight * scale) / 2 - bbox.y1 * scale;

    dispatch(updateZoom(scale));
    dispatch(updateViewportOffset({ x: newX, y: newY }));
  };

  // Add preventDefault for Ctrl+wheel
  useEffect(() => {
    const preventDefault = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", preventDefault, { passive: false });
    return () => document.removeEventListener("wheel", preventDefault);
  }, []);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    if (typeof window !== "undefined") {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }
  }, []);

  useEffect(() => {
    const preventBrowserZoom = (e) => {
      if (e.ctrlKey && e.deltaY) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventBrowserZoom, { passive: false });
    return () => window.removeEventListener("wheel", preventBrowserZoom);
  }, []);
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        document.body.style.cursor = "default";
      }
    };

    const handleKeyDown = (e) => {
      if (!selectedIds.length) return;
      if (e.code === "Space") {
        e.preventDefault();
        document.body.style.cursor = "grab";
      }

      if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        handleZoomToFit();
      }

      // Zoom to 100% (Ctrl + 1)
      if (e.ctrlKey && e.key === "1") {
        e.preventDefault();
        dispatch(updateZoom(1));
        dispatch(updateViewportOffset({ x: 0, y: 0 }));
      }

      // Zoom in (Ctrl +)
      if (e.ctrlKey && e.key === "=") {
        e.preventDefault();
        const newScale = Math.min(zoom * 1.2, 5);
        dispatch(updateZoom(newScale));
      }

      // Zoom out (Ctrl -)
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        const newScale = Math.max(zoom / 1.2, 0.1);
        dispatch(updateZoom(newScale));
      }
      // Delete/Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        dispatch(deleteElements(selectedIds));
      }

      // Layer management
      if ((e.ctrlKey || e.metaKey) && e.key === "]") {
        e.preventDefault();
        dispatch(bringToFront(selectedIds));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "[") {
        e.preventDefault();
        dispatch(sendToBack(selectedIds));
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "]") {
        e.preventDefault();
        selectedIds.forEach((id) => dispatch(moveUp(id)));
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "[") {
        e.preventDefault();
        selectedIds.forEach((id) => dispatch(moveDown(id)));
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        dispatch(setSelectedIds(elements.map((el) => el.id)));
      }

      // Escape to deselect
      if (e.key === "Escape") {
        dispatch(setSelectedIds([]));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [selectedIds, elements, dispatch]);

  // Helper functions
  const getDefaultStyles = (toolType) => ({
    fill: toolType === "text" ? "transparent" : "#4299e1",
    stroke: "#2b6cb0",
    strokeWidth: 2,
    opacity: 1,
    rotation: 0,
  });

  const createNewElement = (pos, size, toolType, additionalProps = {}) => ({
    id: `element-${Date.now()}`,
    type: toolType,
    position: { x: pos.x, y: pos.y },
    size: { width: size.width, height: size.height },
    style: getDefaultStyles(toolType),
    ...additionalProps,
  });

  // Mouse event handlers
  const handleStageMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (e.evt.button === 1 || (e.evt.button === 0 && tool === "hand")) {
      setIsPanning(true);
      setLastCenter(stage.getPointerPosition());
      stage.container().style.cursor = "grabbing";
      return;
    }
    // Handle multi-selection with shift key
    if (tool === "select" && e.evt.shiftKey) {
      setSelectionRect({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
      return;
    }

    // Clear selection when clicking canvas
    if (e.target === stage) {
      dispatch(setSelectedIds([]));
    }

    if (tool !== "select") {
      setIsDrawing(true);
      setNewElementStart(pos);

      if (tool === "pen" || tool === "line") {
        setLinePoints([{ x: pos.x, y: pos.y }]);
      }
    }
    if (e.target === stage) {
      dispatch(setSelectedIds([]));

      if (tool !== "select") {
        const pos = stage.getPointerPosition();
        setIsDrawing(true);
        setNewElementStart(pos);
        // ... rest of your drawing logic
      }
    }

    setLastPointerPosition(pos);
  };

  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // Handle selection rectangle
    if (selectionRect) {
      setSelectionRect({
        ...selectionRect,
        x2: pos.x,
        y2: pos.y,
      });
      return;
    }
    if (isPanning && lastCenter) {
      const dx = pointerPos.x - lastCenter.x;
      const dy = pointerPos.y - lastCenter.y;

      dispatch(
        updateViewportOffset({
          x: viewportOffset.x + dx,
          y: viewportOffset.y + dy,
        })
      );

      setLastCenter(pointerPos);
      return;
    }
    // Handle drawing
    if (isDrawing) {
      if (tool === "pen") {
        setLinePoints((points) => [...points, { x: pos.x, y: pos.y }]);
      } else if (tool === "line") {
        setLinePoints([linePoints[0], { x: pos.x, y: pos.y }]);
      } else {
        const width = pos.x - newElementStart.x;
        const height = pos.y - newElementStart.y;

        // Remove previous temporary shape
        stage.findOne("#tempShape")?.destroy();
        const layer = stage.findOne("Layer");

        // Create temporary shape
        createTemporaryShape(layer, width, height);
      }
    }

    setLastPointerPosition(pos);
  };

  const handleStageMouseUp = () => {
    if (!isDrawing) return;

    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    if (isPanning) {
      setIsPanning(false);
      setLastCenter(null);
      stageRef.current.container().style.cursor = "default";
      return;
    }

    if (tool === "pen" || tool === "line") {
      finalizePath();
    } else {
      finalizeShape(pos);
    }

    // Clean up
    setIsDrawing(false);
    setNewElementStart(null);
    setLinePoints([]);
    stage.findOne("#tempShape")?.destroy();
  };

  // Continue in Part 2...// ... continuing from Part 1

  // Helper functions for shape creation and drawing
  const createTemporaryShape = (layer, width, height) => {
    const tempProps = {
      id: "tempShape",
      x: newElementStart.x,
      y: newElementStart.y,
      ...getDefaultStyles(tool),
    };

    let tempShape;
    switch (tool) {
      case "rectangle":
        tempShape = new Konva.Rect({
          ...tempProps,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        break;
      case "circle":
        tempShape = new Konva.Circle({
          ...tempProps,
          radius: Math.max(Math.abs(width), Math.abs(height)) / 2,
        });
        break;
      case "star":
        tempShape = new Konva.Star({
          ...tempProps,
          numPoints: 5,
          innerRadius: Math.min(Math.abs(width), Math.abs(height)) / 4,
          outerRadius: Math.max(Math.abs(width), Math.abs(height)) / 2,
        });
        break;
      case "triangle":
        tempShape = new Konva.RegularPolygon({
          ...tempProps,
          sides: 3,
          radius: Math.max(Math.abs(width), Math.abs(height)) / 2,
        });
        break;
      case "arrow":
        tempShape = new Konva.Arrow({
          ...tempProps,
          points: [0, 0, width, height],
          pointerLength: 10,
          pointerWidth: 10,
        });
        break;
    }

    if (tempShape) {
      layer.add(tempShape);
      layer.batchDraw();
    }
  };

  const finalizePath = () => {
    const points = linePoints.reduce((arr, point) => {
      arr.push(point.x, point.y);
      return arr;
    }, []);

    const newElement = {
      id: `element-${Date.now()}`,
      type: tool,
      points,
      style: {
        stroke: "#2b6cb0",
        strokeWidth: tool === "pen" ? 2 : 3,
        tension: tool === "pen" ? 0.5 : 0,
        lineCap: "round",
        lineJoin: "round",
      },
    };

    dispatch(addElement(newElement));
  };

  const finalizeShape = (pos) => {
    const width = pos.x - newElementStart.x;
    const height = pos.y - newElementStart.y;

    let newElement;
    switch (tool) {
      case "star":
        newElement = createNewElement(
          newElementStart,
          { width: Math.abs(width), height: Math.abs(height) },
          tool,
          {
            numPoints: 5,
            innerRadius: Math.min(Math.abs(width), Math.abs(height)) / 4,
            outerRadius: Math.max(Math.abs(width), Math.abs(height)) / 2,
          }
        );
        break;
      case "triangle":
        newElement = createNewElement(
          newElementStart,
          { width: Math.abs(width), height: Math.abs(height) },
          tool,
          {
            sides: 3,
            radius: Math.max(Math.abs(width), Math.abs(height)) / 2,
          }
        );
        break;
      case "arrow":
        newElement = createNewElement(
          newElementStart,
          { width: Math.abs(width), height: Math.abs(height) },
          tool,
          {
            points: [0, 0, width, height],
            pointerLength: 10,
            pointerWidth: 10,
          }
        );
        break;
      case "text":
        newElement = createNewElement(
          newElementStart,
          { width: Math.abs(width), height: Math.abs(height) },
          tool,
          {
            content: "Double click to edit",
            fontSize: 16,
            fill: "#000000",
          }
        );
        break;
      default:
        newElement = createNewElement(
          newElementStart,
          { width: Math.abs(width), height: Math.abs(height) },
          tool
        );
    }

    if (newElement) {
      dispatch(addElement(newElement));
    }
  };

  // Text editing handlers
  const handleTextDblClick = (e, element) => {
    if (tool !== "select") return;
    const textPosition = stageRef.current.getPointerPosition();
    setIsEditing(true);
    setEditingText(element.content);
    dispatch(
      updateElement({
        ...element,
        position: { x: textPosition.x, y: textPosition.y },
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

  // Selection and transform handlers
  const handleElementSelect = (e) => {
    if (tool !== "select") return;
    e.cancelBubble = true;

    const id = e.target.id();
    if (id) {
      if (e.evt.shiftKey) {
        const ids = selectedIds.includes(id)
          ? selectedIds.filter((selectedId) => selectedId !== id)
          : [...selectedIds, id];
        dispatch(setSelectedIds(ids));
      } else {
        dispatch(setSelectedIds([id]));
      }
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

    const updatedElement = {
      ...element,
      position: {
        x: node.x(),
        y: node.y(),
      },
      style: {
        ...element.style,
        rotation: node.rotation(),
      },
    };

    switch (element.type) {
      case "rectangle":
      case "text":
        updatedElement.size = {
          width: node.width() * scaleX,
          height: node.height() * scaleY,
        };
        break;
      case "circle":
        const radius = Math.max(
          (node.width() * scaleX) / 2,
          (node.height() * scaleY) / 2
        );
        updatedElement.size = {
          width: radius * 2,
          height: radius * 2,
        };
        break;
      case "star":
      case "triangle":
        updatedElement.radius =
          Math.max(node.width() * scaleX, node.height() * scaleY) / 2;
        break;
    }

    dispatch(updateElement(updatedElement));
  };

  // Element rendering
  const renderElement = (element) => {
    const isSelected = selectedIds.includes(element.id);
    const commonProps = {
      id: element.id,
      draggable: tool === "select",
      onClick: handleElementSelect,
      onTransformEnd: () => handleTransform(element.id),
      onDragStart: (e) => {
        e.target.setZIndex(100);
      },
      onDragEnd: (e) => {
        e.target.setZIndex(1);
        const pos = e.target.position();
        dispatch(
          updateElement({
            ...element,
            position: { x: pos.x, y: pos.y },
          })
        );
      },
      ...element.style,
    };

    if (isSelected) {
      commonProps.stroke = "#0066ff";
      commonProps.strokeWidth = (element.style.strokeWidth || 2) + 1;
    }

    switch (element.type) {
      case "rectangle":
        return (
          <Rect
            key={element.id}
            {...commonProps}
            {...element.position}
            {...element.size}
          />
        );
      case "circle":
        return (
          <Circle
            key={element.id}
            {...commonProps}
            {...element.position}
            radius={Math.min(element.size.width, element.size.height) / 2}
          />
        );
      case "star":
        return (
          <Star
            key={element.id}
            {...commonProps}
            {...element.position}
            numPoints={5}
            innerRadius={element.innerRadius}
            outerRadius={element.outerRadius}
          />
        );
      case "triangle":
        return (
          <RegularPolygon
            key={element.id}
            {...commonProps}
            {...element.position}
            sides={3}
            radius={element.radius}
          />
        );
      case "arrow":
        return (
          <Arrow
            key={element.id}
            {...commonProps}
            {...element.position}
            points={element.points}
          />
        );
      case "line":
      case "pen":
        return (
          <Line
            key={element.id}
            {...commonProps}
            points={element.points}
            tension={element.type === "pen" ? 0.5 : 0}
          />
        );
      case "text":
        return (
          <Text
            key={element.id}
            {...commonProps}
            {...element.position}
            text={element.content}
            fontSize={element.fontSize || 16}
            fill="#000000"
            onDblClick={(e) => handleTextDblClick(e, element)}
          />
        );
      default:
        return null;
    }
  };

  // Text editor component
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

  // Update transformer on selection change
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
        scaleX={zoom}
        scaleY={zoom}
        x={viewportOffset.x}
        y={viewportOffset.y}
        onWheel={handleWheel}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
      >
        <Layer>
          {elements.map(renderElement)}

          {isDrawing && (tool === "pen" || tool === "line") && (
            <Line
              points={linePoints.reduce((arr, point) => {
                arr.push(point.x, point.y);
                return arr;
              }, [])}
              stroke="#2b6cb0"
              strokeWidth={tool === "pen" ? 2 : 3}
              tension={tool === "pen" ? 0.5 : 0}
              lineCap="round"
              lineJoin="round"
            />
          )}

          {selectionRect && (
            <Rect
              x={Math.min(selectionRect.x1, selectionRect.x2)}
              y={Math.min(selectionRect.y1, selectionRect.y2)}
              width={Math.abs(selectionRect.x1 - selectionRect.x2)}
              height={Math.abs(selectionRect.y1 - selectionRect.y2)}
              fill="rgba(0, 102, 255, 0.1)"
              stroke="rgba(0, 102, 255, 0.8)"
              strokeWidth={1}
              dash={[4, 4]}
            />
          )}

          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              const minSize = 5;
              return newBox.width < minSize || newBox.height < minSize
                ? oldBox
                : newBox;
            }}
            enabledAnchors={[
              "top-left",
              "top-center",
              "top-right",
              "middle-right",
              "middle-left",
              "bottom-left",
              "bottom-center",
              "bottom-right",
            ]}
            rotateAnchorOffset={30}
            padding={5}
            anchorSize={8}
            anchorCornerRadius={2}
            borderStroke="#0066ff"
            borderStrokeWidth={1}
            anchorStroke="#0066ff"
            anchorFill="#ffffff"
          />
        </Layer>
      </Stage>

      <div className="absolute bottom-12 right-4 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2">
        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors tooltip"
          onClick={() => {
            const newScale = Math.min(zoom * 1.2, 5);
            dispatch(updateZoom(newScale));
          }}
          title="Zoom In (Ctrl +)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="relative group">
          <span
            className="text-sm px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
            onClick={() => dispatch(updateZoom(1))}
            title="Reset Zoom (Ctrl + 1)"
          >
            {Math.round(zoom * 100)}%
          </span>
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-white rounded-lg shadow-lg py-1">
              <button
                className="w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
                onClick={() => dispatch(updateZoom(0.5))}
              >
                50%
              </button>
              <button
                className="w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
                onClick={() => dispatch(updateZoom(1))}
              >
                100%
              </button>
              <button
                className="w-full px-4 py-1 text-left text-sm hover:bg-gray-100"
                onClick={() => dispatch(updateZoom(2))}
              >
                200%
              </button>
            </div>
          </div>
        </div>

        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={() => {
            const newScale = Math.max(zoom / 1.2, 0.1);
            dispatch(updateZoom(newScale));
          }}
          title="Zoom Out (Ctrl -)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={handleZoomToFit}
          title="Zoom to Fit (Ctrl + 0)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          className="p-2 hover:bg-gray-100 rounded transition-colors"
          onClick={() => {
            dispatch(updateZoom(1));
            dispatch(updateViewportOffset({ x: 0, y: 0 }));
          }}
          title="Reset View (Ctrl + 1)"
        >
          <ZoomOutIcon className="w-4 h-4" />
        </button>
      </div>
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
