import type { FileFormat, ProgressCallback } from '$lib/types';
import { htmlToImage } from './html-utils';
import { splitTextChunks } from './text-utils';

export function parseMarkdownTables(md: string): { headers: string[]; rows: string[][] }[] {
	const tables: { headers: string[]; rows: string[][] }[] = [];
	const lines = md.split('\n');

	let i = 0;
	while (i < lines.length) {
		const line = lines[i].trim();
		if (line.startsWith('|') && line.endsWith('|')) {
			const headers = parseMarkdownRow(line);
			i++;

			if (i < lines.length && lines[i].includes('---')) {
				i++;
				const rows: string[][] = [];
				while (i < lines.length && lines[i].trim().startsWith('|')) {
					rows.push(parseMarkdownRow(lines[i]));
					i++;
				}
				tables.push({ headers, rows });
			}
		} else {
			i++;
		}
	}

	return tables;
}

function parseMarkdownRow(line: string): string[] {
	return line
		.slice(1, -1)
		.split('|')
		.map((cell) => cell.trim());
}

export function stripMarkdown(md: string): string {
	return md
		.replace(/#{1,6}\s+/g, '')
		.replace(/\*\*/g, '')
		.replace(/\*/g, '')
		.replace(/`/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function markdownToHtml(md: string): string {
	return md
		.replace(/^### (.*$)/gim, '<h3>$1</h3>')
		.replace(/^## (.*$)/gim, '<h2>$1</h2>')
		.replace(/^# (.*$)/gim, '<h1>$1</h1>')
		.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
		.replace(/\*(.*)\*/gim, '<em>$1</em>')
		.replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
		.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
		.replace(/`([^`]+)`/gim, '<code>$1</code>')
		.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
		.replace(/\n\n/gim, '</p><p>')
		.replace(/\n/gim, '<br>');
}

export function htmlToMarkdown(html: string): string {
	return html
		.replace(/<h1[^>]*>(.*?)<\/h1>/gim, '# $1\n\n')
		.replace(/<h2[^>]*>(.*?)<\/h2>/gim, '## $1\n\n')
		.replace(/<h3[^>]*>(.*?)<\/h3>/gim, '### $1\n\n')
		.replace(/<strong[^>]*>(.*?)<\/strong>/gim, '**$1**')
		.replace(/<b[^>]*>(.*?)<\/b>/gim, '**$1**')
		.replace(/<em[^>]*>(.*?)<\/em>/gim, '*$1*')
		.replace(/<i[^>]*>(.*?)<\/i>/gim, '*$1*')
		.replace(/<code[^>]*>(.*?)<\/code>/gim, '`$1`')
		.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gims, '```\n$1\n```')
		.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gim, '> $1')
		.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gim, '![$1]($2)')
		.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gim, '![$2]($1)')
		.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gim, '[$2]($1)')
		.replace(/<p[^>]*>(.*?)<\/p>/gims, '$1\n\n')
		.replace(/<br\s*\/?>/gim, '\n')
		.replace(/<li[^>]*>(.*?)<\/li>/gim, '- $1')
		.replace(/<ul[^>]*>|<\/ul>/gim, '')
		.replace(/<ol[^>]*>|<\/ol>/gim, '')
		.replace(/<[^>]+>/gim, '')
		.replace(/&nbsp;/gim, ' ')
		.replace(/&lt;/gim, '<')
		.replace(/&gt;/gim, '>')
		.replace(/&amp;/gim, '&')
		.replace(/\n{3,}/gim, '\n\n')
		.trim();
}

export function detectMarkdownCodeBlocks(md: string): string[] {
	const blocks: string[] = [];
	const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
	let match;

	while ((match = codeRegex.exec(md)) !== null) {
		blocks.push(match[2]);
	}

	return blocks;
}

export async function mdToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(30);
  const html = markdownToHtml(text);
  onProgress?.(60);
  return htmlToImage(html, 'png', onProgress);
}

export async function mdToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(30);
  const docx = await import('docx');
  const { Document, Paragraph, TextRun, Packer, HeadingLevel } = docx;

  const children: any[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.trim().startsWith('# ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^#\s+/, ''), bold: true, size: 32 })],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
    } else if (line.trim().startsWith('## ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^##\s+/, ''), bold: true, size: 28 })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 }
        })
      );
    } else if (line.trim().startsWith('### ')) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/^###\s+/, ''), bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 250, after: 120 }
        })
      );
    } else if (line.trim()) {
      const content = line
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');
      children.push(
        new Paragraph({
          children: [new TextRun({ text: content, size: 24 })],
          spacing: { after: 120 }
        })
      );
    }
  }

  onProgress?.(75);
  const doc = new Document({ sections: [{ children }] });
  onProgress?.(90);
  return Packer.toBlob(doc);
}

export async function mdToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(30);
  const PptxGenJS = (await import('pptxgenjs')).default;
  const pres = new PptxGenJS();

  const chunks = splitTextChunks(text, 800);
  for (let i = 0; i < chunks.length; i++) {
    const slide = pres.addSlide();
    slide.addText(chunks[i], {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 6.5,
      fontSize: 18,
      fontFace: 'Arial',
      valign: 'top',
      wrap: true
    });
    onProgress?.(30 + (i / chunks.length) * 60);
  }

  const arrBuf = await (pres.write as any)({ outputType: 'arraybuffer' });
  return new Blob([arrBuf], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}

export async function mdToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(40);
  const tables = parseMarkdownTables(text);
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();

  if (tables.length > 0) {
    tables.forEach((table, idx) => {
      const data = [table.headers, ...table.rows];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, `Table ${idx + 1}`);
    });
  } else {
    const ws = XLSX.utils.aoa_to_sheet([['Content'], [text]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Content');
  }

  onProgress?.(80);
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

export async function mdToCsv(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const text = await file.text();
  onProgress?.(40);
  const tables = parseMarkdownTables(text);
  let csv = '';

  if (tables.length > 0) {
    csv = tables
      .map((table) => {
        const headers = table.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',');
        const rows = table.rows
          .map((row) => row.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
          .join('\n');
        return headers + '\n' + rows;
      })
      .join('\n\n');
  } else {
    csv = `"Line","Content"\n${text
      .split('\n')
      .filter(Boolean)
      .map((line, i) => `${i + 1},"${line.replace(/"/g, '""')}"`)
      .join('\n')}`;
  }

  onProgress?.(90);
  return new Blob([csv], { type: 'text/csv' });
}

export async function mdToImage(
  file: File,
  format: FileFormat,
  onProgress?: ProgressCallback
): Promise<Blob> {
  const text = await file.text();
  onProgress?.(30);
  const html = markdownToHtml(text);
  return htmlToImage(html, format, onProgress);
}

export async function mdToHtmlInternal(file: File, onProgress?: ProgressCallback): Promise<Blob> {
	const md = await file.text();
	onProgress?.(30);
	const html = markdownToHtml(md);
	onProgress?.(90);
	return new Blob([html], { type: 'text/html' });
}

export async function mdToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
  const md = await file.text();
  onProgress?.(50);
  const text = stripMarkdown(md);
  onProgress?.(90);
  return new Blob([text], { type: 'text/plain' });
}