import type { ProgressCallback, FileFormat } from '../types';
import { htmlToImage } from './html-utils';
import { textToMarkdown } from './text-utils';
import { splitTextChunks } from './text-utils';

export async function readDocxText(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return result.value;
}

export async function readDocxHtml(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer: buf });
  return result.value;
}

export async function docxToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(40);
  const jsPDF = (await import('jspdf')).jsPDF;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 56;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;
  const lineH = 16;
  const pageH = pdf.internal.pageSize.getHeight() - margin * 2;
  pdf.setFont('helvetica');
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
  return pdf.output('blob');
}

export async function docxToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(40);
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pres = new PptxGenJS();
  const chunks = splitTextChunks(text, 1500);
  for (let i = 0; i < chunks.length; i++) {
    const slide = pres.addSlide();
    slide.addText(chunks[i], {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 6.5,
      fontSize: 14,
      fontFace: 'Arial',
      valign: 'top',
      wrap: true
    });
    onProgress?.(40 + (i / chunks.length) * 50);
  }
  const arrBuf = await (pres.write as any)({ outputType: 'arraybuffer' });
  return new Blob([arrBuf], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}

export async function docxToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(40);
  const XLSX = await import('xlsx');
  const lines = text.split('\n').filter(Boolean);
  const data = lines.map((l) => [l]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Content');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export async function docxToCsv(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(50);
  const lines = text
    .split('\n')
    .filter(Boolean)
    .map((l) => `"${l.replace(/"/g, '""')}"`)
    .join('\n');
  return new Blob([lines], { type: 'text/csv' });
}

export async function docxToImage(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const html = await readDocxHtml(file);
  onProgress?.(30);
  return htmlToImage(html, format, onProgress);
}

export async function docxToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(50);
  const md = await textToMarkdown(text);
  onProgress?.(90);
  return new Blob([md], { type: 'text/markdown' });
}

export async function docxToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
	const html = await readDocxHtml(file);
	onProgress?.(90);

	const fullHtml = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Document</title>
<style>body{font-family:Arial,sans-serif;line-height:1.6;max-width:800px;margin:0 auto;padding:20px}</style>
</head><body>${html}</body></html>`;

	return new Blob([fullHtml], { type: 'text/html' });
}

export async function docxToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await readDocxText(file);
  onProgress?.(90);
  return new Blob([text], { type: 'text/plain' });
}