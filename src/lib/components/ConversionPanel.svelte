<script lang="ts">
	import { FORMAT_MAP, type FileFormat, type ConversionJob } from '$lib/types';

	let {
		job,
		onDownload,
		onReset
	}: {
		job: ConversionJob;
		onDownload: () => void;
		onReset: () => void;
	} = $props();

	const sourceInfo = $derived(FORMAT_MAP[job.sourceFormat]);
	const targetInfo = $derived(FORMAT_MAP[job.targetFormat]);

	const sourceBadgeStyle = $derived(`background: color-mix(in srgb, ${sourceInfo.color} 15%, #1e1e3a); border: 1px solid color-mix(in srgb, ${sourceInfo.color} 30%, transparent); color: ${sourceInfo.color}; font-size: 0.85rem; font-weight: 600;`);
	const targetBadgeStyle = $derived(`background: color-mix(in srgb, ${targetInfo.color} 15%, #1e1e3a); border: 1px solid color-mix(in srgb, ${targetInfo.color} 30%, transparent); color: ${targetInfo.color}; font-size: 0.85rem; font-weight: 600;`);

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<div class="mt-8 bg-[var(--color-bg-card)]/60 backdrop-blur-2xl border border-[var(--color-border-subtle)] rounded-2xl py-8 px-8 transition-all duration-700 relative overflow-hidden" 
	style={job.status === 'done' ? 'border-color: rgba(0, 255, 136, 0.4); box-shadow: 0 10px 40px rgba(0, 255, 136, 0.1);' : job.status === 'error' ? 'border-color: rgba(255, 51, 102, 0.4); box-shadow: 0 10px 40px rgba(255, 51, 102, 0.1);' : ''}>
	
	<!-- File info header -->
	<div class="text-center mb-8 relative z-10">
		<div class="flex items-center justify-center gap-4 mb-4">
			<div class="inline-flex items-center gap-2 py-2 px-4 rounded-xl shadow-md" style={sourceBadgeStyle}>
				<span class="text-lg">{sourceInfo.icon}</span>
				<span class="tracking-wide uppercase text-xs">{sourceInfo.label}</span>
			</div>
			<div class="text-[var(--color-text-muted)]">
				<svg class="animate-pulse" width="24" height="24" viewBox="0 0 32 32" fill="none">
					<path d="M8 16h16m0 0l-6-6m6 6l-6 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<div class="inline-flex items-center gap-2 py-2 px-4 rounded-xl shadow-md" style={targetBadgeStyle}>
				<span class="text-lg">{targetInfo.icon}</span>
				<span class="tracking-wide uppercase text-xs">{targetInfo.label}</span>
			</div>
		</div>
		<p class="text-base text-[var(--color-text-primary)] font-bold break-all">{job.sourceFile.name}</p>
		<p class="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-wider">{formatSize(job.sourceFile.size)}</p>
	</div>

	<!-- Progress / Status -->
	{#if job.status === 'converting'}
		<div class="text-center relative z-10">
			<div class="h-2.5 bg-[var(--color-bg-elevated)]/50 rounded-full overflow-hidden mb-4 border border-[var(--color-border-subtle)] shadow-inner">
				<div class="h-full rounded-full transition-[width_300ms_ease-out] relative" style="width: {job.progress}%; background: linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-blue))">
					<div class="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[pulse_1.5s_infinite]"></div>
				</div>
			</div>
			<p class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-blue animate-pulse">Processing... {Math.round(job.progress)}%</p>
		</div>
	{:else if job.status === 'done'}
		<div class="text-center relative z-10">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)] mb-4 border border-[var(--color-accent-green)]/20 shadow-[0_0_30px_rgba(0,255,136,0.2)]" style="animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
				<svg width="32" height="32" viewBox="0 0 28 28" fill="none">
					<path d="M8 14l4 4 8-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</div>
			<p class="font-body text-xl font-bold text-[var(--color-accent-green)] mb-1 text-shadow-sm">Conversion Complete!</p>
			{#if job.resultBlob}
				<p class="text-xs text-[var(--color-text-muted)]/80 mb-6 uppercase tracking-wider">{formatSize(job.resultBlob.size)}</p>
			{/if}
			<div class="flex gap-4 justify-center flex-wrap">
				<button class="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl bg-[var(--color-accent-green)] text-[#05050a] font-extrabold text-sm transition-all duration-300 hover:bg-[#33ff99] hover:-translate-y-1 hover:shadow-[0_10px_30px_-5px_rgba(0,255,136,0.4)]" onclick={onDownload}>
					<svg width="20" height="20" viewBox="0 0 18 18" fill="none">
						<path d="M9 3v9m0 0l-3.5-3.5M9 12l3.5-3.5M3 14h12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Download File
				</button>
				<button class="py-3.5 px-8 rounded-xl bg-[var(--color-bg-elevated)]/80 border-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-bold text-sm transition-all duration-300 hover:bg-[var(--color-bg-card-hover)] hover:border-[var(--color-text-muted)] hover:-translate-y-1" onclick={onReset}>Convert Another</button>
			</div>
		</div>
	{:else if job.status === 'error'}
		<div class="text-center relative z-10">
			<div class="inline-flex items-center justify-center p-4 rounded-full bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)] mb-3">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</div>
			<p class="text-[var(--color-accent-red)] font-bold mb-6">{job.error || 'Conversion failed'}</p>
			<button class="py-3 px-8 rounded-xl bg-[var(--color-bg-elevated)]/80 border-2 border-[var(--color-border-subtle)] text-[var(--color-text-primary)] font-bold text-sm transition-all duration-300 hover:bg-[var(--color-bg-card-hover)] hover:border-[var(--color-accent-red)]/50 hover:text-[var(--color-accent-red)] hover:-translate-y-1" onclick={onReset}>Try Again</button>
		</div>
	{/if}
</div>
