<script lang="ts">
	import { detectFormat, FORMAT_MAP, type FileFormat } from '$lib/types';

	let {
		onFileSelect
	}: {
		onFileSelect: (file: File, format: FileFormat) => void;
	} = $props();

	let isDragging = $state(false);
	let error = $state('');
	let inputEl: HTMLInputElement;

	const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.text,.md,.markdown,.html,.htm,.jpg,.jpeg,.png,.webp';

	function handleFiles(files: FileList | null) {
		error = '';
		if (!files || files.length === 0) return;
		const file = files[0];
		const format = detectFormat(file);
		if (!format) {
			error = `Unsupported file: ${file.name}`;
			return;
		}
		onFileSelect(file, format);
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		handleFiles(e.dataTransfer?.files ?? null);
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative flex flex-col items-center justify-center p-12 md:p-16 border-2 border-dashed rounded-[2rem] transition-all duration-500 overflow-hidden cursor-pointer
		{isDragging 
			? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 scale-[1.02] shadow-[0_0_40px_rgba(56,182,255,0.15)]' 
			: 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)]/40 hover:bg-[var(--color-bg-card)]/80 hover:border-[var(--color-text-muted)] hover:shadow-2xl'}"
	ondrop={onDrop}
	ondragover={onDragOver}
	ondragleave={() => (isDragging = false)}
	onclick={() => inputEl.click()}
	onkeydown={(e) => e.key === 'Enter' && inputEl.click()}
	role="button"
	tabindex="0"
>
	<!-- Animated gradient background effect strictly on hover -->
	<div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_50%_0%,_rgba(56,182,255,0.08),_transparent_70%)] pointer-events-none"></div>

	<input
		bind:this={inputEl}
		type="file"
		accept={ACCEPT}
		onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
		hidden
	/>

	<div class="relative z-10 flex flex-col items-center text-center max-w-lg">
		<div class="mb-6 p-5 rounded-full bg-[var(--color-bg-elevated)]/80 border border-[var(--color-border-subtle)] shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:border-[var(--color-accent-cyan)]/30 group-hover:text-[var(--color-accent-cyan)]">
			<svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-cyan)] transition-colors duration-300">
				<path d="M12 16V4M12 4L8 8M12 4L16 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M4 17L4 18C4 19.6569 5.34315 21 7 21L17 21C18.6569 21 20 19.6569 20 18L20 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>
		
		<h3 class="font-body text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] mb-2 tracking-tight">
			{isDragging ? 'Drop it like it\'s hot!' : 'Click or drop a file directly here'}
		</h3>
		
		<p class="text-[var(--color-text-secondary)] md:text-lg mb-8 max-w-md">
			Instantly convert your documents, spreadsheets, slides, and images right in your browser.
		</p>
		
		<div class="flex flex-wrap gap-2.5 justify-center">
			{#each Object.values(FORMAT_MAP) as fmt}
				<span class="inline-flex items-center gap-1.5 text-[0.75rem] font-bold tracking-wider px-3 py-1.5 rounded-full bg-[var(--color-bg-elevated)]/50 backdrop-blur-sm shadow-sm transition-transform hover:scale-110" style="color: {fmt.color}; border: 1px solid color-mix(in srgb, {fmt.color} 30%, transparent)">
					{fmt.label}
				</span>
			{/each}
		</div>
	</div>

	{#if error}
		<div class="absolute bottom-6 px-4 py-2 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] text-sm font-medium animate-fadeIn backdrop-blur-md">
			{error}
		</div>
	{/if}
</div>
