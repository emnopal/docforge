<script lang="ts">
  import "../app.css";
  import { Button } from "$lib/components/ui/button";
  import { Separator } from "$lib/components/ui/separator";
  import { FileText } from "lucide-svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  let { children } = $props();
</script>

<div class="bg-background text-foreground flex min-h-screen flex-col">
  <header
    class="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur-sm"
  >
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
      <a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-80">
        <FileText class="text-primary h-5 w-5" />
        <span class="text-lg font-bold tracking-tight">DocForge</span>
      </a>
      <ThemeToggle />
    </div>
  </header>

  <main class="mx-auto w-full max-w-6xl flex-1">
    {@render children()}
  </main>

  <Separator />
  <footer>
    <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <p class="text-muted-foreground text-xs">
        100% client-side · Your files never leave your device
      </p>
      <p class="text-muted-foreground text-xs">
        Built with <Button
          variant="link"
          href="https://kit.svelte.dev"
          target="_blank"
          rel="noreferrer"
          class="h-auto p-0 text-xs">SvelteKit</Button
        >
      </p>
    </div>
  </footer>
</div>
