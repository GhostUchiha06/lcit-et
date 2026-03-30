export type ViewMode = "notes" | "whiteboard" | "both";

export interface NoteSlide {
  id: string;
  title: string;
  content: string;
}

export interface SavedState {
  viewMode: ViewMode;
  splitRatio: number;
  notes: NoteSlide[];
  currentSlideIndex: number;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
}

export interface FolderStructure {
  name: string;
  id: string;
  files: DriveFile[];
  subfolders: FolderStructure[];
}
