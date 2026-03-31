import type { ProgressCallback } from "$lib/types";

export type OcrOutputFormat = "txt" | "md" | "pdf" | "docx";

export interface OcrResult {
  pages: OcrPageResult[];
  fullText: string;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

async function getImageFromFile(file: File): Promise<HTMLCanvasElement[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);
      resolve([canvas]);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image"));
    };
    img.src = URL.createObjectURL(file);
  });
}

async function getPagesFromPdf(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<HTMLCanvasElement[]> {
  const pdfjsLib = await import("pdfjs-dist");
  type RenderParameters = import("pdfjs-dist/types/src/display/api").RenderParameters;
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases: HTMLCanvasElement[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    onProgress?.(`Rendering page ${i}/${pdf.numPages}...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport } as RenderParameters).promise;
    canvases.push(canvas);
  }

  return canvases;
}

export async function performOcr(
  file: File,
  onProgress?: ProgressCallback,
  onStatus?: (msg: string) => void,
): Promise<OcrResult> {
  const Tesseract = await import("tesseract.js");

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  onStatus?.("Preparing file...");
  onProgress?.(5);

  const canvases = isPdf ? await getPagesFromPdf(file, onStatus) : await getImageFromFile(file);

  onProgress?.(20);

  const worker = await Tesseract.createWorker("eng", undefined, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") {
        const base = 20;
        const range = 75;
        const pageProgress = m.progress * range;
        onProgress?.(base + pageProgress / canvases.length);
      }
    },
  });

  const pages: OcrPageResult[] = [];

  for (let i = 0; i < canvases.length; i++) {
    onStatus?.(`Recognizing text — page ${i + 1}/${canvases.length}...`);
    const baseProgress = 20 + (i / canvases.length) * 75;
    onProgress?.(baseProgress);

    const { data } = await worker.recognize(canvases[i]);
    pages.push({
      pageNumber: i + 1,
      text: data.text.trim(),
      confidence: data.confidence,
    });
  }

  await worker.terminate();
  onProgress?.(95);

  const fullText = pages.map((p) => p.text).join("\n\n");

  onProgress?.(100);
  onStatus?.("Done");

  return { pages, fullText };
}

export async function ocrResultToBlob(
  result: OcrResult,
  format: OcrOutputFormat,
  fileName: string,
): Promise<Blob> {
  switch (format) {
    case "txt":
      return new Blob([result.fullText], { type: "text/plain" });

    case "md": {
      const mdParts = result.pages.map((p) => {
        const header = result.pages.length > 1 ? `## Page ${p.pageNumber}\n\n` : "";
        return header + p.text;
      });
      return new Blob([mdParts.join("\n\n---\n\n")], { type: "text/markdown" });
    }

    case "pdf": {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 6;

      result.pages.forEach((page, idx) => {
        if (idx > 0) doc.addPage();
        const lines = doc.splitTextToSize(page.text, maxWidth);
        let y = margin;
        for (const line of lines) {
          if (y + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineHeight;
        }
      });

      return doc.output("blob");
    }

    case "docx": {
      const docx = await import("docx");
      const sections = result.pages.map((page) => ({
        properties: {},
        children: page.text.split("\n").map(
          (line) =>
            new docx.Paragraph({
              children: [new docx.TextRun(line)],
            }),
        ),
      }));

      const doc = new docx.Document({
        title: fileName,
        sections,
      });

      return docx.Packer.toBlob(doc);
    }

    default:
      throw new Error(`Unsupported output format: ${format}`);
  }
}
