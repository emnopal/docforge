<script lang="ts">
  import {
    createPdfJoinerDocuments,
    joinPdfDocuments,
    type PdfJoinerDocument,
  } from "$lib/converters/pdf-joiner";

  let {
    onReset,
  }: {
    onReset: () => void;
  } = $props();

  let documents = $state<PdfJoinerDocument[]>([]);
  let isLoading = $state(false);
  let isExporting = $state(false);
  let isDraggingFile = $state(false);
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);
  let errorMessage = $state("");
  let inputEl = $state<HTMLInputElement | undefined>(undefined);

  const totalPages = $derived(documents.reduce((sum, doc) => sum + doc.pageCount, 0));

  function toFileArray(fileList: FileList | null): File[] {
    return fileList ? Array.from(fileList) : [];
  }

  function validatePdfFiles(files: File[]): void {
    for (const file of files) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        throw new Error(`"${file.name}" is not a PDF file`);
      }
    }
  }

  async function addDocuments(files: File[]): Promise<void> {
    if (files.length === 0) return;
    isLoading = true;
    errorMessage = "";
    try {
      validatePdfFiles(files);
      const nextDocuments = await createPdfJoinerDocuments(files);
      documents = [...documents, ...nextDocuments];
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Failed to load PDF files";
    } finally {
      isLoading = false;
    }
  }

  async function handleFileSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    await addDocuments(toFileArray(input.files));
    input.value = "";
  }

  function onFileDrop(event: DragEvent): void {
    event.preventDefault();
    isDraggingFile = false;
    void addDocuments(toFileArray(event.dataTransfer?.files ?? null));
  }

  function onFileDragOver(event: DragEvent): void {
    event.preventDefault();
    isDraggingFile = true;
  }

  function onDragStart(index: number): void {
    draggedIndex = index;
  }

  function onDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    dragOverIndex = index;
  }

  function onDragLeave(): void {
    dragOverIndex = null;
  }

  function onDrop(index: number): void {
    if (draggedIndex === null || draggedIndex === index) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }

    const nextDocs = [...documents];
    const [moved] = nextDocs.splice(draggedIndex, 1);
    nextDocs.splice(index, 0, moved);
    documents = nextDocs;
    draggedIndex = null;
    dragOverIndex = null;
  }

  function onDragEnd(): void {
    draggedIndex = null;
    dragOverIndex = null;
  }

  function removeDocument(id: string): void {
    documents = documents.filter((doc) => doc.id !== id);
  }

  function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportJoinedPdf(): Promise<void> {
    if (documents.length === 0) return;
    isExporting = true;
    errorMessage = "";
    try {
      const blob = await joinPdfDocuments(documents.map((doc) => doc.file));
      downloadBlob(blob, "joined-document.pdf");
    } catch (err: unknown) {
      errorMessage = err instanceof Error ? err.message : "Failed to join PDF files";
    } finally {
      isExporting = false;
    }
  }

  function reset(): void {
    documents = [];
    errorMessage = "";
    onReset();
  }
</script>

{#if documents.length === 0 && !isLoading}
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
      multiple
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
        {isDraggingFile ? "Drop PDFs here" : "Click or drop PDF files here"}
      </h3>
      <p class="text-sm text-[var(--color-text-secondary)]">
        Combine multiple PDF files into a single document
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
{:else if isLoading && documents.length === 0}
  <div
    class="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] py-12 text-center"
  >
    <div
      class="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-accent-blue)] border-t-transparent"
    ></div>
    <p class="text-sm text-[var(--color-text-secondary)]">Loading PDF files…</p>
  </div>
{:else}
  <div
    class="space-y-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-card)] p-5"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="text-2xl">📚</span>
        <div>
          <p class="text-sm font-semibold text-[var(--color-text-primary)]">
            {documents.length} document{documents.length === 1 ? "" : "s"} ready
          </p>
          <p class="text-xs text-[var(--color-text-muted)]">
            {totalPages} total pages
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          onclick={() => inputEl?.click()}
          class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Add more
        </button>
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
    </div>

    <input
      bind:this={inputEl}
      type="file"
      accept=".pdf,application/pdf"
      multiple
      onchange={handleFileSelect}
      hidden
    />

    {#if documents.length > 1}
      <p class="text-center text-xs text-[var(--color-text-muted)]">Drag to reorder documents</p>
    {/if}

    <div
      role="list"
      ondrop={onFileDrop}
      ondragover={onFileDragOver}
      ondragleave={() => (isDraggingFile = false)}
      class="grid grid-cols-1 gap-3 rounded-lg bg-[var(--color-bg-secondary)] p-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {#each documents as doc, i (doc.id)}
        <div
          role="listitem"
          class="relative flex flex-col overflow-hidden rounded-lg border-2 bg-[var(--color-bg-card)] transition-colors
{dragOverIndex === i && draggedIndex !== i
            ? 'border-[var(--color-accent-blue)]'
            : 'border-[var(--color-border-subtle)]'}
{draggedIndex === i ? 'opacity-40' : 'opacity-100'}"
          draggable="true"
          ondragstart={() => onDragStart(i)}
          ondragover={(event) => onDragOver(event, i)}
          ondragleave={onDragLeave}
          ondrop={() => onDrop(i)}
          ondragend={onDragEnd}
        >
          <img
            src={doc.thumbnailUrl}
            alt={doc.name}
            class="h-48 w-full bg-[var(--color-bg-secondary)] object-contain p-2"
            draggable="false"
          />
          <div class="border-t border-[var(--color-border-subtle)] p-3">
            <p class="truncate text-sm font-semibold text-[var(--color-text-primary)]">
              {doc.name}
            </p>
            <p class="text-xs text-[var(--color-text-muted)]">
              {doc.pageCount} page{doc.pageCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onclick={() => removeDocument(doc.id)}
            aria-label="Remove document"
            class="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-bg-primary)]/90 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-red)]/10 hover:text-[var(--color-accent-red)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      {/each}
    </div>

    <div class="flex justify-center pt-2">
      <button
        onclick={exportJoinedPdf}
        disabled={isExporting || documents.length === 0}
        class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {#if isExporting}
          <div
            class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
          ></div>
          Joining…
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
          Join PDFs
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
