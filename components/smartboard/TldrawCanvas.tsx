"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type Tool = "select" | "hand" | "pencil" | "pen" | "eraser" | "line" | "arrow" | "rect" | "circle" | "triangle" | "diamond" | "text" | "note";
type LineStyle = "solid" | "dashed" | "dotted";

interface Point { x: number; y: number; }

interface DrawObject {
  type: string;
  c: string;
  fc: string;
  w: number;
  op: number;
  x?: number; y?: number;
  w2?: number; h?: number;
  x1?: number; y1?: number; x2?: number; y2?: number;
  x3?: number; y3?: number;
  cx?: number; cy?: number; rx?: number; ry?: number;
  pts?: Point[];
  smooth?: boolean;
  text?: string;
  fs?: number;
  lineStyle?: LineStyle;
}

interface TldrawCanvasProps {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  currentTool?: Tool;
  currentColor?: string;
  strokeWidth?: number;
  currentShape?: string;
  fillColor?: string;
  fillEnabled?: boolean;
  lineStyle?: LineStyle;
  onObjectsChange?: (objects: DrawObject[]) => void;
  onExportReady?: (exportFn: (format: string) => void) => void;
}

const STROKE_COLORS = ['#000000', '#1e293b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#ffffff', '#94a3b8'];
const FILL_COLORS = ['#fef2f2', '#fff7ed', '#fefce8', '#f0fdf4', '#ecfeff', '#eef2ff', '#fdf4ff', '#fff1f2', 'transparent'];
const NOTE_COLORS = ['#fef08a', '#bbf7d0', '#bae6fd', '#fecaca', '#e9d5ff', '#fed7aa'];

function dSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}

function hitTest(o: DrawObject, px: number, py: number, eraserSize = 24) {
  const T = 8;
  switch (o.type) {
    case 'rect':
    case 'circle':
      return px >= (o.x || 0) - T && px <= (o.x || 0) + (o.w2 || 0) + T && py >= (o.y || 0) - T && py <= (o.y || 0) + (o.h || 0) + T;
    case 'line':
    case 'arrow':
      return dSeg(px, py, o.x1 || 0, o.y1 || 0, o.x2 || 0, o.y2 || 0) < T;
    case 'triangle':
      return px >= Math.min(o.x1 || 0, o.x2 || 0, o.x3 || 0) - T && px <= Math.max(o.x1 || 0, o.x2 || 0, o.x3 || 0) + T &&
             py >= Math.min(o.y1 || 0, o.y2 || 0, o.y3 || 0) - T && py <= Math.max(o.y1 || 0, o.y2 || 0, o.y3 || 0) + T;
    case 'diamond':
      return (Math.abs(px - (o.cx || 0)) / (o.rx || 1)) + (Math.abs(py - (o.cy || 0)) / (o.ry || 1)) <= 1 + T / Math.max(o.rx || 1, o.ry || 1);
    case 'path':
      return (o.pts || []).some((p, i) => i > 0 && dSeg(px, py, o.pts![i - 1].x, o.pts![i - 1].y, p.x, p.y) < T);
    case 'text':
      return px >= (o.x || 0) - T && px <= (o.x || 0) + 200 && py >= (o.y || 0) - (o.fs || 18) - T && py <= (o.y || 0) + T;
    default:
      return false;
  }
}

function bbox(o: DrawObject) {
  switch (o.type) {
    case 'rect':
    case 'circle':
      return { x: o.x || 0, y: o.y || 0, w: o.w2 || 0, h: o.h || 0 };
    case 'line':
    case 'arrow':
      return { x: Math.min(o.x1 || 0, o.x2 || 0), y: Math.min(o.y1 || 0, o.y2 || 0), w: Math.abs((o.x2 || 0) - (o.x1 || 0)), h: Math.abs((o.y2 || 0) - (o.y1 || 0)) };
    case 'triangle':
      return { x: Math.min(o.x1 || 0, o.x2 || 0, o.x3 || 0), y: Math.min(o.y1 || 0, o.y2 || 0, o.y3 || 0), w: Math.max(o.x1 || 0, o.x2 || 0, o.x3 || 0) - Math.min(o.x1 || 0, o.x2 || 0, o.x3 || 0), h: Math.max(o.y1 || 0, o.y2 || 0, o.y3 || 0) - Math.min(o.y1 || 0, o.y2 || 0, o.y3 || 0) };
    case 'diamond':
      return { x: (o.cx || 0) - (o.rx || 0), y: (o.cy || 0) - (o.ry || 0), w: (o.rx || 0) * 2, h: (o.ry || 0) * 2 };
    case 'path':
      if (!o.pts?.length) return null;
      return { x: Math.min(...o.pts.map(p => p.x)), y: Math.min(...o.pts.map(p => p.y)), w: Math.max(...o.pts.map(p => p.x)) - Math.min(...o.pts.map(p => p.x)), h: Math.max(...o.pts.map(p => p.y)) - Math.min(...o.pts.map(p => p.y)) };
    case 'text':
      return { x: o.x || 0, y: o.y || 0, w: 200, h: (o.fs || 18) * 2 };
    default:
      return null;
  }
}

export default function TldrawCanvas({
  bgColor,
  gridType,
  currentTool = "pencil",
  currentColor = "#1e293b",
  strokeWidth = 2,
  currentShape = "rectangle",
  fillColor = "transparent",
  fillEnabled = false,
  lineStyle = "solid",
  onObjectsChange,
}: TldrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [objects, setObjects] = useState<DrawObject[]>([]);
  const [curObj, setCurObj] = useState<DrawObject | null>(null);
  const [selIdx, setSelIdx] = useState(-1);
  const [drawing, setDrawing] = useState(false);
  const [panning, setPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [zoom, setZoomState] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [sx, setSx] = useState(0);
  const [sy, setSy] = useState(0);
  const [lx, setLx] = useState(0);
  const [ly, setLy] = useState(0);
  const [showGrid, setShowGrid] = useState(gridType !== "none");
  const [history, setHistory] = useState<DrawObject[][]>([[]]);
  const [hi, setHi] = useState([0]);

  const activeTool: Tool = currentTool as Tool;

  useEffect(() => {
    setShowGrid(gridType !== "none");
  }, [gridType]);

  useEffect(() => {
    onObjectsChange?.(objects);
  }, [objects, onObjectsChange]);

  const cpx = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - panX) / zoom,
      y: (e.clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    objects.forEach(o => drawO(ctx, o));
    if (curObj) drawO(ctx, curObj);
    if (selIdx >= 0 && selIdx < objects.length) drawSel(ctx, objects[selIdx]);

    ctx.restore();
  }, [objects, curObj, selIdx, panX, panY, zoom]);

  const drawO = (c: CanvasRenderingContext2D, o: DrawObject) => {
    c.save();
    c.globalAlpha = o.op ?? 1;
    c.strokeStyle = o.c ?? "#000";
    c.fillStyle = o.fc ?? "transparent";
    c.lineWidth = o.w ?? 2;
    c.lineCap = "round";
    c.lineJoin = "round";

    if (o.lineStyle === "dashed") {
      c.setLineDash([10, 8]);
    } else if (o.lineStyle === "dotted") {
      c.setLineDash([3, 5]);
    } else {
      c.setLineDash([]);
    }

    switch (o.type) {
      case "path":
        if (!o.pts || o.pts.length < 2) break;
        c.beginPath();
        if (o.smooth && o.pts.length > 2) {
          c.moveTo(o.pts[0].x, o.pts[0].y);
          for (let i = 1; i < o.pts.length - 1; i++) {
            const mx = (o.pts[i].x + o.pts[i + 1].x) / 2;
            const my = (o.pts[i].y + o.pts[i + 1].y) / 2;
            c.quadraticCurveTo(o.pts[i].x, o.pts[i].y, mx, my);
          }
          c.lineTo(o.pts[o.pts.length - 1].x, o.pts[o.pts.length - 1].y);
        } else {
          c.moveTo(o.pts[0].x, o.pts[0].y);
          o.pts.forEach(p => c.lineTo(p.x, p.y));
        }
        c.stroke();
        break;
      case "line":
        c.beginPath();
        c.moveTo(o.x1 || 0, o.y1 || 0);
        c.lineTo(o.x2 || 0, o.y2 || 0);
        c.stroke();
        break;
      case "arrow": {
        c.beginPath();
        c.moveTo(o.x1 || 0, o.y1 || 0);
        c.lineTo(o.x2 || 0, o.y2 || 0);
        c.stroke();
        const ang = Math.atan2((o.y2 || 0) - (o.y1 || 0), (o.x2 || 0) - (o.x1 || 0));
        const hs = Math.max(12, (o.w || 2) * 4);
        c.beginPath();
        c.moveTo(o.x2 || 0, o.y2 || 0);
        c.lineTo(o.x2! - hs * Math.cos(ang - Math.PI / 6), o.y2! - hs * Math.sin(ang - Math.PI / 6));
        c.lineTo(o.x2! - hs * Math.cos(ang + Math.PI / 6), o.y2! - hs * Math.sin(ang + Math.PI / 6));
        c.closePath();
        c.fillStyle = o.c;
        c.fill();
        break;
      }
      case "rect":
        if (o.fc !== "transparent") c.fillRect(o.x || 0, o.y || 0, o.w2 || 0, o.h || 0);
        c.strokeRect(o.x || 0, o.y || 0, o.w2 || 0, o.h || 0);
        break;
      case "circle":
        c.beginPath();
        c.ellipse((o.x || 0) + (o.w2 || 0) / 2, (o.y || 0) + (o.h || 0) / 2, Math.abs((o.w2 || 0) / 2) || 1, Math.abs((o.h || 0) / 2) || 1, 0, 0, Math.PI * 2);
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      case "triangle":
        c.beginPath();
        c.moveTo(o.x1 || 0, o.y1 || 0);
        c.lineTo(o.x2 || 0, o.y2 || 0);
        c.lineTo(o.x3 || 0, o.y3 || 0);
        c.closePath();
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      case "diamond":
        c.beginPath();
        c.moveTo(o.cx || 0, (o.cy || 0) - (o.ry || 0));
        c.lineTo((o.cx || 0) + (o.rx || 0), o.cy || 0);
        c.lineTo(o.cx || 0, (o.cy || 0) + (o.ry || 0));
        c.lineTo((o.cx || 0) - (o.rx || 0), o.cy || 0);
        c.closePath();
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      case "text":
        c.font = `${o.fs || 18}px system-ui, sans-serif`;
        c.fillStyle = o.c || "#000";
        c.globalAlpha = o.op ?? 1;
        (o.text || "").split("\n").forEach((ln, i) => c.fillText(ln, o.x || 0, (o.y || 0) + i * ((o.fs || 18) * 1.3)));
        break;
    }
    c.restore();
  };

  const drawSel = (c: CanvasRenderingContext2D, o: DrawObject) => {
    const bb = bbox(o);
    if (!bb) return;
    c.save();
    c.strokeStyle = "#6366f1";
    c.lineWidth = 2 / zoom;
    c.setLineDash([5 / zoom, 3 / zoom]);
    c.strokeRect(bb.x - 7 / zoom, bb.y - 7 / zoom, bb.w + 14 / zoom, bb.h + 14 / zoom);
    c.fillStyle = "rgba(99, 102, 241, 0.07)";
    c.fillRect(bb.x - 7 / zoom, bb.y - 7 / zoom, bb.w + 14 / zoom, bb.h + 14 / zoom);
    c.restore();
  };

  const moveObj = (o: DrawObject, dx: number, dy: number) => {
    switch (o.type) {
      case "rect":
      case "circle":
        o.x! += dx; o.y! += dy;
        break;
      case "line":
      case "arrow":
        o.x1! += dx; o.y1! += dy; o.x2! += dx; o.y2! += dy;
        break;
      case "triangle":
        o.x1! += dx; o.y1! += dy; o.x2! += dx; o.y2! += dy; o.x3! += dx; o.y3! += dy;
        break;
      case "diamond":
        o.cx! += dx; o.cy! += dy;
        break;
      case "path":
        o.pts?.forEach(p => { p.x += dx; p.y += dy; });
        break;
      case "text":
        o.x! += dx; o.y! += dy;
        break;
    }
  };

  const mkShape = (tool: string, x1: number, y1: number, x2: number, y2: number): DrawObject => {
    const base: DrawObject = { type: tool, c: currentColor, fc: fillEnabled ? fillColor : "transparent", w: strokeWidth, op: 1, lineStyle };
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const ww = Math.abs(x2 - x1);
    const hh = Math.abs(y2 - y1);
    switch (tool) {
      case "line":
        return { ...base, type: "line", x1, y1, x2, y2 };
      case "arrow":
        return { ...base, type: "arrow", x1, y1, x2, y2 };
      case "rect":
        return { ...base, type: "rect", x, y, w2: ww, h: hh };
      case "circle":
        return { ...base, type: "circle", x, y, w2: ww, h: hh };
      case "triangle":
        return { ...base, type: "triangle", x1: x1 + (x2 - x1) / 2, y1, x2, y2, x3: x1, y3: y2 };
      case "diamond": {
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        return { ...base, type: "diamond", cx, cy, rx: ww / 2, ry: hh / 2 };
      }
      default:
        return { ...base, type: "rect", x, y, w2: ww, h: hh };
    }
  };

  const pushHist = () => {
    setHistory(prev => {
      const newHist = [...prev];
      newHist[newHist.length - 1] = [...objects];
      return [...newHist, [...objects]];
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      render();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && spaceDown)) {
        setPanning(true);
        setLx(e.clientX);
        setLy(e.clientY);
        return;
      }
      if (e.button !== 0) return;

      const p = cpx(e);
      if (activeTool === "hand") {
        setPanning(true);
        setLx(e.clientX);
        setLy(e.clientY);
        return;
      }

      setDrawing(true);
      setSx(p.x);
      setSy(p.y);
      setLx(p.x);
      setLy(p.y);

      if (activeTool === "pencil" || activeTool === "pen") {
        setCurObj({ type: "path", pts: [{ x: p.x, y: p.y }], c: currentColor, fc: "transparent", w: strokeWidth, smooth: activeTool === "pen", op: 1, lineStyle });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (panning) {
        setPanX(prev => prev + e.clientX - lx);
        setPanY(prev => prev + e.clientY - ly);
        setLx(e.clientX);
        setLy(e.clientY);
        return;
      }
      if (!drawing) return;

      const p = cpx(e);

      if (activeTool === "select" && selIdx >= 0) {
        const dx = p.x - sx;
        const dy = p.y - sy;
        setObjects(prev => {
          const newObjs = [...prev];
          moveObj(newObjs[selIdx], dx, dy);
          return newObjs;
        });
        setSx(p.x);
        setSy(p.y);
        render();
        return;
      }

      if (activeTool === "eraser") {
        const r = strokeWidth * 3;
        setObjects(prev => prev.filter(o => !hitTest(o, p.x, p.y) || Math.hypot(p.x - (o.cx ?? o.x ?? o.x1 ?? 0), p.y - (o.cy ?? o.y ?? o.y1 ?? 0)) >= r * 3));
        render();
        return;
      }

      if (activeTool === "pencil" || activeTool === "pen") {
        setCurObj(prev => prev ? { ...prev, pts: [...(prev.pts || []), { x: p.x, y: p.y }] } : null);
        render();
        return;
      }

      if (["line", "arrow", "rect", "circle", "triangle", "diamond"].includes(activeTool)) {
        setCurObj(mkShape(activeTool, sx, sy, p.x, p.y));
        render();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (panning) {
        setPanning(false);
        return;
      }
      if (!drawing) return;
      setDrawing(false);

      if (activeTool === "select") {
        render();
        return;
      }

      if (activeTool === "eraser") {
        pushHist();
        render();
        return;
      }

      if (curObj) {
        if (curObj.type === "path" && (curObj.pts?.length || 0) < 2) {
          setCurObj(null);
          return;
        }
        setObjects(prev => [...prev, curObj]);
        pushHist();
        setCurObj(null);
        render();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const f = e.deltaY < 0 ? 1.1 : 0.909;
        const rect = canvas.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        setPanX(prev => px - (px - prev) * f);
        setPanY(prev => py - (py - prev) * f);
        setZoomState(prev => Math.max(0.08, Math.min(8, prev * f)));
        setTimeout(render, 0);
      } else {
        setPanX(prev => prev - e.deltaX);
        setPanY(prev => prev - e.deltaY);
        setTimeout(render, 0);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpaceDown(true);
        return;
      }
      if (e.code === "Delete" || e.code === "Backspace") {
        if (selIdx >= 0) {
          setObjects(prev => prev.filter((_, i) => i !== selIdx));
          setSelIdx(-1);
          pushHist();
          render();
        }
      }
      if (e.code === "Escape") {
        setSelIdx(-1);
        render();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        setHistory(prev => {
          if (prev.length <= 1) return prev;
          const newHist = [...prev];
          newHist.pop();
          setObjects(newHist[newHist.length - 1] || []);
          setTimeout(render, 0);
          return newHist;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };

    const handleClick = (e: MouseEvent) => {
      if (activeTool !== "select") return;
      const p = cpx(e);
      setSelIdx(-1);
      for (let i = objects.length - 1; i >= 0; i--) {
        if (hitTest(objects[i], p.x, p.y)) {
          setSelIdx(i);
          break;
        }
      }
      render();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      observer.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool, drawing, panning, sx, sy, lx, ly, curObj, selIdx, objects, spaceDown, strokeWidth, currentColor, fillEnabled, fillColor, lineStyle, cpx, render]);

  useEffect(() => {
    render();
  }, [render]);

  const gridColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#666" : "#ddd";
  const lineColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#444" : "#eee";

  const getCursor = () => {
    switch (activeTool) {
      case "select": return "default";
      case "hand": return panning ? "grabbing" : "grab";
      case "eraser": return "cell";
      case "text": return "text";
      default: return "crosshair";
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor: bgColor,
        backgroundImage: showGrid
          ? gridType === "dots"
            ? `radial-gradient(circle, ${gridColor} 1.5px, transparent 1.5px)`
            : `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`
          : "none",
        backgroundSize: showGrid ? (gridType === "dots" ? "24px 24px" : "24px 24px") : "auto",
        cursor: getCursor(),
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

export { hitTest, bbox, dSeg };
export type { DrawObject, Tool, LineStyle, Point };
