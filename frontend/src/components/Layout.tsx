import { JSX } from 'solid-js'
import { A } from '@solidjs/router'

interface LayoutProps {
  children?: JSX.Element
}

export default function Layout(props: LayoutProps) {
  return (
    <div class="min-h-screen flex flex-col">
      <header class="bg-card border-b shadow-sm">
        <div class="container mx-auto px-4 py-3 flex items-center justify-between">
          <A href="/" class="text-2xl font-bold text-primary no-underline">
            ✊ oPet
          </A>
          <nav class="flex gap-4 text-sm">
            <A href="/" class="hover:text-primary transition-colors" activeClass="text-primary font-medium">Petitions</A>
            <A href="/privacy" class="hover:text-primary transition-colors">Privacy</A>
            <A href="/imprint" class="hover:text-primary transition-colors">Imprint</A>
          </nav>
        </div>
      </header>

      <main class="container mx-auto px-4 pt-8 pb-12 flex-1">
        {props.children}
      </main>

      <footer class="bg-card border-t py-5 text-center text-sm text-muted-foreground">
        <div class="container mx-auto px-4">
          &copy; {new Date().getFullYear()} oPet &mdash; Open Petition Platform &mdash;{' '}
          <A href="/privacy" class="hover:underline">Privacy</A>
          {' '}&bull;{' '}
          <A href="/imprint" class="hover:underline">Imprint</A>
        </div>
      </footer>
    </div>
  )
}
