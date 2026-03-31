<script lang="ts">
  import { FORMAT_MAP, getTargetFormats, type FileFormat } from "$lib/types";

  let {
    sourceFormat,
    selectedTarget,
    onSelect,
  }: {
    sourceFormat: FileFormat;
    selectedTarget: FileFormat | null;
    onSelect: (format: FileFormat) => void;
  } = $props();

  const targets = $derived(getTargetFormats(sourceFormat));

  const grouped = $derived(() => {
    const groups: Record<string, { format: FileFormat; info: (typeof FORMAT_MAP)[FileFormat] }[]> =
      {
        Document: [],
        Spreadsheet: [],
        Presentation: [],
        Image: [],
      };
    for (const f of targets) {
      const info = FORMAT_MAP[f];
      const cat =
        info.category === "document"
          ? "Document"
          : info.category === "spreadsheet"
            ? "Spreadsheet"
            : info.category === "presentation"
              ? "Presentation"
              : "Image";
      groups[cat].push({ format: f, info });
    }
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  });
</script>

<div class="mt-4">
  <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5">
    {#each grouped() as [category, items]}
      <div class="flex flex-col gap-2">
        <span class="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase"
          >{category}</span
        >
        <div class="flex flex-wrap gap-2">
          {#each items as { format, info }}
            <button
              class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
{selectedTarget === format
                ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-text-primary)]'}"
              onclick={() => onSelect(format)}
            >
              <span class="text-base">{info.icon}</span>
              <span>{info.label}</span>
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>
