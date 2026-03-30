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
  HardDrive,
  X,
  File,
  Loader2,
  Settings,
  Grid3X3,
  Check,
  RefreshCw,
  AlertCircle,
  FileTextIcon,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Eraser,
  Pencil,
  Folder,
  FolderOpen,
  Save,
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

const CANVAS_SIZES = [
  { name: "Square (1:1)", value: { width: 1920, height: 1920 } },
  { name: "Landscape HD (16:9)", value: { width: 1920, height: 1080 } },
  { name: "Portrait (9:16)", value: { width: 1080, height: 1920 } },
  { name: "A4 Landscape", value: { width: 1123, height: 794 } },
  { name: "A4 Portrait", value: { width: 794, height: 1123 } },
  { name: "Widescreen (21:9)", value: { width: 2560, height: 1080 } },
];

function BoardSettingsModal({
  isOpen,
  onClose,
  bgColor,
  onBgColorChange,
  canvasSize,
  onCanvasSizeChange,
  gridType,
  onGridTypeChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  bgColor: string;
  onBgColorChange: (color: string) => void;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
  gridType: "dots" | "lines" | "none";
  onGridTypeChange: (type: "dots" | "lines" | "none") => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Board Settings
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <div className="flex flex-wrap gap-2">
              {BG_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => onBgColorChange(color.value)}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all",
                    bgColor === color.value ? "border-primary scale-110" : "border-border"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {bgColor === color.value && (
                    <Check className={cn("w-5 h-5 mx-auto", color.value === "#ffffff" || color.value === "#f5f5f5" || color.value === "#fffef0" ? "text-gray-800" : "text-white")} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Grid Type</label>
            <div className="flex gap-2">
              <button onClick={() => onGridTypeChange("dots")} className={cn("flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2", gridType === "dots" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary")}>
                <Grid3X3 className="w-4 h-4" />Dots
              </button>
              <button onClick={() => onGridTypeChange("lines")} className={cn("flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2", gridType === "lines" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary")}>
                <Grid3X3 className="w-4 h-4" />Lines
              </button>
              <button onClick={() => onGridTypeChange("none")} className={cn("flex-1 py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2", gridType === "none" ? "border-primary bg-primary/10" : "border-border hover:bg-secondary")}>
                <X className="w-4 h-4" />None
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Canvas Size</label>
            <div className="grid grid-cols-2 gap-2">
              {CANVAS_SIZES.map((size) => (
                <button
                  key={size.name}
                  onClick={() => onCanvasSizeChange(size.value)}
                  className={cn("py-2 px-3 rounded-lg border transition-all text-sm", canvasSize.width === size.value.width && canvasSize.height === size.value.height ? "border-primary bg-primary/10" : "border-border hover:bg-secondary")}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
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
            <span className="font-medium text-sm">Drive Folders ({totalFiles} files)</span>
          </div>
          {showFiles ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showFiles && (
          <div className="max-h-80 overflow-y-auto">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : folderStructure.length === 0 ? (
              <div className="text-center py-4 px-3">
                <Folder className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No folders found in Drive.</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Save a whiteboard image to create a date folder.</p>
                <p className="text-xs text-muted-foreground/50 mt-2">Folders are named by date (e.g., 2026-03-27)</p>
              </div>
            ) : (
              folderStructure.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  onFileClick={onFileClick}
                  onFolderClick={onFolderClick}
                  expandedFolders={expandedFolders}
                  level={0}
                />
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
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
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
    return () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); };
  }, [file.id]);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold truncate">{file.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a href={pdfUrl || "#"} download={file.name} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Download"><Download className="w-5 h-5" /></a>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Close"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-muted/30">
        {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div> : error ? <div className="flex flex-col items-center justify-center h-full text-muted-foreground"><AlertCircle className="w-12 h-12 mb-4" /><p>{error}</p></div> : pdfUrl ? <iframe src={pdfUrl} className="w-full h-full border-0" title={file.name} /> : null}
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
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
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
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [file.id]);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold truncate">{file.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <a href={imageUrl || "#"} download={file.name} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Download"><Download className="w-5 h-5" /></a>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Close"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
        {loading ? <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /> : error ? <div className="text-center text-muted-foreground"><AlertCircle className="w-12 h-12 mb-4 mx-auto" /><p>{error}</p></div> : imageUrl ? <img src={imageUrl} alt={file.name} className="max-w-full max-h-full object-contain" /> : null}
      </div>
    </div>
  );
}

function DrawingToolbar({ strokeWidth, onStrokeWidthChange, eraserSize, onEraserSizeChange, eraserSoftness, onEraserSoftnessChange, currentTool, onToolChange }: { strokeWidth: number; onStrokeWidthChange: (width: number) => void; eraserSize: number; onEraserSizeChange: (size: number) => void; eraserSoftness: number; onEraserSoftnessChange: (softness: number) => void; currentTool: "pen" | "eraser"; onToolChange: (tool: "pen" | "eraser") => void }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setShowOptions(!showOptions)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm", showOptions ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80")}>
        {currentTool === "pen" ? <Pencil className="w-4 h-4" /> : <Eraser className="w-4 h-4" />}
        <span>{currentTool === "pen" ? "Pen" : "Eraser"}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {showOptions && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-background rounded-lg shadow-lg border w-72 z-50">
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <button onClick={() => onToolChange("pen")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors", currentTool === "pen" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80")}>
                <Pencil className="w-4 h-4" />Pen
              </button>
              <button onClick={() => onToolChange("eraser")} className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors", currentTool === "eraser" ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80")}>
                <Eraser className="w-4 h-4" />Eraser
              </button>
            </div>

            {currentTool === "pen" && (
              <div>
                <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Stroke Thickness</label><span className="text-sm text-muted-foreground">{strokeWidth}px</span></div>
                <input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))} className="w-full accent-primary" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Thin</span><span>Thick</span></div>
              </div>
            )}

            {currentTool === "eraser" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Eraser Size</label><span className="text-sm text-muted-foreground">{eraserSize}px</span></div>
                  <input type="range" min="5" max="100" value={eraserSize} onChange={(e) => onEraserSizeChange(parseInt(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Small</span><span>Large</span></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Softness</label><span className="text-sm text-muted-foreground">{eraserSoftness}%</span></div>
                  <input type="range" min="0" max="100" value={eraserSoftness} onChange={(e) => onEraserSoftnessChange(parseInt(e.target.value))} className="w-full accent-primary" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>Hard</span><span>Soft</span></div>
                </div>
              </>
            )}

            <button onClick={() => setShowOptions(false)} className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mt-2">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

function WhiteboardPanel({ onOpenSettings, bgColor, gridType, strokeWidth, eraserSize, eraserSoftness, currentTool, onToolChange, onSaveComplete }: { onOpenSettings: () => void; bgColor: string; gridType: "dots" | "lines" | "none"; strokeWidth: number; eraserSize: number; eraserSoftness: number; currentTool: "pen" | "eraser"; onToolChange: (tool: "pen" | "eraser") => void; onSaveComplete?: () => void }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savePassword, setSavePassword] = useState('');
  const [showSavePasswordPrompt, setShowSavePasswordPrompt] = useState(false);
  const editorRef = useRef<any>(null);
  const tldrawRef = useRef<any>(null);

  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const formatTimestamp = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, "-");
    return { date, time, fileName: `${date}::${time}` };
  };

  const handleExport = async () => {
    if (!editorRef.current) return;
    setIsExporting(true);
    try {
      const editor = editorRef.current;
      const shapeIds = editor.getCurrentPageShapeIds();
      
      if (shapeIds.size === 0) {
        toast.error("No content to export");
        setIsExporting(false);
        return;
      }

      const { blob } = await editor.toImage([...shapeIds], { format: 'png', background: false, pixelRatio: 3 });

      const { fileName } = formatTimestamp();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PNG exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveToDrive = async () => {
    if (!editorRef.current) {
      toast.error("Editor not ready");
      return;
    }

    // Check if password is required
    const requiredPassword = process.env.NEXT_PUBLIC_SAVE_PASSWORD;
    if (requiredPassword) {
      setIsSaving(true);
      setSavePassword('');
      setShowSavePasswordPrompt(true);
      return;
    }

    await performSave();
  };

  const handleSavePasswordSubmit = async () => {
    const requiredPassword = process.env.NEXT_PUBLIC_SAVE_PASSWORD;
    if (savePassword === requiredPassword) {
      setShowSavePasswordPrompt(false);
      setIsSaving(false);
      await performSave();
    } else {
      toast.error("Incorrect password");
      setSavePassword('');
    }
  };

  const performSave = async () => {
    setIsExporting(true);
    try {
      const editor = editorRef.current;
      
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) {
        toast.error("No content to save");
        setIsExporting(false);
        return;
      }
      
      const { blob } = await editor.toImage([...shapeIds], { format: 'png', background: false, pixelRatio: 3 });

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      console.log("[SmartBoard] Base64 length:", base64.length);

      const { date, fileName } = formatTimestamp();

      const response = await fetch("/api/drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileData: base64,
          fileName: `${fileName}.png`,
          folderName: date,
        }),
      });

      const res = await response.json();
      console.log("[SmartBoard] Save response:", res);
      if (res.success) {
        toast.success(`Saved: ${fileName}.png`);
        onSaveComplete?.();
      } else {
        toast.error(res.error || "Failed to save to Drive");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save to Drive: " + (error as Error).message);
    } finally {
      setIsExporting(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold flex items-center gap-2"><PenTool className="w-5 h-5" />Whiteboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenSettings} className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm" title="Board Settings"><Settings className="w-4 h-4" /></button>
          <button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm"><Download className="w-4 h-4" />Export</button>
          <button onClick={handleSaveToDrive} disabled={isExporting} className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm">{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save</button>
        </div>
      </div>
      <TldrawCanvas ref={tldrawRef} bgColor={bgColor} gridType={gridType} onEditorReady={handleEditorReady} />
      <div className="flex items-center justify-center p-4 border-t bg-card">
        <DrawingToolbar strokeWidth={strokeWidth} onStrokeWidthChange={() => {}} eraserSize={eraserSize} onEraserSizeChange={() => {}} eraserSoftness={eraserSoftness} onEraserSoftnessChange={() => {}} currentTool={currentTool} onToolChange={onToolChange} />
      </div>
    </div>
    );
    
    // Save password prompt modal
    if (showSavePasswordPrompt) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full">
            <h2 className="text-xl font-bold mb-4">Password Required</h2>
            <p className="mb-4 text-gray-600">Enter password to save to Google Drive:</p>
            <div className="mb-4">
              <input
                type="password"
                value={savePassword}
                onChange={(e) => setSavePassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSavePasswordSubmit()}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowSavePasswordPrompt(false);
                  setIsSaving(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePasswordSubmit}
                disabled={!savePassword}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) {
  return <div className="resize-handle w-1 cursor-col-resize bg-border hover:bg-primary/50 transition-colors flex-shrink-0" onMouseDown={onMouseDown} />;
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
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });
  const [viewingFile, setViewingFile] = useState<DriveFile | null>(null);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [eraserSoftness, setEraserSoftness] = useState(50);
  const [currentTool, setCurrentTool] = useState<"pen" | "eraser">("pen");
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const loadFolderStructure = useCallback(async (showToast = false) => {
    setIsLoadingFiles(true);
    try {
      const response = await fetch("/api/drive?action=structure");
      const data = await response.json();
      console.log("[SmartBoard] API response:", JSON.stringify(data, null, 2));
      if (data.success !== false) {
        const structure = data.structure || [];
        setFolderStructure(structure);
        const totalFiles = structure.reduce((acc: number, f: FolderStructure) => acc + f.files.length, 0);
        const totalFolders = structure.length;
        if (showToast) {
          toast.info(`Found ${totalFolders} folders with ${totalFiles} files`);
        }
      } else {
        console.error("[SmartBoard] API error:", data.error);
        toast.error(data.error || "Failed to load files");
      }
    } catch (error) {
      console.error("Load files error:", error);
      toast.error("Failed to load from Drive");
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  const handleFolderClick = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleFileClick = (file: DriveFile) => {
    if (file.mimeType === "application/pdf" || file.mimeType.startsWith("image/")) {
      setViewingFile(file);
    }
  };

  useEffect(() => {
    const savedState = localStorage.getItem("smartboard-state");
    if (savedState) {
      const state = JSON.parse(savedState);
      setViewMode(state.viewMode || "both");
      setSplitRatio(state.splitRatio || 50);
      if (state.slides) setSlides(state.slides);
      if (state.currentSlide !== undefined) setCurrentSlide(state.currentSlide);
    }
    const savedSettings = localStorage.getItem("smartboard-settings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setBgColor(settings.bgColor || "#ffffff");
      setGridType(settings.gridType || "dots");
      if (settings.canvasSize) setCanvasSize(settings.canvasSize);
      if (settings.strokeWidth) setStrokeWidth(settings.strokeWidth);
      if (settings.eraserSize) setEraserSize(settings.eraserSize);
      if (settings.eraserSoftness) setEraserSoftness(settings.eraserSoftness);
    }
    loadFolderStructure();
  }, [loadFolderStructure]);

  useEffect(() => { localStorage.setItem("smartboard-state", JSON.stringify({ viewMode, splitRatio, slides, currentSlide })); }, [viewMode, splitRatio, slides, currentSlide]);
  useEffect(() => { localStorage.setItem("smartboard-settings", JSON.stringify({ bgColor, gridType, canvasSize, strokeWidth, eraserSize, eraserSoftness })); }, [bgColor, gridType, canvasSize, strokeWidth, eraserSize, eraserSoftness]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === "1") setViewMode("notes");
      else if (e.key === "2") setViewMode("whiteboard");
      else if (e.key === "3") setViewMode("both");
      else if (e.key === "Escape" && viewingFile) setViewingFile(null);
      else if (e.key === "e" || e.key === "E") setCurrentTool((t) => (t === "pen" ? "eraser" : "pen"));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingFile]);

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
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitRatio(Math.max(20, Math.min(80, newRatio)));
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
    const newSlide: NoteSlide = { id: Date.now().toString(), title: `Slide ${slides.length + 1}`, content: "" };
    setSlides([...slides, newSlide]);
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
      <BoardSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} bgColor={bgColor} onBgColorChange={setBgColor} canvasSize={canvasSize} onCanvasSizeChange={setCanvasSize} gridType={gridType} onGridTypeChange={setGridType} />

      <header className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">LCIT ET</h1>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <ViewModeButton mode="notes" currentMode={viewMode} onClick={() => setViewMode("notes")} icon={FileText} label="Notes" />
            <ViewModeButton mode="whiteboard" currentMode={viewMode} onClick={() => setViewMode("whiteboard")} icon={PenTool} label="Board" />
            <ViewModeButton mode="both" currentMode={viewMode} onClick={() => setViewMode("both")} icon={Columns} label="Both" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
            <span className="font-medium">Shortcuts:</span><span>F Fullscreen</span><span>1/2/3 Modes</span><span>E Tool</span>
          </div>
          <button onClick={() => loadFolderStructure(true)} className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm">
            {isLoadingFiles ? <Loader2 className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4 text-primary" />}
            <span className="hidden md:inline">Drive</span>
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-secondary rounded-lg transition-colors" title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {viewMode === "notes" && (
          <div className="w-full">
            {viewingFile ? (viewingFile.mimeType === "application/pdf" ? <PDFViewer file={viewingFile} onClose={() => setViewingFile(null)} /> : <ImageViewer file={viewingFile} onClose={() => setViewingFile(null)} />) : (
              <NotesPanel slides={slides} currentSlide={currentSlide} onSlideChange={setCurrentSlide} onAddSlide={addSlide} onDeleteSlide={deleteSlide} onUpdateSlide={updateSlide} folderStructure={folderStructure} onFileClick={handleFileClick} onFolderClick={handleFolderClick} isLoadingFiles={isLoadingFiles} onRefreshFiles={() => loadFolderStructure()} expandedFolders={expandedFolders} />
            )}
          </div>
        )}
        {viewMode === "whiteboard" && (
          <div className="w-full"><WhiteboardPanel onOpenSettings={() => setShowSettingsModal(true)} bgColor={bgColor} gridType={gridType} strokeWidth={strokeWidth} eraserSize={eraserSize} eraserSoftness={eraserSoftness} currentTool={currentTool} onToolChange={setCurrentTool} onSaveComplete={() => loadFolderStructure(true)} /></div>
        )}
        {viewMode === "both" && (
          <>
            <div style={{ width: `${splitRatio}%` }} className="flex flex-col">
              {viewingFile ? (viewingFile.mimeType === "application/pdf" ? <PDFViewer file={viewingFile} onClose={() => setViewingFile(null)} /> : <ImageViewer file={viewingFile} onClose={() => setViewingFile(null)} />) : (
                <NotesPanel slides={slides} currentSlide={currentSlide} onSlideChange={setCurrentSlide} onAddSlide={addSlide} onDeleteSlide={deleteSlide} onUpdateSlide={updateSlide} folderStructure={folderStructure} onFileClick={handleFileClick} onFolderClick={handleFolderClick} isLoadingFiles={isLoadingFiles} onRefreshFiles={() => loadFolderStructure()} expandedFolders={expandedFolders} />
              )}
            </div>
            <ResizeHandle onMouseDown={handleResizeStart} />
            <div style={{ width: `${100 - splitRatio}%` }}><WhiteboardPanel onOpenSettings={() => setShowSettingsModal(true)} bgColor={bgColor} gridType={gridType} strokeWidth={strokeWidth} eraserSize={eraserSize} eraserSoftness={eraserSoftness} currentTool={currentTool} onToolChange={setCurrentTool} onSaveComplete={() => loadFolderStructure(true)} /></div>
          </>
        )}
      </div>
    </div>
  );
}
