import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

export interface PdfJoinerDocument {
	id: string;
	file: File;
	name: string;
	pageCount: number;
	thumbnailUrl: string;
}

let pdfjsLib: typeof import('pdfjs-dist') | null = null;

async function getPdfJs(): Promise<typeof import('pdfjs-dist')> {
	if (pdfjsLib) return pdfjsLib;
	pdfjsLib = await import('pdfjs-dist');
	pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
	return pdfjsLib;
}

function createDocumentId(): string {
	if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createPdfJoinerDocument(file: File): Promise<PdfJoinerDocument> {
	const pdfjs = await getPdfJs();
	const buffer = await file.arrayBuffer();
	const pdf = await pdfjs.getDocument({ data: buffer }).promise;
	const firstPage = await pdf.getPage(1);
	const viewport = firstPage.getViewport({ scale: 0.45 });
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');

	if (!context) {
		throw new Error('Canvas context unavailable');
	}

	canvas.width = viewport.width;
	canvas.height = viewport.height;

	await firstPage.render({ canvasContext: context, viewport } as RenderParameters).promise;

	return {
		id: createDocumentId(),
		file,
		name: file.name,
		pageCount: pdf.numPages,
		thumbnailUrl: canvas.toDataURL('image/png')
	};
}

export async function createPdfJoinerDocuments(files: File[]): Promise<PdfJoinerDocument[]> {
	const docs: PdfJoinerDocument[] = [];
	for (const file of files) {
		docs.push(await createPdfJoinerDocument(file));
	}
	return docs;
}

export async function joinPdfDocuments(files: File[]): Promise<Blob> {
	const { PDFDocument } = await import('pdf-lib');
	const outputPdf = await PDFDocument.create();

	for (const file of files) {
		const buffer = await file.arrayBuffer();
		const srcPdf = await PDFDocument.load(buffer);
		const pageIndexes = srcPdf.getPages().map((_, index) => index);
		const copiedPages = await outputPdf.copyPages(srcPdf, pageIndexes);
		for (const page of copiedPages) {
			outputPdf.addPage(page);
		}
	}

	const outputBytes = await outputPdf.save();
	return new Blob([outputBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
}
