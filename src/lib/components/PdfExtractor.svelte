<script lang="ts">
import { onDestroy } from 'svelte';
	import {
		extractPdfPagesToImages,
		extractPdfPagesToPdf,
		generatePdfPagePreviews,
		type ImageExportFormat,
		type PdfPagePreview
	} from '$lib/converters/pdf-extractor';

	let {
		onReset
	}: {
		onReset: () => void;
	} = $props();

	type ExtractPreview = PdfPagePreview & { selected: boolean };
	type OutputType = 'pdf' | ImageExportFormat;

	const imageOutputTypes: ImageExportFormat[] = ['png', 'jpg', 'webp'];

	let pdfFile = $state<File | null>(null);
	let previews = $state<ExtractPreview[]>([]);
	let isLoading = $state(false);
	let isExporting = $state(false);
	let isDraggingFile = $state(false);
	let errorMessage = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);
	let outputType = $state<OutputType>('pdf');

	const selectedCount = $derived(previews.filter((page) => page.selected).length);

	function clearPreviewUrls(): void {
		previews = [];
	}

	onDestroy(() => {
		clearPreviewUrls();
	});

	async function handleFileSelect(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File): Promise<void> {
		if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
			errorMessage = 'Please select a PDF file';
			return;
		}

		isLoading = true;
		errorMessage = '';
		clearPreviewUrls();
		previews = [];
		pdfFile = file;

		try {
			const pagePreviews = await generatePdfPagePreviews(file);
			previews = pagePreviews.map((page) => ({ ...page, selected: false }));
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load PDF pages';
			previews = [];
		} finally {
			isLoading = false;
		}
	}

	function onFileDrop(event: DragEvent): void {
		event.preventDefault();
		isDraggingFile = false;
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		void processFile(file);
	}

	function onFileDragOver(event: DragEvent): void {
		event.preventDefault();
		isDraggingFile = true;
	}

	function togglePage(index: number): void {
		previews = previews.map((preview, previewIndex) =>
			previewIndex === index ? { ...preview, selected: !preview.selected } : preview
		);
	}

	function selectAllPages(): void {
		previews = previews.map((preview) => ({ ...preview, selected: true }));
	}

	function clearPageSelection(): void {
		previews = previews.map((preview) => ({ ...preview, selected: false }));
	}

	function getSelectedPageIndexes(): number[] {
		return previews.filter((page) => page.selected).map((page) => page.index);
	}

	function basePdfName(fileName: string): string {
		return fileName.replace(/\.pdf$/i, '') || 'document';
	}

	function downloadBlob(blob: Blob, fileName: string): void {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function  exportSelection(): Promise<void> {
		if (!pdfFile) return;
		const selectedPages = getSelectedPageIndexes();
		if (selectedPages.length === 0) {
			errorMessage = 'Select at least one page to export';
			return;
		}

		isExporting = true;
		errorMessage = '';

		try {
			const name = basePdfName(pdfFile.name);
			if (outputType === 'pdf') {
				const blob = await extractPdfPagesToPdf(pdfFile, selectedPages);
				downloadBlob(blob, `${name}-extracted.pdf`);
			} else {
				const { blob, isZip } = await extractPdfPagesToImages(pdfFile, selectedPages, outputType);
				if (isZip) {
					downloadBlob(blob, `${name}-pages-${outputType}.zip`);
				} else {
					downloadBlob(blob, `${name}-page-${selectedPages[0] + 1}.${outputType}`);
				}
			}
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Failed to export pages';
		} finally {
			isExporting = false;
		}
	}

	function reset(): void {
		clearPreviewUrls();
		pdfFile = null;
		previews = [];
		outputType = 'pdf';
		errorMessage = '';
		onReset();
	}
</script>

<div
	class="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden {!pdfFile ? 'cursor-pointer' : ''}
  {isDraggingFile || pdfFile
		? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 scale-[1.02] shadow-[0_0_40px_rgba(56,182,255,0.15)]'
		: 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/40 hover:bg-[var(--color-bg-card)]/80 hover:border-[var(--color-text-muted)] hover:shadow-2xl'}"
>
	{#if !pdfFile}
		<div
			ondrop={onFileDrop}
			ondragover={onFileDragOver}
			ondragleave={() => (isDraggingFile = false)}
			onclick={() => inputEl?.click()}
			onkeydown={(event) => event.key === 'Enter' && inputEl?.click()}
			role="button"
			tabindex="0"
		>
			<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,_rgba(56,182,255,0.08),_transparent_70%)] pointer-events-none"></div>
			<input bind:this={inputEl} type="file" accept=".pdf,application/pdf" onchange={handleFileSelect} hidden />
			<div class="relative z-10 flex flex-col items-center text-center">
				<div class="mb-6 p-5 rounded-full bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-[var(--color-accent-cyan)]/30">
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-cyan)] transition-colors duration-300">
						<path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M4 17L4 18C4 19.6569 5.34315 21 7 21L17 21C18.6569 21 20 19.6569 20 18L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<h3 class="font-body text-2xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">{isDraggingFile ? 'Drop it!' : 'Click or drop a PDF here'}</h3>
				<p class="text-[var(--color-text-secondary)] mb-4">Choose one or more pages, then export as PDF or images</p>
			</div>
			{#if errorMessage}
				<div class="absolute bottom-6 px-4 py-2 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] text-sm font-medium backdrop-blur-md">
					{errorMessage}
				</div>
			{/if}
		</div>
	{:else if isLoading}
		<div class="text-center py-12">
			<div class="inline-block w-12 h-12 border-4 border-[var(--color-accent-cyan)] border-t-transparent rounded-full animate-spin mb-4"></div>
			<p class="text-[var(--color-text-secondary)] font-medium">Loading PDF pages...</p>
		</div>
	{:else}
		<div class="space-y-6 w-full">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-[#e94560]/10 border border-[#e94560]/30">
						<span class="text-2xl">📄</span>
					</div>
					<div>
						<p class="font-bold text-[var(--color-text-primary)]">{pdfFile.name}</p>
						<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{(pdfFile.size / 1024).toFixed(1)} KB • {previews.length} pages • {selectedCount} selected</p>
					</div>
				</div>
				<button
					onclick={reset}
					title="Remove file"
					class="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 transition-all duration-300 hover:bg-[var(--color-accent-red)]/20 hover:text-[var(--color-accent-red)] hover:rotate-90 group border border-transparent hover:border-[var(--color-accent-red)]/30 shadow-sm"
				>
					<svg width="20" height="20" viewBox="0 0 18 18" fill="none" class="transition-transform group-hover:scale-110">
						<path d="M5 5l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
					</svg>
				</button>
			</div>

			<div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl border border-[var(--color-border-subtle)]">
				<div class="inline-flex items-center gap-2">
          <span class="text-xs font-bold tracking-wider uppercase text-[var(--color-text-muted)]">Export as</span>
						<div class="inline-flex rounded-lg bg-[var(--color-bg-card)]/50 border border-[var(--color-border-subtle)] p-1">
							{#each ['pdf', ...imageOutputTypes] as option (option)}
								<button
									aria-pressed={outputType === option}
									onclick={() => (outputType = option as OutputType)}
									class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-200 border inline-flex items-center gap-1.5 {outputType === option ? 'bg-[var(--color-accent-blue)] text-white border-[var(--color-accent-blue)] shadow-[0_0_0_1px_var(--color-accent-blue),0_4px_16px_-4px_rgba(56,182,255,0.5)]' : 'bg-transparent text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-bg-card)]/50 hover:text-[var(--color-text-primary)]'}"
								>
									{#if outputType === option}
										<span>✓</span>
									{/if}
									<span>{option}</span>
								</button>
							{/each}
						</div>
				</div>
				<div class="flex items-center gap-2">
          {#if selectedCount < previews.length}
            <button onclick={selectAllPages} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[var(--color-bg-card)]/60 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Select all
            </button>
          {/if}
          {#if selectedCount > 0}
            <button onclick={clearPageSelection} class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[var(--color-bg-card)]/60 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Clear
            </button>
          {/if}
				</div>
			</div>

			{#if previews.length > 0}
				<div class="flex flex-col items-center gap-4">
					<p class="text-sm text-[var(--color-text-secondary)] font-medium">Click pages to select what to extract</p>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl border border-[var(--color-border-subtle)]">
						{#each previews as preview, i (preview.index)}
							<button
								onclick={() => togglePage(i)}
								class="relative flex flex-col items-center gap-2 text-left transition-all duration-200 rounded-lg p-2 border-2 {preview.selected ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10' : 'border-transparent hover:border-[var(--color-border-subtle)]'}"
							>
								<img src={preview.imageUrl} alt="Page {preview.index + 1}" class="border rounded-lg border-[var(--color-border-subtle)] shadow-md" />
								<span class="text-xs text-[var(--color-text-muted)] font-medium">Page {preview.index + 1}</span>
								<div class="absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center {preview.selected ? 'bg-[var(--color-accent-blue)] border-[var(--color-accent-blue)]' : 'bg-[var(--color-bg-primary)]/80 border-[var(--color-border-subtle)]'}">
									{#if preview.selected}
										<svg width="14" height="14" viewBox="0 0 20 20" fill="none">
											<path d="M4.5 10.5L8 14l7.5-7.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<div class="flex gap-4 justify-center flex-wrap mt-4">
						<button
							onclick={exportSelection}
							disabled={isExporting || selectedCount === 0}
							class="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-[var(--color-accent-green)] text-[#05050a] font-extrabold text-sm transition-all duration-300 hover:bg-[#33ff99] hover:-translate-y-1 hover:shadow-[0_10px_30px_-5px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{#if isExporting}
								<div class="w-4 h-4 border-2 border-[#05050a] border-t-transparent rounded-full animate-spin"></div>
								Exporting...
							{:else}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none">
									<path d="M9 3v9m0 0l-3.5-3.5M9 12l3.5-3.5M3 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
								</svg>
								Export {selectedCount} page{selectedCount === 1 ? '' : 's'} to {outputType}
							{/if}
						</button>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<div class="text-center py-4">
					<div class="inline-flex items-center justify-center p-3 rounded-full bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)] mb-3">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
					</div>
					<p class="text-[var(--color-accent-red)] font-medium">{errorMessage}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
