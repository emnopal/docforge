<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Badge } from "$lib/components/ui/badge";
  import { ArrowRightLeft, FileText, Scissors, BookCopy, ScanSearch } from "lucide-svelte";

  type Module = {
    name: string;
    description: string;
    icon: typeof ArrowRightLeft;
    route: string;
    badge?: string;
  };

  const modules: Module[] = [
    {
      name: "Converter",
      description: "Convert between PDF, DOCX, PPTX, XLSX, CSV, Images, TXT, and Markdown.",
      icon: ArrowRightLeft,
      route: "/converter",
    },
    {
      name: "PDF Rearranger",
      description: "Drag and drop to reorder PDF pages. Full resolution, no quality loss.",
      icon: FileText,
      route: "/pdf-rearranger",
    },
    {
      name: "PDF Extractor",
      description: "Extract selected pages from a PDF into a new PDF or image files.",
      icon: Scissors,
      route: "/pdf-extractor",
    },
    {
      name: "PDF Joiner",
      description: "Combine multiple PDF files into one with drag-and-drop ordering.",
      icon: BookCopy,
      route: "/pdf-joiner",
    },
    {
      name: "OCR",
      description: "Extract text from PDFs and images. Save as TXT, Markdown, PDF, or DOCX.",
      icon: ScanSearch,
      route: "/ocr",
      badge: "AI",
    },
  ];
</script>

<svelte:head>
  <title>DocForge — Your All-in-One Document Tools</title>
  <meta
    name="description"
    content="Free client-side file tools. Convert, compress, and more - all in your browser. No uploads, no servers."
  />
</svelte:head>

<div class="px-6 py-14">
  <div class="mb-10">
    <h1 class="text-4xl font-bold tracking-tight">All tools</h1>
    <p class="text-muted-foreground mt-2 text-lg">
      Fast, secure document tools that run entirely in your browser.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each modules as module (module.name)}
      <a href={module.route} class="group">
        <Card.Root class="hover:bg-accent/50 h-full transition-colors">
          <Card.Header>
            <div class="flex items-center gap-3">
              <div
                class="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              >
                <module.icon class="text-primary h-5 w-5" />
              </div>
              <div class="flex items-center gap-2">
                <Card.Title class="text-base">{module.name}</Card.Title>
                {#if module.badge}
                  <Badge variant="secondary" class="text-[10px]">{module.badge}</Badge>
                {/if}
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            <p class="text-muted-foreground text-sm leading-relaxed">
              {module.description}
            </p>
          </Card.Content>
        </Card.Root>
      </a>
    {/each}
  </div>
</div>
