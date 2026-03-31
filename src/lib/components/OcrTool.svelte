<script lang="ts">
  import { onDestroy } from "svelte";
  import {
    performOcr,
    ocrResultToBlob,
    type OcrResult,
    type OcrOutputFormat,
  } from "$lib/converters/ocr-utils";

  let {
    onReset,
  }: {
    onReset: () => void;
  } = $props();

  const ACCEPT = ".pdf,application/pdf,.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";
  const OUTPUT_FORMATS: { value: OcrOutputFormat; label: string }[] = [
    { value: "txt", label: "TXT" },
    { value: "md", label: "Markdown" },
    { value: "pdf", label: "PDF" },
    { value: "docx", label: "DOCX" },
  ];

  let file = $state<File | null>(null);
  let isDragging = $state(false);
  let isProcessing = $state(false);
  let isExporting = $state(false);
  let progress = $state(0);
  let statusMessage = $state("");
  let errorMessage = $state("");
  let ocrResult = $state<OcrResult | null>(null);
  let outputFormat = $state<OcrOutputFormat>("txt");
  let inputEl = $state<HTMLInputElement | undefined>(undefined);

  const avgConfidence = $derived(
    ocrResult
      ? Math.round(
          ocrResult.pages.reduce((sum, p) => sum + p.confidence, 0) / ocrResult.pages.length,
        )
      : 0,
  );

  onDestroy(() => {
    file = null;
    ocrResult = null;
  });

  function handleFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0];
    if (!f) return;
    void processFile(f);
  }

  function isValidFile(f: File): boolean {
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (validTypes.includes(f.type)) return true;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    return ["pdf", "jpg", "jpeg", "png", "webp"].includes(ext);
  }

  async function processFile(f: File): Promise<void> {
    if (!isValidFile(f)) {
      errorMessage = "Please select a PDF or image file (JPG, PNG, WebP)";
      return;
    }

    file = f;
    isProcessing = true;
    errorMessage = "";
    ocrResult = null;
    progress = 0;
    statusMessage = "Starting OCR...";

    try {
      ocrResult = await performOcr(
        f,
        (p) => {
          progress = p;
        },
        (msg) => {
          statusMessage = msg;
        },
      );
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "OCR processing failed";
      ocrResult = null;
    } finally {
      isProcessing = false;
    }
  }

  function onFileDrop(event: DragEvent): void {
    event.preventDefault();
    isDragging = false;
    const f = event.dataTransfer?.files?.[0];
    if (!f) return;
    void processFile(f);
  }

  function onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    isDragging = true;
  }

  function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportResult(): Promise<void> {
    if (!ocrResult || !file) return;

    isExporting = true;
    errorMessage = "";

    try {
      const baseName = file.name.replace(/\.[^.]+$/, "") || "document";
      const blob = await ocrResultToBlob(ocrResult, outputFormat, baseName);
      const extMap: Record<OcrOutputFormat, string> = {
        txt: ".txt",
        md: ".md",
        pdf: ".pdf",
        docx: ".docx",
      };
      downloadBlob(blob, `${baseName}-ocr${extMap[outputFormat]}`);
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Failed to export";
    } finally {
      isExporting = false;
    }
  }

  function reset(): void {
    file = null;
    ocrResult = null;
    progress = 0;
    statusMessage = "";
    errorMessage = "";
    outputFormat = "txt";
    onReset();
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

{#if !file}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors
{isDragging
      ? 'border-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/5'
      : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] hover:border-[var(--color-text-muted)]'}"
    ondrop={onFileDrop}
    ondragover={onFileDragOver}
    ondragleave={() => (isDragging = false)}
    onclick={() => inputEl?.click()}
    onkeydown={(event) => event.key === "Enter" && inputEl?.click()}
    role="button"
    tabindex="0"
  >
    <input bind:this={inputEl} type="file" accept={ACCEPT} onchange={handleFileSelect} hidden />
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
        {isDragging ? "Drop your file here" : "Click or drop a file here"}
      </h3>
      <p class="mb-5 text-sm text-[var(--color-text-secondary)]">
        Upload a PDF or image to extract text using OCR
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        {#each ["PDF", "JPG", "PNG", "WebP"] as label}
          <span
            class="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
          >
            {label}
          </span>
        {/each}
      </div>
    </div>
    {#if errorMessage}
      <div
        class="mt-4 rounded-lg bg-[var(--color-accent-red)]/10 px-3 py-1.5 text-sm font-medium text-[var(--color-accent-red)]"
      >
        {errorMessage}
      </div>
    {/if}
  </div>
{:else if isProcessing}
  <div
    class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-6 py-12 text-center"
  >
    <div
      class="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-accent-blue)] border-t-transparent"
    ></div>
    <p class="mb-4 text-sm text-[var(--color-text-secondary)]">
      {statusMessage}
    </p>
    <div
      class="mx-auto h-2 w-full max-w-sm overflow-hidden rounded-full bg-[var(--color-bg-elevated)]"
    >
      <div
        class="h-full rounded-full bg-[var(--color-accent-blue)] transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>
    <p class="mt-2 text-xs text-[var(--color-text-muted)]">
      {Math.round(progress)}%
    </p>
  </div>
{:else if ocrResult}
  <div
    class="space-y-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🔍</span>
        <div>
          <p class="text-sm font-semibold text-[var(--color-text-primary)]">
            {file.name}
          </p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {formatFileSize(file.size)} · {ocrResult.pages.length} page{ocrResult.pages.length === 1
              ? ""
              : "s"} · {avgConfidence}% confidence
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
      class="overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]"
    >
      <div
        class="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-2.5"
      >
        <span class="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase"
          >Extracted Text</span
        >
        <button
          onclick={() => navigator.clipboard.writeText(ocrResult?.fullText ?? "")}
          class="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <rect
              x="9"
              y="9"
              width="13"
              height="13"
              rx="2"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
              stroke="currentColor"
              stroke-width="2"
            />
          </svg>
          Copy
        </button>
      </div>
      <pre
        class="max-h-72 overflow-y-auto p-4 font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-[var(--color-text-secondary)]">{ocrResult.fullText ||
          "(No text detected)"}</pre>
    </div>

    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3"
    >
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] uppercase"
          >Save as</span
        >
        <div
          class="inline-flex rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-0.5"
        >
          {#each OUTPUT_FORMATS as fmt (fmt.value)}
            <button
              aria-pressed={outputFormat === fmt.value}
              onclick={() => (outputFormat = fmt.value)}
              class="rounded-md px-3 py-1 text-xs font-semibold uppercase transition-colors
{outputFormat === fmt.value
                ? 'bg-[var(--color-accent-blue)] text-white'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}"
            >
              {fmt.label}
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="flex justify-center pt-2">
      <button
        onclick={exportResult}
        disabled={isExporting || !ocrResult.fullText}
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
          Download as {OUTPUT_FORMATS.find((f) => f.value === outputFormat)?.label}
        {/if}
      </button>
    </div>

    {#if errorMessage}
      <div class="py-3 text-center">
        <p class="text-sm font-medium text-[var(--color-accent-red)]">
          {errorMessage}
        </p>
      </div>
    {/if}
  </div>
{/if}
