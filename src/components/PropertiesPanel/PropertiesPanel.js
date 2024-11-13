// src/components/PropertiesPanel/PropertiesPanel.js
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateElement } from "@/store/slices/canvasSlice";
import * as Tabs from "@radix-ui/react-tabs";
import * as Slider from "@radix-ui/react-slider";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChromePicker } from "react-color";
import { jsPDF } from "jspdf";
import {
  LayoutGrid,
  Paintbrush,
  Sparkles,
  Move,
  Square,
  RotateCw,
  Palette,
  Eye,
  Download,
  Code,
  Copy,
  Check,
  ChevronDown,
  FileImage,
  FilePdf,
  Droplet,
  Cloud,
  XCircle,
  ChevronUp,
  PaintBucket,
  X,
} from "lucide-react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-markup";

const ExportDropdown = ({ onExport }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportClick = async (format) => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats = [
    { id: "png", label: "PNG", icon: Image },
    { id: "jpeg", label: "JPEG", icon: Image },
    { id: "svg", label: "SVG", icon: File },
    { id: "pdf", label: "PDF", icon: FilePdf },
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-white border 
                       rounded-md hover:bg-gray-50 ${
                         isExporting ? "opacity-50 cursor-not-allowed" : ""
                       }`}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export As</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-white rounded-md shadow-lg border p-1 min-w-[160px] z-50"
          sideOffset={5}
        >
          {exportFormats.map(({ id, label, icon: Icon }) => (
            <DropdownMenu.Item
              key={id}
              onSelect={() => handleExportClick(id)}
              disabled={isExporting}
              className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 
                         rounded outline-none cursor-pointer disabled:opacity-50 
                         disabled:cursor-not-allowed"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};

const PropertiesPanel = () => {
  const dispatch = useDispatch();
  const { elements, selectedIds } = useSelector((state) => state.canvas);
  const selectedElement = elements.find((el) => el.id === selectedIds[0]);
  const [showHtmlCode, setShowHtmlCode] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [colorPickerState, setColorPickerState] = useState({
    show: false,
    type: null,
  });

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 p-4 text-center">
        Select an element to view and edit its properties
      </div>
    );
  }

  const handleStyleChange = (property, value) => {
    dispatch(
      updateElement({
        ...selectedElement,
        style: {
          ...selectedElement.style,
          [property]: value,
        },
      })
    );
  };

  const handlePositionChange = (axis, value) => {
    dispatch(
      updateElement({
        ...selectedElement,
        position: {
          ...selectedElement.position,
          [axis]: parseFloat(value),
        },
      })
    );
  };

  const handleSizeChange = (dimension, value) => {
    dispatch(
      updateElement({
        ...selectedElement,
        size: {
          ...selectedElement.size,
          [dimension]: parseFloat(value),
        },
      })
    );
  };

  const handleExport = async (format) => {
    const canvas = document.querySelector("canvas");
    if (!canvas) {
      alert("No canvas element found");
      return;
    }

    try {
      switch (format) {
        case "png":
        case "jpeg": {
          // Create a temporary link element
          const dataUrl = canvas.toDataURL(`image/${format}`, 1.0);
          // Convert base64 to blob
          const byteString = atob(dataUrl.split(",")[1]);
          const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const url = URL.createObjectURL(blob);

          // Create and trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = `design.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Clean up the URL
          URL.revokeObjectURL(url);
          break;
        }

        case "svg": {
          // Get canvas content and convert to SVG
          const canvasContent = canvas.toDataURL("image/png");
          const svgTemplate = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
              <image href="${canvasContent}" width="100%" height="100%"/>
            </svg>
          `;

          // Create blob from SVG
          const blob = new Blob([svgTemplate], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);

          // Create and trigger download
          const link = document.createElement("a");
          link.href = url;
          link.download = "design.svg";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Clean up the URL
          URL.revokeObjectURL(url);
          break;
        }

        case "pdf": {
          try {
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({
              orientation: "landscape",
              unit: "px",
              format: [canvas.width, canvas.height],
            });

            // Get canvas content
            const imgData = canvas.toDataURL("image/png", 1.0);

            // Add image to PDF
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

            // Save PDF
            pdf.save("design.pdf");
          } catch (error) {
            console.error("PDF export failed:", error);
            alert("Failed to export PDF. Please try again.");
          }
          break;
        }

        default:
          alert("Unsupported format");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export. Please try again.");
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const generateHtmlCode = () => {
    const styles = {
      position: "absolute",
      left: `${selectedElement.position.x}px`,
      top: `${selectedElement.position.y}px`,
      width: `${selectedElement.size.width}px`,
      height: `${selectedElement.size.height}px`,
      backgroundColor: selectedElement.style.fill,
      border: `${selectedElement.style.strokeWidth}px solid ${selectedElement.style.stroke}`,
      opacity: selectedElement.style.opacity,
      transform: `rotate(${selectedElement.style.rotation}deg)`,
      boxShadow: selectedElement.style.shadowX
        ? `${selectedElement.style.shadowX}px ${selectedElement.style.shadowY}px ${selectedElement.style.shadowBlur}px ${selectedElement.style.shadowColor}`
        : "none",
      filter: selectedElement.style.blur
        ? `blur(${selectedElement.style.blur}px)`
        : "none",
    };

    const styleString = Object.entries(styles)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join("\n");

    return `<div style="
${styleString}
"></div>`;
  };

  return (
    <div className="h-full flex flex-col max-h-screen overflow-y-scroll pb-[6rem]">
      <Tabs.Root defaultValue="layout" className="flex-1">
        <Tabs.List className="flex border-b bg-white shrink-0 sticky top-0 z-10">
          <TabButton value="layout" icon={LayoutGrid} label="Layout" />
          <TabButton value="style" icon={Paintbrush} label="Style" />
          <TabButton value="effects" icon={Sparkles} label="Effects" />
        </Tabs.List>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Layout Tab */}
            <Tabs.Content value="layout" className="space-y-6">
              <Section title="Position" icon={Move}>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInputWithLabel
                    label="X Position"
                    value={selectedElement.position.x}
                    onChange={(val) => handlePositionChange("x", val)}
                  />
                  <NumberInputWithLabel
                    label="Y Position"
                    value={selectedElement.position.y}
                    onChange={(val) => handlePositionChange("y", val)}
                  />
                </div>
              </Section>

              <Section title="Size" icon={Square}>
                <div className="grid grid-cols-2 gap-3">
                  <NumberInputWithLabel
                    label="Width"
                    value={selectedElement.size.width}
                    onChange={(val) => handleSizeChange("width", val)}
                  />
                  <NumberInputWithLabel
                    label="Height"
                    value={selectedElement.size.height}
                    onChange={(val) => handleSizeChange("height", val)}
                  />
                </div>
              </Section>

              <Section title="Rotation" icon={RotateCw}>
                <SliderWithInput
                  label="Angle"
                  value={selectedElement.style.rotation || 0}
                  onChange={(val) => handleStyleChange("rotation", val)}
                  min={0}
                  max={360}
                />
              </Section>
            </Tabs.Content>

            {/* Style Tab */}
            <Tabs.Content value="style">
              <div className="p-4 space-y-6">
                <Section icon={PaintBucket} title="Fill">
                  <div className="p-1 border rounded-md">
                    <ChromePicker
                      color={selectedElement.style.fill}
                      onChange={(color) => handleStyleChange("fill", color.hex)}
                      styles={{
                        default: {
                          picker: {
                            width: "100%",
                            boxShadow: "none",
                            border: "none",
                          },
                        },
                      }}
                    />
                  </div>
                </Section>

                <Section icon={Palette} title="Stroke">
                  <div className="space-y-3">
                    <ChromePicker
                      color={selectedElement.style.stroke}
                      onChange={(color) =>
                        handleStyleChange("stroke", color.hex)
                      }
                      styles={{
                        default: {
                          picker: {
                            width: "100%",
                            boxShadow: "none",
                            border: "none",
                          },
                        },
                      }}
                    />
                    <NumberInputWithLabel
                      label="Stroke Width"
                      value={selectedElement.style.strokeWidth}
                      onChange={(val) => handleStyleChange("strokeWidth", val)}
                      min={0}
                    />
                  </div>
                </Section>

                <Section icon={Eye} title="Opacity">
                  <SliderWithInput
                    label="Opacity"
                    value={selectedElement.style.opacity * 100}
                    onChange={(val) => handleStyleChange("opacity", val / 100)}
                    min={0}
                    max={100}
                  />
                </Section>
              </div>
            </Tabs.Content>

            {/* Effects Tab */}
            <Tabs.Content value="effects">
              <div className="p-4 space-y-6">
                <Section title="Blur Effects" icon={Droplet}>
                  <SliderWithInput
                    label="Blur Amount"
                    value={selectedElement.style.blur || 0}
                    onChange={(val) => handleStyleChange("blur", val)}
                    min={0}
                    max={50}
                  />
                </Section>

                <Section title="Shadow" icon={Cloud}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <NumberInputWithLabel
                        label="Offset X"
                        value={selectedElement.style.shadowX || 0}
                        onChange={(val) => handleStyleChange("shadowX", val)}
                      />
                      <NumberInputWithLabel
                        label="Offset Y"
                        value={selectedElement.style.shadowY || 0}
                        onChange={(val) => handleStyleChange("shadowY", val)}
                      />
                    </div>

                    <NumberInputWithLabel
                      label="Blur Radius"
                      value={selectedElement.style.shadowBlur || 0}
                      onChange={(val) => handleStyleChange("shadowBlur", val)}
                      min={0}
                    />

                    <div className="p-1 border rounded-md">
                      <ChromePicker
                        color={selectedElement.style.shadowColor || "#000000"}
                        onChange={(color) =>
                          handleStyleChange("shadowColor", color.hex)
                        }
                        styles={{
                          default: {
                            picker: {
                              width: "100%",
                              boxShadow: "none",
                              border: "none",
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </Section>
              </div>
            </Tabs.Content>
          </div>
        </div>
      </Tabs.Root>

      {/* Export Section */}
      <div className="border-t bg-gray-50 p-4 space-y-4">
        {/* <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Export & Code</span>
          <ExportDropdown onExport={handleExport} />
        </div> */}

        <button
          className="w-full px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 
                     flex items-center justify-center gap-2"
          onClick={() => setShowHtmlCode(!showHtmlCode)}
        >
          <Code className="w-4 h-4" />
          <span>{showHtmlCode ? "Hide" : "Show"} HTML Code</span>
        </button>

        {showHtmlCode && (
          <div className="relative">
            <pre className="p-3 bg-gray-900 rounded-md text-sm overflow-x-auto">
              <code
                className="language-html text-white"
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    generateHtmlCode(),
                    Prism.languages.markup,
                    "html"
                  ),
                }}
              />
            </pre>
            <button
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white 
                         bg-gray-800 rounded-md transition-colors"
              onClick={() => copyToClipboard(generateHtmlCode())}
            >
              {copiedCode ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Color Picker Modal */}
      {colorPickerState.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium">Pick a Color</span>
              <button
                onClick={() => setColorPickerState({ show: false, type: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <ChromePicker
              color={selectedElement.style[colorPickerState.type]}
              onChange={(color) =>
                handleStyleChange(colorPickerState.type, color.hex)
              }
            />
            <button
              className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              onClick={() => setColorPickerState({ show: false, type: null })}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components (add these to the same file)

const NumberInputWithLabel = ({
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
}) => {
  const [inputValue, setInputValue] = useState(String(value));

  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Convert to number and update if valid
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed); // Continue from previous code...
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed) || parsed < min || parsed > max) {
      setInputValue(String(value));
    }
  };

  const incrementValue = (increment) => {
    const currentValue = parseFloat(value);
    const newValue = currentValue + increment;
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full h-9 px-3 rounded-md border border-gray-300 
                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                   text-sm transition-colors bg-white pr-12"
        />
        <div className="absolute right-0 top-0 h-full flex flex-col border-l border-gray-300">
          <button
            className="flex-1 px-2 hover:bg-gray-100 text-gray-600 flex items-center justify-center"
            onClick={() => incrementValue(1)}
            type="button"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            className="flex-1 px-2 hover:bg-gray-100 text-gray-600 border-t border-gray-300 
                     flex items-center justify-center"
            onClick={() => incrementValue(-1)}
            type="button"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SliderWithInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 0.1,
}) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localValue);
    if (isNaN(parsed) || parsed < min || parsed > max) {
      setLocalValue(String(value));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-gray-600">{label}</label>
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className="w-16 h-6 px-2 text-sm border rounded focus:border-blue-500 
                   focus:ring-1 focus:ring-blue-500 text-center"
        />
      </div>
      <Slider.Root
        className="relative flex items-center w-full h-5"
        value={[parseFloat(value)]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0])}
      >
        <Slider.Track className="bg-gray-200 relative flex-grow h-1.5 rounded-full">
          <Slider.Range className="absolute bg-blue-500 h-full rounded-full" />
        </Slider.Track>
        <Slider.Thumb
          className="block w-4 h-4 bg-white border-2 border-blue-500 rounded-full 
                               shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Slider.Root>
    </div>
  );
};

const ColorPickerButton = ({ color, onClick, label }) => (
  <div className="space-y-1">
    <label className="text-sm text-gray-600">{label}</label>
    <button
      className="w-full h-9 px-3 rounded-md border border-gray-300 hover:border-gray-400 
                 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
                 flex items-center gap-2 bg-white transition-colors"
      onClick={onClick}
    >
      <div
        className="w-4 h-4 rounded-full border border-gray-300"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm text-gray-700 flex-1 text-left">{color}</span>
      <ChevronDown className="w-4 h-4 text-gray-400" />
    </button>
  </div>
);

const TabButton = ({ value, icon: Icon, label }) => (
  <Tabs.Trigger
    value={value}
    className={`
      flex-1 px-4 py-2 text-sm font-medium text-gray-600 
      hover:bg-gray-50 transition-colors outline-none
      data-[state=active]:text-blue-600 
      data-[state=active]:border-b-2 
      data-[state=active]:border-blue-600
    `}
  >
    <div className="flex items-center justify-center gap-2">
      <Icon className="w-4 h-4" />
      {label}
    </div>
  </Tabs.Trigger>
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-500" />
      <h3 className="text-sm font-medium text-gray-700">{title}</h3>
    </div>
    {children}
  </div>
);

const ExportSection = ({
  onExport,
  onShowHtmlCode,
  showHtmlCode,
  htmlCode,
  copiedCode,
  onCopyCode,
}) => {
  return (
    <div className="border-t bg-gray-50 p-4 space-y-4 shrink-0">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Export & Code</span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="px-3 py-1.5 text-sm bg-white border rounded-md hover:bg-gray-50 
                               flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Download className="w-4 h-4" />
              Export As
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[160px] bg-white rounded-md shadow-lg border p-1 z-50"
              sideOffset={5}
            >
              {["PNG", "JPEG", "SVG", "PDF"].map((format) => (
                <DropdownMenu.Item
                  key={format}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 
                             rounded cursor-pointer outline-none"
                  onSelect={() => onExport(format.toLowerCase())}
                >
                  {format === "PDF" ? (
                    <FilePdf className="w-4 h-4" />
                  ) : (
                    <FileImage className="w-4 h-4" />
                  )}
                  {format}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>

      <button
        className="w-full px-3 py-2 text-sm bg-white border rounded-md hover:bg-gray-50 
                     flex items-center justify-center gap-2"
        onClick={onShowHtmlCode}
      >
        <Code className="w-4 h-4" />
        {showHtmlCode ? "Hide" : "Show"} HTML Code
      </button>

      {showHtmlCode && (
        <div className="relative">
          <pre className="p-3 bg-gray-900 rounded-md text-sm overflow-x-auto">
            <code
              className="language-html text-white"
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(
                  htmlCode,
                  Prism.languages.markup,
                  "html"
                ),
              }}
            />
          </pre>
          <button
            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white 
                         bg-gray-800 rounded-md transition-colors"
            onClick={onCopyCode}
          >
            {copiedCode ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
export default PropertiesPanel;
