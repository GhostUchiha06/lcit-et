"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WhiteboardCanvasProps {
  bgColor?: string;
  currentColor?: string;
  strokeWidth?: number;
  onColorChange?: (color: string) => void;
  onStrokeWidthChange?: (width: number) => void;
}

interface Point {
  x: number;
  y: number;
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
    name: "Isometric Grid",
    category: "General",
    draw: (ctx, w, h) => {
      ctx.strokeStyle = "#c8e0ff";
      ctx.lineWidth = 0.7;
      const s = 40;
      for (let y = -h; y < h * 2; y += s) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y + w * 0.5);
        ctx.stroke();
      }
      for (let x = -w; x < w * 2; x += s * 0.866) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h * 0.5, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - h * 0.5, h);
        ctx.stroke();
      }
    },
  },
  {
    name: "Waveform Axes",
    category: "Signal",
    draw: (ctx, w, h) => {
      const px = 60,
        py = 30,
        ex = w - 30,
        ey = h - 30,
        mid = h / 2;
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, ey);
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
      ctx.strokeStyle = "#999";
      ctx.lineWidth = 1;
      const step = (ex - px) / 8;
      for (let i = 1; i <= 7; i++) {
        const x = px + i * step;
        ctx.beginPath();
        ctx.moveTo(x, mid - 5);
        ctx.lineTo(x, mid + 5);
        ctx.stroke();
      }
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
      const pad = 55,
        mid = h / 2;
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
      ctx.strokeStyle = "#dde";
      ctx.lineWidth = 0.7;
      [0.2, 0.4, 0.6, 0.8].forEach((f) => {
        const x = pad + f * (w - pad - 16);
        ctx.beginPath();
        ctx.moveTo(x, 16);
        ctx.lineTo(x, mid - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, mid + 8);
        ctx.lineTo(x, h - 22);
        ctx.stroke();
      });
      ctx.font = "11px sans-serif";
      ctx.fillStyle = "#555";
      ctx.fillText("|H(jω)| dB", pad + 4, 14);
      ctx.fillText("∠H(jω)°", pad + 4, mid + 7);
      ctx.fillText("ω", w - 30, mid - 18);
      ctx.fillText("ω", w - 30, h - 38);
    },
  },
  {
    name: "Op-Amp Inverting",
    category: "Analog",
    draw: (ctx, w, h) => {
      const cx = w / 2,
        cy = h / 2;
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
      const cy = h / 2,
        sx = 60;
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
      const bx = w / 2 - 80,
        by = h / 2 - 100;
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
      const s = by + 45,
        rh = 38;
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
      const cx = w / 2,
        cy = h / 2,
        r = 22;
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
      const lh = Math.floor((h - 50) / 7),
        lw = Math.min(260, w - 40);
      const sx = (w - lw) / 2,
        sy = 28;
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

export default function WhiteboardCanvas({
  bgColor = "#ffffff",
  currentColor = "#000000",
  strokeWidth = 4,
}: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(currentColor);
  const [size, setSize] = useState(strokeWidth);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [eraserCursor, setEraserCursor] = useState<Point | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [redoStack, setRedoStack] = useState<ImageData[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("All");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const MAX_HISTORY = 50;

  const categories = [
    "All",
    ...Array.from(new Set(TEMPLATES.map((t) => t.category))),
  ];

  const saveHistory = useCallback(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const newHistory = [...prev, imageData];
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
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
  }, [history]);

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
  }, [redoStack]);

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

    if (bgSnap) {
      bgCanvas.getContext("2d")!.putImageData(bgSnap, 0, 0);
    } else {
      bgCanvas.getContext("2d")!.fillStyle = "#ffffff";
      bgCanvas.getContext("2d")!.fillRect(0, 0, W, H);
    }
    if (mainSnap) {
      mainCanvas.getContext("2d")!.putImageData(mainSnap, 0, 0);
    }
  }, []);

  useEffect(() => {
    resizeCanvases();
    const timer = setTimeout(() => {
      saveHistory();
    }, 100);
    return () => clearTimeout(timer);
  }, [resizeCanvases, saveHistory]);

  useEffect(() => {
    const handleResize = () => {
      resizeCanvases();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      } else if (e.key === "p" || e.key === "P") {
        setTool("pen");
      } else if (e.key === "e" || e.key === "E") {
        setTool("eraser");
      }
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

  const getLineWidth = () => (tool === "eraser" ? size * 4 : size);

  const drawLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point) => {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
    ctx.lineWidth = getLineWidth();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const handleStart = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const point = getPos((e as TouchEvent).touches?.[0] || (e as MouseEvent));
    setIsDrawing(true);
    setLastPoint(point);
    saveHistory();

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.arc(point.x, point.y, getLineWidth() / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    const clientX = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
    const clientY = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY;

    if (tool === "eraser") {
      setEraserCursor({ x: clientX, y: clientY });
    }

    if (!isDrawing) return;
    e.preventDefault();

    const point = getPos((e as TouchEvent).touches?.[0] || (e as MouseEvent));
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    if (lastPoint) {
      drawLine(ctx, lastPoint, point);
    }
    ctx.globalCompositeOperation = "source-over";
    setLastPoint(point);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    setLastPoint(null);
    const canvas = mainCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.globalCompositeOperation = "source-over";
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (tool === "eraser") {
      setEraserCursor({ x: e.clientX, y: e.clientY });
    }
    handleMove(e as unknown as TouchEvent);
  };

  const handleClear = () => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    saveHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExport = () => {
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!bgCanvas || !mainCanvas) return;

    const output = document.createElement("canvas");
    output.width = mainCanvas.width;
    output.height = mainCanvas.height;
    const outCtx = output.getContext("2d");
    if (!outCtx) return;

    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, output.width, output.height);
    outCtx.drawImage(bgCanvas, 0, 0);
    outCtx.drawImage(mainCanvas, 0, 0);

    const a = document.createElement("a");
    a.download = `smartboard-${Date.now()}.png`;
    a.href = output.toDataURL("image/png");
    a.click();
  };

  const applyTemplate = (template: Template) => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    template.draw(ctx, canvas.width, canvas.height);
    setShowTemplates(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
      />
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 2,
          cursor: tool === "eraser" ? "none" : "crosshair",
          backgroundColor: "transparent",
        }}
        onMouseDown={handleStart as unknown as React.MouseEventHandler<HTMLCanvasElement>}
        onMouseMove={handleMouseMove as unknown as React.MouseEventHandler<HTMLCanvasElement>}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart as unknown as React.TouchEventHandler<HTMLCanvasElement>}
        onTouchMove={handleMove as unknown as React.TouchEventHandler<HTMLCanvasElement>}
        onTouchEnd={handleEnd}
      />

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

      {showTemplates && (
        <div className="absolute top-14 right-4 w-80 max-h-[calc(100vh-100px)] bg-[#1e1e2e] border border-[#3e3e5e] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-3 border-b border-[#3e3e5e]">
            <h3 className="text-white text-sm font-semibold">Templates</h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border-b border-[#2e2e4e]">
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
            {(templateFilter === "All"
              ? TEMPLATES
              : TEMPLATES.filter((t) => t.category === templateFilter)
            ).map((tpl, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(tpl)}
                className="border-2 border-[#3e3e5e] rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:scale-[1.02]"
              >
                <div className="h-16 bg-[#12121e] flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Preview</span>
                </div>
                <div className="p-2 text-center text-xs text-gray-300 bg-[#1a1a2e] border-t border-[#2e2e4e]">
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
          className="p-3 rounded-xl shadow-lg border transition-all bg-[#1e1e2e] border-[#3e3e5e] text-gray-300 hover:border-blue-500 hover:text-white"
          title="Templates"
        >
          <LayoutTemplate className="w-5 h-5" />
        </button>
        <button
          onClick={handleClear}
          className="p-3 rounded-xl shadow-lg border transition-all bg-[#1e1e2e] border-[#3e3e5e] text-gray-300 hover:border-blue-500 hover:text-white"
          title="Clear"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button
          onClick={handleExport}
          className="p-3 rounded-xl shadow-lg border transition-all bg-[#1e1e2e] border-[#3e3e5e] text-gray-300 hover:border-blue-500 hover:text-white"
          title="Export PNG"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#1e1e2e] border border-[#3e3e5e] rounded-2xl p-2 shadow-xl">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`p-2.5 rounded-lg transition-all ${
            canUndo
              ? "hover:bg-[#3a3a5e] text-gray-300"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`p-2.5 rounded-lg transition-all ${
            canRedo
              ? "hover:bg-[#3a3a5e] text-gray-300"
              : "text-gray-600 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-[#3e3e5e]" />

        <button
          onClick={() => setTool("pen")}
          className={`p-2.5 rounded-lg transition-all ${
            tool === "pen"
              ? "bg-blue-500 text-white"
              : "hover:bg-[#3a3a5e] text-gray-300"
          }`}
          title="Pen (P)"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool("eraser")}
          className={`p-2.5 rounded-lg transition-all ${
            tool === "eraser"
              ? "bg-blue-500 text-white"
              : "hover:bg-[#3a3a5e] text-gray-300"
          }`}
          title="Eraser (E)"
        >
          <Eraser className="w-5 h-5" />
        </button>

        <div className="w-px h-8 bg-[#3e3e5e]" />

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-9 h-9 rounded-full border-2 border-[#3e3e5e] cursor-pointer"
        />
        <input
          type="range"
          min="1"
          max="50"
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-20 accent-blue-500"
        />
        <span className="text-gray-400 text-xs w-10">{size}px</span>
      </div>
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

function Trash2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  );
}

function Download({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function Undo2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7v6h6M3 13a9 9 0 1 0 2.636-6.364L3 9" />
    </svg>
  );
}

function Redo2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 7v6h-6M21 13a9 9 0 1 1-2.636-6.364L21 9" />
    </svg>
  );
}

function Pencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function Eraser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 20H7L3 16l10-10 7 7-4 4M6.5 13.5L11 9" />
    </svg>
  );
}
