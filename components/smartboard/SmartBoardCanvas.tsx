"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface DrawObject {
  id: string;
  type: "pen" | "highlight" | "eraser" | "line" | "arrow" | "rect" | "circle" | "triangle" | "text";
  points?: Point[];
  color: string;
  width: number;
  opacity: number;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  text?: string;
  fontSize?: number;
}

interface Template {
  name: string;
  category: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

const TEMPLATES: Template[] = [
  {
    name: "Blank Grid",
    category: "General",
    draw: (ctx, w, h) => {
      ctx.strokeStyle = "#d0d8e8";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
  },
  {
    name: "Dot Grid",
    category: "General",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#aab4c8";
      for (let x = 28; x < w; x += 28) {
        for (let y = 28; y < h; y += 28) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    name: "Lined Paper",
    category: "General",
    draw: (ctx, w, h) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#b8cfe8";
      ctx.lineWidth = 1;
      for (let y = 60; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(56, y);
        ctx.lineTo(w - 20, y);
        ctx.stroke();
      }
      ctx.strokeStyle = "#f4a0a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(54, 0);
      ctx.lineTo(54, h);
      ctx.stroke();
    },
  },
  {
    name: "Waveform Axes",
    category: "Signal",
    draw: (ctx, w, h) => {
      const px = 60, py = 30, ex = w - 30, mid = h / 2;
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, h - 30);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px, mid);
      ctx.lineTo(ex, mid);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px - 5, py + 10);
      ctx.lineTo(px, py);
      ctx.lineTo(px + 5, py + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ex - 10, mid - 5);
      ctx.lineTo(ex, mid);
      ctx.lineTo(ex - 10, mid + 5);
      ctx.stroke();
      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#444";
      ctx.fillText("t", ex - 10, mid - 10);
      ctx.fillText("V", px + 4, py + 14);
    },
  },
  {
    name: "Bode Plot",
    category: "Signal",
    draw: (ctx, w, h) => {
      const pad = 55, mid = h / 2;
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pad, 16);
      ctx.lineTo(pad, mid - 12);
      ctx.lineTo(w - 16, mid - 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, mid + 8);
      ctx.lineTo(pad, h - 22);
      ctx.lineTo(w - 16, h - 22);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#555";
      ctx.fillText("|H(jω)| dB", pad + 4, 14);
      ctx.fillText("∠H(jω)°", pad + 4, mid + 7);
    },
  },
  {
    name: "Op-Amp Inverting",
    category: "Analog",
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 55);
      ctx.lineTo(cx - 70, cy + 55);
      ctx.lineTo(cx + 70, cy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = "18px serif";
      ctx.fillStyle = "#111";
      ctx.fillText("−", cx - 60, cy - 16);
      ctx.fillText("+", cx - 60, cy + 32);
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 150, cy - 28);
      ctx.lineTo(cx - 110, cy - 28);
      ctx.stroke();
      ctx.font = "10px sans-serif";
      ctx.fillStyle = "#555";
      ctx.fillText("Rin", cx - 104, cy - 22);
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy - 40);
      ctx.lineTo(cx - 70, cy - 90);
      ctx.lineTo(cx + 100, cy - 90);
      ctx.lineTo(cx + 100, cy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(cx + 70, cy);
      ctx.lineTo(cx + 120, cy);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#666";
      ctx.fillText("Vin", cx - 158, cy - 18);
      ctx.fillText("Vout", cx + 72, cy - 6);
    },
  },
  {
    name: "RC Low-Pass",
    category: "Analog",
    draw: (ctx, w, h) => {
      const cy = h / 2, sx = 60;
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, cy);
      ctx.lineTo(sx + 70, cy);
      ctx.stroke();
      ctx.strokeRect(sx + 70, cy - 16, 55, 32);
      ctx.font = "12px sans-serif";
      ctx.fillStyle = "#333";
      ctx.fillText("R", sx + 90, cy + 6);
      ctx.beginPath();
      ctx.moveTo(sx + 125, cy);
      ctx.lineTo(sx + 175, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 175, cy - 24);
      ctx.lineTo(sx + 175, cy + 24);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 187, cy - 24);
      ctx.lineTo(sx + 187, cy + 24);
      ctx.stroke();
      ctx.fillText("C", sx + 174, cy + 40);
      ctx.beginPath();
      ctx.moveTo(sx + 187, cy);
      ctx.lineTo(sx + 270, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx + 181, cy + 24);
      ctx.lineTo(sx + 181, cy + 55);
      ctx.stroke();
      ctx.fillStyle = "#666";
      ctx.font = "11px sans-serif";
      ctx.fillText("Vin", sx + 4, cy - 8);
      ctx.fillText("Vout", sx + 274, cy - 8);
    },
  },
  {
    name: "555 Timer",
    category: "Analog",
    draw: (ctx, w, h) => {
      const bx = w / 2 - 80, by = h / 2 - 100;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.fillRect(bx, by, 160, 200);
      ctx.strokeRect(bx, by, 160, 200);
      ctx.font = "13px bold sans-serif";
      ctx.fillStyle = "#111";
      ctx.fillText("NE555", bx + 44, by + 22);
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1.5;
      const leftPins: [string, number][] = [
        ["GND", 0],
        ["TRIG", 1],
        ["OUT", 2],
        ["RST", 3],
      ];
      const rightPins: [string, number][] = [
        ["VCC", 0],
        ["DIS", 1],
        ["THR", 2],
        ["CV", 3],
      ];
      const s = by + 45, rh = 38;
      ctx.font = "11px sans-serif";
      leftPins.forEach(([n, i]) => {
        const y = s + i * rh;
        ctx.beginPath();
        ctx.moveTo(bx - 35, y);
        ctx.lineTo(bx, y);
        ctx.stroke();
        ctx.fillStyle = "#444";
        ctx.fillText(n, bx - 33, y - 3);
      });
      rightPins.forEach(([n, i]) => {
        const y = s + i * rh;
        ctx.beginPath();
        ctx.moveTo(bx + 160, y);
        ctx.lineTo(bx + 195, y);
        ctx.stroke();
        ctx.fillStyle = "#444";
        ctx.fillText(n, bx + 162, y - 3);
      });
    },
  },
  {
    name: "Logic Gates",
    category: "Digital",
    draw: (ctx, w, h) => {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      const drawAND = (x: number, y: number) => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(x, y - 22);
        ctx.lineTo(x + 22, y - 22);
        ctx.arc(x + 22, y, 22, Math.PI * 1.5, Math.PI * 0.5);
        ctx.lineTo(x, y + 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 22, y - 11);
        ctx.lineTo(x, y - 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 22, y + 11);
        ctx.lineTo(x, y + 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 44, y);
        ctx.lineTo(x + 66, y);
        ctx.stroke();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#333";
        ctx.fillText("AND", x + 2, y + 4);
      };
      const drawOR = (x: number, y: number) => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(x, y - 22);
        ctx.quadraticCurveTo(x + 22, y - 22, x + 44, y);
        ctx.quadraticCurveTo(x + 22, y + 22, x, y + 22);
        ctx.quadraticCurveTo(x + 12, y, x, y - 22);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 22, y - 11);
        ctx.lineTo(x + 4, y - 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 22, y + 11);
        ctx.lineTo(x + 4, y + 11);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 44, y);
        ctx.lineTo(x + 66, y);
        ctx.stroke();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#333";
        ctx.fillText("OR", x + 10, y + 4);
      };
      const drawNOT = (x: number, y: number) => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(x, y - 20);
        ctx.lineTo(x + 38, y);
        ctx.lineTo(x, y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 42, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 22, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 46, y);
        ctx.lineTo(x + 68, y);
        ctx.stroke();
        ctx.font = "10px sans-serif";
        ctx.fillStyle = "#333";
        ctx.fillText("NOT", x + 4, y + 4);
      };
      const col = w / 4;
      drawAND(col - 33, h / 3);
      drawOR(col - 33, (h * 2) / 3);
      drawNOT(col * 2 - 33, h / 2);
    },
  },
  {
    name: "Full Wave Rect.",
    category: "Power",
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2, r = 22;
      const pts = [
        [cx, cy - 90],
        [cx + 90, cy],
        [cx, cy + 90],
        [cx - 90, cy],
      ];
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.fillStyle = "#fff";
      pts.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.lineTo(x + r, y);
        ctx.lineTo(x, y + r);
        ctx.lineTo(x - r, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(cx - 90, cy);
      ctx.lineTo(cx - 140, cy);
      ctx.moveTo(cx + 90, cy);
      ctx.lineTo(cx + 140, cy);
      ctx.moveTo(cx, cy - 90);
      ctx.lineTo(cx, cy - 120);
      ctx.moveTo(cx, cy + 90);
      ctx.lineTo(cx, cy + 120);
      ctx.stroke();
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#666";
      ctx.fillText("AC", cx - 136, cy - 6);
      ctx.fillText("DC+", cx + 92, cy - 6);
    },
  },
  {
    name: "OSI Layers",
    category: "Comms",
    draw: (ctx, w, h) => {
      const layers: [string, string][] = [
        ["7 · Application", "#4a90e2"],
        ["6 · Presentation", "#7b68ee"],
        ["5 · Session", "#50c878"],
        ["4 · Transport", "#f0a500"],
        ["3 · Network", "#e05c5c"],
        ["2 · Data Link", "#e07a5f"],
        ["1 · Physical", "#6c757d"],
      ];
      const lh = Math.floor((h - 50) / 7), lw = Math.min(260, w - 40);
      const sx = (w - lw) / 2, sy = 28;
      ctx.font = "13px sans-serif";
      layers.forEach(([name, col], i) => {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.roundRect(sx, sy + i * lh, lw, lh - 3, 5);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(name, sx + 14, sy + i * lh + lh / 2 + 5);
      });
      ctx.font = "13px bold sans-serif";
      ctx.fillStyle = "#222";
      ctx.fillText("OSI Network Model", sx + lw / 2 - 68, 18);
    },
  },
];

const COLORS = [
  "#000000", "#ffffff", "#e05c5c", "#f0a500", "#50c878",
  "#4a90e2", "#7b68ee", "#e07a5f", "#6c757d",
];

export default function SmartBoardCanvas({
  bgColor = "#ffffff",
  onBgColorChange,
  gridType = "none",
  onGridTypeChange,
}: {
  bgColor?: string;
  onBgColorChange?: (color: string) => void;
  gridType?: "dots" | "lines" | "none";
  onGridTypeChange?: (type: "dots" | "lines" | "none") => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [size, setSize] = useState(4);
  const [opacity, setOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [eraserCursor, setEraserCursor] = useState<Point | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("All");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [textInput, setTextInput] = useState<{ visible: boolean; x: number; y: number; value: string }>({
    visible: false,
    x: 0,
    y: 0,
    value: "",
  });
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const MAX_HISTORY = 50;
  const categories = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1800);
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHistory = [...prev, imageData];
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setRedoStack([]);
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setRedoStack((prev) => [...prev, currentState]);
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    if (newHistory.length > 0) {
      ctx.putImageData(newHistory[newHistory.length - 1], 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setCanUndo(newHistory.length > 0);
    setCanRedo(true);
    showToast("Undo");
  }, [history, showToast]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, currentState]);
    const newRedoStack = [...redoStack];
    const stateToRestore = newRedoStack.pop()!;
    setRedoStack(newRedoStack);
    ctx.putImageData(stateToRestore, 0, 0);
    setCanUndo(true);
    setCanRedo(newRedoStack.length > 0);
    showToast("Redo");
  }, [redoStack, showToast]);

  const resizeCanvases = useCallback(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!container || !bgCanvas || !mainCanvas) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    let bgSnap: ImageData | null = null;
    let mainSnap: ImageData | null = null;

    if (bgCanvas.width > 0 && bgCanvas.height > 0) {
      bgSnap = bgCanvas.getContext("2d")!.getImageData(0, 0, bgCanvas.width, bgCanvas.height);
    }
    if (mainCanvas.width > 0 && mainCanvas.height > 0) {
      mainSnap = mainCanvas.getContext("2d")!.getImageData(0, 0, mainCanvas.width, mainCanvas.height);
    }

    bgCanvas.width = W;
    bgCanvas.height = H;
    mainCanvas.width = W;
    mainCanvas.height = H;
    if (overlayCanvasRef.current) {
      overlayCanvasRef.current.width = W;
      overlayCanvasRef.current.height = H;
    }

    if (bgSnap) {
      bgCanvas.getContext("2d")!.putImageData(bgSnap, 0, 0);
    } else {
      const bgCtx = bgCanvas.getContext("2d")!;
      bgCtx.fillStyle = bgColor;
      bgCtx.fillRect(0, 0, W, H);
      if (gridType === "dots") {
        bgCtx.fillStyle = "#aab4c8";
        for (let x = 28; x < W; x += 28) {
          for (let y = 28; y < H; y += 28) {
            bgCtx.beginPath();
            bgCtx.arc(x, y, 1.5, 0, Math.PI * 2);
            bgCtx.fill();
          }
        }
      } else if (gridType === "lines") {
        bgCtx.strokeStyle = "#d0d8e8";
        bgCtx.lineWidth = 1;
        for (let x = 0; x <= W; x += 30) {
          bgCtx.beginPath();
          bgCtx.moveTo(x, 0);
          bgCtx.lineTo(x, H);
          bgCtx.stroke();
        }
        for (let y = 0; y <= H; y += 30) {
          bgCtx.beginPath();
          bgCtx.moveTo(0, y);
          bgCtx.lineTo(W, y);
          bgCtx.stroke();
        }
      }
    }
    if (mainSnap) {
      mainCanvas.getContext("2d")!.putImageData(mainSnap, 0, 0);
    }
  }, [bgColor, gridType]);

  useEffect(() => {
    resizeCanvases();
    const timer = setTimeout(() => saveHistory(), 100);
    return () => clearTimeout(timer);
  }, [resizeCanvases, saveHistory]);

  useEffect(() => {
    window.addEventListener("resize", resizeCanvases);
    return () => window.removeEventListener("resize", resizeCanvases);
  }, [resizeCanvases]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleExportPNG();
      } else if (e.key === "p" || e.key === "P") setTool("pen");
      else if (e.key === "e" || e.key === "E") setTool("eraser");
      else if (e.key === "h" || e.key === "H") setTool("highlight");
      else if (e.key === "l" || e.key === "L") setTool("line");
      else if (e.key === "a" || e.key === "A") setTool("arrow");
      else if (e.key === "r" || e.key === "R") setTool("rect");
      else if (e.key === "c" || e.key === "C") setTool("circle");
      else if (e.key === "t" || e.key === "T") setTool("text");
      else if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3, z + 0.1));
      else if (e.key === "-") setZoom((z) => Math.max(0.1, z - 0.1));
      else if (e.key === "0") { setZoom(1); setPan({ x: 0, y: 0 }); }
      else if (e.key === "Escape") { setShowTemplates(false); setTextInput({ visible: false, x: 0, y: 0, value: "" }); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const getPos = (e: MouseEvent | Touch): Point => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getLineWidth = () => (tool === "eraser" ? size * 4 : tool === "highlight" ? size * 3 : size);

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const src = (e as React.TouchEvent).touches?.[0] || (e as React.MouseEvent);
    const point = getPos(src as MouseEvent | Touch);

    if (tool === "pointer") {
      setIsPanning(true);
      setPanStart({ x: src.clientX - pan.x, y: src.clientY - pan.y });
      return;
    }

    if (tool === "text") {
      setTextInput({ visible: true, x: src.clientX, y: src.clientY, value: "" });
      return;
    }

    setIsDrawing(true);
    setLastPoint(point);
    setStartPoint(point);
    saveHistory();

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    if (tool === "pen" || tool === "highlight" || tool === "eraser") {
      ctx.beginPath();
      ctx.arc(point.x, point.y, getLineWidth() / 2, 0, Math.PI * 2);
      ctx.fillStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
      ctx.fill();
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    const src = (e as React.TouchEvent).touches?.[0] || (e as React.MouseEvent);
    const clientX = src.clientX;
    const clientY = src.clientY;

    if (isPanning && panStart) {
      setPan({ x: clientX - panStart.x, y: clientY - panStart.y });
      return;
    }

    if (tool === "eraser") {
      setEraserCursor({ x: clientX, y: clientY });
    }

    if (!isDrawing) return;
    e.preventDefault();

    const point = getPos(src as MouseEvent | Touch);
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    if (tool === "pen" || tool === "highlight" || tool === "eraser") {
      if (lastPoint) {
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(point.x, point.y);
        ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
        ctx.lineWidth = getLineWidth();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = tool === "highlight" ? 0.3 : opacity;
        ctx.stroke();
      }
    } else {
      const overlay = overlayCanvasRef.current;
      if (overlay) {
        const oCtx = overlay.getContext("2d");
        if (oCtx && startPoint) {
          oCtx.clearRect(0, 0, overlay.width, overlay.height);
          oCtx.strokeStyle = color;
          oCtx.lineWidth = size;
          oCtx.lineCap = "round";
          oCtx.globalAlpha = opacity;

          if (tool === "line") {
            oCtx.beginPath();
            oCtx.moveTo(startPoint.x, startPoint.y);
            oCtx.lineTo(point.x, point.y);
            oCtx.stroke();
          } else if (tool === "arrow") {
            oCtx.beginPath();
            oCtx.moveTo(startPoint.x, startPoint.y);
            oCtx.lineTo(point.x, point.y);
            oCtx.stroke();
            const angle = Math.atan2(point.y - startPoint.y, point.x - startPoint.x);
            const headLen = 15;
            oCtx.beginPath();
            oCtx.moveTo(point.x, point.y);
            oCtx.lineTo(point.x - headLen * Math.cos(angle - Math.PI / 6), point.y - headLen * Math.sin(angle - Math.PI / 6));
            oCtx.moveTo(point.x, point.y);
            oCtx.lineTo(point.x - headLen * Math.cos(angle + Math.PI / 6), point.y - headLen * Math.sin(angle + Math.PI / 6));
            oCtx.stroke();
          } else if (tool === "rect") {
            oCtx.strokeRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y);
          } else if (tool === "circle") {
            const rx = Math.abs(point.x - startPoint.x) / 2;
            const ry = Math.abs(point.y - startPoint.y) / 2;
            const cx = startPoint.x + (point.x - startPoint.x) / 2;
            const cy = startPoint.y + (point.y - startPoint.y) / 2;
            oCtx.beginPath();
            oCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            oCtx.stroke();
          } else if (tool === "triangle") {
            oCtx.beginPath();
            oCtx.moveTo((startPoint.x + point.x) / 2, startPoint.y);
            oCtx.lineTo(point.x, point.y);
            oCtx.lineTo(startPoint.x, point.y);
            oCtx.closePath();
            oCtx.stroke();
          }
        }
      }
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    setLastPoint(point);
  };

  const handleEnd = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    const overlay = overlayCanvasRef.current;
    if (overlay) {
      const oCtx = overlay.getContext("2d");
      if (oCtx) {
        oCtx.clearRect(0, 0, overlay.width, overlay.height);
      }
    }

    if (startPoint && lastPoint && tool !== "pen" && tool !== "highlight" && tool !== "eraser") {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.strokeStyle = color;
          ctx.lineWidth = size;
          ctx.lineCap = "round";
          ctx.globalAlpha = opacity;

          if (tool === "line") {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(lastPoint.x, lastPoint.y);
            ctx.stroke();
          } else if (tool === "arrow") {
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(lastPoint.x, lastPoint.y);
            ctx.stroke();
            const angle = Math.atan2(lastPoint.y - startPoint.y, lastPoint.x - startPoint.x);
            const headLen = 15;
            ctx.beginPath();
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(lastPoint.x - headLen * Math.cos(angle - Math.PI / 6), lastPoint.y - headLen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(lastPoint.x - headLen * Math.cos(angle + Math.PI / 6), lastPoint.y - headLen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          } else if (tool === "rect") {
            ctx.strokeRect(startPoint.x, startPoint.y, lastPoint.x - startPoint.x, lastPoint.y - startPoint.y);
          } else if (tool === "circle") {
            const rx = Math.abs(lastPoint.x - startPoint.x) / 2;
            const ry = Math.abs(lastPoint.y - startPoint.y) / 2;
            const cx = startPoint.x + (lastPoint.x - startPoint.x) / 2;
            const cy = startPoint.y + (lastPoint.y - startPoint.y) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else if (tool === "triangle") {
            ctx.beginPath();
            ctx.moveTo((startPoint.x + lastPoint.x) / 2, startPoint.y);
            ctx.lineTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(startPoint.x, lastPoint.y);
            ctx.closePath();
            ctx.stroke();
          }

          ctx.globalAlpha = 1;
        }
      }
    }

    const canvas = mainCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
    }
    setLastPoint(null);
    setStartPoint(null);
  };

  const handleClear = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    showToast("Canvas cleared");
  };

  const handleExportPNG = () => {
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!bgCanvas || !mainCanvas) return;
    const output = document.createElement("canvas");
    output.width = mainCanvas.width;
    output.height = mainCanvas.height;
    const outCtx = output.getContext("2d");
    if (!outCtx) return;
    outCtx.fillStyle = bgColor;
    outCtx.fillRect(0, 0, output.width, output.height);
    outCtx.drawImage(bgCanvas, 0, 0);
    outCtx.drawImage(mainCanvas, 0, 0);
    const a = document.createElement("a");
    a.download = `smartboard-${Date.now()}.png`;
    a.href = output.toDataURL("image/png");
    a.click();
    showToast("Saved as PNG");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const applyTemplate = (template: Template) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    template.draw(ctx, canvas.width, canvas.height);
    setShowTemplates(false);
    showToast("Template: " + template.name);
  };

  const handleTextSubmit = () => {
    if (textInput.value.trim()) {
      const canvas = mainCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          saveHistory();
          ctx.font = `${size * 4}px sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          const rect = canvas.getBoundingClientRect();
          const scaleX = canvas.width / rect.width;
          const scaleY = canvas.height / rect.height;
          ctx.fillText(textInput.value, (textInput.x - rect.left) * scaleX, (textInput.y - rect.top) * scaleY);
          ctx.globalAlpha = 1;
        }
      }
    }
    setTextInput({ visible: false, x: 0, y: 0, value: "" });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0d0d1a]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
      >
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
        <canvas ref={mainCanvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 2 }} />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 3, cursor: tool === "eraser" ? "none" : tool === "pointer" ? "grab" : "crosshair" }}
          onMouseDown={handleStart}
          onMouseMove={handleMove as unknown as React.MouseEventHandler<HTMLCanvasElement>}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart as unknown as React.TouchEventHandler<HTMLCanvasElement>}
          onTouchMove={handleMove as unknown as React.TouchEventHandler<HTMLCanvasElement>}
          onTouchEnd={handleEnd}
        />
      </div>

      {tool === "eraser" && eraserCursor && (
        <div
          className="pointer-events-none fixed border-2 border-blue-500 bg-blue-500/10 rounded-full"
          style={{
            width: size * 4,
            height: size * 4,
            left: eraserCursor.x - (size * 4) / 2,
            top: eraserCursor.y - (size * 4) / 2,
            zIndex: 9999,
          }}
        />
      )}

      {textInput.visible && (
        <div
          className="absolute z-50 bg-white rounded border-2 border-blue-500"
          style={{ left: textInput.x, top: textInput.y }}
        >
          <textarea
            autoFocus
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleTextSubmit();
              }
            }}
            className="p-2 outline-none min-w-[120px] min-h-[36px] resize-none"
            placeholder="Type here..."
          />
          <div className="flex gap-2 p-2 border-t">
            <button onClick={handleTextSubmit} className="px-3 py-1 bg-blue-500 text-white rounded text-xs">Add</button>
            <button onClick={() => setTextInput({ visible: false, x: 0, y: 0, value: "" })} className="px-3 py-1 bg-gray-200 rounded text-xs">Cancel</button>
          </div>
        </div>
      )}

      {showTemplates && (
        <div className="absolute top-14 right-4 w-80 max-h-[calc(100vh-100px)] bg-[#1a1a2e] border border-[#3e3e6e] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-[#2e2e5e]">
            <h3 className="text-white text-sm font-semibold">Circuit Templates</h3>
            <button onClick={() => setShowTemplates(false)} className="text-gray-400 hover:text-white text-lg">✕</button>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border-b border-[#2e2e5e]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setTemplateFilter(cat)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  templateFilter === cat
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "border-[#3e3e5e] text-gray-400 hover:border-blue-500 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3">
            {(templateFilter === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === templateFilter)).map((tpl, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(tpl)}
                className="border-2 border-[#2e2e5e] rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:scale-[1.03]"
              >
                <div className="h-16 bg-[#12122a] flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Preview</span>
                </div>
                <div className="p-2 text-center text-xs text-gray-300 bg-[#1a1a2e] border-t border-[#2e2e5e]">
                  {tpl.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="p-3 rounded-xl shadow-lg border transition-all bg-[#1a1a2e] border-[#3e3e6e] text-gray-300 hover:border-blue-500 hover:text-white"
          title="Templates"
        >
          <LayoutTemplate className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#1a1a2e] border border-[#2a2a4e] rounded-2xl p-2 shadow-xl flex-wrap justify-center max-w-[95vw]">
        <button onClick={() => setTool("pointer")} className={`tb-btn ${tool === "pointer" ? "active" : ""}`} title="Pointer (V)">🖱️</button>
        <button onClick={() => setTool("pen")} className={`tb-btn ${tool === "pen" ? "active" : ""}`} title="Pen (P)">✏️</button>
        <button onClick={() => setTool("highlight")} className={`tb-btn ${tool === "highlight" ? "active" : ""}`} title="Highlighter (H)">🖊️</button>
        <button onClick={() => setTool("eraser")} className={`tb-btn ${tool === "eraser" ? "active" : ""}`} title="Eraser (E)">🧹</button>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <button onClick={() => setTool("line")} className={`tb-btn ${tool === "line" ? "active" : ""}`} title="Line (L)">╱</button>
        <button onClick={() => setTool("arrow")} className={`tb-btn ${tool === "arrow" ? "active" : ""}`} title="Arrow (A)">➜</button>
        <button onClick={() => setTool("rect")} className={`tb-btn ${tool === "rect" ? "active" : ""}`} title="Rectangle (R)">▭</button>
        <button onClick={() => setTool("circle")} className={`tb-btn ${tool === "circle" ? "active" : ""}`} title="Circle (C)">○</button>
        <button onClick={() => setTool("triangle")} className={`tb-btn ${tool === "triangle" ? "active" : ""}`} title="Triangle">△</button>
        <button onClick={() => setTool("text")} className={`tb-btn ${tool === "text" ? "active" : ""}`} title="Text (T)">T</button>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? "border-white scale-110" : "border-transparent hover:scale-115"}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-6 h-6 rounded-full border border-[#3e3e6e] cursor-pointer" />
        </div>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Size</span>
          <input type="range" min="1" max="60" value={size} onChange={(e) => setSize(parseInt(e.target.value))} className="w-16 accent-blue-500" />
          <span className="w-6">{size}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Opacity</span>
          <input type="range" min="5" max="100" value={opacity * 100} onChange={(e) => setOpacity(parseInt(e.target.value) / 100)} className="w-16 accent-blue-500" />
          <span className="w-8">{Math.round(opacity * 100)}%</span>
        </div>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <select
          value={gridType}
          onChange={(e) => onGridTypeChange?.(e.target.value as "dots" | "lines" | "none")}
          className="bg-[#12122a] border border-[#3e3e6e] rounded px-2 py-1 text-xs text-gray-300"
        >
          <option value="none">Background</option>
          <option value="dots">Dots</option>
          <option value="lines">Grid</option>
        </select>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <button onClick={undo} disabled={!canUndo} className={`tb-btn ${!canUndo ? "opacity-40" : ""}`} title="Undo (Ctrl+Z)">↩</button>
        <button onClick={redo} disabled={!canRedo} className={`tb-btn ${!canRedo ? "opacity-40" : ""}`} title="Redo (Ctrl+Y)">↪</button>
        <button onClick={handleClear} className="tb-btn" title="Clear">🗑</button>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <button onClick={handleExportPNG} className="tb-btn" title="Save PNG">💾</button>
        <button onClick={handleExportPDF} className="tb-btn" title="Print/PDF">🖨</button>
        <div className="w-px h-6 bg-[#2e2e5e] mx-1" />
        <button onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))} className="tb-btn" title="Zoom Out">−</button>
        <span className="text-xs text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.1))} className="tb-btn" title="Zoom In">+</button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="tb-btn" title="Reset Zoom">⊡</button>
      </div>

      {toastVisible && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1e1e3e] text-gray-300 text-xs px-4 py-2 rounded-full border border-[#3e3e6e] z-[999]">
          {toast}
        </div>
      )}
    </div>
  );
}

function LayoutTemplate({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
