<script lang="ts">
  import PdfJoiner from "$lib/components/PdfJoiner.svelte";
  import { Button } from "$lib/components/ui/button";
  import { ArrowLeft } from "lucide-svelte";
</script>

<svelte:head>
  <title>DocForge — PDF Joiner</title>
  <meta name="description" content="Join multiple PDFs into one document. Entirely client-side." />
</svelte:head>

<div class="px-6 py-10">
  <div class="mx-auto max-w-5xl space-y-6">
    <div>
      <Button variant="link" href="/" class="text-muted-foreground mb-1 h-auto gap-1.5 p-0">
        <ArrowLeft class="h-4 w-4" />
        All tools
      </Button>
      <h1 class="text-2xl font-bold tracking-tight">PDF Joiner</h1>
      <p class="text-muted-foreground mt-1 text-sm">
        Combine multiple PDF files into a single document.
      </p>
    </div>

    <PdfJoiner onReset={() => {}} />
  </div>
</div>
