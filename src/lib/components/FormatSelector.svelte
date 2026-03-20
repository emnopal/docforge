<script lang="ts">
	import { FORMAT_MAP, getTargetFormats, type FileFormat } from '$lib/types';

	let {
		sourceFormat,
		selectedTarget,
		onSelect
	}: {
		sourceFormat: FileFormat;
		selectedTarget: FileFormat | null;
		onSelect: (format: FileFormat) => void;
	} = $props();

	const targets = $derived(getTargetFormats(sourceFormat));

	const grouped = $derived(() => {
		const groups: Record<string, { format: FileFormat; info: (typeof FORMAT_MAP)[FileFormat] }[]> = {
			Document: [],
			Spreadsheet: [],
			Presentation: [],
			Image: []
		};
		for (const f of targets) {
			const info = FORMAT_MAP[f];
			const cat =
				info.category === 'document'
					? 'Document'
					: info.category === 'spreadsheet'
						? 'Spreadsheet'
						: info.category === 'presentation'
							? 'Presentation'
							: 'Image';
			groups[cat].push({ format: f, info });
		}
		return Object.entries(groups).filter(([_, items]) => items.length > 0);
	});
</script>

<div class="mt-6">
	<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-6">
		{#each grouped() as [category, items]}
			<div class="flex flex-col gap-3">
				<span class="text-xs font-bold tracking-[0.15em] uppercase text-[var(--color-text-muted)]/80">{category}</span>
				<div class="flex flex-wrap gap-3">
					{#each items as { format, info }}
						<button
							class="group flex items-center gap-2.5 py-2.5 px-4 rounded-xl transition-all duration-300 transform {selectedTarget === format ? 'scale-105' : 'hover:-translate-y-1'}"
							style={selectedTarget === format ? `background: color-mix(in srgb, ${info.color} 20%, var(--color-bg-elevated)); border: 2px solid ${info.color}; color: ${info.color}; box-shadow: 0 8px 25px color-mix(in srgb, ${info.color} 25%, transparent);` : `background: var(--color-bg-elevated); border: 1px solid var(--color-border-subtle); color: var(--color-text-secondary);`}
							onmouseenter={(e) => {
								if (selectedTarget !== format) {
									e.currentTarget.style.border = `1px solid ${info.color}`;
									e.currentTarget.style.color = info.color;
									e.currentTarget.style.background = `color-mix(in srgb, ${info.color} 10%, var(--color-bg-elevated))`;
								}
							}}
							onmouseleave={(e) => {
								if (selectedTarget !== format) {
									e.currentTarget.style.border = '1px solid var(--color-border-subtle)';
									e.currentTarget.style.color = 'var(--color-text-secondary)';
									e.currentTarget.style.background = 'var(--color-bg-elevated)';
								}
							}}
							onclick={() => onSelect(format)}
						>
							<span class="text-lg drop-shadow-sm transition-transform duration-300 group-hover:scale-110">{info.icon}</span>
							<span class="font-bold tracking-wide">{info.label}</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
