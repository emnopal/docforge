import type { 
  FileFormat,
  ProgressCallback
} from '$lib/types';
import {
  pdfToImage,
  pdfToDocx,
  pdfToPptx,
  pdfToCsv,
  pdfToXlsx,
  pdfToHtml,
  pdfToMarkdown,
  pdfToTxt,
} from './pdf-utils';
import {
  mdToCsv,
  mdToDocx,
  mdToImage,
  mdToPdf,
  mdToPptx,
  mdToXlsx,
  mdToHtmlInternal,
  mdToTxt
} from './markdown-utils';
import { 
  imageToPdf, 
  imageConvert, 
  imageToDocx, 
  imageToPptx, 
  imageToXlsx,
  imageToMarkdownInternal,
} from './image-utils';
import { 
  docxToPdf, 
  docxToPptx, 
  docxToXlsx, 
  docxToCsv, 
  docxToImage,
  docxToHtml,
  docxToMarkdown,
  docxToTxt,
} from './doc-utils';
import { 
  htmlFileToImage, 
  htmlToDocx,
  htmlToMarkdownInternal, 
  htmlToPdf, 
  htmlToTxt 
} from './html-utils';
import { pptxToPdf,
  pptxToDocx,
  pptxToXlsx,
  pptxToCsv,
  pptxToMarkdown,
  pptxToImage,
  pptxToTxt
} from './pptx-utils';
import { xlsxToPdf,
  xlsxToDocx,
  xlsxToPptx,
  xlsxToCsv,
  xlsxToImage,
  csvToPdf,
  csvToDocx,
  csvToPptx,
  csvToXlsx,
  csvToMarkdown,
  csvToTxt,
  xlsxToMarkdown,
  xlsxToTxt,
} from './spreadsheet-utils';
import { 
  txtToPdf, 
  txtToHtml, 
  txtToDocx, 
  txtToMarkdown, 
  txtToXlsx 
} from './text-utils';

export async function convert(
	file: File,
	from: FileFormat,
	to: FileFormat,
	onProgress?: ProgressCallback
): Promise<Blob> {
	const key = `${from}->${to}`;
	onProgress?.(5);

	const converters: Record<string, () => Promise<Blob>> = {
		// ── PDF → Images ──
		'pdf->jpg': () => pdfToImage(file, 'jpg', onProgress),
		'pdf->png': () => pdfToImage(file, 'png', onProgress),
		'pdf->webp': () => pdfToImage(file, 'webp', onProgress),

		// ── PDF → Documents ──
		'pdf->docx': () => pdfToDocx(file, onProgress),
		'pdf->pptx': () => pdfToPptx(file, onProgress),
		'pdf->xlsx': () => pdfToXlsx(file, onProgress),
		'pdf->csv': () => pdfToCsv(file, onProgress),
    'pdf->md': () => pdfToMarkdown(file, onProgress),
    'pdf->html': () => pdfToHtml(file, onProgress),
    'pdf->txt': () => pdfToTxt(file, onProgress),

		// ── Images → Other ──
		'jpg->pdf': () => imageToPdf(file, onProgress),
		'png->pdf': () => imageToPdf(file, onProgress),
		'webp->pdf': () => imageToPdf(file, onProgress),
		'jpg->png': () => imageConvert(file, 'png', onProgress),
		'jpg->webp': () => imageConvert(file, 'webp', onProgress),
		'png->jpg': () => imageConvert(file, 'jpg', onProgress),
		'png->webp': () => imageConvert(file, 'webp', onProgress),
		'webp->jpg': () => imageConvert(file, 'jpg', onProgress),
		'webp->png': () => imageConvert(file, 'png', onProgress),
		'jpg->docx': () => imageToDocx(file, onProgress),
		'png->docx': () => imageToDocx(file, onProgress),
		'webp->docx': () => imageToDocx(file, onProgress),
		'jpg->pptx': () => imageToPptx(file, onProgress),
		'png->pptx': () => imageToPptx(file, onProgress),
		'webp->pptx': () => imageToPptx(file, onProgress),
		'jpg->xlsx': () => imageToXlsx(file, onProgress),
		'png->xlsx': () => imageToXlsx(file, onProgress),
		'webp->xlsx': () => imageToXlsx(file, onProgress),
		'jpg->csv': () => imageToXlsx(file, onProgress),
		'png->csv': () => imageToXlsx(file, onProgress),
		'webp->csv': () => imageToXlsx(file, onProgress),
    'jpg->md': () => imageToMarkdownInternal(file, 'jpg', onProgress),
    'png->md': () => imageToMarkdownInternal(file, 'png', onProgress),
		'webp->md': () => imageToMarkdownInternal(file, 'webp', onProgress),

		// ── DOCX → Other ──
		'docx->pdf': () => docxToPdf(file, onProgress),
		'docx->pptx': () => docxToPptx(file, onProgress),
		'docx->xlsx': () => docxToXlsx(file, onProgress),
		'docx->csv': () => docxToCsv(file, onProgress),
		'docx->jpg': () => docxToImage(file, 'jpg', onProgress),
		'docx->png': () => docxToImage(file, 'png', onProgress),
		'docx->webp': () => docxToImage(file, 'webp', onProgress),
    'docx->md': () => docxToMarkdown(file, onProgress),
    'docx->html': () => docxToHtml(file, onProgress),
    'docx->txt': () => docxToTxt(file, onProgress),

		// ── PPTX → Other ──
		'pptx->pdf': () => pptxToPdf(file, onProgress),
		'pptx->docx': () => pptxToDocx(file, onProgress),
		'pptx->xlsx': () => pptxToXlsx(file, onProgress),
		'pptx->csv': () => pptxToCsv(file, onProgress),
		'pptx->md': () => pptxToMarkdown(file, onProgress),
		'pptx->txt': () => pptxToTxt(file, onProgress),
		'pptx->jpg': () => pptxToImage(file, 'jpg', onProgress),
		'pptx->png': () => pptxToImage(file, 'png', onProgress),
		'pptx->webp': () => pptxToImage(file, 'webp', onProgress),

		// ── XLSX → Other ──
		'xlsx->pdf': () => xlsxToPdf(file, onProgress),
		'xlsx->docx': () => xlsxToDocx(file, onProgress),
		'xlsx->pptx': () => xlsxToPptx(file, onProgress),
		'xlsx->csv': () => xlsxToCsv(file, onProgress),
		'xlsx->jpg': () => xlsxToImage(file, 'jpg', onProgress),
		'xlsx->png': () => xlsxToImage(file, 'png', onProgress),
		'xlsx->webp': () => xlsxToImage(file, 'webp', onProgress),
    'xlsx->md': () => xlsxToMarkdown(file, onProgress),
    'xlsx->txt': () => xlsxToTxt(file, onProgress),

		// ── CSV → Other ──
		'csv->pdf': () => csvToPdf(file, onProgress),
		'csv->docx': () => csvToDocx(file, onProgress),
		'csv->pptx': () => csvToPptx(file, onProgress),
		'csv->xlsx': () => csvToXlsx(file, onProgress),
		'csv->jpg': () => xlsxToImage(file, 'jpg', onProgress),
		'csv->png': () => xlsxToImage(file, 'png', onProgress),
		'csv->webp': () => xlsxToImage(file, 'webp', onProgress),
    'csv->md': () => csvToMarkdown(file, onProgress),
    'csv->txt': () => csvToTxt(file, onProgress),

		// ── Markdown → Other ──
		'md->pdf': () => mdToPdf(file, onProgress),
		'md->docx': () => mdToDocx(file, onProgress),
		'md->pptx': () => mdToPptx(file, onProgress),
		'md->xlsx': () => mdToXlsx(file, onProgress),
		'md->csv': () => mdToCsv(file, onProgress),
		'md->html': () => mdToHtmlInternal(file, onProgress),
		'md->txt': () => mdToTxt(file, onProgress),
		'md->jpg': () => mdToImage(file, 'jpg', onProgress),
		'md->png': () => mdToImage(file, 'png', onProgress),
		'md->webp': () => mdToImage(file, 'webp', onProgress),

		// ── HTML → Other ──
		'html->pdf': () => htmlToPdf(file, onProgress),
		'html->docx': () => htmlToDocx(file, onProgress),
		'html->md': () => htmlToMarkdownInternal(file, onProgress),
		'html->txt': () => htmlToTxt(file, onProgress),
		'html->jpg': () => htmlFileToImage(file, 'jpg', onProgress),
		'html->png': () => htmlFileToImage(file, 'png', onProgress),
		'html->webp': () => htmlFileToImage(file, 'webp', onProgress),

		// ── TXT → Other ──
		'txt->pdf': () => txtToPdf(file, onProgress),
		'txt->html': () => txtToHtml(file, onProgress),
		'txt->docx': () => txtToDocx(file, onProgress),
		'txt->md': () => txtToMarkdown(file, onProgress),
		'txt->xlsx': () => txtToXlsx(file, onProgress),
	};

	const converter = converters[key];
	if (!converter) {
		throw new Error(`Conversion from ${from} to ${to} is not supported`);
	}

	const result = await converter();
	onProgress?.(100);
	return result;
}
