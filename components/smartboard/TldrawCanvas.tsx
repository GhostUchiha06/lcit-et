"use client";

import { useRef, useCallback, useEffect, forwardRef, useState } from "react";

interface TldrawCanvasHandle {
  getEditor: () => any;
}

interface TldrawCanvasProps {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  onEditorReady?: (editor: any) => void;
  currentTool?: string;
  currentColor?: string;
  strokeWidth?: number;
}

const TldrawCanvas = forwardRef<TldrawCanvasHandle, TldrawCanvasProps>(
  ({ bgColor, gridType, onEditorReady, currentTool = "pen", currentColor = "#000000", strokeWidth = 4 }, ref) => {
    const editorRef = useRef<any>(null);
    const [TldrawComponent, setTldrawComponent] = useState<any>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
      if (isMountedRef.current) return;
      isMountedRef.current = true;
      
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
      editor.user.updateUserPreferences({ color: currentColor });
      onEditorReady?.(editor);
    }, [onEditorReady, currentColor]);

    useEffect(() => {
      if (!editorRef.current) return;
      
      const toolMap: Record<string, string> = {
        select: "select",
        pen: "draw",
        highlighter: "highlight",
        eraser: "eraser",
        rectangle: "rectangle",
        ellipse: "ellipse",
        line: "line",
        arrow: "arrow",
        text: "text",
        sticky: "note",
      };
      
      const tldrawTool = toolMap[currentTool] || "select";
      
      if (editorRef.current.getCurrentToolId() !== tldrawTool) {
        editorRef.current.setCurrentTool(tldrawTool);
      }
    }, [currentTool]);

    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.user.updateUserPreferences({ color: currentColor });
      }
    }, [currentColor]);

    const gridColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#444" : "#ccc";
    const lineColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#333" : "#ddd";

    if (!TldrawComponent) {
      return (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="w-full h-full" 
        style={{ 
          backgroundColor: bgColor, 
          backgroundImage: gridType === "dots" 
            ? `radial-gradient(circle, ${gridColor} 1.5px, transparent 1.5px)` 
            : gridType === "lines" 
              ? `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)` 
              : "none", 
          backgroundSize: gridType === "dots" ? "24px 24px" : gridType === "lines" ? "24px 24px" : "auto" 
        }}
      >
        <TldrawComponent 
          onMount={handleMount} 
          autoFocus 
          hideUi
          components={{ 
            DebugMenu: () => null,
            DebugPanel: () => null,
            SharePanel: () => null,
            TopPanel: () => null,
            HelperButtons: () => null,
            TldrawToolbar: () => null,
          }} 
        />
      </div>
    );
  }
);

TldrawCanvas.displayName = "TldrawCanvas";

export default TldrawCanvas;
