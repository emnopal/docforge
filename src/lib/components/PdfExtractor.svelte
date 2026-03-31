<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    extractPdfPagesToImages,
    extractPdfPagesToPdf,
    generatePdfPagePreviews,
    type ImageExportFormat,
    type PdfPagePreview,
  } from "$lib/converters/pdf-extractor";

  let {
    onReset,
  }: {
    onReset: () => void;
  } = $props();

  type ExtractPreview = PdfPagePreview & { selected: boolean };
  type OutputType = "pdf" | ImageExportFormat;

  const imageOutputTypes: ImageExportFormat[] = ["png", "jpg", "webp"];

  let pdfFile = $state<File | null>(null);
  let previews = $state<ExtractPreview[]>([]);
  let isLoading = $state(false);
  let isExporting = $state(false);
  let isDraggingFile = $state(false);
  let errorMessage = $state("");
  let inputEl = $state<HTMLInputElement | undefined>(undefined);
  let outputType = $state<OutputType>("pdf");

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
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      errorMessage = "Please select a PDF file";
      return;
    }

    isLoading = true;
    errorMessage = "";
    clearPreviewUrls();
    previews = [];
    pdfFile = file;

    try {
      const pagePreviews = await generatePdfPagePreviews(file);
      previews = pagePreviews.map((page) => ({ ...page, selected: false }));
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Failed to load PDF pages";
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
      previewIndex === index ? { ...preview, selected: !preview.selected } : preview,
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
    return fileName.replace(/\.pdf$/i, "") || "document";
  }

  function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportSelection(): Promise<void> {
    if (!pdfFile) return;
    const selectedPages = getSelectedPageIndexes();
    if (selectedPages.length === 0) {
      errorMessage = "Select at least one page to export";
      return;
    }

    isExporting = true;
    errorMessage = "";

    try {
      const name = basePdfName(pdfFile.name);
      if (outputType === "pdf") {
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
      errorMessage = err instanceof Error ? err.message : "Failed to export pages";
    } finally {
      isExporting = false;
    }
  }

  function reset(): void {
    clearPreviewUrls();
    pdfFile = null;
    previews = [];
    outputType = "pdf";
    errorMessage = "";
    onReset();
  }
</script>

{#if !pdfFile}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors
{isDraggingFile
      ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
      : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-[var(--color-text-muted)]'}"
    ondrop={onFileDrop}
    ondragover={onFileDragOver}
    ondragleave={() => (isDraggingFile = false)}
    onclick={() => inputEl?.click()}
    onkeydown={(event) => event.key === "Enter" && inputEl?.click()}
    role="button"
    tabindex="0"
  >
    <input
      bind:this={inputEl}
      type="file"
      accept=".pdf,application/pdf"
      onchange={handleFileSelect}
      hidden
    />
    <div class="flex flex-col items-center text-center">
      <div
        class="mb-5 rounded-full bg-[var(--color-bg-elevated)] p-4 text-[var(--color-text-muted)]"
      >
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
        {isDraggingFile ? "Drop your PDF here" : "Click or drop a PDF here"}
      </h3>
      <p class="text-sm text-[var(--color-text-secondary)]">
        Choose pages to extract as PDF or images
      </p>
    </div>
    {#if errorMessage}
      <div
        class="mt-4 rounded-lg bg-[var(--color-accent-red)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-accent-red)]"
      >
        {errorMessage}
      </div>
    {/if}
  </div>
{:else if isLoading}
  <div
    class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] py-12 text-center"
  >
    <div
      class="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-accent-blue)] border-t-transparent"
    ></div>
    <p class="text-sm text-[var(--color-text-secondary)]">Loading PDF pages…</p>
  </div>
{:else}
  <div
    class="space-y-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📄</span>
        <div>
          <p class="text-sm font-semibold text-[var(--color-text-primary)]">
            {pdfFile.name}
          </p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {(pdfFile.size / 1024).toFixed(1)} KB · {previews.length} pages · {selectedCount}
            selected
          </p>
        </div>
      </div>
      <button
        onclick={reset}
        aria-label="Remove"
        class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-red)]/10 hover:text-[var(--color-accent-red)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase"
          >Export as</span
        >
        <div
          class="inline-flex rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-0.5"
        >
          {#each ["pdf", ...imageOutputTypes] as option (option)}
            <button
              aria-pressed={outputType === option}
              onclick={() => (outputType = option as OutputType)}
              class="rounded-md px-3 py-1 text-xs font-semibold uppercase transition-colors
{outputType === option
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
            >
              {option}
            </button>
          {/each}
        </div>
      </div>
      <div class="flex items-center gap-2">
        {#if selectedCount < previews.length}
          <button
            onclick={selectAllPages}
            class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Select all
          </button>
        {/if}
        {#if selectedCount > 0}
          <button
            onclick={clearPageSelection}
            class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            Clear
          </button>
        {/if}
      </div>
    </div>

    {#if previews.length > 0}
      <p class="text-center text-xs text-[var(--color-text-muted)]">
        Click pages to select what to extract
      </p>
      <div
        class="grid grid-cols-2 gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3 md:grid-cols-3 lg:grid-cols-4"
      >
        {#each previews as preview, i (preview.index)}
          <button
            onclick={() => togglePage(i)}
            class="relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2 text-left transition-colors
{preview.selected
              ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
              : 'border-transparent hover:border-[var(--color-border-subtle)]'}"
          >
            <img
              src={preview.imageUrl}
              alt="Page {preview.index + 1}"
              class="rounded-lg border border-[var(--color-border-subtle)]"
            />
            <span class="text-xs text-[var(--color-text-muted)]">Page {preview.index + 1}</span>
            <div
              class="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border-2
{preview.selected
                ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]'
                : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]'}"
            >
              {#if preview.selected}
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4.5 10.5L8 14l7.5-7.5"
                    stroke="white"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              {/if}
            </div>
          </button>
        {/each}
      </div>

      <div class="flex justify-center pt-2">
        <button
          onclick={exportSelection}
          disabled={isExporting || selectedCount === 0}
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isExporting}
            <div
              class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
            ></div>
            Exporting…
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v10m0 0l-4-4m4 4l4-4M5 18h14"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            Export {selectedCount} page{selectedCount === 1 ? "" : "s"} as {outputType.toUpperCase()}
          {/if}
        </button>
      </div>
    {/if}

    {#if errorMessage}
      <div class="py-3 text-center">
        <p class="text-sm font-medium text-[var(--color-accent-red)]">
          {errorMessage}
        </p>
      </div>
    {/if}
  </div>
{/if}
