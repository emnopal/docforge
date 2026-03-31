import type { FileFormat, ProgressCallback } from "$lib/types";

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: FileFormat,
  quality: number = 0.92,
): Promise<Blob> {
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas to blob failed"));
      },
      mimeMap[format] || "image/png",
      quality,
    );
  });
}

export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

export async function imageToCanvas(file: File): Promise<HTMLCanvasElement> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(img.src);
  return canvas;
}

export async function imageConvert(
  file: File,
  to: FileFormat,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  onProgress?.(30);
  const canvas = await imageToCanvas(file);
  onProgress?.(70);
  return canvasToBlob(canvas, to);
}

export async function imageToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const img = await loadImage(file);
  onProgress?.(30);
  const jsPDF = (await import("jspdf")).jsPDF;
  const isLandscape = img.naturalWidth > img.naturalHeight;
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: [img.naturalWidth, img.naturalHeight],
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  pdf.addImage(
    canvas.toDataURL("image/jpeg", 0.92),
    "JPEG",
    0,
    0,
    img.naturalWidth,
    img.naturalHeight,
  );
  onProgress?.(80);
  URL.revokeObjectURL(img.src);
  return pdf.output("blob");
}

export async function imageToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const img = await loadImage(file);
  onProgress?.(30);
  const docx = await import("docx");
  const { Document, Paragraph, ImageRun, Packer } = docx;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const blob = await canvasToBlob(canvas, "png");
  const buf = await blob.arrayBuffer();
  onProgress?.(60);
  const maxW = 600;
  const ratio = Math.min(maxW / img.naturalWidth, 1);
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new ImageRun({
                data: buf,
                transformation: {
                  width: img.naturalWidth * ratio,
                  height: img.naturalHeight * ratio,
                },
                type: "png",
              }),
            ],
          }),
        ],
      },
    ],
  });
  URL.revokeObjectURL(img.src);
  return Packer.toBlob(doc);
}

export async function imageToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const img = await loadImage(file);
  onProgress?.(30);
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pres = new PptxGenJS();
  const slide = pres.addSlide();
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  slide.addImage({
    data: canvas.toDataURL("image/png"),
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    sizing: { type: "contain", w: 10, h: 7.5 },
  });
  onProgress?.(70);
  URL.revokeObjectURL(img.src);
  const arrBuf = await (pres.write as any)({ outputType: "arraybuffer" });
  return new Blob([arrBuf], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

export async function imageToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  onProgress?.(30);
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Image File", file.name],
    ["Size (bytes)", file.size],
    ["Type", file.type],
    ["Note", "Image data embedded as reference. Open the original image for visual content."],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, "Image Info");
  onProgress?.(70);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function imageToMarkdown(file: File, format: FileFormat): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };

  const mimeType = mimeMap[format] || "image/jpeg";
  return `# ${file.name}\n\n![${file.name}](${mimeType};base64,${base64})\n\n`;
}

export async function imageToMarkdownInternal(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  onProgress?.(50);
  const md = await imageToMarkdown(file, format);
  onProgress?.(90);
  return new Blob([md], { type: "text/markdown" });
}
