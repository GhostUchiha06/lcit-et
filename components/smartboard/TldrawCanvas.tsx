"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface Shape {
  id: string;
  type: "rectangle" | "ellipse" | "diamond" | "triangle" | "hexagon" | "star" | "line" | "arrow" | "text" | "note";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fillColor?: string;
  strokeWidth: number;
  text?: string;
  rotation?: number;
}

interface TldrawCanvasProps {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  onEditorReady?: (editor: any) => void;
  currentTool?: string;
  currentColor?: string;
  strokeWidth?: number;
  currentShape?: string;
  shapes?: Shape[];
  onShapesChange?: (shapes: Shape[]) => void;
}

export default function TldrawCanvas({
  bgColor,
  gridType,
  onEditorReady,
  currentTool = "draw",
  currentColor = "#000000",
  strokeWidth = 4,
  currentShape = "rectangle",
  shapes = [],
  onShapesChange,
}: TldrawCanvasProps) {
  const editorRef = useRef<any>(null);
  const [TldrawComponent, setTldrawComponent] = useState<any>(null);
  const isMountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const shapesLayerRef = useRef<HTMLDivElement>(null);
  const [localShapes, setLocalShapes] = useState<Shape[]>(shapes);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, shapeX: 0, shapeY: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, shapeX: 0, shapeY: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    setLocalShapes(shapes);
  }, [shapes]);

  useEffect(() => {
    if (onShapesChange) {
      onShapesChange(localShapes);
    }
  }, [localShapes, onShapesChange]);

  const handleMount = useCallback((editor: any) => {
    editorRef.current = editor;
    editor.user.updateUserPreferences({ color: currentColor });
    onEditorReady?.(editor);
  }, [onEditorReady, currentColor]);

  useEffect(() => {
    if (!editorRef.current) return;
    
    const toolMap: Record<string, string> = {
      select: "select",
      draw: "draw",
      highlight: "highlight",
      eraser: "eraser",
      geo: "geo",
      arrow: "arrow",
      line: "line",
      text: "text",
      note: "note",
    };
    
    const tldrawTool = toolMap[currentTool] || "select";
    
    try {
      const editor = editorRef.current;
      if (editor.getCurrentToolId() !== tldrawTool) {
        editor.setCurrentTool(tldrawTool);
      }
    } catch (e) {
      console.error("Tool change error:", e);
    }
  }, [currentTool]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.user.updateUserPreferences({ color: currentColor });
    }
  }, [currentColor]);

  const getShapeStyles = (shape: Shape) => {
    const baseStyle = {
      left: shape.x,
      top: shape.y,
      width: shape.width,
      height: shape.height,
      borderColor: shape.color,
      borderWidth: shape.strokeWidth,
      backgroundColor: shape.fillColor || "transparent",
      transform: shape.rotation ? `rotate(${shape.rotation}deg)` : undefined,
    };

    switch (shape.type) {
      case "rectangle":
        return { ...baseStyle, borderRadius: "4px" };
      case "ellipse":
        return { ...baseStyle, borderRadius: "50%" };
      case "diamond":
        return { ...baseStyle, transform: `rotate(45deg) ${shape.rotation ? `rotate(${shape.rotation}deg)` : ''}`, width: shape.width * 0.707, height: shape.height * 0.707, left: shape.x + shape.width * 0.146, top: shape.y + shape.height * 0.146 };
      case "triangle":
        return { ...baseStyle, backgroundColor: "transparent", border: "none", clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" };
      case "hexagon":
        return { ...baseStyle, clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" };
      case "star":
        return { ...baseStyle, backgroundColor: "transparent", border: "none", clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" };
      case "note":
        return { ...baseStyle, backgroundColor: "#fef08a", borderRadius: "2px", boxShadow: "2px 2px 5px rgba(0,0,0,0.1)" };
      case "line":
        return { ...baseStyle, height: shape.strokeWidth, backgroundColor: shape.color, borderRadius: shape.strokeWidth / 2 };
      case "arrow":
        return { ...baseStyle, height: shape.strokeWidth, backgroundColor: shape.color };
      default:
        return baseStyle;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (currentTool === "geo" || currentTool === "line" || currentTool === "arrow" || currentTool === "note") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setDrawStart({ x, y });
      setIsDrawing(true);
    } else if (currentTool === "select") {
      setSelectedShapeId(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (currentTool !== "geo" && currentTool !== "line" && currentTool !== "arrow" && currentTool !== "note") return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setDrawStart({ x, y });
    setIsDrawing(true);
    e.stopPropagation();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selectedShapeId) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - dragStartRef.current.x;
      const dy = y - dragStartRef.current.y;
      
      setLocalShapes((prev) =>
        prev.map((s) =>
          s.id === selectedShapeId
            ? { ...s, x: dragStartRef.current.shapeX + dx, y: dragStartRef.current.shapeY + dy }
            : s
        )
      );
    } else if (isResizing && selectedShapeId && resizeHandle) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const dx = x - resizeStartRef.current.x;
      const dy = y - resizeStartRef.current.y;
      
      let newWidth = resizeStartRef.current.width;
      let newHeight = resizeStartRef.current.height;
      let newX = resizeStartRef.current.shapeX;
      let newY = resizeStartRef.current.shapeY;
      
      if (resizeHandle.includes("e")) newWidth = Math.max(20, resizeStartRef.current.width + dx);
      if (resizeHandle.includes("w")) { newWidth = Math.max(20, resizeStartRef.current.width - dx); newX = resizeStartRef.current.shapeX + dx; }
      if (resizeHandle.includes("s")) newHeight = Math.max(20, resizeStartRef.current.height + dy);
      if (resizeHandle.includes("n")) { newHeight = Math.max(20, resizeStartRef.current.height - dy); newY = resizeStartRef.current.shapeY + dy; }
      
      setLocalShapes((prev) =>
        prev.map((s) =>
          s.id === selectedShapeId
            ? { ...s, x: newX, y: newY, width: newWidth, height: newHeight }
            : s
        )
      );
    } else if (isDrawing) {
      // Preview drawing - handled by render
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      return;
    }
    if (isDrawing) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newX = Math.min(drawStart.x, x);
      const newY = Math.min(drawStart.y, y);
      const width = Math.max(40, Math.abs(x - drawStart.x));
      const height = Math.max(40, Math.abs(y - drawStart.y));
      
      if (width > 10 && height > 10) {
        const newShape: Shape = {
          id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: currentTool === "geo" ? currentShape as Shape["type"] :
                currentTool === "line" ? "line" :
                currentTool === "arrow" ? "arrow" :
                currentTool === "note" ? "note" : "rectangle",
          x: newX,
          y: newY,
          width,
          height,
          color: currentColor,
          strokeWidth,
          fillColor: currentTool === "note" ? "#fef08a" : undefined,
        };
        
        setLocalShapes((prev) => [...prev, newShape]);
      }
      
      setIsDrawing(false);
    }
  };

  const handleShapeMouseDown = (e: React.MouseEvent, shapeId: string) => {
    e.stopPropagation();
    if (currentTool !== "select") return;
    
    setSelectedShapeId(shapeId);
    setIsDragging(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const shape = localShapes.find((s) => s.id === shapeId);
    if (shape) {
      dragStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        shapeX: shape.x,
        shapeY: shape.y,
      };
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || !selectedShapeId) return;
    
    const shape = localShapes.find((s) => s.id === selectedShapeId);
    if (shape) {
      resizeStartRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: shape.width,
        height: shape.height,
        shapeX: shape.x,
        shapeY: shape.y,
      };
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === "Delete" || e.key === "Backspace") && selectedShapeId) {
      setLocalShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
      setSelectedShapeId(null);
    }
  }, [selectedShapeId]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const renderShape = (shape: Shape) => {
    const isSelected = selectedShapeId === shape.id;
    const styles = getShapeStyles(shape);
    
    return (
      <div
        key={shape.id}
        className="absolute cursor-move select-none"
        style={{
          ...styles,
          borderStyle: "solid",
          borderColor: shape.color,
          borderWidth: shape.strokeWidth,
          position: "absolute",
          zIndex: isSelected ? 100 : 10,
        }}
        onMouseDown={(e) => handleShapeMouseDown(e, shape.id)}
      >
        {shape.type === "triangle" && (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,5 95,95 5,95"
              fill={shape.fillColor || "transparent"}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth}
            />
          </svg>
        )}
        {shape.type === "star" && (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              points="50,5 61,35 95,35 68,57 79,90 50,70 21,90 32,57 5,35 39,35"
              fill={shape.fillColor || shape.color}
              stroke={shape.color}
              strokeWidth={shape.strokeWidth / 2}
            />
          </svg>
        )}
        {shape.type === "note" && (
          <div className="w-full h-full p-2 text-sm overflow-hidden" style={{ color: "#333" }}>
            {shape.text || "Double-click to edit"}
          </div>
        )}
        {shape.type === "arrow" && (
          <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
            <defs>
              <marker id={`arrowhead-${shape.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill={shape.color} />
              </marker>
            </defs>
            <line x1="0" y1="10" x2="90" y2="10" stroke={shape.color} strokeWidth={shape.strokeWidth} markerEnd={`url(#arrowhead-${shape.id})`} />
          </svg>
        )}
        {shape.type === "line" && (
          <svg width="100%" height="100%" viewBox={`0 0 ${shape.width} ${shape.strokeWidth}`} preserveAspectRatio="none">
            <line x1="0" y1={shape.strokeWidth / 2} x2={shape.width} y2={shape.strokeWidth / 2} stroke={shape.color} strokeWidth={shape.strokeWidth} strokeLinecap="round" />
          </svg>
        )}
        
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize" onMouseDown={(e) => handleResizeMouseDown(e, "nw")} />
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-n-resize" onMouseDown={(e) => handleResizeMouseDown(e, "n")} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize" onMouseDown={(e) => handleResizeMouseDown(e, "ne")} />
            <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-w-resize" onMouseDown={(e) => handleResizeMouseDown(e, "w")} />
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-e-resize" onMouseDown={(e) => handleResizeMouseDown(e, "e")} />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize" onMouseDown={(e) => handleResizeMouseDown(e, "sw")} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-blue-500 cursor-s-resize" onMouseDown={(e) => handleResizeMouseDown(e, "s")} />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize" onMouseDown={(e) => handleResizeMouseDown(e, "se")} />
          </>
        )}
      </div>
    );
  };

  const renderDrawingPreview = () => {
    if (!isDrawing) return null;
    
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;
    
    const previewX = Math.min(drawStart.x, drawStart.x);
    const previewY = Math.min(drawStart.y, drawStart.y);
    
    return (
      <div
        className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10 pointer-events-none"
        style={{
          left: previewX,
          top: previewY,
          zIndex: 1000,
        }}
      />
    );
  };

  const gridColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#666" : "#ddd";
  const lineColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#444" : "#eee";

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
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{ cursor: currentTool === "geo" || currentTool === "line" || currentTool === "arrow" || currentTool === "note" ? "crosshair" : currentTool === "select" ? "default" : "crosshair" }}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
    >
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          backgroundColor: bgColor, 
          backgroundImage: gridType === "dots" 
            ? `radial-gradient(circle, ${gridColor} 1.5px, transparent 1.5px)` 
            : gridType === "lines" 
              ? `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)` 
              : "none", 
          backgroundSize: gridType === "dots" ? "24px 24px" : gridType === "lines" ? "24px 24px" : "auto",
          zIndex: 0,
        }}
      />
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: currentTool === "select" ? "auto" : "none" }}>
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
      <div 
        ref={shapesLayerRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 2, pointerEvents: "none" }}
      >
        {localShapes.map(renderShape)}
        {renderDrawingPreview()}
      </div>
    </div>
  );
}
