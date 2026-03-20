import type { ProgressCallback, FileFormat } from '../types';
import { htmlToImage } from './html-utils';

export async function readPptxText(file: File): Promise<string[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slides: string[] = [];
  let i = 1;
  while (true) {
    const slideFile = zip.file(`ppt/slides/slide${i}.xml`);
    if (!slideFile) break;
    const xml = await slideFile.async('text');
    const text = xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    slides.push(text);
    i++;
  }
  return slides;
}

export async function pptxToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(40);
  const jsPDF = (await import('jspdf')).jsPDF;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const margin = 56;
  const pageW = pdf.internal.pageSize.getWidth() - margin * 2;

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) pdf.addPage();
    pdf.setFontSize(18);
    pdf.text(`Slide ${i + 1}`, margin, margin);
    pdf.setFontSize(12);
    const lines = pdf.splitTextToSize(slides[i], pageW);
    pdf.text(lines, margin, margin + 30);
    onProgress?.(40 + (i / slides.length) * 50);
  }
  return pdf.output('blob');
}

export async function pptxToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(40);
  const docx = await import('docx');
  const { Document, Paragraph, TextRun, Packer, HeadingLevel } = docx;
  const children: any[] = [];
  for (let i = 0; i < slides.length; i++) {
    children.push(
      new Paragraph({ text: `Slide ${i + 1}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } })
    );
    children.push(
      new Paragraph({ children: [new TextRun({ text: slides[i], size: 24 })], spacing: { after: 200 } })
    );
  }
  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

export async function pptxToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(40);
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const data = slides.map((s, i) => [`Slide ${i + 1}`, s]);
  data.unshift(['Slide', 'Content']);
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Slides');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export async function pptxToCsv(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(50);
  const csv = ['Slide,Content']
    .concat(slides.map((s, i) => `${i + 1},"${s.replace(/"/g, '""')}"`))
    .join('\n');
  return new Blob([csv], { type: 'text/csv' });
}

export async function pptxToMarkdown(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(50);

  const md = slides
    .map((s, i) => `## Slide ${i + 1}\n\n${s}\n\n`)
    .join('');

  onProgress?.(90);
  return new Blob([md], { type: 'text/markdown' });
}

export async function pptxToImage(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const slides = await readPptxText(file);
  onProgress?.(30);
  const html = slides
    .map(
      (s, i) => `<div style="margin-bottom:24px"><h2>Slide ${i + 1}</h2><p>${s}</p></div>`
    )
    .join('');
  return htmlToImage(html, format, onProgress);
}

export async function pptxToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
	const slides = await readPptxText(file);
	onProgress?.(50);
	const text = slides.map((s, i) => `Slide ${i + 1}:\n${s}`).join('\n\n');
	onProgress?.(90);
	return new Blob([text], { type: 'text/plain' });
}