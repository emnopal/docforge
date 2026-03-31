<script lang="ts">
  import { detectFormat, FORMAT_MAP, type FileFormat } from "$lib/types";

  let {
    onFileSelect,
  }: {
    onFileSelect: (file: File, format: FileFormat) => void;
  } = $props();

  let isDragging = $state(false);
  let error = $state("");
  let inputEl: HTMLInputElement;

  const ACCEPT =
    ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.text,.md,.markdown,.html,.htm,.jpg,.jpeg,.png,.webp";

  function handleFiles(files: FileList | null) {
    error = "";
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
  class="relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors md:p-14
{isDragging
    ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
    : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-[var(--color-text-muted)]'}"
  ondrop={onDrop}
  ondragover={onDragOver}
  ondragleave={() => (isDragging = false)}
  onclick={() => inputEl.click()}
  onkeydown={(e) => e.key === "Enter" && inputEl.click()}
  role="button"
  tabindex="0"
>
  <input
    bind:this={inputEl}
    type="file"
    accept={ACCEPT}
    onchange={(e) => handleFiles((e.target as HTMLInputElement).files)}
    hidden
  />

  <div class="flex flex-col items-center text-center">
    <div class="mb-5 rounded-full bg-[var(--color-bg-elevated)] p-4 text-[var(--color-text-muted)]">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 16V4M12 4L8 8M12 4L16 8"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M4 17V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V17"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>

    <h3 class="mb-1 text-xl font-semibold text-[var(--color-text-primary)]">
      {isDragging ? "Drop your file here" : "Click or drop a file here"}
    </h3>

    <p class="mb-6 max-w-sm text-sm text-[var(--color-text-secondary)]">
      Convert documents, spreadsheets, slides, and images in your browser.
    </p>

    <div class="flex flex-wrap justify-center gap-2">
      {#each Object.values(FORMAT_MAP) as fmt}
        <span
          class="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
        >
          {fmt.label}
        </span>
      {/each}
    </div>
  </div>

  {#if error}
    <div
      class="absolute bottom-4 rounded-lg border border-[var(--color-accent-red)]/20 bg-[var(--color-accent-red)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-accent-red)]"
    >
      {error}
    </div>
  {/if}
</div>
