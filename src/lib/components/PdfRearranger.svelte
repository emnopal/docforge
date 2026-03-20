<script lang="ts">
	import { onMount } from 'svelte';
	import * as pdfjsLib from 'pdfjs-dist';
	import { PDFDocument } from 'pdf-lib';
	import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

	let {
		onReset
	}: {
		onReset: () => void;
	} = $props();

	let pdfFile = $state<File | null>(null);
	let pdfDoc = $state<any>(null);
	let previews = $state<{ index: number; imageUrl: string }[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let isExporting = $state(false);
	let isDraggingFile = $state(false);
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	onMount(async () => {
		try {
			pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
		} catch (err) {
			console.error('Failed to initialize pdf.js:', err);
		}
	});

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await processFile(file);
	}

	async function processFile(file: File) {
		if (file.type !== 'application/pdf') {
			errorMessage = 'Please select a PDF file';
			return;
		}

		isLoading = true;
		errorMessage = '';
		previews = [];
		pdfDoc = null;
		pdfFile = file;

		try {
			const arrayBuffer = await file.arrayBuffer();
			const typedarray = new Uint8Array(arrayBuffer);
			const loadingTask = pdfjsLib.getDocument({ data: typedarray });
			pdfDoc = await loadingTask.promise;

			const scale = 1.5;
			const previewList: { index: number; imageUrl: string }[] = [];

			for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
				const page = await pdfDoc.getPage(pageNum);
				const viewport = page.getViewport({ scale });

				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');
				if (!context) continue;

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				await page.render({ canvasContext: context, viewport }).promise;

				previewList.push({
					index: pageNum - 1,
					imageUrl: canvas.toDataURL('image/png')
				});
			}

			previews = previewList;
		} catch (err: any) {
			errorMessage = err.message || 'Failed to load PDF';
			previews = [];
		} finally {
			isLoading = false;
		}
	}

	function onFileDrop(e: DragEvent) {
		e.preventDefault();
		isDraggingFile = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processFile(file);
	}

	function onFileDragOver(e: DragEvent) {
		e.preventDefault();
		isDraggingFile = true;
	}

	function onDragStart(index: number) {
		draggedIndex = index;
	}

	function onDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		dragOverIndex = index;
	}

	function onDragLeave() {
		dragOverIndex = null;
	}

	function onDrop(index: number) {
		if (draggedIndex === null || draggedIndex === index) {
			draggedIndex = null;
			dragOverIndex = null;
			return;
		}
		const nextPreviews = [...previews];
		const [moved] = nextPreviews.splice(draggedIndex, 1);
		nextPreviews.splice(index, 0, moved);
		previews = nextPreviews;
		draggedIndex = null;
		dragOverIndex = null;
	}

	function onDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}

	async function exportRearrangedPdf() {
		if (!pdfFile) return;

		isExporting = true;
		errorMessage = '';

		try {
			const newOrder = previews.map((p) => p.index);
			const buffer = await pdfFile.arrayBuffer();

			const newPdf = await PDFDocument.create();
			const srcPdf = await PDFDocument.load(buffer);
			const copiedPages = await newPdf.copyPages(srcPdf, newOrder);

			copiedPages.forEach((page) => {
				newPdf.addPage(page);
			});

			const pdfBytes = await newPdf.save();
			const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);

			const a = document.createElement('a');
			a.href = url;
			a.download = `rearranged-${pdfFile?.name || 'document.pdf'}`;
			a.click();
			URL.revokeObjectURL(url);
		} catch (err: any) {
			errorMessage = err.message || 'Failed to export PDF';
		} finally {
			isExporting = false;
		}
	}

	function reset() {
		pdfFile = null;
		pdfDoc = null;
		previews = [];
		errorMessage = '';
		onReset();
	}
</script>


<div 
  class="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden cursor-pointer
  {isDraggingFile || pdfFile
    ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 scale-[1.02] shadow-[0_0_40px_rgba(56,182,255,0.15)]'
    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/40 hover:bg-[var(--color-bg-card)]/80 hover:border-[var(--color-text-muted)] hover:shadow-2xl'}">
	{#if !pdfFile}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
      ondrop={onFileDrop}
			ondragover={onFileDragOver}
			ondragleave={() => (isDraggingFile = false)}
			onclick={() => inputEl?.click()}
			onkeydown={(e) => e.key === 'Enter' && inputEl?.click()}
			role="button"
			tabindex="0"
		>
			<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,_rgba(56,182,255,0.08),_transparent_70%)] pointer-events-none"></div>

			<input
				bind:this={inputEl}
				type="file"
				accept=".pdf,application/pdf"
				onchange={handleFileSelect}
				hidden
			/>

			<div class="relative z-10 flex flex-col items-center text-center">
				<div class="mb-6 p-5 rounded-full bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-[var(--color-accent-cyan)]/30">
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-cyan)] transition-colors duration-300">
						<path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M4 17L4 18C4 19.6569 5.34315 21 7 21L17 21C18.6569 21 20 19.6569 20 18L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h3 class="font-body text-2xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">
					{isDraggingFile ? "Drop it!" : 'Click or drop a PDF here'}
				</h3>
				<p class="text-[var(--color-text-secondary)] mb-4">
					Drag and drop pages to reorder them after loading
				</p>
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
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-[#e94560]/10 border border-[#e94560]/30">
						<span class="text-2xl">📄</span>
					</div>
					<div>
						<p class="font-bold text-[var(--color-text-primary)]">{pdfFile.name}</p>
						<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{(pdfFile.size / 1024).toFixed(1)} KB • {previews.length} pages</p>
					</div>
				</div>
					<button
						onclick={reset}
						title="Remove file"
						class="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 transition-all duration-300 hover:bg-[var(--color-accent-red)]/20 hover:text-[var(--color-accent-red)] hover:rotate-90 group border border-transparent hover:border-[var(--color-accent-red)]/30 shadow-sm"
					>
					<svg width="20" height="20" viewBox="0 0 18 18" fill="none" class="transition-transform group-hover:scale-110">
						<path d="M5 5l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
					</svg>
				</button>
			</div>

			{#if previews.length > 0}
				<div class="flex flex-col items-center gap-4">
					<p class="text-sm text-[var(--color-text-secondary)] font-medium">Drag and drop pages to reorder</p>
					<div
						role="list"
						class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl border border-[var(--color-border-subtle)]"
					>
						{#each previews as preview, i (preview.index)}
							<div
								role="listitem"
								class="flex flex-col items-center gap-2 cursor-move transition-opacity duration-150 {draggedIndex === i ? 'opacity-30' : 'opacity-100'}"
								draggable="true"
								ondragstart={() => onDragStart(i)}
								ondragover={(e) => onDragOver(e, i)}
								ondragleave={onDragLeave}
								ondrop={() => onDrop(i)}
								ondragend={onDragEnd}
							>
								<img
									src={preview.imageUrl}
									alt="Page {preview.index + 1}"
									draggable="false"
									class="border-2 rounded-lg shadow-md transition-all duration-150 {dragOverIndex === i && draggedIndex !== i ? 'border-[var(--color-accent-blue)] scale-105' : 'border-[var(--color-border-subtle)]'}"
								/>
								<span class="text-xs text-[var(--color-text-muted)] font-medium">Page {preview.index + 1}</span>
							</div>
						{/each}
					</div>

					<div class="flex gap-4 justify-center flex-wrap mt-6">
						<button
							onclick={exportRearrangedPdf}
							disabled={isExporting}
							class="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-[var(--color-accent-green)] text-[#05050a] font-extrabold text-sm transition-all duration-300 hover:bg-[#33ff99] hover:-translate-y-1 hover:shadow-[0_10px_30px_-5px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
						>
							{#if isExporting}
								<div class="w-4 h-4 border-2 border-[#05050a] border-t-transparent rounded-full animate-spin"></div>
								Exporting...
							{:else}
								<svg width="20" height="20" viewBox="0 0 18 18" fill="none">
									<path d="M9 3v9m0 0l-3.5-3.5M9 12l3.5-3.5M3 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								Export Rearranged PDF
							{/if}
						</button>
					</div>
				</div>
			{/if}

			{#if errorMessage}
				<div class="text-center py-4">
					<div class="inline-flex items-center justify-center p-3 rounded-full bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)] mb-3">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
							<path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
					<p class="text-[var(--color-accent-red)] font-medium">{errorMessage}</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
