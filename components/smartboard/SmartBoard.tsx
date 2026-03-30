"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import TldrawCanvas from "./TldrawCanvas";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ViewMode, NoteSlide, DriveFile, FolderStructure } from "@/lib/types";
import {
  FileText,
  PenTool,
  Columns,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Download,
  X,
  Loader2,
  Settings,
  Grid3X3,
  Check,
  RefreshCw,
  FileTextIcon,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Eraser,
  Pencil,
  Folder,
  FolderOpen,
  MousePointer2,
  Highlighter,
  Square,
  Circle,
  ArrowRight,
  Type,
  Undo2,
  Redo2,
  Trash,
  CircleDot,
  StickyNote,
  DownloadCloud,
  FileInput,
  FileOutput,
  Layers,
} from "lucide-react";

function ViewModeButton({
  mode,
  currentMode,
  onClick,
  icon: Icon,
  label,
}: {
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
        currentMode === mode
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

const BG_COLORS = [
  { name: "White", value: "#ffffff" },
  { name: "Light Gray", value: "#f5f5f5" },
  { name: "Cream", value: "#fffef0" },
  { name: "Light Blue", value: "#f0f8ff" },
  { name: "Light Green", value: "#f0fff0" },
  { name: "Light Pink", value: "#fff0f5" },
  { name: "Dark", value: "#1e1e1e" },
  { name: "Dark Blue", value: "#1a1a2e" },
];

const PEN_COLORS = [
  "#000000", "#374151", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#2563eb", "#7c3aed", "#db2777",
];

function BoardSettingsModal({
  isOpen,
  onClose,
  bgColor,
  onBgColorChange,
  gridType,
  onGridTypeChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  gridType: "dots" | "lines" | "none";
  onGridTypeChange: (type: "dots" | "lines" | "none") => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md overflow-hidden border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Board Settings
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-3">Background Color</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onBgColorChange(color.value)}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all hover:scale-105",
                    bgColor === color.value ? "border-primary scale-110 ring-2 ring-primary/30" : "border-border"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {bgColor === color.value && (
                    <Check className={cn("w-5 h-5 mx-auto", ["#ffffff", "#f5f5f5", "#fffef0"].includes(color.value) ? "text-gray-800" : "text-white")} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Grid Type</label>
            <div className="flex gap-2">
              {(["dots", "lines", "none"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => onGridTypeChange(type)}
                  className={cn(
                    "flex-1 py-2.5 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 font-medium text-sm",
                    gridType === type ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"
                  )}
                >
                  {type === "dots" && <Grid3X3 className="w-4 h-4" />}
                  {type === "lines" && <Grid3X3 className="w-4 h-4" />}
                  {type === "none" && <X className="w-4 h-4" />}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderItem({
  folder,
  onFileClick,
  onFolderClick,
  expandedFolders,
  level = 0,
}: {
  folder: FolderStructure;
  onFileClick: (file: DriveFile) => void;
  onFolderClick: (folderId: string) => void;
  expandedFolders: Set<string>;
  level?: number;
}) {
  const isExpanded = expandedFolders.has(folder.id);

  return (
    <div>
      <button
        onClick={() => onFolderClick(folder.id)}
        className="w-full flex items-center gap-2 p-2 hover:bg-secondary/50 rounded transition-colors text-left"
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
        <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>
        <span className="text-xs text-muted-foreground">{folder.files.length}</span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isExpanded && (
        <div>
          {folder.files.map((file) => (
            <button
              key={file.id}
              onClick={() => onFileClick(file)}
              className="w-full flex items-center gap-2 p-2 hover:bg-secondary/30 rounded transition-colors text-left"
              style={{ paddingLeft: `${28 + level * 16}px` }}
            >
              {file.mimeType === "application/pdf" ? (
                <FileTextIcon className="w-4 h-4 text-red-500" />
              ) : (
                <ImageIcon className="w-4 h-4 text-blue-500" />
              )}
              <span className="flex-1 text-sm truncate">{file.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NotesPanel({
  slides,
  currentSlide,
  onSlideChange,
  onAddSlide,
  onDeleteSlide,
  onUpdateSlide,
  folderStructure,
  onFileClick,
  onFolderClick,
  isLoadingFiles,
  onRefreshFiles,
  expandedFolders,
}: {
  slides: NoteSlide[];
  currentSlide: number;
  onSlideChange: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onUpdateSlide: (index: number, content: string) => void;
  folderStructure: FolderStructure[];
  onFileClick: (file: DriveFile) => void;
  onFolderClick: (folderId: string) => void;
  isLoadingFiles: boolean;
  onRefreshFiles: () => void;
  expandedFolders: Set<string>;
}) {
  const currentNote = slides[currentSlide];
  const [showFiles, setShowFiles] = useState(true);

  const totalFiles = folderStructure.reduce((acc, folder) => acc + folder.files.length, 0);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Notes
        </h2>
        <button onClick={onAddSlide} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Add new note">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 p-2 border-b">
        <button onClick={() => onSlideChange(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-muted-foreground">{currentSlide + 1} / {slides.length}</span>
        <button onClick={() => onSlideChange(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1} className="p-2 hover:bg-secondary rounded-lg disabled:opacity-50 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
        {slides.length > 1 && (
          <button onClick={() => onDeleteSlide(currentSlide)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors ml-2" title="Delete slide">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="border-b">
        <button onClick={() => setShowFiles(!showFiles)} className="w-full flex items-center justify-between p-3 hover:bg-secondary/50 transition-colors">
          <div className="flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Drive Files ({totalFiles})</span>
          </div>
          {showFiles ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showFiles && (
          <div className="max-h-60 overflow-y-auto">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : folderStructure.length === 0 ? (
              <div className="text-center py-4 px-3">
                <Folder className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No files found.</p>
              </div>
            ) : (
              folderStructure.map((folder) => (
                <FolderItem key={folder.id} folder={folder} onFileClick={onFileClick} onFolderClick={onFolderClick} expandedFolders={expandedFolders} level={0} />
              ))
            )}
            <div className="p-2 border-t">
              <button onClick={onRefreshFiles} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={cn("w-4 h-4", isLoadingFiles && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <textarea
          value={currentNote?.content || ""}
          onChange={(e) => onUpdateSlide(currentSlide, e.target.value)}
          placeholder="Type your notes here..."
          className="w-full h-full resize-none bg-transparent border-0 outline-none text-lg leading-relaxed placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function PDFViewer({ file, onClose }: { file: DriveFile; onClose: () => void }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/drive?action=download&fileId=${file.id}`);
        if (response.ok) {
          const blob = await response.blob();
          setPdfUrl(URL.createObjectURL(blob));
        } else {
          setError("Failed to load PDF");
        }
      } catch {
        setError("Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [file.id]);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold truncate">{file.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-muted/30">
        {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : error ? <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><p>{error}</p></div> : pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-0" /> : null}
      </div>
    </div>
  );
}

function ImageViewer({ file, onClose }: { file: DriveFile; onClose: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/drive?action=download&fileId=${file.id}`);
        if (response.ok) {
          setImageUrl(URL.createObjectURL(await response.blob()));
        } else {
          setError("Failed to load image");
        }
      } catch {
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };
    loadImage();
  }, [file.id]);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold truncate">{file.name}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
        {loading ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : error ? <p className="text-muted-foreground">{error}</p> : imageUrl ? <img src={imageUrl} alt={file.name} className="max-w-full max-h-full object-contain" /> : null}
      </div>
    </div>
  );
}

type Tool = "select" | "draw" | "highlight" | "eraser" | "brush-eraser" | "geo" | "arrow" | "text" | "note";

const tools = [
  { id: "select" as Tool, icon: MousePointer2, label: "Select" },
  { id: "draw" as Tool, icon: Pencil, label: "Pen" },
  { id: "highlight" as Tool, icon: Highlighter, label: "Highlighter" },
  { id: "eraser" as Tool, icon: Eraser, label: "Shape Eraser" },
  { id: "brush-eraser" as Tool, icon: Trash2, label: "Brush Eraser" },
  { id: "geo" as Tool, icon: Square, label: "Shapes" },
  { id: "arrow" as Tool, icon: ArrowRight, label: "Arrow" },
  { id: "text" as Tool, icon: Type, label: "Text" },
  { id: "note" as Tool, icon: StickyNote, label: "Sticky Note" },
];

const shapeOptions = [
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "ellipse", icon: Circle, label: "Ellipse" },
  { id: "diamond", icon: Square, label: "Diamond" },
  { id: "triangle", icon: Square, label: "Triangle" },
  { id: "line", icon: ArrowRight, label: "Line" },
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
];

function WhiteboardToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  canUndo,
  canRedo,
  currentShape,
  onShapeChange,
  onAddPage,
  onPrevPage,
  onNextPage,
  currentPage,
  pageCount,
}: {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentShape: string;
  onShapeChange: (shape: string) => void;
  onAddPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  currentPage: number;
  pageCount: number;
}) {
  const [showColors, setShowColors] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1">
        <button onClick={onUndo} disabled={!canUndo} className={cn("p-2.5 rounded-xl transition-all", canUndo ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200" : "text-gray-300 dark:text-gray-600")}>
          <Undo2 className="w-5 h-5" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={cn("p-2.5 rounded-xl transition-all", canRedo ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200" : "text-gray-300 dark:text-gray-600")}>
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        {tools.map((tool) => (
          <div key={tool.id} className="relative">
            {tool.id === "geo" ? (
              <>
                <button
                  onClick={() => { onToolChange(tool.id); setShowShapes(!showShapes); setShowExportMenu(false); }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all relative",
                    currentTool === tool.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  )}
                  title={tool.label}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
                {showShapes && currentTool === "geo" && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1">
                    {shapeOptions.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => { onShapeChange(shape.id); setShowShapes(false); }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          currentShape === shape.id ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                        title={shape.label}
                      >
                        <shape.icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={() => { onToolChange(tool.id); setShowShapes(false); setShowExportMenu(false); }}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  currentTool === tool.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                )}
                title={tool.label}
              >
                <tool.icon className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="relative">
          <button
            onClick={() => { setShowColors(!showColors); setShowShapes(false); setShowExportMenu(false); }}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: currentColor }} />
          </button>
          {showColors && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2">
              <div className="grid grid-cols-5 gap-1.5">
                {PEN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { onColorChange(color); setShowColors(false); }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all hover:scale-110",
                      currentColor === color ? "ring-2 ring-blue-500 ring-offset-2" : ""
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-2">
          <CircleDot className="w-4 h-4 text-gray-400" />
          <input
            type="range"
            min="1"
            max="20"
            value={strokeWidth}
            onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
            className="w-20 accent-blue-500"
          />
          <span className="text-xs text-gray-500 w-5">{strokeWidth}</span>
        </div>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="relative">
          <button
            onClick={() => { setShowExportMenu(!showExportMenu); setShowColors(false); setShowShapes(false); }}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200"
            title="Export"
          >
            <DownloadCloud className="w-5 h-5" />
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-32">
              <button
                onClick={() => { onExport(); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
              >
                <Download className="w-4 h-4" />
                Export PNG
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-1">
          <button onClick={onPrevPage} disabled={currentPage <= 1} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs px-2">{currentPage}/{pageCount}</span>
          <button onClick={onNextPage} disabled={currentPage >= pageCount} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onAddPage} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700" title="Add Page">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        <button onClick={onClear} className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all" title="Clear">
          <Trash className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function WhiteboardPanel({
  bgColor,
  gridType,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
}: {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}) {
  const [currentTool, setCurrentTool] = useState<Tool>("draw");
  const [currentShape, setCurrentShape] = useState("rectangle");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pages, setPages] = useState([{ id: "1", name: "Page 1" }]);
  const [currentPage, setCurrentPage] = useState(1);
  const editorRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);

  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
    editor.store.listen(() => {
      const history = editor.getHistory();
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    });
  }, []);

  const handleUndo = () => editorRef.current?.undo();
  const handleRedo = () => editorRef.current?.redo();
  const handleClear = () => {
    if (editorRef.current) {
      const shapes = editorRef.current.getCurrentPageShapeIds();
      if (shapes.size > 0) editorRef.current.deleteShapes([...shapes]);
    }
  };

  const handleExport = async () => {
    if (!editorRef.current) return;
    try {
      const editor = editorRef.current;
      const asset = await editor.toImage();
      const url = URL.createObjectURL(asset);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whiteboard-page-${currentPage}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully!");
    } catch (error) {
      toast.error("Failed to export");
      console.error(error);
    }
  };

  const handleAddPage = () => {
    const newPage = { id: Date.now().toString(), name: `Page ${pages.length + 1}` };
    setPages([...pages, newPage]);
    setCurrentPage(pages.length + 1);
    
    if (editorRef.current) {
      editorRef.current.createPage();
      editorRef.current.setCurrentPage(newPage.id);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (editorRef.current) {
        const pageId = pages[currentPage - 2]?.id;
        if (pageId) editorRef.current.setCurrentPage(pageId);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
      if (editorRef.current) {
        const pageId = pages[currentPage]?.id;
        if (pageId) editorRef.current.setCurrentPage(pageId);
      }
    }
  };

  useEffect(() => {
    if (!editorRef.current) return;
    
    const toolMap: Record<string, string> = {
      select: "select",
      draw: "draw",
      highlight: "highlight",
      eraser: "eraser",
      "brush-eraser": "eraser",
      geo: "geo",
      arrow: "arrow",
      text: "text",
      note: "note",
    };
    
    const tldrawTool = toolMap[currentTool] || "select";
    
    try {
      if (editorRef.current.getCurrentToolId() !== tldrawTool) {
        editorRef.current.setCurrentTool(tldrawTool);
      }
      
      if (currentTool === "geo" && editorRef.current.getCurrentTool()) {
        const tool = editorRef.current.getCurrentTool();
        if (tool && typeof tool.setGeo === "function") {
          tool.setGeo(currentShape);
        }
      }
    } catch (e) {
      console.error("Tool change error:", e);
    }
  }, [currentTool, currentShape]);

  return (
    <div className="relative w-full h-full overflow-hidden" ref={canvasRef}>
      <TldrawCanvas
        bgColor={bgColor}
        gridType={gridType}
        onEditorReady={handleEditorReady}
        currentTool={currentTool}
        currentColor={currentColor}
        strokeWidth={strokeWidth}
      />
      <WhiteboardToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={onColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={onStrokeWidthChange}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onExport={handleExport}
        canUndo={canUndo}
        canRedo={canRedo}
        currentShape={currentShape}
        onShapeChange={setCurrentShape}
        onAddPage={handleAddPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        currentPage={currentPage}
        pageCount={pages.length}
      />
    </div>
  );
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return <div className="w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors flex-shrink-0" onMouseDown={onMouseDown} />;
}

export default function SmartBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>("both");
  const [splitRatio, setSplitRatio] = useState(50);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [slides, setSlides] = useState<NoteSlide[]>([{ id: "1", title: "Slide 1", content: "" }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [folderStructure, setFolderStructure] = useState<FolderStructure[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [bgColor, setBgColor] = useState("#ffffff");
  const [gridType, setGridType] = useState<"dots" | "lines" | "none">("dots");
  const [viewingFile, setViewingFile] = useState<DriveFile | null>(null);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const loadFolderStructure = useCallback(async () => {
    setIsLoadingFiles(true);
    try {
      const data = await fetch("/api/drive?action=structure").then(r => r.json());
      if (data.success !== false) setFolderStructure(data.structure || []);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  const handleFolderClick = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(folderId) ? next.delete(folderId) : next.add(folderId);
      return next;
    });
  }, []);

  useEffect(() => {
    loadFolderStructure();
  }, [loadFolderStructure]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSplitRatio(Math.max(20, Math.min(80, ((e.clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const addSlide = () => {
    setSlides([...slides, { id: Date.now().toString(), title: `Slide ${slides.length + 1}`, content: "" }]);
    setCurrentSlide(slides.length);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    setCurrentSlide(Math.min(currentSlide, newSlides.length - 1));
  };

  const updateSlide = (index: number, content: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], content };
    setSlides(newSlides);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <BoardSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} bgColor={bgColor} onBgColorChange={setBgColor} gridType={gridType} onGridTypeChange={setGridType} />

      <header className="flex items-center justify-between px-6 py-3 border-b bg-card flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">LCIT ET</h1>
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <ViewModeButton mode="notes" currentMode={viewMode} onClick={() => setViewMode("notes")} icon={FileText} label="Notes" />
            <ViewModeButton mode="whiteboard" currentMode={viewMode} onClick={() => setViewMode("whiteboard")} icon={PenTool} label="Board" />
            <ViewModeButton mode="both" currentMode={viewMode} onClick={() => setViewMode("both")} icon={Columns} label="Both" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadFolderStructure()} className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm">
            {isLoadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
            <span className="hidden md:inline">Files</span>
          </button>
          <button onClick={() => setShowSettingsModal(true)} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {viewMode === "notes" && (
          <div className="w-full">
            {viewingFile ? (
              viewingFile.mimeType === "application/pdf" ? <PDFViewer file={viewingFile} onClose={() => setViewingFile(null)} /> : <ImageViewer file={viewingFile} onClose={() => setViewingFile(null)} />
            ) : (
              <NotesPanel slides={slides} currentSlide={currentSlide} onSlideChange={setCurrentSlide} onAddSlide={addSlide} onDeleteSlide={deleteSlide} onUpdateSlide={updateSlide} folderStructure={folderStructure} onFileClick={(f) => setViewingFile(f)} onFolderClick={handleFolderClick} isLoadingFiles={isLoadingFiles} onRefreshFiles={loadFolderStructure} expandedFolders={expandedFolders} />
            )}
          </div>
        )}
        {viewMode === "whiteboard" && (
          <div className="w-full"><WhiteboardPanel bgColor={bgColor} gridType={gridType} currentColor={currentColor} onColorChange={setCurrentColor} strokeWidth={strokeWidth} onStrokeWidthChange={setStrokeWidth} /></div>
        )}
        {viewMode === "both" && (
          <>
            <div style={{ width: `${splitRatio}%` }} className="flex flex-col">
              {viewingFile ? (
                viewingFile.mimeType === "application/pdf" ? <PDFViewer file={viewingFile} onClose={() => setViewingFile(null)} /> : <ImageViewer file={viewingFile} onClose={() => setViewingFile(null)} />
              ) : (
                <NotesPanel slides={slides} currentSlide={currentSlide} onSlideChange={setCurrentSlide} onAddSlide={addSlide} onDeleteSlide={deleteSlide} onUpdateSlide={updateSlide} folderStructure={folderStructure} onFileClick={(f) => setViewingFile(f)} onFolderClick={handleFolderClick} isLoadingFiles={isLoadingFiles} onRefreshFiles={loadFolderStructure} expandedFolders={expandedFolders} />
              )}
            </div>
            <ResizeHandle onMouseDown={handleResizeStart} />
            <div style={{ width: `${100 - splitRatio}%` }}>
              <WhiteboardPanel bgColor={bgColor} gridType={gridType} currentColor={currentColor} onColorChange={setCurrentColor} strokeWidth={strokeWidth} onStrokeWidthChange={setStrokeWidth} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
