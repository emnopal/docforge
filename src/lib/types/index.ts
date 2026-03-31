export type FileFormat =
  | "pdf"
  | "docx"
  | "pptx"
  | "xlsx"
  | "csv"
  | "txt"
  | "md"
  | "html"
  | "jpg"
  | "png"
  | "webp";

export type FormatCategory = "document" | "presentation" | "spreadsheet" | "image";

export interface FormatInfo {
  format: FileFormat;
  label: string;
  category: FormatCategory;
  mime: string;
  extension: string;
  color: string;
  icon: string;
}

export interface ConversionJob {
  id: string;
  sourceFile: File;
  sourceFormat: FileFormat;
  targetFormat: FileFormat;
  status: "pending" | "converting" | "done" | "error";
  progress: number;
  resultBlob?: Blob;
  resultName?: string;
  error?: string;
}

export const FORMAT_MAP: Record<FileFormat, FormatInfo> = {
  pdf: {
    format: "pdf",
    label: "PDF",
    category: "document",
    mime: "application/pdf",
    extension: ".pdf",
    color: "#e94560",
    icon: "📄",
  },
  docx: {
    format: "docx",
    label: "DOCX",
    category: "document",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: ".docx",
    color: "#4361ee",
    icon: "📝",
  },
  pptx: {
    format: "pptx",
    label: "PPTX",
    category: "presentation",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: ".pptx",
    color: "#f39c12",
    icon: "📊",
  },
  xlsx: {
    format: "xlsx",
    label: "XLSX",
    category: "spreadsheet",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
    color: "#2ecc71",
    icon: "📈",
  },
  csv: {
    format: "csv",
    label: "CSV",
    category: "spreadsheet",
    mime: "text/csv",
    extension: ".csv",
    color: "#1abc9c",
    icon: "📋",
  },
  jpg: {
    format: "jpg",
    label: "JPG",
    category: "image",
    mime: "image/jpeg",
    extension: ".jpg",
    color: "#9b59b6",
    icon: "🖼️",
  },
  png: {
    format: "png",
    label: "PNG",
    category: "image",
    mime: "image/png",
    extension: ".png",
    color: "#38b6ff",
    icon: "🖼️",
  },
  webp: {
    format: "webp",
    label: "WebP",
    category: "image",
    mime: "image/webp",
    extension: ".webp",
    color: "#e84393",
    icon: "🖼️",
  },
  md: {
    format: "md",
    label: "Markdown",
    category: "document",
    mime: "text/markdown",
    extension: ".md",
    color: "#607d8b",
    icon: "📑",
  },
  html: {
    format: "html",
    label: "HTML",
    category: "document",
    mime: "text/html",
    extension: ".html",
    color: "#e44d26",
    icon: "🌐",
  },
  txt: {
    format: "txt",
    label: "Text",
    category: "document",
    mime: "text/plain",
    extension: ".txt",
    color: "#7f8c8d",
    icon: "📄",
  },
};

export function detectFormat(file: File): FileFormat | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, FileFormat> = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "text/markdown": "md",
    "text/x-markdown": "md",
    "text/html": "html",
    "application/xhtml+xml": "html",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extMap: Record<string, FileFormat> = {
    pdf: "pdf",
    docx: "docx",
    doc: "docx",
    pptx: "pptx",
    ppt: "pptx",
    xlsx: "xlsx",
    xls: "xlsx",
    csv: "csv",
    txt: "txt",
    text: "txt",
    md: "md",
    markdown: "md",
    html: "html",
    htm: "html",
    jpg: "jpg",
    jpeg: "jpg",
    png: "png",
    webp: "webp",
  };
  return mimeMap[file.type] || (ext ? extMap[ext] : null) || null;
}

export function getTargetFormats(source: FileFormat): FileFormat[] {
  const all: FileFormat[] = [
    "pdf",
    "docx",
    "pptx",
    "xlsx",
    "csv",
    "txt",
    "md",
    "html",
    "jpg",
    "png",
    "webp",
  ];
  return all.filter((f) => f !== source);
}

export type ProgressCallback = (progress: number) => void;
