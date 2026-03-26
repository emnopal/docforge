import type { ProgressCallback } from '$lib/types';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export type ImageExportFormat = 'jpg' | 'png' | 'webp';

export interface PdfPagePreview {
	index: number;
	imageUrl: string;
	width: number;
	height: number;
}

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
	if (pdfjsLib) return pdfjsLib;
	pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
	return pdfjsLib;
}

function canvasToImageBlob(canvas: HTMLCanvasElement, format: ImageExportFormat): Promise<Blob> {
	const mimeMap: Record<ImageExportFormat, string> = {
		jpg: 'image/jpeg',
		png: 'image/png',
		webp: 'image/webp'
	};

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
					return;
				}
				reject(new Error('Failed to convert page to image'));
			},
			mimeMap[format],
			0.92
		);
	});
}

export async function generatePdfPagePreviews(
	file: File,
	scale: number = 0.35,
	onProgress?: ProgressCallback
): Promise<PdfPagePreview[]> {
	const pdfjs = await getPdfJs();
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: buffer }).promise;
	const pages: PdfPagePreview[] = [];

	for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
		const page = await pdf.getPage(pageNum);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Canvas context unavailable');
		}

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		await page.render({ canvasContext: context, viewport } as RenderParameters).promise;
		pages.push({
			index: pageNum - 1,
			imageUrl: canvas.toDataURL('image/png'),
			width: viewport.width,
			height: viewport.height
		});
		onProgress?.((pageNum / pdf.numPages) * 100);
	}

	return pages;
}

export async function extractPdfPagesToPdf(file: File, pageIndexes: number[]): Promise<Blob> {
	const { PDFDocument } = await import('pdf-lib');
	const buffer = await file.arrayBuffer();
	const sourcePdf = await PDFDocument.load(buffer);
	const nextPdf = await PDFDocument.create();
	const copiedPages = await nextPdf.copyPages(sourcePdf, pageIndexes);

	for (const page of copiedPages) {
		nextPdf.addPage(page);
	}

	const bytes = await nextPdf.save();
	return new Blob([bytes as unknown as ArrayBuffer], { type: 'application/pdf' });
}

export async function extractPdfPagesToImages(
	file: File,
	pageIndexes: number[],
	format: ImageExportFormat,
	scale: number = 2,
	onProgress?: ProgressCallback
): Promise<{ blob: Blob; isZip: boolean }> {
	const pdfjs = await getPdfJs();
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: buffer }).promise;

	if (pageIndexes.length === 1) {
		const page = await pdf.getPage(pageIndexes[0] + 1);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Canvas context unavailable');
		}

		canvas.width = viewport.width;
		canvas.height = viewport.height;
		await page.render({ canvasContext: context, viewport } as RenderParameters).promise;
		onProgress?.(90);
		return { blob: await canvasToImageBlob(canvas, format), isZip: false };
	}

	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();

	for (let i = 0; i < pageIndexes.length; i++) {
		const pageNumber = pageIndexes[i] + 1;
		const page = await pdf.getPage(pageNumber);
		const viewport = page.getViewport({ scale });
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Canvas context unavailable');
		}

		canvas.width = viewport.width;
		canvas.height = viewport.height;
		await page.render({ canvasContext: context, viewport } as RenderParameters).promise;
		const pageBlob = await canvasToImageBlob(canvas, format);
		zip.file(`page-${pageNumber}.${format}`, pageBlob);
		onProgress?.(((i + 1) / pageIndexes.length) * 95);
	}

	return { blob: await zip.generateAsync({ type: 'blob' }), isZip: true };
}
