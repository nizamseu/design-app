// src/app/page.js
"use client";
import { useState } from "react";
import Canvas from "@/components/Canvas/Canvas";
import Toolbar from "@/components/Toolbar/Toolbar";
import PropertiesPanel from "@/components/PropertiesPanel/PropertiesPanel";
import LayersPanel from "@/components/LayersPanel/LayersPanel";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [isRightPanelOpen, setRightPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("layers"); // 'layers' or 'properties'

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <h1 className="font-semibold text-lg">Design Editor</h1>
          <span className="text-sm text-gray-500">Untitled Project</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
            Share
          </button>
          <button className="p-2 hover:bg-gray-100 rounded text-gray-600">
            Export
          </button>
          <button className="ml-2 px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Canvas Area with Toolbar Overlay */}
        <div className="flex-1 relative bg-gray-100 overflow-hidden">
          {/* Canvas */}
          <Canvas />

          {/* Original Toolbar - Now properly positioned */}
          <Toolbar />
        </div>

        {/* Right Panel (Layers & Properties) */}
        <div
          className={`${
            isRightPanelOpen ? "w-80" : "w-0"
          } bg-white border-l flex flex-col transition-all duration-300 shadow-lg z-10`}
        >
          {isRightPanelOpen && (
            <>
              {/* Tabs */}
              <div className="h-12 border-b flex">
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === "layers"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("layers")}
                >
                  Layers
                </button>
                <button
                  className={`flex-1 px-4 py-2 text-sm font-medium ${
                    activeTab === "properties"
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveTab("properties")}
                >
                  Properties
                </button>
              </div>

              {/* Panel Content */}
              <div className="w-80 border-l bg-white h-full flex flex-col">
                {activeTab === "layers" ? <LayersPanel /> : <PropertiesPanel />}
              </div>
            </>
          )}

          {/* Toggle Panel Button */}
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full 
                     bg-white p-2 rounded-l-lg shadow-lg border border-r-0"
            onClick={() => setRightPanelOpen(!isRightPanelOpen)}
          >
            {isRightPanelOpen ? (
              <ArrowRightIcon className="w-4 h-4" />
            ) : (
              <ArrowLeftIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
