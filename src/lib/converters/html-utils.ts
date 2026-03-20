import type { FileFormat, ProgressCallback } from "../types";
import { canvasToBlob } from "./image-utils";
import { htmlToMarkdown } from "./markdown-utils";

export async function htmlToImage(
  html: string,
  format: FileFormat,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;background:#fff;padding:32px;max-width:800px;font-family:sans-serif;color:#111';
  container.innerHTML = html;
  document.body.appendChild(container);

  onProgress?.(50);
  await new Promise((r) => setTimeout(r, 100));

  const canvas = document.createElement('canvas');
  const rect = container.getBoundingClientRect();
  const scale = 2;
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, rect.width, rect.height);

  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">${container.innerHTML}</div>
      </foreignObject>
    </svg>`;

  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => reject(new Error('SVG render failed'));
    img.src = url;
  });

  URL.revokeObjectURL(url);
  document.body.removeChild(container);

  onProgress?.(80);
  return canvasToBlob(canvas, format);
}

export async function htmlToMarkdownInternal(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const html = await file.text();
  onProgress?.(30);
  const md = htmlToMarkdown(html);
  onProgress?.(90);
  return new Blob([md], { type: 'text/markdown' });
}

export async function htmlToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const html = await file.text();
  onProgress?.(30);
  return htmlToImage(html, 'png', onProgress);
}

export async function htmlToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const html = await file.text();
  onProgress?.(30);
  const docx = await import('docx');
  const { Document, Paragraph, TextRun, Packer } = docx;

  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const paragraphs = text.split(/\n+/).filter(Boolean);
  const children = paragraphs.map(
    (p) =>
      new Paragraph({
        children: [new TextRun({ text: p.trim(), size: 24 })],
        spacing: { after: 120 }
      })
  );

  onProgress?.(75);
  const doc = new Document({ sections: [{ children }] });
  onProgress?.(90);
  return Packer.toBlob(doc);
}

export async function htmlFileToImage(
	file: File,
	format: FileFormat,
	onProgress?: ProgressCallback
): Promise<Blob> {
	const html = await file.text();
	onProgress?.(30);
	return htmlToImage(html, format, onProgress);
}

export async function htmlToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const html = await file.text();
  onProgress?.(50);

  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  onProgress?.(90);
  return new Blob([text], { type: 'text/plain' });
}