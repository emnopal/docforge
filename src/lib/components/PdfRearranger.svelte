<script lang="ts">
  import { onMount } from "svelte";
  import * as pdfjsLib from "pdfjs-dist";
  import { PDFDocument } from "pdf-lib";
  import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

  let {
    onReset,
  }: {
    onReset: () => void;
  } = $props();

  let pdfFile = $state<File | null>(null);
  let pdfDoc = $state<any>(null);
  let previews = $state<{ index: number; imageUrl: string }[]>([]);
  let isLoading = $state(false);
  let errorMessage = $state("");
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let isExporting = $state(false);
  let isDraggingFile = $state(false);
  let inputEl = $state<HTMLInputElement | undefined>(undefined);

  onMount(async () => {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    } catch (err) {
      console.error("Failed to initialize pdf.js:", err);
    }
  });

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  async function processFile(file: File) {
    if (file.type !== "application/pdf") {
      errorMessage = "Please select a PDF file";
      return;
    }

    isLoading = true;
    errorMessage = "";
    previews = [];
    pdfDoc = null;
    pdfFile = file;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const typedarray = new Uint8Array(arrayBuffer);
      const loadingTask = pdfjsLib.getDocument({ data: typedarray });
      pdfDoc = await loadingTask.promise;

      const scale = 1.5;
      const previewList: { index: number; imageUrl: string }[] = [];

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) continue;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        previewList.push({
          index: pageNum - 1,
          imageUrl: canvas.toDataURL("image/png"),
        });
      }

      previews = previewList;
    } catch (err: any) {
      errorMessage = err.message || "Failed to load PDF";
      previews = [];
    } finally {
      isLoading = false;
    }
  }

  function onFileDrop(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  }

  function onFileDragOver(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = true;
  }

  function onDragStart(index: number) {
    draggedIndex = index;
  }

  function onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    dragOverIndex = index;
  }

  function onDragLeave() {
    dragOverIndex = null;
  }

  function onDrop(index: number) {
    if (draggedIndex === null || draggedIndex === index) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }
    const nextPreviews = [...previews];
    const [moved] = nextPreviews.splice(draggedIndex, 1);
    nextPreviews.splice(index, 0, moved);
    previews = nextPreviews;
    draggedIndex = null;
    dragOverIndex = null;
  }

  function onDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  async function exportRearrangedPdf() {
    if (!pdfFile) return;

    isExporting = true;
    errorMessage = "";

    try {
      const newOrder = previews.map((p) => p.index);
      const buffer = await pdfFile.arrayBuffer();

      const newPdf = await PDFDocument.create();
      const srcPdf = await PDFDocument.load(buffer);
      const copiedPages = await newPdf.copyPages(srcPdf, newOrder);

      copiedPages.forEach((page) => {
        newPdf.addPage(page);
      });

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `rearranged-${pdfFile?.name || "document.pdf"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      errorMessage = err.message || "Failed to export PDF";
    } finally {
      isExporting = false;
    }
  }

  function reset() {
    pdfFile = null;
    pdfDoc = null;
    previews = [];
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
    onkeydown={(e) => e.key === "Enter" && inputEl?.click()}
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
        Drag and drop pages to reorder them after loading
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
            {(pdfFile.size / 1024).toFixed(1)} KB · {previews.length} pages
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

    {#if previews.length > 0}
      <p class="text-center text-xs text-[var(--color-text-muted)]">
        Drag and drop pages to reorder
      </p>
      <div
        role="list"
        class="grid grid-cols-2 gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3 md:grid-cols-3 lg:grid-cols-4"
      >
        {#each previews as preview, i (preview.index)}
          <div
            role="listitem"
            class="flex cursor-move flex-col items-center gap-1.5 transition-opacity {draggedIndex ===
            i
              ? 'opacity-30'
              : 'opacity-100'}"
            draggable="true"
            ondragstart={() => onDragStart(i)}
            ondragover={(e) => onDragOver(e, i)}
            ondragleave={onDragLeave}
            ondrop={() => onDrop(i)}
            ondragend={onDragEnd}
          >
            <img
              src={preview.imageUrl}
              alt="Page {preview.index + 1}"
              draggable="false"
              class="rounded-lg border-2 transition-colors {dragOverIndex === i &&
              draggedIndex !== i
                ? 'border-[var(--color-accent-blue)]'
                : 'border-[var(--color-border-subtle)]'}"
            />
            <span class="text-xs text-[var(--color-text-muted)]">Page {preview.index + 1}</span>
          </div>
        {/each}
      </div>

      <div class="flex justify-center pt-2">
        <button
          onclick={exportRearrangedPdf}
          disabled={isExporting}
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
            Export Rearranged PDF
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
