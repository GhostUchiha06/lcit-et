"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, ChevronDown, ChevronUp, Layers, Square, Circle, Triangle, Minus, ArrowRight, Pencil, Type, StickyNote, Star, MessageSquare, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type Tool = "select" | "hand" | "pencil" | "pen" | "eraser" | "brushEraser" | "geo" | "line" | "arrow" | "text" | "note" | "hexagon" | "star" | "chat" | "checkbox";
type LineStyle = "solid" | "dashed" | "dotted";

interface Point { x: number; y: number; }

interface BezierPoint {
  id: string;
  x: number;
  y: number;
  type: "corner" | "smooth";
  handleIn: { x: number; y: number };
  handleOut: { x: number; y: number };
}

interface BezierPath {
  id: string;
  closed: boolean;
  points: BezierPoint[];
}

interface EraserParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface DrawObject {
  id: string;
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
  bezierPath?: BezierPath;
}

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  objects: DrawObject[];
  thumbnail?: string;
}

interface TldrawCanvasProps {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  gridSpacing?: number;
  currentTool?: Tool;
  currentColor?: string;
  strokeWidth?: number;
  currentShape?: string;
  fillColor?: string;
  fillEnabled?: boolean;
  lineStyle?: LineStyle;
  onObjectsChange?: (objects: DrawObject[]) => void;
  showLayers?: boolean;
  eraserOpacity?: number;
  eraserHardness?: number;
}

function genId() {
  return Math.random().toString(36).substring(2, 11);
}

function dSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2)) : 0;
  return Math.hypot(px - x1 - t * dx, py - y1 - t * dy);
}

function hitTest(o: DrawObject, px: number, py: number, eraserSize = 24) {
  const T = eraserSize;
  switch (o.type) {
    case 'rect':
    case 'circle':
    case 'hexagon':
    case 'star':
    case 'chat':
    case 'checkbox':
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

function hitTestAll(objects: DrawObject[], px: number, py: number, eraserSize: number): number[] {
  const hit: number[] = [];
  objects.forEach((o, idx) => {
    if (hitTest(o, px, py, eraserSize)) {
      hit.push(idx);
    }
  });
  return hit;
}

function bbox(o: DrawObject) {
  switch (o.type) {
    case 'rect':
    case 'circle':
    case 'hexagon':
    case 'star':
    case 'chat':
    case 'checkbox':
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

function getObjectWidth(o: DrawObject): number {
  const bb = bbox(o);
  return bb ? Math.round(bb.w) : 0;
}

function getObjectHeight(o: DrawObject): number {
  const bb = bbox(o);
  return bb ? Math.round(bb.h) : 0;
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'rect': return Square;
    case 'circle': return Circle;
    case 'triangle': return Triangle;
    case 'line': return Minus;
    case 'arrow': return ArrowRight;
    case 'path': return Pencil;
    case 'text': return Type;
    case 'diamond': return Square;
    case 'hexagon': return Square;
    case 'star': return Star;
    case 'chat': return MessageSquare;
    case 'checkbox': return CheckSquare;
    default: return Square;
  }
}

function ObjectThumbnail({ obj, size = 40 }: { obj: DrawObject; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bb = bbox(obj);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bb) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const scale = Math.min(size / (bb.w || 1), size / (bb.h || 1), 1) * 0.8;
    const offsetX = (size - bb.w * scale) / 2;
    const offsetY = (size - bb.h * scale) / 2;
    
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(offsetX / scale - bb.x, offsetY / scale - bb.y);
    
    ctx.strokeStyle = obj.c || '#000';
    ctx.fillStyle = obj.fc || 'transparent';
    ctx.lineWidth = (obj.w || 2) / scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (obj.lineStyle === "dashed") ctx.setLineDash([10, 8]);
    else if (obj.lineStyle === "dotted") ctx.setLineDash([3, 5]);
    else ctx.setLineDash([]);
    
    switch (obj.type) {
      case "rect":
        if (obj.fc !== "transparent") ctx.fillRect(obj.x || 0, obj.y || 0, obj.w2 || 0, obj.h || 0);
        ctx.strokeRect(obj.x || 0, obj.y || 0, obj.w2 || 0, obj.h || 0);
        break;
      case "circle":
        ctx.beginPath();
        ctx.ellipse((obj.x || 0) + (obj.w2 || 0) / 2, (obj.y || 0) + (obj.h || 0) / 2, Math.abs((obj.w2 || 0) / 2) || 1, Math.abs((obj.h || 0) / 2) || 1, 0, 0, Math.PI * 2);
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(obj.x1 || 0, obj.y1 || 0);
        ctx.lineTo(obj.x2 || 0, obj.y2 || 0);
        ctx.lineTo(obj.x3 || 0, obj.y3 || 0);
        ctx.closePath();
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      case "diamond":
        ctx.beginPath();
        ctx.moveTo(obj.cx || 0, (obj.cy || 0) - (obj.ry || 0));
        ctx.lineTo((obj.cx || 0) + (obj.rx || 0), obj.cy || 0);
        ctx.lineTo(obj.cx || 0, (obj.cy || 0) + (obj.ry || 0));
        ctx.lineTo((obj.cx || 0) - (obj.rx || 0), obj.cy || 0);
        ctx.closePath();
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      case "hexagon": {
        const hcx = obj.cx || 0;
        const hcy = obj.cy || 0;
        const hrx = obj.rx || 0;
        const hry = obj.ry || 0;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = hcx + hrx * Math.cos(angle);
          const py = hcy + hry * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      }
      case "star": {
        const scx = obj.cx || 0;
        const scy = obj.cy || 0;
        const srx = obj.rx || 0;
        const sry = obj.ry || 0;
        const outerRadius = Math.max(srx, sry);
        const innerRadius = outerRadius * 0.4;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const px = scx + radius * Math.cos(angle);
          const py = scy + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      }
      case "chat": {
        const chatX = obj.x || 0;
        const chatY = obj.y || 0;
        const chatW = obj.w2 || 50;
        const chatH = obj.h || 40;
        const radius = 8;
        ctx.beginPath();
        ctx.moveTo(chatX + radius, chatY);
        ctx.lineTo(chatX + chatW - radius, chatY);
        ctx.quadraticCurveTo(chatX + chatW, chatY, chatX + chatW, chatY + radius);
        ctx.lineTo(chatX + chatW, chatY + chatH - radius);
        ctx.quadraticCurveTo(chatX + chatW, chatY + chatH, chatX + chatW - radius, chatY + chatH);
        ctx.lineTo(chatX + 15, chatY + chatH);
        ctx.lineTo(chatX + 5, chatY + chatH + 10);
        ctx.lineTo(chatX + 10, chatY + chatH);
        ctx.lineTo(chatX + radius, chatY + chatH);
        ctx.quadraticCurveTo(chatX, chatY + chatH, chatX, chatY + chatH - radius);
        ctx.lineTo(chatX, chatY + radius);
        ctx.quadraticCurveTo(chatX, chatY, chatX + radius, chatY);
        ctx.closePath();
        if (obj.fc !== "transparent") ctx.fill();
        ctx.stroke();
        break;
      }
      case "checkbox": {
        const cbX = obj.x || 0;
        const cbY = obj.y || 0;
        const cbW = obj.w2 || 40;
        const cbH = obj.h || 40;
        ctx.strokeRect(cbX, cbY, cbW, cbH);
        if (obj.fc !== "transparent") ctx.fillRect(cbX, cbY, cbW, cbH);
        ctx.beginPath();
        ctx.moveTo(cbX + cbW * 0.2, cbY + cbH * 0.5);
        ctx.lineTo(cbX + cbW * 0.4, cbY + cbH * 0.7);
        ctx.lineTo(cbX + cbW * 0.8, cbY + cbH * 0.3);
        ctx.stroke();
        break;
      }
      case "line":
      case "arrow":
        ctx.beginPath();
        ctx.moveTo(obj.x1 || 0, obj.y1 || 0);
        ctx.lineTo(obj.x2 || 0, obj.y2 || 0);
        ctx.stroke();
        if (obj.type === "arrow") {
          const ang = Math.atan2((obj.y2 || 0) - (obj.y1 || 0), (obj.x2 || 0) - (obj.x1 || 0));
          const hs = Math.max(12, (obj.w || 2) * 4);
          ctx.beginPath();
          ctx.moveTo(obj.x2 || 0, obj.y2 || 0);
          ctx.lineTo((obj.x2 || 0) - hs * Math.cos(ang - Math.PI / 6), (obj.y2 || 0) - hs * Math.sin(ang - Math.PI / 6));
          ctx.lineTo((obj.x2 || 0) - hs * Math.cos(ang + Math.PI / 6), (obj.y2 || 0) - hs * Math.sin(ang + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
        break;
      case "path":
        if (obj.pts && obj.pts.length > 1) {
          ctx.beginPath();
          ctx.moveTo(obj.pts[0].x, obj.pts[0].y);
          obj.pts.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
        break;
      case "text":
        ctx.font = `${obj.fs || 18}px system-ui`;
        ctx.fillStyle = obj.c || '#000';
        ctx.fillText(obj.text || '', obj.x || 0, obj.y || 0);
        break;
    }
    ctx.restore();
  }, [obj, bb, size]);
  
  if (!bb) return null;
  
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
    />
  );
}

function LayersPanel({
  layers,
  currentLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onRenameLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveLayer,
  onSelectObjects,
  selectedObjectIds,
  onSelectObject,
  onDeleteObject,
  position,
  onPositionChange,
  isCollapsed,
  onToggleCollapse,
  panelWidth,
  onWidthChange,
}: {
  layers: Layer[];
  currentLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onDeleteLayer: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onSelectObjects: (ids: string[]) => void;
  selectedObjectIds: string[];
  onSelectObject: (id: string) => void;
  onDeleteObject: (layerId: string, objectId: string) => void;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  panelWidth: number;
  onWidthChange: (width: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set([currentLayerId]));
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (!next.has(currentLayerId)) next.add(currentLayerId);
      return next;
    });
  }, [currentLayerId]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (layer: Layer) => {
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const handleFinishEdit = () => {
    if (editingId && editingName.trim()) {
      onRenameLayer(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingName("");
    }
  };

  const toggleExpand = (layerId: string) => {
    setExpandedLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.layers-no-drag')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onPositionChange({
          x: Math.max(0, Math.min(window.innerWidth - panelWidth - 20, e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y)),
        });
      } else if (isResizing) {
        const newWidth = Math.max(200, Math.min(500, e.clientX - position.x));
        onWidthChange(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, panelWidth, onPositionChange, onWidthChange]);

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute z-30 w-12 h-12 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        style={{ left: position.x, top: position.y }}
      >
        <Layers className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className="absolute z-30 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden select-none"
      style={{
        left: position.x,
        top: position.y,
        width: panelWidth,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      <div
        className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800 cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span className="font-medium text-sm">Layers</span>
          <span className="text-xs text-muted-foreground">({layers.length})</span>
        </div>
        <div className="flex items-center gap-1 layers-no-drag">
          <button
            onClick={onAddLayer}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Add Layer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Collapse"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        {[...layers].reverse().map((layer) => (
          <div key={layer.id}>
            <div
              className={cn(
                "group border-b border-gray-100 dark:border-gray-800",
                currentLayerId === layer.id && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <div className="flex items-center gap-1 p-2">
                <button
                  onClick={() => toggleExpand(layer.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {expandedLayers.has(layer.id) ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronUp className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={() => onToggleVisibility(layer.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  {layer.visible ? (
                    <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => onToggleLock(layer.id)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                  {layer.locked ? (
                    <Lock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Unlock className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  {editingId === layer.id ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={handleFinishEdit}
                      onKeyDown={handleKeyDown}
                      className="w-full px-2 py-0.5 text-sm bg-white dark:bg-gray-800 border border-blue-500 rounded outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => onSelectLayer(layer.id)}
                      onDoubleClick={() => handleStartEdit(layer)}
                      className="w-full text-left px-2 py-0.5 text-sm truncate rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {layer.name}
                    </button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{layer.objects.length}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onMoveLayer(layer.id, 'up')}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Move Up"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onMoveLayer(layer.id, 'down')}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Move Down"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {layers.length > 1 && (
                    <button
                      onClick={() => onDeleteLayer(layer.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                      title="Delete Layer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {expandedLayers.has(layer.id) && layer.objects.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 space-y-1 max-h-64 overflow-y-auto">
                {layer.objects.map((obj, idx) => {
                  const Icon = getTypeIcon(obj.type);
                  const objWidth = getObjectWidth(obj);
                  const objHeight = getObjectHeight(obj);
                  const isSelected = selectedObjectIds.includes(obj.id);
                  
                  return (
                    <div
                      key={obj.id}
                      onClick={() => {
                        onSelectLayer(layer.id);
                        onSelectObject(obj.id);
                      }}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all",
                        isSelected ? "bg-blue-100 dark:bg-blue-900/30 ring-1 ring-blue-500" : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      <ObjectThumbnail obj={obj} size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium truncate capitalize">{obj.type}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {objWidth} x {objHeight}px
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteObject(layer.id, obj.id);
                        }}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Object"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors layers-no-drag"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}

export default function TldrawCanvas({
  bgColor,
  gridType,
  gridSpacing = 24,
  currentTool = "pencil",
  currentColor = "#1e293b",
  strokeWidth = 2,
  currentShape = "rectangle",
  fillColor = "transparent",
  fillEnabled = false,
  lineStyle = "solid",
  onObjectsChange,
  showLayers = true,
  eraserOpacity = 0.5,
  eraserHardness = 0.8,
}: TldrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layers, setLayers] = useState<Layer[]>([
    { id: genId(), name: "Layer 1", visible: true, locked: false, objects: [] }
  ]);
  const [currentLayerId, setCurrentLayerId] = useState(layers[0].id);
  const [curObj, setCurObj] = useState<DrawObject | null>(null);
  const [selectedObjectIds, setSelectedObjectIds] = useState<string[]>([]);
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
  const [eraserParticles, setEraserParticles] = useState<EraserParticle[]>([]);
  const [isErasing, setIsErasing] = useState(false);
  const [marquee, setMarquee] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [copiedObjects, setCopiedObjects] = useState<DrawObject[]>([]);
  const [layerPanelPosition, setLayerPanelPosition] = useState({ x: 16, y: 16 });
  const [layerPanelCollapsed, setLayerPanelCollapsed] = useState(false);
  const [layerPanelWidth, setLayerPanelWidth] = useState(288);
  const [eraserCursorPos, setEraserCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [layersHistory, setLayersHistory] = useState<Layer[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const lastObjectsCountRef = useRef(0);

  const [penPath, setPenPath] = useState<BezierPath | null>(null);
  const [penMode, setPenMode] = useState<"default" | "edit">("default");
  const [editingPathId, setEditingPathId] = useState<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<"in" | "out" | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [penPreview, setPenPreview] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingAnchor, setIsDraggingAnchor] = useState(false);
  const [altKeyDown, setAltKeyDown] = useState(false);

  const currentLayer = layers.find(l => l.id === currentLayerId);
  const activeObjects = currentLayer?.objects || [];

  const toolMap: Record<string, string> = {
    rectangle: "rect",
    ellipse: "circle",
    diamond: "diamond",
    triangle: "triangle",
    hexagon: "hexagon",
    star: "star",
    chat: "chat",
    checkbox: "checkbox",
  };

  const activeTool: Tool = currentTool === "geo" ? (toolMap[currentShape] || "rect") as Tool : currentTool as Tool;

  const cubicBezier = (t: number, p0: Point, p1: Point, p2: Point, p3: Point): Point => {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    };
  };

  const getBezierPathPoints = (path: BezierPath, resolution = 50): Point[] => {
    const result: Point[] = [];
    for (let i = 0; i < path.points.length; i++) {
      const current = path.points[i];
      const next = path.points[(i + 1) % path.points.length];
      if (!next && !path.closed) break;

      const p0 = { x: current.x, y: current.y };
      const p1 = { x: current.x + current.handleOut.x, y: current.y + current.handleOut.y };
      const p2 = { x: next.x + next.handleIn.x, y: next.y + next.handleIn.y };
      const p3 = { x: next.x, y: next.y };

      for (let t = 0; t <= 1; t += 1 / resolution) {
        result.push(cubicBezier(t, p0, p1, p2, p3));
      }
    }
    return result;
  };

  const findPointAtPosition = (paths: BezierPath[], px: number, py: number, threshold = 10): { path: BezierPath; point: BezierPoint; index: number } | null => {
    for (const path of paths) {
      for (let i = 0; i < path.points.length; i++) {
        const pt = path.points[i];
        const dist = Math.hypot(pt.x - px, pt.y - py);
        if (dist < threshold) {
          return { path, point: pt, index: i };
        }
      }
    }
    return null;
  };

  const findHandleAtPosition = (paths: BezierPath[], px: number, py: number, threshold = 8): { path: BezierPath; point: BezierPoint; handle: "in" | "out"; index: number } | null => {
    for (const path of paths) {
      for (let i = 0; i < path.points.length; i++) {
        const pt = path.points[i];
        const handleInPos = { x: pt.x + pt.handleIn.x, y: pt.y + pt.handleIn.y };
        const handleOutPos = { x: pt.x + pt.handleOut.x, y: pt.y + pt.handleOut.y };

        if (Math.hypot(handleInPos.x - px, handleInPos.y - py) < threshold) {
          return { path, point: pt, handle: "in", index: i };
        }
        if (Math.hypot(handleOutPos.x - px, handleOutPos.y - py) < threshold) {
          return { path, point: pt, handle: "out", index: i };
        }
      }
    }
    return null;
  };

  const findSegmentAtPosition = (path: BezierPath, px: number, py: number, threshold = 8): { index: number; t: number } | null => {
    const sampled = getBezierPathPoints(path, 100);
    let minDist = threshold;
    let closestIndex = -1;
    let closestT = 0;

    for (let i = 0; i < sampled.length - 1; i++) {
      const p1 = sampled[i];
      const p2 = sampled[i + 1];
      const dist = dSeg(px, py, p1.x, p1.y, p2.x, p2.y);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = Math.floor((i / sampled.length) * path.points.length);
        closestT = i / sampled.length;
      }
    }

    return closestIndex >= 0 ? { index: closestIndex, t: closestT } : null;
  };

  useEffect(() => {
    setShowGrid(gridType !== "none");
  }, [gridType]);

  useEffect(() => {
    const totalObjects = layers.flatMap(l => l.objects).length;
    if (totalObjects !== lastObjectsCountRef.current) {
      if (totalObjects > lastObjectsCountRef.current) {
        const newHistory = [...layersHistory.slice(0, historyIndex + 1), JSON.parse(JSON.stringify(layers))];
        setLayersHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setCanUndo(newHistory.length > 1);
        setCanRedo(false);
      }
      lastObjectsCountRef.current = totalObjects;
    }
    onObjectsChange?.(layers.flatMap(l => l.objects));
  }, [layers, onObjectsChange]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setLayers(JSON.parse(JSON.stringify(layersHistory[newIndex])));
      setHistoryIndex(newIndex);
      setCanUndo(newIndex > 0);
      setCanRedo(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < layersHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setLayers(JSON.parse(JSON.stringify(layersHistory[newIndex])));
      setHistoryIndex(newIndex);
      setCanUndo(true);
      setCanRedo(newIndex < layersHistory.length - 1);
    }
  };

  useEffect(() => {
    if (eraserParticles.length === 0) return;
    
    let animationId: number;
    let lastTime = 0;
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      setEraserParticles(prev => {
        const updated = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.3,
          life: p.life - delta * 0.003,
        })).filter(p => p.life > 0);
        
        if (updated.length > 0) {
          render();
        }
        return updated;
      });
      
      if (eraserParticles.length > 0) {
        animationId = requestAnimationFrame(animate);
      }
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [eraserParticles.length]);

  const cpx = useCallback((e: MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left - panX) / zoom,
      y: (e.clientY - rect.top - panY) / zoom,
    };
  }, [panX, panY, zoom]);

  const findObjectLayer = useCallback((objectId: string): string | null => {
    for (const layer of layers) {
      if (layer.objects.some(o => o.id === objectId)) {
        return layer.id;
      }
    }
    return null;
  }, [layers]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panX, panY);
    ctx.scale(zoom, zoom);

    layers.forEach(layer => {
      if (!layer.visible) return;
      layer.objects.forEach(o => {
        drawO(ctx, o);
        if (o.bezierPath && layer.visible) {
          drawBezierPath(ctx, o.bezierPath, o.c, o.w, o.fc);
        }
      });
    });
    
    if (curObj) drawO(ctx, curObj);

    if (penPath && activeTool === "pen") {
      drawBezierPath(ctx, penPath, currentColor, strokeWidth, fillEnabled ? fillColor : "transparent");
      penPath.points.forEach((pt, i) => {
        drawPenAnchor(ctx, pt, i === 0);
      });
      if (penPreview) {
        const lastPt = penPath.points[penPath.points.length - 1];
        ctx.save();
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(lastPt.x, lastPt.y);
        ctx.lineTo(penPreview.x, penPreview.y);
        ctx.stroke();
        ctx.restore();
      }
    }
    
    selectedObjectIds.forEach(id => {
      const layerId = findObjectLayer(id);
      if (layerId) {
        const layer = layers.find(l => l.id === layerId);
        const obj = layer?.objects.find(o => o.id === id);
        if (obj && layer?.visible) {
          drawSel(ctx, obj);
          if (obj.bezierPath) {
            drawBezierHandles(ctx, obj.bezierPath);
          }
        }
      }
    });

    eraserParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (marquee) {
      ctx.save();
      ctx.strokeStyle = "#6366f1";
      ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 3 / zoom]);
      ctx.fillRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.strokeRect(marquee.x, marquee.y, marquee.w, marquee.h);
      ctx.restore();
    }

    ctx.restore();
  }, [layers, curObj, selectedObjectIds, panX, panY, zoom, eraserParticles, marquee, findObjectLayer]);

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
      case "hexagon": {
        const hcx = (o.x || 0) + (o.w2 || 0) / 2;
        const hcy = (o.y || 0) + (o.h || 0) / 2;
        const hrx = (o.w2 || 0) / 2;
        const hry = (o.h || 0) / 2;
        c.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 2;
          const px = hcx + hrx * Math.cos(angle);
          const py = hcy + hry * Math.sin(angle);
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      }
      case "star": {
        const scx = (o.x || 0) + (o.w2 || 0) / 2;
        const scy = (o.y || 0) + (o.h || 0) / 2;
        const outerRadius = Math.max((o.w2 || 0) / 2, (o.h || 0) / 2);
        const innerRadius = outerRadius * 0.4;
        c.beginPath();
        for (let i = 0; i < 10; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI / 5) * i - Math.PI / 2;
          const px = scx + radius * Math.cos(angle);
          const py = scy + radius * Math.sin(angle);
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      }
      case "chat": {
        const chatX = o.x || 0;
        const chatY = o.y || 0;
        const chatW = o.w2 || 50;
        const chatH = o.h || 40;
        const radius = 8;
        c.beginPath();
        c.moveTo(chatX + radius, chatY);
        c.lineTo(chatX + chatW - radius, chatY);
        c.quadraticCurveTo(chatX + chatW, chatY, chatX + chatW, chatY + radius);
        c.lineTo(chatX + chatW, chatY + chatH - radius);
        c.quadraticCurveTo(chatX + chatW, chatY + chatH, chatX + chatW - radius, chatY + chatH);
        c.lineTo(chatX + 15, chatY + chatH);
        c.lineTo(chatX + 5, chatY + chatH + 10);
        c.lineTo(chatX + 10, chatY + chatH);
        c.lineTo(chatX + radius, chatY + chatH);
        c.quadraticCurveTo(chatX, chatY + chatH, chatX, chatY + chatH - radius);
        c.lineTo(chatX, chatY + radius);
        c.quadraticCurveTo(chatX, chatY, chatX + radius, chatY);
        c.closePath();
        if (o.fc !== "transparent") c.fill();
        c.stroke();
        break;
      }
      case "checkbox": {
        const cbX = o.x || 0;
        const cbY = o.y || 0;
        const cbW = o.w2 || 40;
        const cbH = o.h || 40;
        c.strokeRect(cbX, cbY, cbW, cbH);
        if (o.fc !== "transparent") c.fillRect(cbX, cbY, cbW, cbH);
        c.beginPath();
        c.moveTo(cbX + cbW * 0.2, cbY + cbH * 0.5);
        c.lineTo(cbX + cbW * 0.4, cbY + cbH * 0.7);
        c.lineTo(cbX + cbW * 0.8, cbY + cbH * 0.3);
        c.stroke();
        break;
      }
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

  const drawBezierPath = (c: CanvasRenderingContext2D, path: BezierPath, color: string, width: number, fill: string) => {
    if (path.points.length < 2) return;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.fillStyle = fill !== "transparent" ? fill : "transparent";

    const sampled = getBezierPathPoints(path, 50);
    if (sampled.length === 0) { c.restore(); return; }

    c.beginPath();
    c.moveTo(sampled[0].x, sampled[0].y);
    for (let i = 1; i < sampled.length; i++) {
      c.lineTo(sampled[i].x, sampled[i].y);
    }
    if (path.closed) c.closePath();
    c.stroke();
    if (path.closed && fill !== "transparent") c.fill();
    c.restore();
  };

  const drawPenAnchor = (c: CanvasRenderingContext2D, pt: BezierPoint, isFirst: boolean) => {
    c.save();
    c.fillStyle = isFirst ? "#6366f1" : "#ffffff";
    c.strokeStyle = "#6366f1";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.restore();
  };

  const drawBezierHandles = (c: CanvasRenderingContext2D, path: BezierPath) => {
    c.save();
    path.points.forEach((pt) => {
      const hasIn = pt.handleIn.x !== 0 || pt.handleIn.y !== 0;
      const hasOut = pt.handleOut.x !== 0 || pt.handleOut.y !== 0;

      if (hasIn) {
        c.strokeStyle = "#6366f1";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(pt.x, pt.y);
        c.lineTo(pt.x + pt.handleIn.x, pt.y + pt.handleIn.y);
        c.stroke();
        c.fillStyle = "#6366f1";
        c.beginPath();
        c.arc(pt.x + pt.handleIn.x, pt.y + pt.handleIn.y, 3, 0, Math.PI * 2);
        c.fill();
      }
      if (hasOut) {
        c.strokeStyle = "#6366f1";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(pt.x, pt.y);
        c.lineTo(pt.x + pt.handleOut.x, pt.y + pt.handleOut.y);
        c.stroke();
        c.fillStyle = "#6366f1";
        c.beginPath();
        c.arc(pt.x + pt.handleOut.x, pt.y + pt.handleOut.y, 3, 0, Math.PI * 2);
        c.fill();
      }
    });
    c.restore();
  };

  const moveObj = (o: DrawObject, dx: number, dy: number) => {
    switch (o.type) {
      case "rect":
      case "circle":
      case "hexagon":
      case "star":
      case "chat":
      case "checkbox":
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
    const minSize = 20;
    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    let ww = Math.abs(x2 - x1);
    let hh = Math.abs(y2 - y1);
    ww = Math.max(ww, minSize);
    hh = Math.max(hh, minSize);
    
    const base: DrawObject = { id: genId(), type: tool, c: currentColor, fc: fillEnabled ? fillColor : "transparent", w: strokeWidth, op: 1, lineStyle };
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
        return { ...base, type: "triangle", x1: x1 + (x2 - x1) / 2, y1, x2: x + ww, y2: y + hh, x3: x, y3: y + hh };
      case "diamond": {
        const cx = x + ww / 2;
        const cy = y + hh / 2;
        return { ...base, type: "diamond", cx, cy, rx: ww / 2, ry: hh / 2 };
      }
      case "hexagon": {
        return { ...base, type: "hexagon", x, y, w2: ww, h: hh };
      }
      case "star": {
        return { ...base, type: "star", x, y, w2: ww, h: hh };
      }
      case "chat": {
        return { ...base, type: "chat", x, y, w2: ww, h: hh };
      }
      case "checkbox": {
        return { ...base, type: "checkbox", x, y, w2: ww, h: hh };
      }
      default:
        return { ...base, type: "rect", x, y, w2: ww, h: hh };
    }
  };

  const deepClone = (obj: DrawObject): DrawObject => {
    const clone = { ...obj, id: genId() };
    if (obj.pts) clone.pts = obj.pts.map(p => ({ ...p }));
    return clone;
  };

  const addLayer = (name?: string) => {
    const newLayer: Layer = {
      id: genId(),
      name: name || `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      objects: [],
    };
    setLayers(prev => [...prev, newLayer]);
    setCurrentLayerId(newLayer.id);
    setSelectedObjectIds([]);
    return newLayer.id;
  };

  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    const idx = layers.findIndex(l => l.id === id);
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);
    if (currentLayerId === id) {
      const newIdx = Math.min(idx, newLayers.length - 1);
      setCurrentLayerId(newLayers[newIdx].id);
    }
    setSelectedObjectIds([]);
  };

  const renameLayer = (id: string, name: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  const toggleLayerLock = (id: string) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, locked: !l.locked } : l));
  };

  const moveLayer = (id: string, direction: 'up' | 'down') => {
    const idx = layers.findIndex(l => l.id === id);
    if (direction === 'up' && idx > 0) {
      const newLayers = [...layers];
      [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
      setLayers(newLayers);
    } else if (direction === 'down' && idx < layers.length - 1) {
      const newLayers = [...layers];
      [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
      setLayers(newLayers);
    }
  };

  const deleteObject = (layerId: string, objectId: string) => {
    setLayers(prev => prev.map(layer => {
      if (layer.id !== layerId) return layer;
      return {
        ...layer,
        objects: layer.objects.filter(obj => obj.id !== objectId)
      };
    }));
    setSelectedObjectIds(prev => prev.filter(id => id !== objectId));
    render();
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

      if (currentLayer?.locked) return;

      setDrawing(true);
      setSx(p.x);
      setSy(p.y);
      setLx(p.x);
      setLy(p.y);

      if (activeTool === "pen") {
        const bezierObjects = layers.flatMap(l => l.objects).filter(o => o.bezierPath);
        const bezierPaths = bezierObjects.map(o => o.bezierPath!);
        
        const hitPoint = findPointAtPosition(bezierPaths, p.x, p.y);
        const hitHandle = findHandleAtPosition(bezierPaths, p.x, p.y);

        if (hitPoint && penMode === "edit") {
          setDraggingPoint(hitPoint.point.id);
          setEditingPathId(hitPoint.path.id);
          setIsDraggingAnchor(true);
          return;
        }

        if (hitHandle && penMode === "edit") {
          setDraggingPoint(hitHandle.point.id);
          setDraggingHandle(hitHandle.handle);
          setEditingPathId(hitHandle.path.id);
          setIsDraggingAnchor(true);
          return;
        }

        const isDragging = e.shiftKey;
        const newPoint: BezierPoint = {
          id: genId(),
          x: p.x,
          y: p.y,
          type: isDragging ? "smooth" : "corner",
          handleIn: isDragging ? { x: -(p.x - sx) / 3, y: -(p.y - sy) / 3 } : { x: 0, y: 0 },
          handleOut: isDragging ? { x: (p.x - sx) / 3, y: (p.y - sy) / 3 } : { x: 0, y: 0 },
        };

        if (!penPath) {
          setPenPath({ id: genId(), closed: false, points: [newPoint] });
        } else {
          setPenPath(prev => prev ? { ...prev, points: [...prev.points, newPoint] } : null);
        }
        setSx(p.x);
        setSy(p.y);
        render();
        return;
      }

      if (activeTool === "pencil") {
        setCurObj({ id: genId(), type: "path", pts: [{ x: p.x, y: p.y }], c: currentColor, fc: "transparent", w: strokeWidth, smooth: false, op: 1, lineStyle });
      }

      if (activeTool === "select") {
        setMarquee({ x: p.x, y: p.y, w: 0, h: 0 });
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (activeTool === "eraser" || activeTool === "brushEraser") {
        setEraserCursorPos({ x: e.clientX, y: e.clientY });
      }

      if (activeTool === "pen") {
        const p = cpx(e);
        setPenPreview(p);
        
        if (isDraggingAnchor && draggingPoint) {
          const dx = p.x - sx;
          const dy = p.y - sy;
          
          if (draggingHandle) {
            setLayers(prev => prev.map(layer => ({
              ...layer,
              objects: layer.objects.map(obj => {
                if (!obj.bezierPath || obj.bezierPath.id !== editingPathId) return obj;
                const updatedPoints = obj.bezierPath.points.map(pt => {
                  if (pt.id !== draggingPoint) return pt;
                  if (draggingHandle === "out") {
                    return {
                      ...pt,
                      handleOut: { x: pt.handleOut.x + dx, y: pt.handleOut.y + dy },
                      handleIn: altKeyDown ? pt.handleIn : { x: -(pt.handleOut.x + dx), y: -(pt.handleOut.y + dy) },
                    };
                  } else {
                    return {
                      ...pt,
                      handleIn: { x: pt.handleIn.x + dx, y: pt.handleIn.y + dy },
                      handleOut: altKeyDown ? pt.handleOut : { x: -(pt.handleIn.x + dx), y: -(pt.handleIn.y + dy) },
                    };
                  }
                });
                return { ...obj, bezierPath: { ...obj.bezierPath, points: updatedPoints } };
              })
            })));
          } else {
            setLayers(prev => prev.map(layer => ({
              ...layer,
              objects: layer.objects.map(obj => {
                if (!obj.bezierPath || obj.bezierPath.id !== editingPathId) return obj;
                const updatedPoints = obj.bezierPath.points.map(pt => 
                  pt.id === draggingPoint ? { ...pt, x: pt.x + dx, y: pt.y + dy } : pt
                );
                return { ...obj, bezierPath: { ...obj.bezierPath, points: updatedPoints } };
              })
            })));
          }
          setSx(p.x);
          setSy(p.y);
          render();
          return;
        }
        
        if (penPath && drawing) {
          const lastPt = penPath.points[penPath.points.length - 1];
          const dx = p.x - lastPt.x;
          const dy = p.y - lastPt.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 20) {
            setPenPath(prev => prev ? {
              ...prev,
              points: prev.points.map((pt, i) => 
                i === prev.points.length - 1 
                  ? { ...pt, handleOut: { x: dx / 3, y: dy / 3 }, handleIn: { x: -dx / 3, y: -dy / 3 } }
                  : pt
              )
            } : null);
          }
          render();
        }
        return;
      }

      if (panning) {
        setPanX(prev => prev + e.clientX - lx);
        setPanY(prev => prev + e.clientY - ly);
        setLx(e.clientX);
        setLy(e.clientY);
        return;
      }
      if (!drawing) return;

      const p = cpx(e);

      if (activeTool === "select" && marquee) {
        setMarquee({ ...marquee, w: p.x - marquee.x, h: p.y - marquee.y });
        render();
        return;
      }

      if (activeTool === "select" && selectedObjectIds.length > 0) {
        const dx = p.x - sx;
        const dy = p.y - sy;
        setLayers(prev => prev.map(layer => {
          if (layer.id !== currentLayerId) return layer;
          return {
            ...layer,
            objects: layer.objects.map(obj => {
              if (selectedObjectIds.includes(obj.id)) {
                const clone = { ...obj };
                moveObj(clone, dx, dy);
                return clone;
              }
              return obj;
            })
          };
        }));
        setSx(p.x);
        setSy(p.y);
        render();
        return;
      }

      if (activeTool === "eraser" || activeTool === "brushEraser") {
        const r = activeTool === "brushEraser" ? strokeWidth * 2 * (1 + (1 - eraserHardness) * 0.5) : strokeWidth * 3;
        const erased = hitTestAll(activeObjects, p.x, p.y, r);
        
        if (erased.length > 0) {
          const newParticles: EraserParticle[] = [];
          erased.forEach(idx => {
            const obj = activeObjects[idx];
            if (obj) {
              const particleCount = Math.floor(5 * eraserOpacity);
              for (let i = 0; i < particleCount; i++) {
                const spreadRadius = r * eraserHardness;
                newParticles.push({
                  x: p.x + (Math.random() - 0.5) * spreadRadius * 2,
                  y: p.y + (Math.random() - 0.5) * spreadRadius * 2,
                  vx: (Math.random() - 0.5) * 8 * eraserHardness,
                  vy: (Math.random() - 0.5) * 8 * eraserHardness,
                  life: 1,
                  maxLife: 1,
                  size: Math.random() * 4 * eraserOpacity + 2 * eraserOpacity,
                  color: obj.c || '#fff',
                });
              }
            }
          });
          setEraserParticles(prev => [...prev, ...newParticles]);
          setIsErasing(true);
        }
        
        setLayers(prev => prev.map(layer => {
          if (layer.id !== currentLayerId) return layer;
          return {
            ...layer,
            objects: layer.objects.filter((_, idx) => !erased.includes(idx))
          };
        }));
        render();
        return;
      }

      if (activeTool === "pencil") {
        setCurObj(prev => prev ? { ...prev, pts: [...(prev.pts || []), { x: p.x, y: p.y }] } : null);
        render();
        return;
      }

      if (["line", "arrow", "rect", "circle", "triangle", "diamond", "hexagon", "star", "chat", "checkbox"].includes(activeTool)) {
        setCurObj(mkShape(activeTool, sx, sy, p.x, p.y));
        render();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (panning) {
        setPanning(false);
        return;
      }

      if (currentTool === "pen") {
        if (isDraggingAnchor) {
          setIsDraggingAnchor(false);
          setDraggingPoint(null);
          setDraggingHandle(null);
          setEditingPathId(null);
          render();
          return;
        }

        if (penPath && penPath.points.length >= 2) {
          const distToStart = Math.hypot(
            penPath.points[penPath.points.length - 1].x - penPath.points[0].x,
            penPath.points[penPath.points.length - 1].y - penPath.points[0].y
          );
          const isClosed = distToStart < 10;

          const bezierObj: DrawObject = {
            id: genId(),
            type: "bezier",
            c: currentColor,
            fc: fillEnabled ? fillColor : "transparent",
            w: strokeWidth,
            op: 1,
            bezierPath: { ...penPath, closed: isClosed },
          };

          setLayers(prev => prev.map(layer => {
            if (layer.id === currentLayerId) {
              return { ...layer, objects: [...layer.objects, bezierObj] };
            }
            return layer;
          }));

          if (isClosed) {
            setPenPath(null);
          } else {
            setPenPath(prev => prev ? { ...prev, points: [penPath.points[penPath.points.length - 1]] } : null);
          }
          render();
          return;
        }
        return;
      }

      if (!drawing) return;
      setDrawing(false);
      setPenPreview(null);

      if (activeTool === "select") {
        if (marquee) {
          const minX = Math.min(marquee.x, marquee.x + marquee.w);
          const minY = Math.min(marquee.y, marquee.y + marquee.h);
          const maxX = Math.max(marquee.x, marquee.x + marquee.w);
          const maxY = Math.max(marquee.y, marquee.y + marquee.h);
          
          const selected = activeObjects.filter(obj => {
            const bb = bbox(obj);
            if (!bb) return false;
            return bb.x >= minX && bb.x + bb.w <= maxX && bb.y >= minY && bb.y + bb.h <= maxY;
          }).map(o => o.id);
          
          setSelectedObjectIds(selected);
        }
        setMarquee(null);
        render();
        return;
      }

      if (activeTool === "eraser" || activeTool === "brushEraser") {
        setIsErasing(false);
        render();
        return;
      }

      if (curObj) {
        if (curObj.type === "path" && (curObj.pts?.length || 0) < 2) {
          setCurObj(null);
          return;
        }
        
        const newLayerId = addLayer(`${curObj.type} ${Date.now().toString(36).slice(-4)}`);
        
        setLayers(prev => prev.map(layer => {
          if (layer.id === newLayerId) {
            return { ...layer, objects: [curObj] };
          }
          return layer;
        }));
        
        setCurObj(null);
        setSelectedObjectIds([curObj.id]);
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
        if (selectedObjectIds.length > 0) {
          setLayers(prev => prev.map(layer => {
            if (layer.id !== currentLayerId) return layer;
            return {
              ...layer,
              objects: layer.objects.filter(obj => !selectedObjectIds.includes(obj.id))
            };
          }));
          setSelectedObjectIds([]);
          render();
        }
      }
      if (e.code === "Escape") {
        setSelectedObjectIds([]);
        setMarquee(null);
        render();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyA") {
        e.preventDefault();
        setSelectedObjectIds(activeObjects.map(o => o.id));
        render();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyC") {
        e.preventDefault();
        const selected = activeObjects.filter(o => selectedObjectIds.includes(o.id));
        setCopiedObjects(selected.map(deepClone));
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyV") {
        e.preventDefault();
        if (copiedObjects.length > 0) {
          const offset = 20;
          const newObjects = copiedObjects.map(o => {
            const clone = deepClone(o);
            switch (clone.type) {
              case "rect":
              case "circle":
              case "text":
                clone.x! += offset;
                clone.y! += offset;
                break;
              case "line":
              case "arrow":
                clone.x1! += offset;
                clone.y1! += offset;
                clone.x2! += offset;
                clone.y2! += offset;
                break;
              case "triangle":
                clone.x1! += offset;
                clone.y1! += offset;
                clone.x2! += offset;
                clone.y2! += offset;
                clone.x3! += offset;
                clone.y3! += offset;
                break;
              case "diamond":
                clone.cx! += offset;
                clone.cy! += offset;
                break;
              case "path":
                clone.pts = clone.pts?.map(p => ({ x: p.x + offset, y: p.y + offset }));
                break;
            }
            return clone;
          });
          setLayers(prev => prev.map(layer => {
            if (layer.id === currentLayerId) return layer;
            return { ...layer, objects: [...layer.objects, ...newObjects] };
          }));
          setSelectedObjectIds(newObjects.map(o => o.id));
          setCopiedObjects(newObjects);
          render();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceDown(false);
    };

    const handleClick = (e: MouseEvent) => {
      if (activeTool !== "select") return;
      const p = cpx(e);

      if (e.shiftKey && selectedObjectIds.length > 0) {
        for (let i = activeObjects.length - 1; i >= 0; i--) {
          if (hitTest(activeObjects[i], p.x, p.y)) {
            const objId = activeObjects[i].id;
            if (selectedObjectIds.includes(objId)) {
              setSelectedObjectIds(prev => prev.filter(id => id !== objId));
            } else {
              setSelectedObjectIds(prev => [...prev, objId]);
            }
            render();
            return;
          }
        }
      }

      let found = false;
      for (let i = activeObjects.length - 1; i >= 0; i--) {
        if (hitTest(activeObjects[i], p.x, p.y)) {
          setSelectedObjectIds([activeObjects[i].id]);
          found = true;
          break;
        }
      }
      if (!found) {
        setSelectedObjectIds([]);
      }
      render();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", () => setEraserCursorPos(null));
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      observer.disconnect();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseleave", () => setEraserCursorPos(null));
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeTool, drawing, panning, sx, sy, lx, ly, curObj, selectedObjectIds, spaceDown, strokeWidth, currentColor, fillEnabled, fillColor, lineStyle, cpx, render, marquee, currentLayerId, currentLayer, activeObjects, copiedObjects, eraserParticles, handleUndo, handleRedo]);

  useEffect(() => {
    render();
  }, [render]);

  const gridColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#666" : "#ddd";
  const lineColor = bgColor === "#1e1e1e" || bgColor === "#1a1a2e" ? "#444" : "#eee";

  const getCursor = () => {
    switch (activeTool) {
      case "select": return selectedObjectIds.length > 0 ? "move" : "default";
      case "hand": return panning ? "grabbing" : "grab";
      case "eraser":
      case "brushEraser": return "none";
      case "text": return "text";
      default: return "crosshair";
    }
  };

  const getEraserSize = () => {
    const baseSize = activeTool === "brushEraser" ? strokeWidth * 2 : strokeWidth * 3;
    if (activeTool === "brushEraser") {
      return baseSize * (1 + (1 - eraserHardness) * 0.5);
    }
    return baseSize;
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
        backgroundSize: showGrid ? `${gridSpacing}px ${gridSpacing}px` : "auto",
        backgroundPosition: showGrid ? `${panX}px ${panY}px` : "auto",
        cursor: getCursor(),
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {eraserCursorPos && (activeTool === "eraser" || activeTool === "brushEraser") && (
        <div
          className="pointer-events-none fixed border-2 border-blue-500 bg-blue-500/10 rounded-full"
          style={{
            width: getEraserSize(),
            height: getEraserSize(),
            left: eraserCursorPos.x - getEraserSize() / 2,
            top: eraserCursorPos.y - getEraserSize() / 2,
            zIndex: 9999,
          }}
        />
      )}
      {showLayers && (
        <LayersPanel
          layers={layers}
          currentLayerId={currentLayerId}
          onSelectLayer={setCurrentLayerId}
          onAddLayer={() => addLayer()}
          onDeleteLayer={deleteLayer}
          onRenameLayer={renameLayer}
          onToggleVisibility={toggleLayerVisibility}
          onToggleLock={toggleLayerLock}
          onMoveLayer={moveLayer}
          onSelectObjects={setSelectedObjectIds}
          selectedObjectIds={selectedObjectIds}
          onSelectObject={(id) => setSelectedObjectIds([id])}
          onDeleteObject={deleteObject}
          position={layerPanelPosition}
          onPositionChange={setLayerPanelPosition}
          isCollapsed={layerPanelCollapsed}
          onToggleCollapse={() => setLayerPanelCollapsed(!layerPanelCollapsed)}
          panelWidth={layerPanelWidth}
          onWidthChange={setLayerPanelWidth}
        />
      )}
    </div>
  );
}

export { hitTest, bbox, dSeg };
export type { DrawObject, Tool, LineStyle, Point, Layer };
