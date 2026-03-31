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
  LayoutTemplate,
  Brain,
  Lightbulb,
  BarChart3,
  Target,
  Sparkles,
  Hexagon,
  Star,
  MessageSquare,
  CheckSquare,
  Triangle,
  Minus,
  Paintbrush,
  Layers,
  Calculator,
  ArrowLeftRight,
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

export interface WhiteboardTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  type: "brainstorming" | "planning" | "workflow" | "presentation";
  theme: {
    bgColor: string;
    gridType: "dots" | "lines" | "none";
    accentColor: string;
  };
  sections: TemplateSection[];
}

export interface TemplateSection {
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  elements: TemplateElement[];
}

export interface TemplateElement {
  type: "text" | "sticky_note" | "shape" | "icon";
  content?: string;
  color?: string;
  fontSize?: number;
  shapeType?: string;
  iconType?: "brain" | "lightbulb" | "chart" | "target";
  style?: Record<string, any>;
}

const templates: WhiteboardTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start with a clean slate",
    icon: Square,
    type: "presentation",
    theme: { bgColor: "#ffffff", gridType: "dots", accentColor: "#2563eb" },
    sections: [],
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    description: "Mind map for ideas",
    icon: Brain,
    type: "brainstorming",
    theme: { bgColor: "#fffef0", gridType: "none", accentColor: "#f59e0b" },
    sections: [
      {
        title: "Main Idea",
        position: { x: 400, y: 300 },
        size: { width: 200, height: 80 },
        elements: [
          { type: "shape", shapeType: "ellipse" },
        ],
      },
      {
        title: "Idea 1",
        position: { x: 100, y: 150 },
        size: { width: 150, height: 60 },
        elements: [
          { type: "sticky_note", content: "Idea 1", color: "#FFF3B0" },
        ],
      },
      {
        title: "Idea 2",
        position: { x: 650, y: 150 },
        size: { width: 150, height: 60 },
        elements: [
          { type: "sticky_note", content: "Idea 2", color: "#FECACA" },
        ],
      },
      {
        title: "Idea 3",
        position: { x: 100, y: 450 },
        size: { width: 150, height: 60 },
        elements: [
          { type: "sticky_note", content: "Idea 3", color: "#BAE6FD" },
        ],
      },
      {
        title: "Idea 4",
        position: { x: 650, y: 450 },
        size: { width: 150, height: 60 },
        elements: [
          { type: "sticky_note", content: "Idea 4", color: "#BBF7D0" },
        ],
      },
    ],
  },
  {
    id: "kanban",
    name: "Kanban Board",
    description: "Project task management",
    icon: LayoutTemplate,
    type: "workflow",
    theme: { bgColor: "#f8fafc", gridType: "none", accentColor: "#0891b2" },
    sections: [
      {
        title: "To Do",
        position: { x: 50, y: 100 },
        size: { width: 250, height: 400 },
        elements: [
          { type: "sticky_note", content: "Task 1", color: "#FEE2E2" },
          { type: "sticky_note", content: "Task 2", color: "#FEE2E2" },
        ],
      },
      {
        title: "In Progress",
        position: { x: 320, y: 100 },
        size: { width: 250, height: 400 },
        elements: [
          { type: "sticky_note", content: "Task 3", color: "#FEF3C7" },
        ],
      },
      {
        title: "Done",
        position: { x: 590, y: 100 },
        size: { width: 250, height: 400 },
        elements: [
          { type: "sticky_note", content: "Task 4", color: "#DCFCE7" },
        ],
      },
    ],
  },
  {
    id: "swot",
    name: "SWOT Analysis",
    description: "Strategic planning matrix",
    icon: Target,
    type: "planning",
    theme: { bgColor: "#ffffff", gridType: "dots", accentColor: "#16a34a" },
    sections: [
      {
        title: "Strengths",
        position: { x: 50, y: 80 },
        size: { width: 360, height: 180 },
        elements: [
          { type: "sticky_note", content: "Strength 1", color: "#DCFCE7" },
        ],
      },
      {
        title: "Weaknesses",
        position: { x: 430, y: 80 },
        size: { width: 360, height: 180 },
        elements: [
          { type: "sticky_note", content: "Weakness 1", color: "#FEE2E2" },
        ],
      },
      {
        title: "Opportunities",
        position: { x: 50, y: 320 },
        size: { width: 360, height: 180 },
        elements: [
          { type: "sticky_note", content: "Opportunity 1", color: "#BAE6FD" },
        ],
      },
      {
        title: "Threats",
        position: { x: 430, y: 320 },
        size: { width: 360, height: 180 },
        elements: [
          { type: "sticky_note", content: "Threat 1", color: "#FEF3C7" },
        ],
      },
    ],
  },
  {
    id: "presentation",
    name: "Presentation",
    description: "Slide-style layout",
    icon: LayoutTemplate,
    type: "presentation",
    theme: { bgColor: "#1e1e1e", gridType: "none", accentColor: "#ffffff" },
    sections: [
      {
        title: "Title",
        position: { x: 100, y: 100 },
        size: { width: 800, height: 100 },
        elements: [
          { type: "text", content: "Presentation Title", fontSize: 48, style: { color: "#ffffff" } },
        ],
      },
      {
        title: "Subtitle",
        position: { x: 100, y: 220 },
        size: { width: 800, height: 60 },
        elements: [
          { type: "text", content: "Subtitle here", fontSize: 24, style: { color: "#94a3b8" } },
        ],
      },
    ],
  },
];

function TemplateModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: WhiteboardTemplate) => void;
}) {
  const [filter, setFilter] = useState<"all" | "brainstorming" | "planning" | "workflow" | "presentation">("all");

  if (!isOpen) return null;

  const filteredTemplates = filter === "all" ? templates : templates.filter((t) => t.type === filter);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden border" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Choose a Template
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 border-b">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: "all", label: "All" },
              { id: "brainstorming", label: "Brainstorm" },
              { id: "planning", label: "Planning" },
              { id: "workflow", label: "Workflow" },
              { id: "presentation", label: "Presentation" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm transition-colors",
                  filter === f.id ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => { onSelect(template); onClose(); }}
                className="group p-4 rounded-xl border hover:border-primary hover:bg-primary/5 transition-all text-left"
              >
                <div
                  className="w-full h-24 rounded-lg mb-3 flex items-center justify-center"
                  style={{ backgroundColor: template.theme.bgColor }}
                >
                  <template.icon className="w-8 h-8" style={{ color: template.theme.accentColor }} />
                </div>
                <h4 className="font-medium group-hover:text-primary transition-colors">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
                <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
              </div>
            ) : folderStructure.length === 0 ? (
              <div className="text-center py-6 px-3">
                <Folder className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No files in Drive</p>
                <p className="text-xs text-muted-foreground/70">Make sure:</p>
                <ul className="text-xs text-muted-foreground/70 mt-1 space-y-0.5">
                  <li>• Shared drive "SmartBoard" exists</li>
                  <li>• Has folders with images/PDFs</li>
                  <li>• Service account has access</li>
                </ul>
                <button onClick={onRefreshFiles} className="mt-3 px-3 py-1.5 text-xs bg-secondary hover:bg-secondary/80 rounded-lg transition-colors flex items-center gap-1 mx-auto">
                  <RefreshCw className="w-3 h-3" />
                  Try Again
                </button>
              </div>
            ) : (
              folderStructure.map((folder) => (
                <FolderItem key={folder.id} folder={folder} onFileClick={onFileClick} onFolderClick={onFolderClick} expandedFolders={expandedFolders} level={0} />
              ))
            )}
            <div className="p-2 border-t">
              <button onClick={onRefreshFiles} className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className={cn("w-4 h-4", isLoadingFiles && "animate-spin")} />
                Refresh Files
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

type Tool = "select" | "hand" | "pencil" | "pen" | "eraser" | "brushEraser" | "geo" | "line" | "arrow" | "text" | "note";

const tools = [
  { id: "select" as Tool, icon: MousePointer2, label: "Select" },
  { id: "pencil" as Tool, icon: Pencil, label: "Pencil" },
  { id: "pen" as Tool, icon: PenTool, label: "Pen" },
  { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
  { id: "brushEraser" as Tool, icon: Paintbrush, label: "Brush Eraser" },
  { id: "geo" as Tool, icon: Square, label: "Shapes" },
  { id: "line" as Tool, icon: Minus, label: "Line" },
  { id: "arrow" as Tool, icon: ArrowRight, label: "Arrow" },
  { id: "text" as Tool, icon: Type, label: "Text" },
  { id: "note" as Tool, icon: StickyNote, label: "Sticky Note" },
];

const shapeOptions = [
  { id: "rectangle", label: "Rectangle", icon: "rect" },
  { id: "ellipse", label: "Ellipse", icon: "ellipse" },
  { id: "diamond", label: "Diamond", icon: "diamond" },
  { id: "triangle", label: "Triangle", icon: "triangle" },
  { id: "hexagon", label: "Hexagon", icon: "hexagon" },
  { id: "star", label: "Star", icon: "star" },
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "checkbox", label: "Checkbox", icon: "checkbox" },
];

function ShapeIcon({ type, className }: { type: string; className?: string }) {
  const size = 24;
  const s = size;
  
  switch (type) {
    case "rect":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
      );
    case "ellipse":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="12" rx="9" ry="7" />
        </svg>
      );
    case "diamond":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L22 12 L12 22 L2 12 Z" />
        </svg>
      );
    case "triangle":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3 L22 21 L2 21 Z" />
        </svg>
      );
    case "hexagon":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
        </svg>
      );
    case "star":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L15 9 L22 9 L17 14 L19 22 L12 18 L5 22 L7 14 L2 9 L9 9 Z" />
        </svg>
      );
    case "chat":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5 C21 16.19 16.97 20 12 20 C10.76 20 9.59 19.76 8.52 19.34 L3 20 L4.66 14.48 C4.24 13.41 4 12.24 4 11 C4 6.03 8.03 2 13 2 C17.97 2 22 6.03 22 11 C22 13.24 21.76 15.41 21.34 16.48 C21.14 17.08 21 17.68 21 18.3 L21 20 L21 18.3 C21 17.68 20.86 17.08 20.66 16.48 C20.24 15.41 20 13.24 20 11 C20 8.97 20.44 6.97 21.21 5.21" />
        </svg>
      );
    case "checkbox":
      return (
        <svg className={className} width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 12 L11 14 L15 10" />
        </svg>
      );
    default:
      return <Square className={className} />;
  }
}

type LineStyle = "solid" | "dashed" | "dotted";

function WhiteboardToolbar({
  currentTool,
  onToolChange,
  currentColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  lineStyle,
  onLineStyleChange,
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
  gridType,
  onGridTypeChange,
  eraserOpacity,
  onEraserOpacityChange,
  eraserHardness,
  onEraserHardnessChange,
  showLayersPanel,
  onToggleLayersPanel,
}: {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  lineStyle: LineStyle;
  onLineStyleChange: (style: LineStyle) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: (format: "png" | "svg" | "json") => void;
  canUndo: boolean;
  canRedo: boolean;
  currentShape: string;
  onShapeChange: (shape: string) => void;
  onAddPage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  currentPage: number;
  pageCount: number;
  gridType: "dots" | "lines" | "none";
  onGridTypeChange: (type: "dots" | "lines" | "none") => void;
  eraserOpacity?: number;
  onEraserOpacityChange?: (opacity: number) => void;
  eraserHardness?: number;
  onEraserHardnessChange?: (hardness: number) => void;
  showLayersPanel?: boolean;
  onToggleLayersPanel?: () => void;
}) {
  const [showColors, setShowColors] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showEraserSettings, setShowEraserSettings] = useState(false);
  const showBrushEraser = currentTool === "brushEraser";
  const showPenPencilLayers = currentTool === "pencil" || currentTool === "pen";

  const toggleGrid = () => {
    if (gridType === "none") {
      onGridTypeChange("dots");
    } else {
      onGridTypeChange("none");
    }
  };

  return (
    <div className="absolute bottom-4 md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-50">
      {showShapes && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 grid grid-cols-4 gap-3 min-w-[200px] z-[60]">
          {shapeOptions.map((shape) => {
            return (
              <button
                key={shape.id}
                onClick={() => { onShapeChange(shape.id); setShowShapes(false); }}
                className={cn(
                  "p-3 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center",
                  currentShape === shape.id ? "bg-blue-500 text-white" : "text-gray-700 dark:text-gray-200"
                )}
                title={shape.label}
              >
                <ShapeIcon type={shape.icon} className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-full md:max-w-none justify-center md:justify-start">
        <button onClick={onUndo} disabled={!canUndo} className={cn("p-2.5 rounded-xl transition-all flex-shrink-0", canUndo ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200" : "text-gray-300 dark:text-gray-600")}>
          <Undo2 className="w-5 h-5" />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className={cn("p-2.5 rounded-xl transition-all flex-shrink-0", canRedo ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200" : "text-gray-300 dark:text-gray-600")}>
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1" />

        {tools.map((tool) => (
          <div key={tool.id} className="relative flex-shrink-0">
            {tool.id === "geo" ? (
              <button
                onClick={() => { onToolChange(tool.id); setShowShapes(!showShapes); setShowExportMenu(false); setShowEraserSettings(false); }}
                className={cn(
                  "p-2.5 rounded-xl transition-all flex items-center gap-1",
                  currentTool === tool.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                )}
                title={tool.label}
              >
                {(() => {
                  const shape = shapeOptions.find(s => s.id === currentShape);
                  const iconType = shape?.icon || "rect";
                  const iconColorClass = currentTool === tool.id ? "text-white" : "text-gray-700 dark:text-gray-200";
                  return <ShapeIcon type={iconType} className={cn("w-5 h-5", iconColorClass)} />;
                })()}
                <ChevronDown className="w-3 h-3" />
              </button>
            ) : tool.id === "brushEraser" ? (
              <div className="relative">
                <button
                  onClick={() => { onToolChange(tool.id); setShowShapes(false); setShowExportMenu(false); setShowEraserSettings(!showEraserSettings); }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    currentTool === tool.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  )}
                  title={tool.label}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
                {showEraserSettings && showBrushEraser && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 min-w-[200px]">
                    <div className="mb-3">
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">Opacity (Particles)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={eraserOpacity || 0.5}
                          onChange={(e) => onEraserOpacityChange?.(parseFloat(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="text-xs w-8">{Math.round((eraserOpacity || 0.5) * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">Hardness (Spread)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={eraserHardness || 0.8}
                          onChange={(e) => onEraserHardnessChange?.(parseFloat(e.target.value))}
                          className="flex-1 accent-blue-500"
                        />
                        <span className="text-xs w-8">{Math.round((eraserHardness || 0.8) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : tool.id === "pencil" || tool.id === "pen" ? (
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => { onToolChange(tool.id); setShowShapes(false); setShowExportMenu(false); setShowEraserSettings(false); }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all",
                    currentTool === tool.id ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                  )}
                  title={tool.label}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
                {showPenPencilLayers && (
                  <button
                    onClick={() => onToggleLayersPanel?.()}
                    className={cn(
                      "p-2.5 rounded-xl transition-all",
                      showLayersPanel ? "bg-blue-500 text-white shadow-md" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                    )}
                    title="Toggle Layers"
                  >
                    <Layers className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => { onToolChange(tool.id); setShowShapes(false); setShowExportMenu(false); setShowEraserSettings(false); }}
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

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <div className="relative flex-shrink-0" style={{ overflow: 'visible' }}>
          <button
            onClick={() => { setShowColors(!showColors); setShowShapes(false); setShowExportMenu(false); }}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: currentColor }} />
          </button>
          {showColors && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50">
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

        <div className="flex items-center gap-1.5 px-2 flex-shrink-0">
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

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <div className="flex items-center gap-1 px-1 flex-shrink-0">
          <button
            onClick={() => onLineStyleChange("solid")}
            className={cn(
              "p-2 rounded-lg transition-all",
              lineStyle === "solid" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            )}
            title="Solid Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onLineStyleChange("dashed")}
            className={cn(
              "p-2 rounded-lg transition-all",
              lineStyle === "dashed" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            )}
            title="Dashed Line"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16">
              <line x1="2" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="2" />
              <line x1="10" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
          <button
            onClick={() => onLineStyleChange("dotted")}
            className={cn(
              "p-2 rounded-lg transition-all",
              lineStyle === "dotted" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
            )}
            title="Dotted Line"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16">
              <circle cx="3" cy="8" r="2" fill="currentColor" />
              <circle cx="8" cy="8" r="2" fill="currentColor" />
              <circle cx="13" cy="8" r="2" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <button
          onClick={toggleGrid}
          className={cn(
            "p-2.5 rounded-xl transition-all flex-shrink-0",
            gridType !== "none" ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          )}
          title={gridType === "none" ? "Show Grid" : "Hide Grid"}
        >
          <Grid3X3 className="w-5 h-5" />
        </button>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <div className="relative flex-shrink-0" style={{ overflow: 'visible' }}>
          <button
            onClick={() => { setShowExportMenu(!showExportMenu); setShowColors(false); setShowShapes(false); }}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-200"
            title="Export"
          >
            <DownloadCloud className="w-5 h-5" />
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-40 z-50">
              <button
                onClick={() => { onExport("png"); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
              >
                <Download className="w-4 h-4" />
                Export as PNG
              </button>
              <button
                onClick={() => { onExport("svg"); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
              >
                <Download className="w-4 h-4" />
                Export as SVG
              </button>
              <button
                onClick={() => { onExport("json"); setShowExportMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-1 flex-shrink-0">
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

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />

        <button onClick={onClear} className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-all flex-shrink-0" title="Clear">
          <Trash className="w-5 h-5" />
        </button>

        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
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
  onBgColorChange,
  onGridTypeChange,
}: {
  bgColor: string;
  gridType: "dots" | "lines" | "none";
  currentColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onBgColorChange: (color: string) => void;
  onGridTypeChange: (type: "dots" | "lines" | "none") => void;
}) {
  const [currentTool, setCurrentTool] = useState<Tool>("pencil");
  const [currentShape, setCurrentShape] = useState("rectangle");
  const [lineStyle, setLineStyle] = useState<LineStyle>("solid");
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [pages, setPages] = useState([{ id: "1", name: "Page 1" }]);
  const [currentPage, setCurrentPage] = useState(1);
  const [drawnObjects, setDrawnObjects] = useState<any[]>([]);
  const [showLayers, setShowLayers] = useState(true);
  const [eraserOpacity, setEraserOpacity] = useState(0.5);
  const [eraserHardness, setEraserHardness] = useState(0.8);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcPosition, setCalcPosition] = useState({ x: 100, y: 100 });
  const [calcSize, setCalcSize] = useState({ width: 600, height: 450 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeEdge, setResizeEdge] = useState<string>('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [calcType, setCalcType] = useState<'graphing' | 'scientific'>('graphing');
  const calcRef = useRef<HTMLDivElement>(null);
  const calcKeyRef = useRef(0);

  const handleEditorReady = useCallback(() => {
  }, []);

  const handleUndo = () => {
    setCanRedo(true);
  };
  const handleRedo = () => {
    setCanUndo(true);
  };
  const handleClear = () => {
    setDrawnObjects([]);
    setCanUndo(true);
    setCanRedo(false);
  };

  const handleExport = async (format: "png" | "svg" | "json") => {
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) return;
      
      if (format === "png") {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `whiteboard-page-${currentPage}.png`;
        a.click();
      } else if (format === "svg") {
        const exportData = {
          objects: drawnObjects,
          bgColor,
          gridType,
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `whiteboard-page-${currentPage}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "json") {
        const exportData = {
          objects: drawnObjects,
          bgColor,
          gridType,
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `whiteboard-page-${currentPage}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error("Failed to export");
      console.error(error);
    }
  };

  const handleAddPage = () => {
    const newPage = { id: Date.now().toString(), name: `Page ${pages.length + 1}` };
    setPages([...pages, newPage]);
    setCurrentPage(pages.length + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  useEffect(() => {
  }, [currentTool, currentShape]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      
      if (e.key === "e" || e.key === "E") {
        setCurrentTool("eraser");
      } else if (e.key === "p" || e.key === "P") {
        setCurrentTool("pencil");
      } else if (e.key === "b" || e.key === "B") {
        setCurrentTool("brushEraser");
      } else if (e.key === "s" || e.key === "S") {
        setCurrentTool("select");
      } else if (e.key === "l" || e.key === "L") {
        setShowLayers(!showLayers);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLayers]);

  useEffect(() => {
    if (!showCalculator) return;

    const initDesmos = () => {
      if (typeof window !== 'undefined' && !(window as any).Desmos) {
        const script = document.createElement('script');
        script.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${process.env.NEXT_PUBLIC_DESMOS_API_KEY || 'dc6d1a9c-9dd4-4a3f-b8d2-8a6e9f8c4c6c'}`;
        script.async = true;
        script.onload = () => createCalculator();
        document.head.appendChild(script);
      } else {
        createCalculator();
      }
    };

    const createCalculator = () => {
      const elt = document.getElementById('desmos-calculator');
      if (elt) {
        try {
          if (calcType === 'graphing') {
            (elt as any).calculator = (window as any).Desmos.GraphingCalculator(elt, {
              backgroundColor: 'transparent',
              textColor: '#374151',
              gridColor: '#e5e7eb',
              axisColor: '#9ca3af',
            });
          } else {
            (elt as any).calculator = (window as any).Desmos.ScientificCalculator(elt, {
              backgroundColor: 'transparent',
              textColor: '#374151',
            });
          }
        } catch (error) {
          console.error('Desmos init error:', error);
        }
      }
    };

    calcKeyRef.current += 1;
    const timer = setTimeout(initDesmos, 100);
    return () => clearTimeout(timer);
  }, [showCalculator, calcType]);

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCalcPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        let newX = calcPosition.x;
        let newY = calcPosition.y;
        let newWidth = calcSize.width;
        let newHeight = calcSize.height;

        if (resizeEdge.includes('e')) {
          newWidth = Math.max(400, e.clientX - calcPosition.x);
        }
        if (resizeEdge.includes('s')) {
          newHeight = Math.max(300, e.clientY - calcPosition.y);
        }
        if (resizeEdge.includes('w')) {
          const deltaX = calcPosition.x - e.clientX;
          newWidth = Math.max(400, calcSize.width + deltaX);
          newX = Math.min(e.clientX, calcPosition.x + calcSize.width - 400);
        }
        if (resizeEdge.includes('n')) {
          const deltaY = calcPosition.y - e.clientY;
          newHeight = Math.max(300, calcSize.height + deltaY);
          newY = Math.min(e.clientY, calcPosition.y + calcSize.height - 300);
        }

        setCalcPosition({ x: newX, y: newY });
        setCalcSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeEdge('');
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeEdge, dragOffset, calcPosition, calcSize]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <TldrawCanvas
        bgColor={bgColor}
        gridType={gridType}
        currentTool={currentTool}
        currentColor={currentColor}
        strokeWidth={strokeWidth}
        currentShape={currentShape}
        lineStyle={lineStyle}
        onObjectsChange={(objs) => {
          setDrawnObjects(objs);
        }}
        showLayers={showLayers}
        eraserOpacity={eraserOpacity}
        eraserHardness={eraserHardness}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <div className="absolute top-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className={cn(
            "p-3 rounded-xl shadow-lg border transition-all",
            showCalculator 
              ? "bg-blue-500 text-white border-blue-600" 
              : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          )}
          title={showCalculator ? "Hide Calculator" : "Show Calculator"}
        >
          <Calculator className="w-5 h-5" />
        </button>
      </div>
      {showCalculator && (
        <div
          ref={calcRef}
          className="absolute z-[60] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden select-none"
          style={{
            left: calcPosition.x,
            top: calcPosition.y,
            width: calcSize.width,
            height: calcSize.height,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          <div
            className="flex items-center justify-between p-3 border-b bg-gray-50 dark:bg-gray-800 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('.resize-handle') || (e.target as HTMLElement).closest('.calc-toggle')) return;
              setIsDragging(true);
              setDragOffset({
                x: e.clientX - calcPosition.x,
                y: e.clientY - calcPosition.y,
              });
            }}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {calcType === 'graphing' ? 'Graphing' : 'Scientific'} Calculator
              </span>
              <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5 calc-toggle">
                <button
                  onClick={() => setCalcType('graphing')}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    calcType === 'graphing'
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  Graph
                </button>
                <button
                  onClick={() => setCalcType('scientific')}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    calcType === 'scientific'
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  Scientific
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowCalculator(false)}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div key={`calc-${calcType}-${calcKeyRef.current}`} id="desmos-calculator" className="w-full" style={{ height: 'calc(100% - 48px)' }} />
          <>
            <div className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('nw'); setIsResizing(true); }} />
            <div className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('ne'); setIsResizing(true); }} />
            <div className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('sw'); setIsResizing(true); }} />
            <div className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('se'); setIsResizing(true); }} />
            <div className="resize-handle absolute top-0 left-3 right-3 h-1.5 cursor-n-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('n'); setIsResizing(true); }} />
            <div className="resize-handle absolute bottom-0 left-3 right-3 h-1.5 cursor-s-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('s'); setIsResizing(true); }} />
            <div className="resize-handle absolute top-3 bottom-3 left-0 w-1.5 cursor-w-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('w'); setIsResizing(true); }} />
            <div className="resize-handle absolute top-3 bottom-3 right-0 w-1.5 cursor-e-resize hover:bg-blue-500/50" onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); setResizeEdge('e'); setIsResizing(true); }} />
          </>
        </div>
      )}
      <WhiteboardToolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        currentColor={currentColor}
        onColorChange={onColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={onStrokeWidthChange}
        lineStyle={lineStyle}
        onLineStyleChange={setLineStyle}
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
        gridType={gridType}
        onGridTypeChange={onGridTypeChange}
        eraserOpacity={eraserOpacity}
        onEraserOpacityChange={setEraserOpacity}
        eraserHardness={eraserHardness}
        onEraserHardnessChange={setEraserHardness}
        showLayersPanel={showLayers}
        onToggleLayersPanel={() => setShowLayers(!showLayers)}
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
  const [swappedPanels, setSwappedPanels] = useState(false);
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
      console.log("Drive API response:", data);
      if (data.success !== false) {
        setFolderStructure(data.structure || []);
        if (data.structure && data.structure.length > 0) {
          setExpandedFolders(new Set(data.structure.map((f: FolderStructure) => f.id)));
        }
      } else {
        console.log("Drive API error:", data.error);
        if (data.error) {
          toast.error(data.error);
        } else {
          toast.error("Failed to load files. Check if Google Drive is configured.");
        }
        setFolderStructure([]);
      }
    } catch (err) {
      console.error("Failed to load files:", err);
      toast.error("Failed to load files. Check if Google Drive is configured.");
      setFolderStructure([]);
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
          {viewMode === "both" && (
            <button
              onClick={() => setSwappedPanels(!swappedPanels)}
              className="p-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              title={swappedPanels ? "Notes on Right" : "Notes on Left"}
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          )}
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
          <div className="w-full">
            <WhiteboardPanel
              bgColor={bgColor}
              gridType={gridType}
              currentColor={currentColor}
              onColorChange={setCurrentColor}
              strokeWidth={strokeWidth}
              onStrokeWidthChange={setStrokeWidth}
              onBgColorChange={setBgColor}
              onGridTypeChange={setGridType}
            />
          </div>
        )}
        {viewMode === "both" && (
          <>
            {swappedPanels ? (
              <>
                <div style={{ width: `${100 - splitRatio}%` }}>
                  <WhiteboardPanel
                    bgColor={bgColor}
                    gridType={gridType}
                    currentColor={currentColor}
                    onColorChange={setCurrentColor}
                    strokeWidth={strokeWidth}
                    onStrokeWidthChange={setStrokeWidth}
                    onBgColorChange={setBgColor}
                    onGridTypeChange={setGridType}
                  />
                </div>
                <ResizeHandle onMouseDown={handleResizeStart} />
                <div style={{ width: `${splitRatio}%` }} className="flex flex-col">
                  {viewingFile ? (
                    viewingFile.mimeType === "application/pdf" ? <PDFViewer file={viewingFile} onClose={() => setViewingFile(null)} /> : <ImageViewer file={viewingFile} onClose={() => setViewingFile(null)} />
                  ) : (
                    <NotesPanel slides={slides} currentSlide={currentSlide} onSlideChange={setCurrentSlide} onAddSlide={addSlide} onDeleteSlide={deleteSlide} onUpdateSlide={updateSlide} folderStructure={folderStructure} onFileClick={(f) => setViewingFile(f)} onFolderClick={handleFolderClick} isLoadingFiles={isLoadingFiles} onRefreshFiles={loadFolderStructure} expandedFolders={expandedFolders} />
                  )}
                </div>
              </>
            ) : (
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
                  <WhiteboardPanel
                    bgColor={bgColor}
                    gridType={gridType}
                    currentColor={currentColor}
                    onColorChange={setCurrentColor}
                    strokeWidth={strokeWidth}
                    onStrokeWidthChange={setStrokeWidth}
                    onBgColorChange={setBgColor}
                    onGridTypeChange={setGridType}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
