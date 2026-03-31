import type { FileFormat, ProgressCallback } from "$lib/types";
import type { RenderParameters } from "pdfjs-dist/types/src/display/api";
import { canvasToBlob } from "./image-utils";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

let pdfjsLib: typeof import("pdfjs-dist") | null = null;

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  return pdfjsLib;
}

export interface PdfPageData {
  pageNum: number;
  text: string;
  width: number;
  height: number;
}

export interface PdfPageImage {
  pageNum: number;
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export async function extractPdfText(
  file: File,
  onProgress?: (p: number) => void,
): Promise<PdfPageData[]> {
  const pdfjs = await getPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: PdfPageData[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const text = textContent.items
      .map((item: any) => item.str)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({
      pageNum: i,
      text,
      width: viewport.width,
      height: viewport.height,
    });
    onProgress?.((i / pdf.numPages) * 100);
  }

  return pages;
}

export async function renderPdfPages(
  file: File,
  scale: number = 2,
  onProgress?: (p: number) => void,
): Promise<PdfPageImage[]> {
  const pdfjs = await getPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const images: PdfPageImage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport } as RenderParameters).promise;
    images.push({
      pageNum: i,
      canvas,
      width: viewport.width,
      height: viewport.height,
    });
    onProgress?.((i / pdf.numPages) * 100);
  }

  return images;
}

export async function pdfToImage(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback,
): Promise<Blob> {
  const pages = await renderPdfPages(file, 2, (p) => onProgress?.(p * 0.7));
  if (pages.length === 1) {
    onProgress?.(80);
    return canvasToBlob(pages[0].canvas, format);
  }
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  for (let i = 0; i < pages.length; i++) {
    const blob = await canvasToBlob(pages[i].canvas, format);
    const ext = format === "jpg" ? "jpg" : format;
    zip.file(`page_${i + 1}.${ext}`, blob);
    onProgress?.(70 + (i / pages.length) * 25);
  }
  return zip.generateAsync({ type: "blob" });
}

export async function pdfToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await extractPdfText(file, (p) => onProgress?.(p * 0.5));
  const docx = await import("docx");
  const { Document, Paragraph, TextRun, Packer, HeadingLevel } = docx;

  const children: any[] = [];
  for (const page of pages) {
    if (pages.length > 1) {
      children.push(
        new Paragraph({
          text: `Page ${page.pageNum}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        }),
      );
    }
    const paragraphs = page.text.split(/\n\n|\r\n\r\n/).filter(Boolean);
    for (const para of paragraphs.length > 0 ? paragraphs : [page.text]) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: para, size: 24, font: "Calibri" })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  onProgress?.(75);
  const doc = new Document({
    sections: [{ children }],
  });
  const blob = await Packer.toBlob(doc);
  onProgress?.(95);
  return blob;
}

export async function pdfToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await renderPdfPages(file, 2, (p) => onProgress?.(p * 0.5));
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pres = new PptxGenJS();

  for (let i = 0; i < pages.length; i++) {
    const slide = pres.addSlide();
    const dataUrl = pages[i].canvas.toDataURL("image/png");
    slide.addImage({
      data: dataUrl,
      x: 0,
      y: 0,
      w: "100%",
      h: "100%",
      sizing: { type: "contain", w: 10, h: 7.5 },
    });
    onProgress?.(50 + (i / pages.length) * 40);
  }

  const arrBuf = await (pres.write as any)({ outputType: "arraybuffer" });
  return new Blob([arrBuf], {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

export async function pdfToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await extractPdfText(file, (p) => onProgress?.(p * 0.5));
  const XLSX = await import("xlsx");

  const wb = XLSX.utils.book_new();
  for (const page of pages) {
    const lines = page.text.split(/\n/).filter(Boolean);
    const data = lines.map((line) => line.split(/\t|  +/).map((cell) => cell.trim()));
    const ws = XLSX.utils.aoa_to_sheet(data.length > 0 ? data : [[page.text]]);
    XLSX.utils.book_append_sheet(wb, ws, `Page ${page.pageNum}`);
    onProgress?.(50 + (page.pageNum / pages.length) * 40);
  }

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export async function pdfToCsv(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await extractPdfText(file, (p) => onProgress?.(p * 0.6));
  const lines: string[] = [];
  for (const page of pages) {
    const pageLines = page.text.split(/\n/).filter(Boolean);
    for (const line of pageLines) {
      const cells = line.split(/\t|  +/).map((c) => `"${c.trim().replace(/"/g, '""')}"`);
      lines.push(cells.join(","));
    }
  }
  onProgress?.(90);
  return new Blob([lines.join("\n")], { type: "text/csv" });
}

export async function pdfToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await extractPdfText(file, (p) => onProgress?.(p * 0.7));
  const md = pages
    .map(
      (page) =>
        `# Page ${page.pageNum}\n\n${page.text
          .split("\n\n")
          .map((p) => p.trim())
          .filter(Boolean)
          .join("\n\n")}\n\n`,
    )
    .join("");
  onProgress?.(90);
  return new Blob([md], { type: "text/markdown" });
}

export async function pdfToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await renderPdfPages(file, 2, (p) => onProgress?.(p * 0.6));

  const htmlParts: string[] = [];
  htmlParts.push("<!DOCTYPE html>");
  htmlParts.push('<html><head><meta charset="UTF-8"><title>PDF Export</title>');
  htmlParts.push("<style>body{font-family:sans-serif;margin:0;padding:20px;background:#fff}");
  htmlParts.push(".page{max-width:100%;margin-bottom:20px;border:1px solid #ddd;overflow:hidden}");
  htmlParts.push(".page img{width:100%;height:auto;display:block}</style>");
  htmlParts.push("</head><body>");

  for (let i = 0; i < pages.length; i++) {
    const canvas = pages[i].canvas;
    const dataUrl = canvas.toDataURL("image/png", 0.92);
    htmlParts.push(`<div class="page"><img src="${dataUrl}" alt="Page ${i + 1}" /></div>`);
    onProgress?.(60 + (i / pages.length) * 30);
  }

  htmlParts.push("</body></html>");
  onProgress?.(95);
  return new Blob([htmlParts.join("")], { type: "text/html" });
}

export async function pdfToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const pages = await extractPdfText(file, (p) => onProgress?.(p * 0.9));
  const text = pages.map((p) => p.text).join("\n\n");
  onProgress?.(95);
  return new Blob([text], { type: "text/plain" });
}
