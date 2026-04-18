import { JSX } from 'solid-js'
import { A } from '@solidjs/router'

interface LayoutProps {
  children?: JSX.Element
}

export default function Layout(props: LayoutProps) {
  return (
    <div style="min-height: 100vh; display: flex; flex-direction: column;">
      <header
        style="background: var(--color-surface); border-bottom: 1px solid var(--color-border);
               padding: 0.85rem 0; box-shadow: var(--shadow);"
      >
        <div class="container" style="display: flex; align-items: center; justify-content: space-between;">
          <A href="/" style="font-size: 1.4rem; font-weight: 700; color: var(--color-primary); text-decoration: none;">
            ✊ oPet
          </A>
          <nav style="display: flex; gap: 1.5rem; font-size: 0.95rem;">
            <A href="/" activeClass="active-link">Petitions</A>
            <A href="/privacy">Privacy</A>
            <A href="/imprint">Imprint</A>
          </nav>
        </div>
      </header>

      <main class="container" style="padding-top: 2rem; padding-bottom: 3rem; flex: 1;">
        {props.children}
      </main>

      <footer
        style="background: var(--color-surface); border-top: 1px solid var(--color-border);
               padding: 1.2rem 0; text-align: center; font-size: 0.85rem; color: var(--color-text-muted);"
      >
        <div class="container">
          &copy; {new Date().getFullYear()} oPet &mdash; Open Petition Platform &mdash;{' '}
          <A href="/privacy">Privacy</A> &bull; <A href="/imprint">Imprint</A>
        </div>
      </footer>
    </div>
  )
}
