<script lang="ts">
  import OcrTool from "$lib/components/OcrTool.svelte";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
  <title>DocForge — OCR Text Recognition</title>
  <meta
    name="description"
    content="Extract text from PDFs and images using OCR. Entirely client-side."
  />
</svelte:head>

<div class="px-6 py-10">
  <div class="mx-auto max-w-5xl space-y-6">
    <div>
      <Button variant="link" href="/" class="text-muted-foreground mb-1 h-auto gap-1.5 p-0">
        <ArrowLeft class="h-4 w-4" />
        All tools
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">OCR Text Recognition</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Extract text from PDFs and images using optical character recognition.
      </p>
    </div>

    <OcrTool onReset={() => {}} />
  </div>
</div>
