<script lang="ts">
	import {
		createPdfJoinerDocuments,
		joinPdfDocuments,
		type PdfJoinerDocument
	} from '$lib/converters/pdf-joiner';

	let {
		onReset
	}: {
		onReset: () => void;
	} = $props();

	let documents = $state<PdfJoinerDocument[]>([]);
	let isLoading = $state(false);
	let isExporting = $state(false);
	let isDraggingFile = $state(false);
	let draggedIndex = $state<number | null>(null);
	let dragOverIndex = $state<number | null>(null);
	let errorMessage = $state('');
	let inputEl = $state<HTMLInputElement | undefined>(undefined);

	const totalPages = $derived(documents.reduce((sum, doc) => sum + doc.pageCount, 0));

	function toFileArray(fileList: FileList | null): File[] {
		return fileList ? Array.from(fileList) : [];
	}

	function validatePdfFiles(files: File[]): void {
		for (const file of files) {
			const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
			if (!isPdf) {
				throw new Error(`"${file.name}" is not a PDF file`);
			}
		}
	}

	async function addDocuments(files: File[]): Promise<void> {
		if (files.length === 0) return;
		isLoading = true;
		errorMessage = '';
		try {
			validatePdfFiles(files);
			const nextDocuments = await createPdfJoinerDocuments(files);
			documents = [...documents, ...nextDocuments];
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Failed to load PDF files';
		} finally {
			isLoading = false;
		}
	}

	async function handleFileSelect(event: Event): Promise<void> {
		const input = event.target as HTMLInputElement;
		await addDocuments(toFileArray(input.files));
		input.value = '';
	}

	function onFileDrop(event: DragEvent): void {
		event.preventDefault();
		isDraggingFile = false;
		void addDocuments(toFileArray(event.dataTransfer?.files ?? null));
	}

	function onFileDragOver(event: DragEvent): void {
		event.preventDefault();
		isDraggingFile = true;
	}

	function onDragStart(index: number): void {
		draggedIndex = index;
	}

	function onDragOver(event: DragEvent, index: number): void {
		event.preventDefault();
		dragOverIndex = index;
	}

	function onDragLeave(): void {
		dragOverIndex = null;
	}

	function onDrop(index: number): void {
		if (draggedIndex === null || draggedIndex === index) {
			draggedIndex = null;
			dragOverIndex = null;
			return;
		}

		const nextDocs = [...documents];
		const [moved] = nextDocs.splice(draggedIndex, 1);
		nextDocs.splice(index, 0, moved);
		documents = nextDocs;
		draggedIndex = null;
		dragOverIndex = null;
	}

	function onDragEnd(): void {
		draggedIndex = null;
		dragOverIndex = null;
	}

	function removeDocument(id: string): void {
		documents = documents.filter((doc) => doc.id !== id);
	}

	function downloadBlob(blob: Blob, fileName: string): void {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async function exportJoinedPdf(): Promise<void> {
		if (documents.length === 0) return;
		isExporting = true;
		errorMessage = '';
		try {
			const blob = await joinPdfDocuments(documents.map((doc) => doc.file));
			downloadBlob(blob, 'joined-document.pdf');
		} catch (err: unknown) {
			errorMessage = err instanceof Error ? err.message : 'Failed to join PDF files';
		} finally {
			isExporting = false;
		}
	}

	function reset(): void {
		documents = [];
		errorMessage = '';
		onReset();
	}
</script>

<div
	class="group relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden cursor-pointer
	{isDraggingFile || documents.length > 0
		? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 scale-[1.02] shadow-[0_0_40px_rgba(56,182,255,0.15)]'
		: 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/40 hover:bg-[var(--color-bg-card)]/80 hover:border-[var(--color-text-muted)] hover:shadow-2xl'}"
>
	{#if documents.length === 0}
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
			<input bind:this={inputEl} type="file" accept=".pdf,application/pdf" multiple onchange={handleFileSelect} hidden />
			<div class="relative z-10 flex flex-col items-center text-center">
				<div class="mb-6 p-5 rounded-full bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-[var(--color-accent-cyan)]/30">
					<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-cyan)] transition-colors duration-300">
						<path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						<path d="M4 17L4 18C4 19.6569 5.34315 21 7 21L17 21C18.6569 21 20 19.6569 20 18L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</div>
				<h3 class="font-body text-2xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">{isDraggingFile ? 'Drop PDFs here' : 'Click or drop PDF files here'}</h3>
				<p class="text-[var(--color-text-secondary)] mb-4">Combine one or more PDF files into a single document</p>
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
			<p class="text-[var(--color-text-secondary)] font-medium">Loading PDF files...</p>
		</div>
	{:else}
		<div class="space-y-6 w-full">
			<div class="flex items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 rounded-xl flex items-center justify-center bg-[#e94560]/10 border border-[#e94560]/30">
						<span class="text-2xl">📚</span>
					</div>
					<div>
						<p class="font-bold text-[var(--color-text-primary)]">{documents.length} document{documents.length === 1 ? '' : 's'} ready</p>
						<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{totalPages} total pages</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<button
						onclick={() => inputEl?.click()}
						class="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[var(--color-bg-card)]/60 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
					>
						Add PDFs
					</button>
					<button
						onclick={reset}
						title="Reset"
						class="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 transition-all duration-300 hover:bg-[var(--color-accent-red)]/20 hover:text-[var(--color-accent-red)] hover:rotate-90 group border border-transparent hover:border-[var(--color-accent-red)]/30 shadow-sm"
					>
						<svg width="20" height="20" viewBox="0 0 18 18" fill="none" class="transition-transform group-hover:scale-110">
							<path d="M5 5l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
						</svg>
					</button>
				</div>
			</div>

			<input bind:this={inputEl} type="file" accept=".pdf,application/pdf" multiple onchange={handleFileSelect} hidden />

			{#if documents.length > 1}
				<p class="text-sm text-[var(--color-text-secondary)] font-medium text-center">Drag and drop to arrange document order</p>
			{/if}

			<div
				role="list"
				ondrop={onFileDrop}
				ondragover={onFileDragOver}
				ondragleave={() => (isDraggingFile = false)}
				class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl border border-[var(--color-border-subtle)]"
			>
				{#each documents as doc, i (doc.id)}
					<div
						role="listitem"
						class="relative flex flex-col rounded-xl border-2 overflow-hidden bg-[var(--color-bg-card)]/70 transition-all duration-150 {dragOverIndex === i && draggedIndex !== i ? 'border-[var(--color-accent-blue)] scale-[1.01]' : 'border-[var(--color-border-subtle)]'} {draggedIndex === i ? 'opacity-40' : 'opacity-100'}"
						draggable="true"
						ondragstart={() => onDragStart(i)}
						ondragover={(event) => onDragOver(event, i)}
						ondragleave={onDragLeave}
						ondrop={() => onDrop(i)}
						ondragend={onDragEnd}
					>
						<img src={doc.thumbnailUrl} alt={doc.name} class="w-full h-56 object-contain bg-[var(--color-bg-primary)] p-2" draggable="false" />
						<div class="border-t border-[var(--color-border-subtle)] p-3">
							<p class="text-sm font-bold text-[var(--color-text-primary)] truncate">{doc.name}</p>
							<p class="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{doc.pageCount} page{doc.pageCount === 1 ? '' : 's'}</p>
						</div>
						<button
							onclick={() => removeDocument(doc.id)}
							class="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-primary)] bg-[var(--color-bg-primary)]/80 hover:bg-[var(--color-accent-red)]/20 hover:text-[var(--color-accent-red)] transition-colors"
							title="Remove document"
						>
							<svg width="16" height="16" viewBox="0 0 18 18" fill="none">
								<path d="M5 5l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
							</svg>
						</button>
					</div>
				{/each}
			</div>

			<div class="flex gap-4 justify-center flex-wrap mt-4">
				<button
					onclick={exportJoinedPdf}
					disabled={isExporting || documents.length === 0}
					class="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-[var(--color-accent-green)] text-[#05050a] font-extrabold text-sm transition-all duration-300 hover:bg-[#33ff99] hover:-translate-y-1 hover:shadow-[0_10px_30px_-5px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
				>
					{#if isExporting}
						<div class="w-4 h-4 border-2 border-[#05050a] border-t-transparent rounded-full animate-spin"></div>
						Joining...
					{:else}
						<svg width="20" height="20" viewBox="0 0 18 18" fill="none">
							<path d="M9 3v9m0 0l-3.5-3.5M9 12l3.5-3.5M3 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
						</svg>
						Join PDF
					{/if}
				</button>
			</div>

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
