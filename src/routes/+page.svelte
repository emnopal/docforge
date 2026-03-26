<script lang="ts">
  type Module = {
    name: string;
    description: string;
    icon: string | any; // Can be a string emoji or a Svelte component
    route: string;
    color: string;
  };

 	const modules: Module[] = [
 		{
 			name: 'Converter',
 			description: 'Convert files between PDF, DOCX, PPTX, XLSX, CSV, Images (JPG, PNG, WebP), TXT, Markdown - all in your browser.',
 			icon: '🔄',
 			route: '/converter',
 			color: 'var(--color-accent-blue)'
 		},
 		{
 			name: 'PDF Rearranger',
 			description: 'Drag and drop to reorder PDF pages instantly. Full resolution output, no quality loss.',
 			icon: '📄',
 			route: '/pdf-rearranger',
 			color: 'var(--color-accent-purple)'
 		},
 		{
 			name: 'PDF Extractor',
 			description: 'Extract selected pages from PDF into a new PDF or image files in one click.',
 			icon: '✂️',
 			route: '/pdf-extractor',
 			color: 'var(--color-accent-cyan)'
 		},
 		{
 			name: 'PDF Joiner',
 			description: 'Combine one or multiple PDF files into one PDF with drag-and-drop document ordering.',
 			icon: '📚',
 			route: '/pdf-joiner',
 			color: 'var(--color-accent-green)'
 		}
 	];
</script>

<svelte:head>
	<title>DocForge — Your All-in-One Document Tools</title>
	<meta name="description" content="Free client-side file tools. Convert, compress, and more - all in your browser. No uploads, no servers." />
</svelte:head>

<div class="relative min-h-screen flex flex-col items-center justify-center py-16 px-6 overflow-hidden bg-[var(--color-bg-primary)] font-body text-white">
	<div class="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-bg-elevated)_0%,_transparent_60%)] pointer-events-none z-0"></div>
	<div class="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat pointer-events-none z-0 opacity-10"></div>
	<div class="fixed rounded-full blur-[140px] pointer-events-none z-0 w-[600px] h-[600px] bg-[var(--color-accent-blue)]/15 top-[-150px] right-[-100px] animate-pulse"></div>
	<div class="fixed rounded-full blur-[140px] pointer-events-none z-0 w-[500px] h-[500px] bg-[var(--color-accent-purple)]/15 bottom-[-100px] left-[-150px] animate-pulse delay-700"></div>

	<header class="relative z-10 text-center mb-16 space-y-5">
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
		<p class="text-xl md:text-2xl text-[var(--color-text-secondary)] font-medium max-w-lg mx-auto leading-relaxed">
			Your all-in-one document tools.<br/>
			<span class="text-lg">Fast. Secure. 100% client-side.</span>
		</p>
	</header>

	<main class="relative z-10 w-full max-w-4xl">
		<div class="flex justify-center mb-12">
			<div class="inline-flex items-center gap-2.5 py-2.5 px-6 rounded-full bg-[var(--color-bg-card)]/40 border border-[var(--color-accent-green)]/30 text-[var(--color-accent-green)] shadow-[0_4px_20px_-4px_rgba(46,204,113,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-4px_rgba(46,204,113,0.3)] hover:bg-[var(--color-bg-card)]/60">
				<svg width="18" height="18" viewBox="0 0 14 14" fill="none" class="animate-pulse">
					<path d="M7 1L2 3.5V6.5C2 9.5 4 12 7 13C10 12 12 9.5 12 6.5V3.5L7 1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
					<path d="M5 7l1.5 1.5L9 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span class="text-sm font-bold tracking-wider uppercase">Your files never leave your device</span>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each modules as module (module.name)}
				<a href={module.route} class="group relative flex flex-col p-8 bg-[var(--color-bg-card)]/40 backdrop-blur-3xl border border-[var(--color-border-subtle)] rounded-3xl shadow-xl hover:border-[var(--color-border-accent)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-8px_rgba(51,102,255,0.25)] overflow-hidden">
					<div class="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[{module.color}]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					<div class="absolute top-0 right-0 w-32 h-32 bg-[{module.color}]/10 blur-[60px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
					<div class="relative z-10 flex flex-col h-full">
						<div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner" style="background: color-mix(in srgb, {module.color} 20%, var(--color-bg-elevated)); border: 2px solid color-mix(in srgb, {module.color} 30%, transparent);">
            {#if typeof module.icon === 'string'}
              <span class="text-3xl drop-shadow-md">{module.icon}</span>
            {:else}
              <!-- TODO: Handle Svelte component icons or svg -->
							<span class="text-4xl drop-shadow-md">{module.icon}</span>
            {/if}
						</div>
						<h2 class="text-2xl font-bold text-[var(--color-text-primary)] mb-3 group-hover:text-[{module.color}] transition-colors">{module.name}</h2>
						<p class="text-[var(--color-text-secondary)] text-sm leading-relaxed flex-1">{module.description}</p>
						<div class="mt-6 flex items-center gap-2 text-[var(--color-text-muted)] text-sm font-bold tracking-wider uppercase group-hover:text-[{module.color}] transition-colors">
							<span>Open Module</span>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="transform group-hover:translate-x-1 transition-transform">
								<path d="M5 12h14m0 0l-6 6m6-6l-6-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</main>

	<footer class="relative z-10 text-center mt-auto pt-24 pb-6 w-full">
		<div class="h-px w-full max-w-lg mx-auto bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent mb-8"></div>
		<p class="text-sm text-[var(--color-text-muted)] font-medium">Built with <a href="https://kit.svelte.dev" target="_blank" rel="noreferrer" class="text-[var(--color-accent-orange)] hover:text-orange-400 transition-colors">SvelteKit</a> & <a href="https://tailwindcss.com" target="_blank" rel="noreferrer" class="text-[var(--color-accent-cyan)] hover:text-cyan-400 transition-colors">Tailwind CSS</a></p>
	</footer>
</div>
