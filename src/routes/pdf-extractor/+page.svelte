<script lang="ts">
  import PdfExtractor from "$lib/components/PdfExtractor.svelte";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
  <title>DocForge — PDF Page Extractor</title>
  <meta
    name="description"
    content="Extract pages from PDF into a new PDF or images. Entirely client-side."
  />
</svelte:head>

<div class="px-6 py-10">
  <div class="mx-auto max-w-5xl space-y-6">
    <div>
      <Button variant="link" href="/" class="text-muted-foreground mb-1 h-auto gap-1.5 p-0">
        <ArrowLeft class="h-4 w-4" />
        All tools
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">PDF Extractor</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Select and extract specific pages from a PDF.
      </p>
    </div>

    <PdfExtractor onReset={() => {}} />
  </div>
</div>
