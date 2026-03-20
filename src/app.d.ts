/// <reference types="@sveltejs/kit" />

declare module 'pptxgenjs' {
	export default class PptxGenJS {
		addSlide(): any;
		write(opts: any): Promise<ArrayBuffer>;
	}
}

declare module 'mammoth' {
	export function extractRawText(opts: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
	export function convertToHtml(opts: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
}
