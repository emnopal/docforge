<script lang="ts">
  import { FORMAT_MAP, type FileFormat, type ConversionJob } from "$lib/types";

  let {
    job,
    onDownload,
    onReset,
  }: {
    job: ConversionJob;
    onDownload: () => void;
    onReset: () => void;
  } = $props();

  const sourceInfo = $derived(FORMAT_MAP[job.sourceFormat]);
  const targetInfo = $derived(FORMAT_MAP[job.targetFormat]);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div
  class="mt-6 rounded-xl border bg-[var(--color-bg-card)] p-6 transition-colors"
  style={job.status === "done"
    ? "border-color: var(--color-accent-green);"
    : job.status === "error"
      ? "border-color: var(--color-accent-red);"
      : "border-color: var(--color-border-subtle);"}
>
  <div class="mb-6 text-center">
    <div class="mb-3 flex items-center justify-center gap-3">
      <span
        class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-sm font-medium"
        style="color: {sourceInfo.color};"
      >
        <span>{sourceInfo.icon}</span>
        <span class="text-xs tracking-wide uppercase">{sourceInfo.label}</span>
      </span>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        class="text-[var(--color-text-muted)]"
      >
        <path
          d="M5 12h14m0 0l-6-6m6 6l-6 6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span
        class="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-sm font-medium"
        style="color: {targetInfo.color};"
      >
        <span>{targetInfo.icon}</span>
        <span class="text-xs tracking-wide uppercase">{targetInfo.label}</span>
      </span>
    </div>
    <p class="text-sm font-medium break-all text-[var(--color-text-primary)]">
      {job.sourceFile.name}
    </p>
    <p class="mt-0.5 text-xs text-[var(--color-text-muted)]">
      {formatSize(job.sourceFile.size)}
    </p>
  </div>

  {#if job.status === "converting"}
    <div class="text-center">
      <div class="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
        <div
          class="h-full rounded-full bg-[var(--color-accent-blue)] transition-[width] duration-300"
          style="width: {job.progress}%"
        ></div>
      </div>
      <p class="text-sm text-[var(--color-text-secondary)]">
        Converting… {Math.round(job.progress)}%
      </p>
    </div>
  {:else if job.status === "done"}
    <div class="text-center">
      <div
        class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-green)]/10 text-[var(--color-accent-green)]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="mb-1 text-base font-semibold text-[var(--color-accent-green)]">
        Conversion complete
      </p>
      {#if job.resultBlob}
        <p class="mb-5 text-xs text-[var(--color-text-muted)]">
          {formatSize(job.resultBlob.size)}
        </p>
      {/if}
      <div class="flex justify-center gap-3">
        <button
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent-green)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          onclick={onDownload}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 5v10m0 0l-4-4m4 4l4-4M5 18h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Download
        </button>
        <button
          class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card-hover)]"
          onclick={onReset}
        >
          Convert another
        </button>
      </div>
    </div>
  {:else if job.status === "error"}
    <div class="text-center">
      <div
        class="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-red)]/10 text-[var(--color-accent-red)]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <p class="mb-4 text-sm font-medium text-[var(--color-accent-red)]">
        {job.error || "Conversion failed"}
      </p>
      <button
        class="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-6 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card-hover)]"
        onclick={onReset}
      >
        Try again
      </button>
    </div>
  {/if}
</div>
