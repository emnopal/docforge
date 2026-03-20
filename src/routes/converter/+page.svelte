<script lang="ts">
	import DropZone from '$lib/components/DropZone.svelte';
	import FormatSelector from '$lib/components/FormatSelector.svelte';
	import ConversionPanel from '$lib/components/ConversionPanel.svelte';
	import { FORMAT_MAP, type FileFormat, type ConversionJob } from '$lib/types';
	import { convert } from '$lib/converters/engine';

	let sourceFile = $state<File | null>(null);
	let sourceFormat = $state<FileFormat | null>(null);
	let targetFormat = $state<FileFormat | null>(null);
	let job = $state<ConversionJob | null>(null);

	function onFileSelect(file: File, format: FileFormat) {
		sourceFile = file;
		sourceFormat = format;
		targetFormat = null;
		job = null;
	}

	async function startConversion() {
		if (!sourceFile || !sourceFormat || !targetFormat) return;

		const newJob: ConversionJob = {
			id: crypto.randomUUID(),
			sourceFile,
			sourceFormat,
			targetFormat,
			status: 'converting',
			progress: 0
		};
		job = newJob;

		try {
			const blob = await convert(sourceFile, sourceFormat, targetFormat, (p) => {
				job = { ...newJob, progress: p };
			});

			const baseName = sourceFile.name.replace(/\.[^.]+$/, '');
			const targetInfo = FORMAT_MAP[targetFormat];
			let ext = targetInfo.extension;
			let mime = targetInfo.mime;
			if (
				sourceFormat === 'pdf' &&
				['jpg', 'png', 'webp'].includes(targetFormat) &&
				blob.type === 'application/zip'
			) {
				ext = '.zip';
				mime = 'application/zip';
			}

			job = {
				...newJob,
				status: 'done',
				progress: 100,
				resultBlob: blob,
				resultName: `${baseName}${ext}`
			};
		} catch (err: any) {
			job = {
				...newJob,
				status: 'error',
				progress: 0,
				error: err.message || 'Conversion failed'
			};
		}
	}

	function downloadResult() {
		if (!job?.resultBlob || !job.resultName) return;
		const url = URL.createObjectURL(job.resultBlob);
		const a = document.createElement('a');
		a.href = url;
		a.download = job.resultName;
		a.click();
		URL.revokeObjectURL(url);
	}

	function reset() {
		sourceFile = null;
		sourceFormat = null;
		targetFormat = null;
		job = null;
	}

	$effect(() => {
		if (targetFormat && sourceFile && sourceFormat && !job) {
			startConversion();
		}
	});
</script>

<svelte:head>
	<title>DocForge — Client-Side Document Converter</title>
	<meta name="description" content="Convert files between PDF, DOCX, PPTX, XLSX, CSV, JPG, PNG, and WebP entirely in your browser. No uploads. No servers." />
</svelte:head>

<div class="relative min-h-screen flex flex-col items-center py-16 px-6 overflow-hidden bg-[var(--color-bg-primary)] font-body text-white">
	<div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-bg-elevated)_0%,_transparent_60%)] pointer-events-none z-0"></div>
	<div class="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat pointer-events-none z-0 opacity-10"></div>
	<div class="fixed rounded-full blur-[140px] pointer-events-none z-0 w-[600px] h-[600px] bg-[var(--color-accent-blue)]/15 top-[-150px] right-[-100px] animate-pulse"></div>
	<div class="fixed rounded-full blur-[140px] pointer-events-none z-0 w-[500px] h-[500px] bg-[var(--color-accent-purple)]/15 bottom-[-100px] left-[-150px] animate-pulse delay-700"></div>

	<header class="relative z-10 text-center mb-12 space-y-5 mt-1">
		<a href="/" class="inline-block transition-transform duration-300 hover:scale-105">
			<div class="inline-flex items-center justify-center p-4 rounded-3xl bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border-subtle)] shadow-xl mb-4 backdrop-blur-md">
				<svg width="40" height="40" viewBox="0 0 32 32" fill="none" class="animate-pulse drop-shadow-[0_0_15px_rgba(51,102,255,0.5)]">
					<path d="M16 2L4 9v14l12 7 12-7V9L16 2z" stroke="url(#paint0_linear)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M16 12l-4 4 4 4 4-4-4-4z" fill="url(#paint0_linear)"/>
					<defs>
						<linearGradient id="paint0_linear" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
							<stop stop-color="var(--color-accent-blue)"/>
							<stop offset="1" stop-color="var(--color-accent-cyan)"/>
						</linearGradient>
					</defs>
				</svg>
			</div>
			<h1 class="font-body text-6xl md:text-7xl pb-1 font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--color-text-secondary)] tracking-tight drop-shadow-sm">
	      DocForge
	    </h1>
		</a>
		<p class="text-xl md:text-2xl text-[var(--color-text-secondary)] font-medium max-w-lg mx-auto leading-relaxed">
			Convert any document instantly.<br/>
		</p>
	</header>

	<main class="relative z-10 w-full max-w-3xl">
		<div class="flex justify-center mb-6">
			<a href="/" class="inline-flex items-center gap-2 py-2.5 px-5 rounded-full bg-[var(--color-bg-card)]/40 border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-bg-card)]/60 hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-accent)]">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="transform group-hover:-translate-x-0.5 transition-transform">
					<path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span class="text-sm font-bold tracking-wider uppercase">Back to Home</span>
			</a>
		</div>
		<div class="flex justify-center mb-10">
			<div class="inline-flex items-center gap-2.5 py-2.5 px-6 rounded-full bg-[var(--color-bg-card)]/40 border border-[var(--color-accent-green)]/30 text-[var(--color-accent-green)] shadow-[0_4px_20px_-4px_rgba(46,204,113,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-4px_rgba(46,204,113,0.3)] hover:bg-[var(--color-bg-card)]/60">
				<svg width="18" height="18" viewBox="0 0 14 14" fill="none" class="animate-pulse">
					<path d="M7 1L2 3.5V6.5C2 9.5 4 12 7 13C10 12 12 9.5 12 6.5V3.5L7 1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
					<path d="M5 7l1.5 1.5L9 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span class="text-sm font-bold tracking-wider uppercase">100% client-side · Your files never leave your device</span>
			</div>
		</div>

		{#if !sourceFile}
			<div class="transition-all duration-500 transform hover:-translate-y-1">
				<DropZone {onFileSelect} />
			</div>
		{:else if sourceFormat}
			<div class="animate-fadeIn space-y-6">
				<div class="flex items-center gap-5 p-5 bg-[var(--color-bg-card)]/40 backdrop-blur-3xl border border-[var(--color-border-subtle)] rounded-3xl shadow-2xl hover:border-[var(--color-accent-cyan)]/30 transition-all duration-300">
					<div class="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" style="background: color-mix(in srgb, {FORMAT_MAP[sourceFormat].color} 20%, var(--color-bg-elevated)); border: 2px solid color-mix(in srgb, {FORMAT_MAP[sourceFormat].color} 30%, transparent);">
						<span class="text-3xl drop-shadow-md">{FORMAT_MAP[sourceFormat].icon}</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-lg font-bold text-[var(--color-text-primary)] truncate">{sourceFile.name}</p>
						<p class="text-xs text-[var(--color-text-muted)] mt-1 font-bold tracking-widest uppercase">
							{FORMAT_MAP[sourceFormat].label} • {(sourceFile.size / 1024).toFixed(1)} KB
						</p>
					</div>
					<button class="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 transition-all duration-300 shrink-0 hover:bg-[var(--color-accent-red)]/20 hover:text-[var(--color-accent-red)] hover:rotate-90 group border border-transparent hover:border-[var(--color-accent-red)]/30 shadow-sm" onclick={reset} title="Remove file">
						<svg width="24" height="24" viewBox="0 0 18 18" fill="none" class="transition-transform group-hover:scale-110">
							<path d="M5 5l8 8m0-8l-8 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
						</svg>
					</button>
				</div>

				{#if !job}
					<div class="p-8 bg-[var(--color-bg-card)]/30 backdrop-blur-2xl border border-[var(--color-border-subtle)] rounded-3xl shadow-xl mt-6 relative overflow-hidden">
						<div class="absolute top-0 right-0 w-64 h-64 bg-[var(--color-accent-purple)]/5 blur-[80px] pointer-events-none"></div>
						<h3 class="text-sm font-bold text-[var(--color-text-primary)] uppercase tracking-[0.2em] mb-6 opacity-80 flex items-center gap-3">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
							Select Target Format
						</h3>
					<FormatSelector
						{sourceFormat}
						selectedTarget={targetFormat}
						onSelect={(f) => { targetFormat = f; }}
					/>
					</div>
				{/if}

				{#if job}
					<div class="mt-6 transform transition-all duration-500">
					<ConversionPanel
						{job}
						onDownload={downloadResult}
						onReset={reset}
					/>
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<footer class="relative z-10 text-center mt-auto pt-24 pb-6 w-full">
		<div class="h-px w-full max-w-lg mx-auto bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent mb-8"></div>
		<p class="text-sm text-[var(--color-text-muted)] font-medium">Built with <a href="https://kit.svelte.dev" target="_blank" rel="noreferrer" class="text-[var(--color-accent-orange)] hover:text-orange-400 transition-colors">SvelteKit</a> & <a href="https://tailwindcss.com" target="_blank" rel="noreferrer" class="text-[var(--color-accent-cyan)] hover:text-cyan-400 transition-colors">Tailwind CSS</a></p>
	</footer>
</div>
