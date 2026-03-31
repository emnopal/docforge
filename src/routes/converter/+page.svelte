<script lang="ts">
  import DropZone from "$lib/components/DropZone.svelte";
  import FormatSelector from "$lib/components/FormatSelector.svelte";
  import ConversionPanel from "$lib/components/ConversionPanel.svelte";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft, X } from "lucide-svelte";
  import { FORMAT_MAP, type FileFormat, type ConversionJob } from "$lib/types";
  import { convert } from "$lib/converters/engine";

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
      status: "converting",
      progress: 0,
    };
    job = newJob;

    try {
      const blob = await convert(sourceFile, sourceFormat, targetFormat, (p) => {
        job = { ...newJob, progress: p };
      });

      const baseName = sourceFile.name.replace(/\.[^.]+$/, "");
      const targetInfo = FORMAT_MAP[targetFormat];
      let ext = targetInfo.extension;
      let mime = targetInfo.mime;
      if (
        sourceFormat === "pdf" &&
        ["jpg", "png", "webp"].includes(targetFormat) &&
        blob.type === "application/zip"
      ) {
        ext = ".zip";
        mime = "application/zip";
      }

      job = {
        ...newJob,
        status: "done",
        progress: 100,
        resultBlob: blob,
        resultName: `${baseName}${ext}`,
      };
    } catch (err: any) {
      job = {
        ...newJob,
        status: "error",
        progress: 0,
        error: err.message || "Conversion failed",
      };
    }
  }

  function downloadResult() {
    if (!job?.resultBlob || !job.resultName) return;
    const url = URL.createObjectURL(job.resultBlob);
    const a = document.createElement("a");
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
  <title>DocForge — File Converter</title>
  <meta
    name="description"
    content="Convert files between PDF, DOCX, PPTX, XLSX, CSV, JPG, PNG, and WebP entirely in your browser."
  />
</svelte:head>

<div class="px-6 py-10">
  <div class="mx-auto max-w-3xl space-y-6">
    <div>
      <Button variant="link" href="/" class="text-muted-foreground mb-1 h-auto gap-1.5 p-0">
        <ArrowLeft class="h-4 w-4" />
        All tools
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">Converter</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Convert any document format instantly in your browser.
      </p>
    </div>

    {#if !sourceFile}
      <DropZone {onFileSelect} />
    {:else if sourceFormat}
      <div class="space-y-4">
        <div class="border-border bg-card flex items-center gap-4 rounded-xl border p-4">
          <span class="text-2xl">{FORMAT_MAP[sourceFormat].icon}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">
              {sourceFile.name}
            </p>
            <p class="text-muted-foreground text-xs">
              {FORMAT_MAP[sourceFormat].label} · {(sourceFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Remove" onclick={reset}>
            <X class="h-4 w-4" />
          </Button>
        </div>

        {#if !job}
          <div class="border-border bg-card rounded-xl border p-5">
            <h3
              class="text-muted-foreground mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            >
              Convert to
            </h3>
            <FormatSelector
              {sourceFormat}
              selectedTarget={targetFormat}
              onSelect={(f) => {
                targetFormat = f;
              }}
            />
          </div>
        {/if}

        {#if job}
          <ConversionPanel {job} onDownload={downloadResult} onReset={reset} />
        {/if}
      </div>
    {/if}
  </div>
</div>
