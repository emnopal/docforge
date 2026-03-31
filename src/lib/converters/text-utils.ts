import type { ProgressCallback } from "../types";

export function splitTextChunks(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    if (current.length + word.length + 1 > maxChars) {
      chunks.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [""];
}

export async function textToMarkdown(text: string): Promise<string> {
  return text
    .split("\n\n")
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return "";
      return trimmed + "\n\n";
    })
    .join("");
}

export async function txtToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(30);
  const jsPDF = (await import("jspdf")).jsPDF;
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 56;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  const lineH = 16;
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2;
  pdf.setFont("helvetica");
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(text, pageW);
  let y = margin;
  for (const line of lines) {
    if (y + lineH > margin + pageH) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineH;
  }
  onProgress?.(85);
  return pdf.output("blob");
}

export async function txtToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(50);

  const escapedText = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Text File</title>
<style>body{font-family:monospace;line-height:1.6;padding:40px;max-width:800px;margin:0 auto}</style>
</head><body>${escapedText}</body></html>`;

  onProgress?.(90);
  return new Blob([html], { type: "text/html" });
}

export async function txtToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(40);
  const docx = await import("docx");
  const { Document, Paragraph, TextRun, Packer } = docx;

  const paragraphs = text.split("\n").filter(Boolean);
  const children = paragraphs.map(
    (p) =>
      new Paragraph({
        children: [new TextRun({ text: p, size: 24 })],
        spacing: { after: 120 },
      }),
  );

  onProgress?.(75);
  const doc = new Document({ sections: [{ children }] });
  onProgress?.(90);
  return Packer.toBlob(doc);
}

export async function txtToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(50);
  const md = await textToMarkdown(text);
  onProgress?.(90);
  return new Blob([md], { type: "text/markdown" });
}

export async function txtToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(40);
  const XLSX = await import("xlsx");

  const lines = text.split("\n").filter(Boolean);
  const data = lines.map((line) => [line]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Content");

  onProgress?.(80);
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
