"use client";

import { useRef, useCallback, useEffect, forwardRef, useImperativeHandle, useState } from "react";

interface TldrawCanvasHandle {
  getEditor: () => any;
}

interface TldrawCanvasProps {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  onEditorReady?: (editor: any) => void;
}

const TldrawCanvas = forwardRef<TldrawCanvasHandle, TldrawCanvasProps>(
  ({ bgColor, gridType, onEditorReady }, ref) => {
    const editorRef = useRef<any>(null);
    const [TldrawComponent, setTldrawComponent] = useState<any>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
    }));

    useEffect(() => {
      import("@tldraw/tldraw").then((mod) => {
        setTldrawComponent(() => mod.Tldraw);
      });
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/@tldraw/tldraw/tldraw.css";
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }, []);

    const handleMount = useCallback((editor: any) => {
      editorRef.current = editor;
      onEditorReady?.(editor);
    }, [onEditorReady]);

    const gridColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#444" : "#ccc";
    const lineColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#333" : "#ddd";

    if (!TldrawComponent) {
      return (
        <div 
          className="flex-1 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading whiteboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="flex-1 overflow-hidden" 
        style={{ 
          backgroundColor: bgColor, 
          backgroundImage: gridType === "dots" 
            ? `radial-gradient(circle, ${gridColor} 1px, transparent 1px)` 
            : gridType === "lines" 
              ? `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)` 
              : "none", 
          backgroundSize: gridType === "dots" ? "20px 20px" : gridType === "lines" ? "20px 20px" : "auto" 
        }}
      >
        <TldrawComponent onMount={handleMount} autoFocus components={{ DebugMenu: null }} />
      </div>
    );
  }
);

TldrawCanvas.displayName = "TldrawCanvas";

export default TldrawCanvas;
