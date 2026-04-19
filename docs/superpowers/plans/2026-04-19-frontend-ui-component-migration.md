# Frontend UI Component Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all raw HTML elements (`<input>`, `<select>`, `<button>`, `.card` divs, `.badge` spans, `confirm()` calls, etc.) in `frontend/src/pages/` with the corresponding components from `frontend/src/components/ui/`, and extract repeated patterns into shared reusable components.

**Architecture:** First create 4 shared components in `frontend/src/components/` (StatusBadge, ConfirmDialog, PaginationControls, StatCard), then rewrite each page and layout in sequence. No logic, routing, or API call changes — only element substitution and layout using the UI library.

**Tech Stack:** SolidJS, Kobalte headless UI components, class-variance-authority, Tailwind CSS

---

## File Map

**New files (shared components):**
- `frontend/src/components/StatusBadge.tsx` — petition + signature status badge
- `frontend/src/components/ConfirmDialog.tsx` — reusable alert-dialog for destructive confirmations
- `frontend/src/components/PaginationControls.tsx` — prev/next page controls
- `frontend/src/components/StatCard.tsx` — admin dashboard metric card

**Modified files:**
- `frontend/src/components/Layout.tsx`
- `frontend/src/components/AdminLayout.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/pages/PetitionPage.tsx`
- `frontend/src/pages/SuccessPage.tsx`
- `frontend/src/pages/VerifyPage.tsx`
- `frontend/src/pages/WithdrawPage.tsx`
- `frontend/src/pages/ImprintPage.tsx`
- `frontend/src/pages/PrivacyPage.tsx`
- `frontend/src/pages/admin/LoginPage.tsx`
- `frontend/src/pages/admin/DashboardPage.tsx`
- `frontend/src/pages/admin/PetitionsPage.tsx`
- `frontend/src/pages/admin/PetitionEditorPage.tsx`
- `frontend/src/pages/admin/SignaturesPage.tsx`
- `frontend/src/pages/admin/ExportPage.tsx`
- `frontend/src/pages/admin/BackupPage.tsx`

---

## Key Component Patterns (Reference)

**Select with label-value options (used throughout):**
```tsx
type Opt = { label: string; value: string }
const OPTIONS: Opt[] = [{ value: '', label: 'All' }, { value: 'active', label: 'Active' }]

<Select
  options={OPTIONS}
  optionValue="value"
  optionTextValue="label"
  value={OPTIONS.find(o => o.value === mySignal()) ?? null}
  onChange={(opt) => setMySignal(opt?.value ?? '')}
  itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
>
  <SelectTrigger class="w-[180px]">
    <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'All'}</SelectValue>
  </SelectTrigger>
  <SelectContent />
</Select>
```

**TextField pattern:**
```tsx
<TextField>
  <TextFieldLabel>Field label</TextFieldLabel>
  <TextFieldInput type="text" value={val()} onInput={(e) => setVal(e.currentTarget.value)} />
</TextField>
```

**Checkbox with label:**
```tsx
<label class="flex items-center gap-2 cursor-pointer text-sm">
  <Checkbox checked={checked()} onChange={setChecked} />
  Label text
</label>
```

**Alert for errors/success:**
```tsx
<Show when={error()}>
  <Alert variant="destructive">
    <AlertDescription>{error()}</AlertDescription>
  </Alert>
</Show>
```

---

## Task 1: Create StatusBadge component

**Files:**
- Create: `frontend/src/components/StatusBadge.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Badge } from '@/components/ui/badge'

type PetitionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
type SigStatus = 'pending' | 'verified' | 'withdrawn'

const petitionVariant: Record<PetitionStatus, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  draft: 'secondary',
  active: 'success',
  paused: 'warning',
  completed: 'default',
  archived: 'outline',
}

const sigVariant: Record<SigStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  verified: 'success',
  withdrawn: 'error',
}

interface StatusBadgeProps {
  status: PetitionStatus | SigStatus
  type?: 'petition' | 'signature'
}

export function StatusBadge(props: StatusBadgeProps) {
  const variant = () =>
    props.type === 'signature'
      ? sigVariant[props.status as SigStatus]
      : petitionVariant[props.status as PetitionStatus]

  return <Badge variant={variant()}>{props.status}</Badge>
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/philhennel/Code/oPet/frontend && bun run typecheck 2>&1 | head -20
```

Expected: no errors about StatusBadge.tsx

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StatusBadge.tsx
git commit -m "feat: add StatusBadge shared component"
```

---

## Task 2: Create ConfirmDialog component

**Files:**
- Create: `frontend/src/components/ConfirmDialog.tsx`

- [ ] **Step 1: Create the file**

```tsx
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{props.title}</AlertDialogTitle>
        <AlertDialogDescription>{props.description}</AlertDialogDescription>
        <div class="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={props.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              props.onOpenChange(false)
              props.onConfirm()
            }}
          >
            {props.confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/philhennel/Code/oPet/frontend && bun run typecheck 2>&1 | head -20
```

Expected: no errors about ConfirmDialog.tsx

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ConfirmDialog.tsx
git commit -m "feat: add ConfirmDialog shared component"
```

---

## Task 3: Create PaginationControls component

**Files:**
- Create: `frontend/src/components/PaginationControls.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Show } from 'solid-js'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls(props: PaginationControlsProps) {
  return (
    <Show when={props.totalPages > 1}>
      <div class="flex items-center justify-center gap-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={props.page <= 1}
          onClick={() => props.onPageChange(props.page - 1)}
        >
          ← Prev
        </Button>
        <span class="text-sm text-muted-foreground">
          Page {props.page} of {props.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={props.page >= props.totalPages}
          onClick={() => props.onPageChange(props.page + 1)}
        >
          Next →
        </Button>
      </div>
    </Show>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/philhennel/Code/oPet/frontend && bun run typecheck 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/PaginationControls.tsx
git commit -m "feat: add PaginationControls shared component"
```

---

## Task 4: Create StatCard component

**Files:**
- Create: `frontend/src/components/StatCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
}

export function StatCard(props: StatCardProps) {
  return (
    <Card class="text-center">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">
          {typeof props.value === 'number' ? props.value.toLocaleString() : props.value}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/philhennel/Code/oPet/frontend && bun run typecheck 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/StatCard.tsx
git commit -m "feat: add StatCard shared component"
```

---

## Task 5: Update Layout.tsx

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

Substitutions: `<button>` → `Button variant="ghost"` for sign out links; nav `<a>` tags keep using `A` from router (already semantic). Overall structure stays, we tighten it with Tailwind utility classes instead of inline styles.

- [ ] **Step 1: Rewrite the file**

```tsx
import { JSX } from 'solid-js'
import { A } from '@solidjs/router'
import { Button } from '@/components/ui/button'

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
            <Button variant="ghost" size="sm" as={A} href="/">
              Petitions
            </Button>
            <Button variant="ghost" size="sm" as={A} href="/privacy">
              Privacy
            </Button>
            <Button variant="ghost" size="sm" as={A} href="/imprint">
              Imprint
            </Button>
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
```

- [ ] **Step 2: Start the dev server and verify the layout renders correctly**

```bash
cd /Users/philhennel/Code/oPet && bun dev
```

Open http://localhost:3000 and confirm header, nav links, and footer appear.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "refactor: update Layout to use Button and Tailwind classes"
```

---

## Task 6: Update AdminLayout.tsx

**Files:**
- Modify: `frontend/src/components/AdminLayout.tsx`

Substitutions: sign-out `<button>` → `Button variant="ghost"`, inline sidebar styles → Tailwind.

- [ ] **Step 1: Rewrite the file**

```tsx
import { JSX, Show, createEffect } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import { isAuthenticated, logout } from '@/stores/auth.js'
import { Button } from '@/components/ui/button'

interface AdminLayoutProps {
  children?: JSX.Element
}

export default function AdminLayout(props: AdminLayoutProps) {
  const navigate = useNavigate()

  createEffect(() => {
    if (!isAuthenticated()) {
      navigate('/admin/login', { replace: true })
    }
  })

  function handleLogout() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  const navItems: [string, string][] = [
    ['/admin/dashboard', '📊 Dashboard'],
    ['/admin/petitions', '📋 Petitions'],
    ['/admin/export', '📤 Export'],
    ['/admin/backup', '💾 Backup'],
  ]

  return (
    <Show when={isAuthenticated()} fallback={null}>
      <div class="min-h-screen flex">
        <aside class="w-[220px] bg-slate-800 text-slate-300 flex flex-col shrink-0">
          <div class="px-5 py-6">
            <A href="/admin/dashboard" class="text-xl font-bold text-white no-underline">
              ✊ oPet Admin
            </A>
          </div>

          <nav class="flex-1 flex flex-col gap-1 px-3">
            {navItems.map(([href, label]) => (
              <A
                href={href}
                class="px-3 py-2 rounded text-slate-300 no-underline text-sm transition-colors hover:bg-white/10"
                activeClass="bg-white/10 text-white"
              >
                {label}
              </A>
            ))}
          </nav>

          <div class="px-5 py-4 mt-auto">
            <Button
              variant="ghost"
              class="w-full text-slate-300 hover:text-white hover:bg-white/10"
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </aside>

        <div class="flex-1 flex flex-col overflow-auto">
          <main class="p-8 flex-1">{props.children}</main>
        </div>
      </div>
    </Show>
  )
}
```

- [ ] **Step 2: Verify admin layout at http://localhost:3001 (or restart dev server)**

Navigate to http://localhost:3000/admin/login and confirm the login page renders, then log in and verify sidebar navigation works.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/AdminLayout.tsx
git commit -m "refactor: update AdminLayout to use Button and Tailwind classes"
```

---

## Task 7: Rewrite Home.tsx

**Files:**
- Modify: `frontend/src/pages/Home.tsx`

Substitutions:
- Search `<input>` → `TextField` + `TextFieldInput`
- Search `<button>` → `Button`
- `.card` articles → `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `.progress-bar` divs → `Progress`
- `.badge-*` spans → `StatusBadge`
- `.pagination` div → `PaginationControls`
- Loading `<p>` → `Skeleton` cards
- `.alert.alert-error` → `Alert variant="destructive"`
- `.alert.alert-info` → `Alert` (default)

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { api, Petition } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TextField, TextFieldInput } from '@/components/ui/text-field'
import { StatusBadge } from '@/components/StatusBadge'
import { PaginationControls } from '@/components/PaginationControls'

export default function Home() {
  const [search, setSearch] = createSignal('')
  const [query, setQuery] = createSignal('')
  const [page, setPage] = createSignal(1)

  const [data] = createResource(
    () => ({ search: query(), page: page() }),
    (params) => api.getPetitions(params),
  )

  function handleSearch(e: Event) {
    e.preventDefault()
    setQuery(search())
    setPage(1)
  }

  function signaturePct(p: Petition) {
    return p.goalCount ? Math.min(100, Math.round((p.signatureCount / p.goalCount) * 100)) : null
  }

  return (
    <div>
      <section class="text-center py-12 pb-8">
        <h1 class="text-4xl font-extrabold mb-3">Make your voice heard</h1>
        <p class="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Browse active petitions and add your signature to causes that matter.
        </p>
        <form onSubmit={handleSearch} class="max-w-lg mx-auto flex gap-2">
          <TextField class="flex-1">
            <TextFieldInput
              type="search"
              placeholder="Search petitions…"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
            />
          </TextField>
          <Button type="submit">Search</Button>
        </form>
      </section>

      <Show when={data.loading}>
        <div class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
          <For each={[1, 2, 3]}>{() => (
            <Card>
              <CardHeader>
                <Skeleton class="h-5 w-3/4 rounded" animate />
              </CardHeader>
              <CardContent class="space-y-2">
                <Skeleton class="h-4 w-full rounded" animate />
                <Skeleton class="h-4 w-5/6 rounded" animate />
              </CardContent>
            </Card>
          )}</For>
        </div>
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load petitions. Please try again.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(result) => (
          <>
            <Show when={result().petitions.length === 0}>
              <Alert>
                <AlertDescription>
                  No petitions found{query() ? ` for "${query()}"` : ''}.
                </AlertDescription>
              </Alert>
            </Show>

            <div class="grid gap-5" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))">
              <For each={result().petitions}>
                {(petition) => (
                  <A href={`/petition/${petition.slug}`} class="no-underline text-inherit">
                    <Card class="h-full cursor-pointer transition-shadow hover:shadow-md">
                      <CardHeader class="pb-2">
                        <CardTitle class="text-base leading-snug">{petition.title}</CardTitle>
                        <p class="text-sm text-muted-foreground">
                          To: <strong>{petition.recipientName}</strong>
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p class="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {petition.summary}
                        </p>
                        <Show when={petition.goalCount}>
                          <Progress
                            value={signaturePct(petition) ?? 0}
                            class="mb-2"
                          />
                        </Show>
                      </CardContent>
                      <CardFooter class="flex items-center gap-2 pt-0">
                        <StatusBadge status={petition.status} type="petition" />
                        <span class="text-xs text-muted-foreground ml-auto">
                          {petition.goalCount
                            ? `${petition.signatureCount} / ${petition.goalCount}`
                            : `${petition.signatureCount} signatures`}
                        </span>
                      </CardFooter>
                    </Card>
                  </A>
                )}
              </For>
            </div>

            <PaginationControls
              page={page()}
              totalPages={result().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000 and confirm the petition grid, search, progress bars, status badges, and pagination render correctly.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Home.tsx
git commit -m "refactor: rewrite Home page with UI component library"
```

---

## Task 8: Rewrite PetitionPage.tsx

**Files:**
- Modify: `frontend/src/pages/PetitionPage.tsx`

Substitutions:
- `.badge-*` span → `StatusBadge`
- `.progress-bar` → `Progress`
- Form `<input>` → `TextField` + `TextFieldInput`
- Form `<textarea>` → `TextField` + `TextFieldTextArea`
- `<input type="checkbox">` wrapped in `<label>` → `<label>` + `Checkbox`
- `<button type="submit">` → `Button`
- `.card` aside → `Card`, `CardHeader`, `CardContent`
- `.alert-error` → `Alert variant="destructive"`
- `.alert-info` → `Alert`
- Signer cards → `Card`
- Loading `<p>` → `Skeleton`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams, useNavigate } from '@solidjs/router'
import { api, SignPayload } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from '@/components/ui/text-field'
import { StatusBadge } from '@/components/StatusBadge'

export default function PetitionPage() {
  const params = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [petition] = createResource(() => params.slug, api.getPetition)

  const [form, setForm] = createSignal<SignPayload>({
    fullName: '',
    email: '',
    city: '',
    country: '',
    comment: '',
    publicOptIn: false,
    updatesOptIn: false,
    recipientShareOptIn: false,
  })
  const [submitting, setSubmitting] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  function update<K extends keyof SignPayload>(key: K, value: SignPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (submitting()) return
    setError(null)
    setSubmitting(true)
    try {
      await api.signPetition(params.slug, form())
      navigate(`/petition/${params.slug}/success`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <Show when={petition.loading}>
        <div class="space-y-4">
          <Skeleton class="h-8 w-2/3 rounded" animate />
          <Skeleton class="h-4 w-1/3 rounded" animate />
          <Skeleton class="h-40 w-full rounded" animate />
        </div>
      </Show>

      <Show when={petition.error}>
        <Alert variant="destructive">
          <AlertDescription>Petition not found.</AlertDescription>
        </Alert>
      </Show>

      <Show when={petition()}>
        {(p) => (
          <div class="grid gap-8" style="grid-template-columns: 1fr 380px; align-items: start;">
            {/* Petition details */}
            <div>
              <div class="mb-3">
                <StatusBadge status={p().status} type="petition" />
              </div>
              <h1 class="text-3xl font-extrabold mb-2">{p().title}</h1>
              <p class="text-muted-foreground mb-1">
                To: <strong>{p().recipientName}</strong>
                <Show when={p().recipientDescription}>
                  {' – '}{p().recipientDescription}
                </Show>
              </p>
              <p class="text-sm text-muted-foreground mb-4">
                {p().signatureCount.toLocaleString()} signatures
                <Show when={p().goalCount}> of {p().goalCount?.toLocaleString()} goal</Show>
              </p>

              <Show when={p().goalCount}>
                <Progress
                  value={Math.min(100, Math.round((p().signatureCount / (p().goalCount ?? 1)) * 100))}
                  class="mb-6"
                />
              </Show>

              <div
                class="leading-relaxed mb-8 prose prose-sm max-w-none"
                innerHTML={p().body.replace(/\n/g, '<br>')}
              />

              <Show when={p().allowPublicNames && p().signatures && p().signatures!.length > 0}>
                <h2 class="text-lg font-bold mb-4">Recent signers</h2>
                <div class="flex flex-col gap-3 mb-8">
                  <For each={p().signatures}>
                    {(sig) => (
                      <Card>
                        <CardContent class="py-3">
                          <strong>{sig.fullName}</strong>
                          <Show when={sig.city || sig.country}>
                            <span class="text-muted-foreground text-sm ml-2">
                              {[sig.city, sig.country].filter(Boolean).join(', ')}
                            </span>
                          </Show>
                          <Show when={sig.comment}>
                            <p class="mt-1 text-sm text-muted-foreground">"{sig.comment}"</p>
                          </Show>
                        </CardContent>
                      </Card>
                    )}
                  </For>
                </div>
              </Show>
            </div>

            {/* Signature form */}
            <aside>
              <Card class="sticky top-6">
                <CardHeader>
                  <CardTitle>Sign this petition</CardTitle>
                </CardHeader>
                <CardContent>
                  <Show when={error()}>
                    <Alert variant="destructive" class="mb-4">
                      <AlertDescription>{error()}</AlertDescription>
                    </Alert>
                  </Show>

                  <Show
                    when={p().status === 'active'}
                    fallback={
                      <Alert>
                        <AlertDescription>
                          This petition is currently {p().status} and not accepting new signatures.
                        </AlertDescription>
                      </Alert>
                    }
                  >
                    <form onSubmit={handleSubmit} class="space-y-4">
                      <TextField>
                        <TextFieldLabel>Full name *</TextFieldLabel>
                        <TextFieldInput
                          type="text"
                          required
                          value={form().fullName}
                          onInput={(e) => update('fullName', e.currentTarget.value)}
                        />
                      </TextField>

                      <TextField>
                        <TextFieldLabel>Email address *</TextFieldLabel>
                        <TextFieldInput
                          type="email"
                          required
                          value={form().email}
                          onInput={(e) => update('email', e.currentTarget.value)}
                        />
                      </TextField>

                      <div class="grid grid-cols-2 gap-3">
                        <TextField>
                          <TextFieldLabel>City</TextFieldLabel>
                          <TextFieldInput
                            type="text"
                            value={form().city ?? ''}
                            onInput={(e) => update('city', e.currentTarget.value)}
                          />
                        </TextField>
                        <TextField>
                          <TextFieldLabel>Country</TextFieldLabel>
                          <TextFieldInput
                            type="text"
                            value={form().country ?? ''}
                            onInput={(e) => update('country', e.currentTarget.value)}
                          />
                        </TextField>
                      </div>

                      <Show when={p().allowComments}>
                        <TextField>
                          <TextFieldLabel>Comment (optional)</TextFieldLabel>
                          <TextFieldTextArea
                            rows={3}
                            maxLength={1000}
                            value={form().comment ?? ''}
                            onInput={(e) => update('comment', e.currentTarget.value)}
                          />
                        </TextField>
                      </Show>

                      <div class="flex flex-col gap-2">
                        <Show when={p().allowPublicNames}>
                          <label class="flex items-center gap-2 cursor-pointer text-sm">
                            <Checkbox
                              checked={form().publicOptIn}
                              onChange={(checked) => update('publicOptIn', checked)}
                            />
                            Display my name publicly
                          </label>
                        </Show>
                        <label class="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={form().updatesOptIn}
                            onChange={(checked) => update('updatesOptIn', checked)}
                          />
                          Send me updates about this petition
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer text-sm">
                          <Checkbox
                            checked={form().recipientShareOptIn}
                            onChange={(checked) => update('recipientShareOptIn', checked)}
                          />
                          Share my signature with the recipient
                        </label>
                      </div>

                      <p class="text-xs text-muted-foreground">
                        By signing, you agree to our{' '}
                        <a href="/privacy" target="_blank" class="underline">Privacy Policy</a>.
                        {p().requireVerification && ' You will receive a confirmation email.'}
                      </p>

                      <Button type="submit" class="w-full" disabled={submitting()}>
                        {submitting() ? 'Submitting…' : 'Sign petition'}
                      </Button>
                    </form>
                  </Show>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </Show>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000, click a petition, confirm the detail page renders with the form on the right, progress bar, status badge, and checkboxes.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/PetitionPage.tsx
git commit -m "refactor: rewrite PetitionPage with UI component library"
```

---

## Task 9: Rewrite SuccessPage, VerifyPage, WithdrawPage

**Files:**
- Modify: `frontend/src/pages/SuccessPage.tsx`
- Modify: `frontend/src/pages/VerifyPage.tsx`
- Modify: `frontend/src/pages/WithdrawPage.tsx`

Substitutions: `<button>`-style `<A>` links → `Button as={A}`, loading `<p>` → `Skeleton`, wrap content in `Card`.

- [ ] **Step 1: Rewrite SuccessPage.tsx**

```tsx
import { useParams, A } from '@solidjs/router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  const params = useParams<{ slug: string }>()

  return (
    <div class="max-w-lg mx-auto mt-16 text-center">
      <Card>
        <CardContent class="pt-8 pb-8 space-y-4">
          <div class="text-6xl">✅</div>
          <h1 class="text-3xl font-extrabold">Thank you for signing!</h1>
          <p class="text-muted-foreground text-lg">
            Please check your email inbox and click the verification link to confirm your signature.
          </p>
          <Button variant="outline" as={A} href={`/petition/${params.slug}`}>
            ← Back to petition
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite VerifyPage.tsx**

```tsx
import { createResource, Show } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { api } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function VerifyPage() {
  const params = useParams<{ token: string }>()
  const [result] = createResource(() => params.token, api.verifyToken)

  return (
    <div class="max-w-md mx-auto mt-20 text-center">
      <Show when={result.loading}>
        <Card>
          <CardContent class="pt-8 pb-8 space-y-3">
            <Skeleton class="h-12 w-12 rounded-full mx-auto" animate />
            <Skeleton class="h-6 w-48 rounded mx-auto" animate />
            <Skeleton class="h-4 w-64 rounded mx-auto" animate />
          </CardContent>
        </Card>
      </Show>

      <Show when={result.error}>
        <Card>
          <CardContent class="pt-8 pb-8 space-y-4">
            <div class="text-5xl">❌</div>
            <h1 class="text-2xl font-bold">Verification failed</h1>
            <Alert variant="destructive">
              <AlertDescription>
                {(result.error as Error).message || 'This link may be invalid or expired.'}
              </AlertDescription>
            </Alert>
            <Button variant="outline" as={A} href="/">Go to homepage</Button>
          </CardContent>
        </Card>
      </Show>

      <Show when={result()}>
        {(r) => (
          <Card>
            <CardContent class="pt-8 pb-8 space-y-4">
              <div class="text-5xl">✅</div>
              <h1 class="text-2xl font-bold">Email verified!</h1>
              <p class="text-muted-foreground">
                Your signature for <strong>{r().petitionTitle}</strong> has been confirmed.
              </p>
              <Button as={A} href={`/petition/${r().petitionSlug}`}>
                View petition
              </Button>
            </CardContent>
          </Card>
        )}
      </Show>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite WithdrawPage.tsx**

```tsx
import { createResource, Show } from 'solid-js'
import { useParams, A } from '@solidjs/router'
import { api } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function WithdrawPage() {
  const params = useParams<{ token: string }>()
  const [result] = createResource(() => params.token, api.withdrawToken)

  return (
    <div class="max-w-md mx-auto mt-20 text-center">
      <Show when={result.loading}>
        <Card>
          <CardContent class="pt-8 pb-8 space-y-3">
            <Skeleton class="h-12 w-12 rounded-full mx-auto" animate />
            <Skeleton class="h-6 w-48 rounded mx-auto" animate />
            <Skeleton class="h-4 w-64 rounded mx-auto" animate />
          </CardContent>
        </Card>
      </Show>

      <Show when={result.error}>
        <Card>
          <CardContent class="pt-8 pb-8 space-y-4">
            <div class="text-5xl">❌</div>
            <h1 class="text-2xl font-bold">Withdrawal failed</h1>
            <Alert variant="destructive">
              <AlertDescription>
                {(result.error as Error).message || 'This link may be invalid or expired.'}
              </AlertDescription>
            </Alert>
            <Button variant="outline" as={A} href="/">Go to homepage</Button>
          </CardContent>
        </Card>
      </Show>

      <Show when={result()}>
        {(r) => (
          <Card>
            <CardContent class="pt-8 pb-8 space-y-4">
              <div class="text-5xl">👋</div>
              <h1 class="text-2xl font-bold">Signature withdrawn</h1>
              <p class="text-muted-foreground">
                Your signature for <strong>{r().petitionTitle}</strong> has been removed.
              </p>
              <Button variant="outline" as={A} href={`/petition/${r().petitionSlug}`}>
                View petition
              </Button>
            </CardContent>
          </Card>
        )}
      </Show>
    </div>
  )
}
```

- [ ] **Step 4: Verify in browser**

Sign a petition (or navigate directly to `/petition/:slug/success`), and manually test verify/withdraw URLs to confirm the card layouts render.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/SuccessPage.tsx frontend/src/pages/VerifyPage.tsx frontend/src/pages/WithdrawPage.tsx
git commit -m "refactor: rewrite Success/Verify/Withdraw pages with UI components"
```

---

## Task 10: Rewrite ImprintPage and PrivacyPage

**Files:**
- Modify: `frontend/src/pages/ImprintPage.tsx`
- Modify: `frontend/src/pages/PrivacyPage.tsx`

These are static content pages. Read each file first, then wrap their sections in `Card` components. Headings use standard Tailwind typography instead of inline styles.

- [ ] **Step 1: Read both files**

```bash
cat frontend/src/pages/ImprintPage.tsx
cat frontend/src/pages/PrivacyPage.tsx
```

- [ ] **Step 2: Rewrite ImprintPage.tsx**

Wrap existing content in a `Card`. Keep all text identical — only replace container structure:

```tsx
import { A } from '@solidjs/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImprintPage() {
  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-extrabold mb-6">Imprint</h1>
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Operator</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground space-y-2">
          <p>
            {/* TODO: Replace with actual operator information before going live */}
            [Operator name and address]
          </p>
        </CardContent>
      </Card>
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground space-y-2">
          <p>[Contact email or form]</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Open Source</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground space-y-2">
          <p>
            This platform runs on{' '}
            <a href="https://github.com/pdiegmann/oPet" target="_blank" class="underline">
              oPet
            </a>
            , an open-source petition platform.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
```

Note: If the existing `ImprintPage.tsx` has more placeholder content than shown above, preserve it verbatim — only wrap in Card components.

- [ ] **Step 3: Rewrite PrivacyPage.tsx**

Read the file, then wrap each section in a `Card`. Preserve all text exactly:

```tsx
import { A } from '@solidjs/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-extrabold mb-6">Privacy Policy</h1>

      <div class="space-y-4">
        <Card>
          <CardHeader><CardTitle>Data We Collect</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground space-y-2">
            <p>When you sign a petition, we collect: full name, email address, city (optional), country (optional), and comment (optional). We also log your IP address for spam prevention.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>How We Use Your Data</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground space-y-2">
            <p>Your data is used to verify your signature and, if you opted in, to send you updates about the petition.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Your Rights</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground space-y-2">
            <p>You may withdraw your signature at any time via the link in your verification email. To request deletion of your data, contact the operator via the <A href="/imprint" class="underline">Imprint</A> page.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Data Retention</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground space-y-2">
            <p>Signature data is retained for 90 days after a petition ends. Withdrawn signatures are deleted after 30 days.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cookies</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground space-y-2">
            <p>We use functional cookies only. No tracking or advertising cookies are used.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            <p>For privacy inquiries, see the <A href="/imprint" class="underline">Imprint</A> page.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

Note: Cross-check the actual file content and adjust section titles and text to match exactly what is in the current files. Do not invent or omit content.

- [ ] **Step 4: Verify in browser**

Navigate to http://localhost:3000/privacy and http://localhost:3000/imprint. Confirm cards render correctly.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ImprintPage.tsx frontend/src/pages/PrivacyPage.tsx
git commit -m "refactor: rewrite Imprint/Privacy pages with Card components"
```

---

## Task 11: Rewrite admin/LoginPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/LoginPage.tsx`

Substitutions: `<input>` → `TextField` + `TextFieldInput`, `<button>` → `Button`, `.card` → `Card`, `.alert-error` → `Alert variant="destructive"`.

- [ ] **Step 1: Rewrite the file**

```tsx
import { createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { adminApi } from '@/lib/api.js'
import { login } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  async function handleSubmit(e: Event) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await adminApi.login(email(), password())
      login(res.token, res.user)
      navigate('/admin/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <Card class="w-full max-w-sm">
        <CardHeader class="text-center">
          <CardTitle class="text-2xl">✊ oPet Admin</CardTitle>
          <CardDescription>Sign in to manage petitions</CardDescription>
        </CardHeader>
        <CardContent>
          <Show when={error()}>
            <Alert variant="destructive" class="mb-4">
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          </Show>

          <form onSubmit={handleSubmit} class="space-y-4">
            <TextField>
              <TextFieldLabel>Email</TextFieldLabel>
              <TextFieldInput
                type="email"
                required
                autocomplete="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
            </TextField>
            <TextField>
              <TextFieldLabel>Password</TextFieldLabel>
              <TextFieldInput
                type="password"
                required
                autocomplete="current-password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
              />
            </TextField>
            <Button type="submit" class="w-full mt-2" disabled={loading()}>
              {loading() ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/admin/login and confirm the card-centered login form renders correctly.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/LoginPage.tsx
git commit -m "refactor: rewrite admin LoginPage with UI component library"
```

---

## Task 12: Rewrite admin/DashboardPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/DashboardPage.tsx`

Substitutions:
- Stat cards (`.card` with big number) → `StatCard`
- `.badge-*` spans → `StatusBadge`
- `<table>` → `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- Inline-colored verified/pending text → `StatusBadge type="signature"`
- Loading `<p>` → `Skeleton`
- `.alert-error` → `Alert variant="destructive"`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, Signature, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/StatCard'
import { StatusBadge } from '@/components/StatusBadge'

export default function DashboardPage() {
  const token = getToken() ?? ''
  const [data] = createResource(() => adminApi.getDashboard(token))

  return (
    <div>
      <h1 class="text-2xl font-bold mb-6">Dashboard</h1>

      <Show when={data.loading}>
        <div class="grid grid-cols-4 gap-4 mb-8">
          <For each={[1, 2, 3, 4]}>{() => <Skeleton class="h-28 rounded-lg" animate />}</For>
        </div>
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <div class="grid grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Petitions" value={d().stats.totalPetitions} />
              <StatCard title="Active Petitions" value={d().stats.activePetitions} />
              <StatCard title="Total Signatures" value={d().stats.totalSignatures} />
              <StatCard title="Verified Signatures" value={d().stats.verifiedSignatures} />
            </div>

            <div class="grid grid-cols-2 gap-6">
              <div>
                <div class="flex justify-between items-center mb-3">
                  <h2 class="font-bold">Recent Petitions</h2>
                  <A href="/admin/petitions" class="text-sm text-primary hover:underline">
                    View all →
                  </A>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Signatures</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={d().recentPetitions}>
                      {(p: AdminPetition) => (
                        <TableRow>
                          <TableCell>
                            <A
                              href={`/admin/petitions/${p.id}/signatures`}
                              class="text-sm hover:underline"
                            >
                              {p.title}
                            </A>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={p.status} type="petition" />
                          </TableCell>
                          <TableCell class="text-sm">
                            {(p.signatureCount ?? 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>

              <div>
                <h2 class="font-bold mb-3">Recent Signatures</h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Petition</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <For each={d().recentSignatures}>
                      {(s: Signature & { petition?: { title: string; slug: string } }) => (
                        <TableRow>
                          <TableCell class="text-sm font-medium">{s.fullName}</TableCell>
                          <TableCell class="text-sm text-muted-foreground">
                            {(s as unknown as { petition: { title: string } }).petition?.title ?? '—'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              status={s.verified ? 'verified' : 'pending'}
                              type="signature"
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </Show>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Log in at http://localhost:3000/admin/login, then navigate to the dashboard and confirm stat cards and tables render.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/DashboardPage.tsx
git commit -m "refactor: rewrite admin DashboardPage with UI component library"
```

---

## Task 13: Rewrite admin/PetitionsPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/PetitionsPage.tsx`

Substitutions:
- `<select>` filter → `Select` (Kobalte)
- `<table>` → `Table` components
- `.badge-*` → `StatusBadge`
- `<button>` actions → `Button`
- `confirm()` → `ConfirmDialog`
- Pagination → `PaginationControls`
- `.alert-error` → `Alert variant="destructive"`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, For, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { adminApi, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { StatusBadge } from '@/components/StatusBadge'

type StatusOpt = { label: string; value: string }
const STATUS_OPTIONS: StatusOpt[] = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function PetitionsPage() {
  const token = getToken() ?? ''
  const [page, setPage] = createSignal(1)
  const [statusFilter, setStatusFilter] = createSignal('')
  const [archiveTarget, setArchiveTarget] = createSignal<AdminPetition | null>(null)
  const [archiveError, setArchiveError] = createSignal<string | null>(null)

  const [data, { refetch }] = createResource(
    () => ({ page: page(), status: statusFilter() }),
    (params) => adminApi.getPetitions(token, params),
  )

  async function handleArchive() {
    const p = archiveTarget()
    if (!p) return
    setArchiveError(null)
    try {
      await adminApi.archivePetition(token, p.id)
      refetch()
    } catch (e: unknown) {
      setArchiveError(e instanceof Error ? e.message : 'Failed to archive petition')
    }
  }

  return (
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Petitions</h1>
        <Button as={A} href="/admin/petitions/new">+ New petition</Button>
      </div>

      <Show when={archiveError()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{archiveError()}</AlertDescription>
        </Alert>
      </Show>

      <div class="flex gap-3 mb-5">
        <Select
          options={STATUS_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={STATUS_OPTIONS.find(o => o.value === statusFilter()) ?? null}
          onChange={(opt) => { setStatusFilter(opt?.value ?? ''); setPage(1) }}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-[180px]">
            <SelectValue<StatusOpt>>{(state) => state.selectedOption()?.label ?? 'All statuses'}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <Show when={data.loading}>
        <Skeleton class="h-64 w-full rounded-lg" animate />
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load petitions.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Show
                  when={d().petitions.length > 0}
                  fallback={
                    <TableRow>
                      <TableCell colspan={5} class="text-center text-muted-foreground py-8">
                        No petitions found
                      </TableCell>
                    </TableRow>
                  }
                >
                  <For each={d().petitions}>
                    {(p: AdminPetition) => (
                      <TableRow>
                        <TableCell>
                          <div class="font-semibold text-sm">{p.title}</div>
                          <div class="text-xs text-muted-foreground">/{p.slug}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} type="petition" />
                        </TableCell>
                        <TableCell class="text-sm">
                          {(p.signatureCount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div class="flex gap-1.5">
                            <Button as={A} href={`/admin/petitions/${p.id}/edit`} variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button as={A} href={`/admin/petitions/${p.id}/signatures`} variant="outline" size="sm">
                              Signatures
                            </Button>
                            <Show when={p.status !== 'archived'}>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setArchiveTarget(p)}
                              >
                                Archive
                              </Button>
                            </Show>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </Show>
              </TableBody>
            </Table>

            <PaginationControls
              page={page()}
              totalPages={d().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>

      <ConfirmDialog
        open={archiveTarget() !== null}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title="Archive petition"
        description={`Archive "${archiveTarget()?.title}"? It will no longer accept signatures.`}
        confirmLabel="Archive"
        variant="destructive"
        onConfirm={handleArchive}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/admin/petitions. Confirm the table, status filter dropdown, action buttons, and archive confirm dialog all work.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/PetitionsPage.tsx
git commit -m "refactor: rewrite admin PetitionsPage with UI component library"
```

---

## Task 14: Rewrite admin/PetitionEditorPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/PetitionEditorPage.tsx`

Substitutions:
- `<input>` → `TextField` + `TextFieldInput` (with `TextFieldDescription` for slug hint)
- `<select>` → `Select` (Kobalte)
- `<input type="checkbox">` → `<label>` + `Checkbox`
- `<button>` → `Button`
- `.card` sections → `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `.alert-error/success` → `Alert`
- Loading `<p>` → `Skeleton`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, Show } from 'solid-js'
import { useNavigate, useParams } from '@solidjs/router'
import { adminApi } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import QuillEditor from '@/components/QuillEditor.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TextField, TextFieldDescription, TextFieldInput, TextFieldLabel,
} from '@/components/ui/text-field'

interface PetitionFormData {
  slug: string
  title: string
  summary: string
  body: string
  recipientName: string
  recipientDescription: string
  status: string
  goalCount: string
  allowPublicNames: boolean
  allowComments: boolean
  requireVerification: boolean
  startsAt: string
  endsAt: string
}

const emptyForm = (): PetitionFormData => ({
  slug: '',
  title: '',
  summary: '',
  body: '',
  recipientName: '',
  recipientDescription: '',
  status: 'draft',
  goalCount: '',
  allowPublicNames: false,
  allowComments: false,
  requireVerification: true,
  startsAt: '',
  endsAt: '',
})

type StatusOpt = { label: string; value: string }
const STATUS_OPTIONS: StatusOpt[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

export default function PetitionEditorPage() {
  const token = getToken() ?? ''
  const navigate = useNavigate()
  const params = useParams<{ id?: string }>()
  const isEdit = !!params.id

  const [form, setForm] = createSignal<PetitionFormData>(emptyForm())
  const [saving, setSaving] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

  const [existing] = createResource(
    () => (isEdit ? params.id : undefined),
    async (id) => {
      const p = await adminApi.getPetition(token, id!)
      setForm({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        body: p.body,
        recipientName: p.recipientName,
        recipientDescription: p.recipientDescription ?? '',
        status: p.status,
        goalCount: p.goalCount ? String(p.goalCount) : '',
        allowPublicNames: p.allowPublicNames,
        allowComments: p.allowComments,
        requireVerification: p.requireVerification,
        startsAt: p.startsAt ? new Date(p.startsAt).toISOString().slice(0, 16) : '',
        endsAt: p.endsAt ? new Date(p.endsAt).toISOString().slice(0, 16) : '',
      })
      return p
    },
  )

  function update<K extends keyof PetitionFormData>(key: K, value: PetitionFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function autoSlug(title: string) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (saving()) return
    setError(null)
    setSuccess(null)
    setSaving(true)
    try {
      const f = form()
      const payload = {
        slug: f.slug,
        title: f.title,
        summary: f.summary,
        body: f.body,
        recipientName: f.recipientName,
        recipientDescription: f.recipientDescription || undefined,
        status: f.status,
        goalCount: f.goalCount ? parseInt(f.goalCount) : undefined,
        allowPublicNames: f.allowPublicNames,
        allowComments: f.allowComments,
        requireVerification: f.requireVerification,
        startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : undefined,
        endsAt: f.endsAt ? new Date(f.endsAt).toISOString() : undefined,
      }
      if (isEdit) {
        await adminApi.updatePetition(token, params.id!, payload)
        setSuccess('Petition updated successfully.')
      } else {
        const created = await adminApi.createPetition(token, payload)
        navigate(`/admin/petitions/${created.id}/edit`)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save petition')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class="max-w-3xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">{isEdit ? 'Edit petition' : 'New petition'}</h1>
        <Show when={isEdit && existing()}>
          <Button variant="outline" size="sm" as="a" href={`/petition/${existing()?.slug}`} target="_blank">
            View public page ↗
          </Button>
        </Show>
      </div>

      <Show when={existing.loading}>
        <Skeleton class="h-64 w-full rounded-lg mb-4" animate />
      </Show>

      <Show when={error()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{error()}</AlertDescription>
        </Alert>
      </Show>
      <Show when={success()}>
        <Alert class="mb-4">
          <AlertDescription>{success()}</AlertDescription>
        </Alert>
      </Show>

      <form onSubmit={handleSubmit} class="space-y-4">
        <Card>
          <CardHeader><CardTitle>Basic information</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <TextField>
              <TextFieldLabel>Title *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                value={form().title}
                onInput={(e) => {
                  update('title', e.currentTarget.value)
                  if (!isEdit) update('slug', autoSlug(e.currentTarget.value))
                }}
              />
            </TextField>

            <TextField>
              <TextFieldLabel>Slug *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                pattern="[a-z0-9-]+"
                value={form().slug}
                onInput={(e) => update('slug', e.currentTarget.value)}
              />
              <TextFieldDescription>URL: /petition/{form().slug || '…'}</TextFieldDescription>
            </TextField>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Summary * (shown in listing)</label>
              <QuillEditor
                id="summary"
                value={form().summary}
                onValueChange={(val) => update('summary', val)}
                placeholder="Short summary shown in the petition listing…"
                minHeight="5rem"
              />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Body * (full petition text)</label>
              <QuillEditor
                id="body"
                value={form().body}
                onValueChange={(val) => update('body', val)}
                placeholder="Full petition text…"
                minHeight="14rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recipient</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <TextField>
              <TextFieldLabel>Recipient name *</TextFieldLabel>
              <TextFieldInput
                type="text"
                required
                value={form().recipientName}
                onInput={(e) => update('recipientName', e.currentTarget.value)}
              />
            </TextField>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Recipient description</label>
              <QuillEditor
                id="recipientDescription"
                value={form().recipientDescription}
                onValueChange={(val) => update('recipientDescription', val)}
                placeholder="Brief description of the petition recipient…"
                minHeight="5rem"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Status</label>
                <Select
                  options={STATUS_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={STATUS_OPTIONS.find(o => o.value === form().status) ?? null}
                  onChange={(opt) => update('status', opt?.value ?? 'draft')}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<StatusOpt>>{(state) => state.selectedOption()?.label}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>

              <TextField>
                <TextFieldLabel>Signature goal</TextFieldLabel>
                <TextFieldInput
                  type="number"
                  min="1"
                  value={form().goalCount}
                  onInput={(e) => update('goalCount', e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>Starts at</TextFieldLabel>
                <TextFieldInput
                  type="datetime-local"
                  value={form().startsAt}
                  onInput={(e) => update('startsAt', e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>Ends at</TextFieldLabel>
                <TextFieldInput
                  type="datetime-local"
                  value={form().endsAt}
                  onInput={(e) => update('endsAt', e.currentTarget.value)}
                />
              </TextField>
            </div>

            <div class="flex flex-col gap-3 pt-1">
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().requireVerification}
                  onChange={(checked) => update('requireVerification', checked)}
                />
                Require email verification
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().allowPublicNames}
                  onChange={(checked) => update('allowPublicNames', checked)}
                />
                Allow public names
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={form().allowComments}
                  onChange={(checked) => update('allowComments', checked)}
                />
                Allow comments
              </label>
            </div>
          </CardContent>
        </Card>

        <div class="flex gap-3 pb-8">
          <Button type="submit" disabled={saving()}>
            {saving() ? 'Saving…' : isEdit ? 'Save changes' : 'Create petition'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/petitions')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/admin/petitions/new, fill in the form, confirm the Quill editors, status select, checkboxes, and slug preview all work. Also test edit mode by navigating to an existing petition.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/PetitionEditorPage.tsx
git commit -m "refactor: rewrite admin PetitionEditorPage with UI component library"
```

---

## Task 15: Rewrite admin/SignaturesPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/SignaturesPage.tsx`

Substitutions:
- `<select>` filters → `Select` (Kobalte)
- `<table>` → `Table` components
- Inline-colored status text → `StatusBadge type="signature"`
- `<button>` → `Button`
- `confirm()` → `ConfirmDialog`
- Pagination → `PaginationControls`
- `.alert-error` → `Alert variant="destructive"`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, For, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { adminApi, Signature } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PaginationControls } from '@/components/PaginationControls'
import { StatusBadge } from '@/components/StatusBadge'

type Opt = { label: string; value: string }

const VERIFIED_OPTIONS: Opt[] = [
  { value: '', label: 'All (verified & unverified)' },
  { value: 'true', label: 'Verified only' },
  { value: 'false', label: 'Unverified only' },
]

const WITHDRAWN_OPTIONS: Opt[] = [
  { value: 'false', label: 'Active only' },
  { value: 'true', label: 'Withdrawn only' },
  { value: '', label: 'All' },
]

export default function SignaturesPage() {
  const token = getToken() ?? ''
  const params = useParams<{ id: string }>()

  const [page, setPage] = createSignal(1)
  const [verifiedFilter, setVerifiedFilter] = createSignal('')
  const [withdrawnFilter, setWithdrawnFilter] = createSignal('false')
  const [removeTarget, setRemoveTarget] = createSignal<Signature | null>(null)
  const [removeError, setRemoveError] = createSignal<string | null>(null)

  const [data, { refetch }] = createResource(
    () => ({
      page: page(),
      verified: verifiedFilter() !== '' ? verifiedFilter() === 'true' : undefined,
      withdrawn: withdrawnFilter() !== '' ? withdrawnFilter() === 'true' : undefined,
    }),
    (filters) => adminApi.getSignatures(token, params.id, filters),
  )

  async function handleRemove() {
    const sig = removeTarget()
    if (!sig) return
    setRemoveError(null)
    try {
      await adminApi.removeSignature(token, sig.id)
      refetch()
    } catch (e: unknown) {
      setRemoveError(e instanceof Error ? e.message : 'Failed to remove signature')
    }
  }

  function sigStatus(sig: Signature): 'withdrawn' | 'verified' | 'pending' {
    if (sig.withdrawn) return 'withdrawn'
    if (sig.verified) return 'verified'
    return 'pending'
  }

  return (
    <div>
      <h1 class="text-2xl font-bold mb-6">Signatures</h1>

      <Show when={removeError()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{removeError()}</AlertDescription>
        </Alert>
      </Show>

      <div class="flex gap-3 mb-5">
        <Select
          options={VERIFIED_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={VERIFIED_OPTIONS.find(o => o.value === verifiedFilter()) ?? null}
          onChange={(opt) => { setVerifiedFilter(opt?.value ?? ''); setPage(1) }}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-[220px]">
            <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'Verification'}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>

        <Select
          options={WITHDRAWN_OPTIONS}
          optionValue="value"
          optionTextValue="label"
          value={WITHDRAWN_OPTIONS.find(o => o.value === withdrawnFilter()) ?? null}
          onChange={(opt) => { setWithdrawnFilter(opt?.value ?? ''); setPage(1) }}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-[180px]">
            <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'Withdrawal'}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </div>

      <Show when={data.loading}>
        <Skeleton class="h-64 w-full rounded-lg" animate />
      </Show>

      <Show when={data.error}>
        <Alert variant="destructive">
          <AlertDescription>Failed to load signatures.</AlertDescription>
        </Alert>
      </Show>

      <Show when={data()}>
        {(d) => (
          <>
            <p class="text-sm text-muted-foreground mb-3">
              {d().total.toLocaleString()} signature(s) found
            </p>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <Show
                  when={d().signatures.length > 0}
                  fallback={
                    <TableRow>
                      <TableCell colspan={6} class="text-center text-muted-foreground py-8">
                        No signatures found
                      </TableCell>
                    </TableRow>
                  }
                >
                  <For each={d().signatures}>
                    {(sig: Signature) => (
                      <TableRow>
                        <TableCell class="font-medium text-sm">{sig.fullName}</TableCell>
                        <TableCell class="text-sm">{sig.email}</TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                          {[sig.city, sig.country].filter(Boolean).join(', ') || '—'}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sigStatus(sig)} type="signature" />
                        </TableCell>
                        <TableCell class="text-sm text-muted-foreground">
                          {new Date(sig.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Show when={!sig.withdrawn}>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRemoveTarget(sig)}
                            >
                              Remove
                            </Button>
                          </Show>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </Show>
              </TableBody>
            </Table>

            <PaginationControls
              page={page()}
              totalPages={d().totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </Show>

      <ConfirmDialog
        open={removeTarget() !== null}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null) }}
        title="Remove signature"
        description={`Remove signature from ${removeTarget()?.fullName}? This cannot be undone.`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemove}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to a petition's signatures page, confirm filters, table, status badges, and the remove confirm dialog all work.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/SignaturesPage.tsx
git commit -m "refactor: rewrite admin SignaturesPage with UI component library"
```

---

## Task 16: Rewrite admin/ExportPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/ExportPage.tsx`

Substitutions:
- `<select>` → `Select` (Kobalte)
- `<input type="text">` → `TextField` + `TextFieldInput`
- `<button>` → `Button`
- `.card` → `Card`, `CardContent`
- `.alert-error` → `Alert variant="destructive"`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createResource, createSignal, For, Show } from 'solid-js'
import { adminApi, AdminPetition } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'

type Opt = { label: string; value: string }

const FORMAT_OPTIONS: Opt[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' },
]

const VERIFIED_OPTIONS: Opt[] = [
  { value: '', label: 'All' },
  { value: 'true', label: 'Verified only' },
  { value: 'false', label: 'Unverified only' },
]

const WITHDRAWN_OPTIONS: Opt[] = [
  { value: 'false', label: 'Active only' },
  { value: 'true', label: 'Withdrawn only' },
  { value: '', label: 'All' },
]

export default function ExportPage() {
  const token = getToken() ?? ''
  const [petitions] = createResource(() => adminApi.getPetitions(token, { page: 1 }))

  const [format, setFormat] = createSignal('csv')
  const [petitionId, setPetitionId] = createSignal('')
  const [verified, setVerified] = createSignal('')
  const [withdrawn, setWithdrawn] = createSignal('false')
  const [country, setCountry] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)

  async function handleExport(e: Event) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await adminApi.exportSignatures(token, format() as 'csv' | 'json', {
        petitionId: petitionId() || undefined,
        verified: verified() !== '' ? verified() === 'true' : undefined,
        withdrawn: withdrawn() !== '' ? withdrawn() === 'true' : undefined,
        country: country() || undefined,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  // Build petition options once loaded
  const petitionOptions = (): Opt[] => {
    const list = petitions()?.petitions ?? []
    return [
      { value: '', label: 'All petitions' },
      ...list.map((p: AdminPetition) => ({ value: p.id, label: p.title })),
    ]
  }

  return (
    <div class="max-w-xl">
      <h1 class="text-2xl font-bold mb-6">Export signatures</h1>

      <Card>
        <CardHeader><CardTitle>Export options</CardTitle></CardHeader>
        <CardContent>
          <Show when={error()}>
            <Alert variant="destructive" class="mb-4">
              <AlertDescription>{error()}</AlertDescription>
            </Alert>
          </Show>

          <form onSubmit={handleExport} class="space-y-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Format</label>
              <Select
                options={FORMAT_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={FORMAT_OPTIONS.find(o => o.value === format()) ?? null}
                onChange={(opt) => setFormat(opt?.value ?? 'csv')}
                itemComponent={(props) => (
                  <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                )}
              >
                <SelectTrigger>
                  <SelectValue<Opt>>{(state) => state.selectedOption()?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Petition (optional)</label>
              <Show
                when={!petitions.loading}
                fallback={<p class="text-sm text-muted-foreground">Loading petitions…</p>}
              >
                <Select
                  options={petitionOptions()}
                  optionValue="value"
                  optionTextValue="label"
                  value={petitionOptions().find(o => o.value === petitionId()) ?? null}
                  onChange={(opt) => setPetitionId(opt?.value ?? '')}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'All petitions'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </Show>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Verification status</label>
                <Select
                  options={VERIFIED_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={VERIFIED_OPTIONS.find(o => o.value === verified()) ?? null}
                  onChange={(opt) => setVerified(opt?.value ?? '')}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'All'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Withdrawal status</label>
                <Select
                  options={WITHDRAWN_OPTIONS}
                  optionValue="value"
                  optionTextValue="label"
                  value={WITHDRAWN_OPTIONS.find(o => o.value === withdrawn()) ?? null}
                  onChange={(opt) => setWithdrawn(opt?.value ?? '')}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
                  )}
                >
                  <SelectTrigger>
                    <SelectValue<Opt>>{(state) => state.selectedOption()?.label ?? 'Active only'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
              </div>
            </div>

            <TextField>
              <TextFieldLabel>Filter by country (optional)</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="e.g. Germany"
                value={country()}
                onInput={(e) => setCountry(e.currentTarget.value)}
              />
            </TextField>

            <Button type="submit" class="w-full" disabled={loading()}>
              {loading() ? 'Preparing export…' : `Export as ${format().toUpperCase()}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/admin/export, confirm all dropdowns and the country filter render, then trigger an export and confirm the download works.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/admin/ExportPage.tsx
git commit -m "refactor: rewrite admin ExportPage with UI component library"
```

---

## Task 17: Rewrite admin/BackupPage.tsx

**Files:**
- Modify: `frontend/src/pages/admin/BackupPage.tsx`

Substitutions:
- `<button>` → `Button`
- `.card` sections → `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `.alert-error/success` → `Alert`
- `<input type="file">` wrapped in a `TextField` block
- `confirm()` → `ConfirmDialog`

- [ ] **Step 1: Rewrite the file**

```tsx
import { createSignal, Show } from 'solid-js'
import { adminApi } from '@/lib/api.js'
import { getToken } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function BackupPage() {
  const token = getToken() ?? ''
  const [backupLoading, setBackupLoading] = createSignal(false)
  const [restoreLoading, setRestoreLoading] = createSignal(false)
  const [restoreFile, setRestoreFile] = createSignal<File | null>(null)
  const [confirmOpen, setConfirmOpen] = createSignal(false)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

  async function handleBackup() {
    setError(null)
    setSuccess(null)
    setBackupLoading(true)
    try {
      await adminApi.backup(token)
      setSuccess('Backup downloaded successfully.')
    } catch {
      setError('Backup failed. Please try again.')
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleRestore() {
    const file = restoreFile()
    if (!file) return
    setError(null)
    setSuccess(null)
    setRestoreLoading(true)
    try {
      const result = await adminApi.restore(token, file)
      setSuccess(
        `Restore complete — ${result.restoredPetitions} petition(s) and ${result.restoredSignatures} signature(s) restored.`,
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Restore failed. Please check the backup file and try again.')
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <div class="max-w-xl">
      <h1 class="text-2xl font-bold mb-6">Backup & Restore</h1>

      <Show when={error()}>
        <Alert variant="destructive" class="mb-4">
          <AlertDescription>{error()}</AlertDescription>
        </Alert>
      </Show>
      <Show when={success()}>
        <Alert class="mb-4">
          <AlertDescription>{success()}</AlertDescription>
        </Alert>
      </Show>

      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Create Backup</CardTitle>
            <CardDescription>
              Download a full JSON backup of all petitions and their signatures.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBackup} disabled={backupLoading()}>
              {backupLoading() ? 'Creating backup…' : '⬇ Download Backup'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restore from Backup</CardTitle>
            <CardDescription>
              Upload a previously downloaded backup file. Existing petitions and signatures will be
              updated; missing ones will be added. No data will be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); setConfirmOpen(true) }}
              class="space-y-4"
            >
              <TextField>
                <TextFieldLabel>Backup file (.json)</TextFieldLabel>
                <TextFieldInput
                  type="file"
                  accept=".json,application/json"
                  required
                  onChange={(e) => setRestoreFile(e.currentTarget.files?.[0] ?? null)}
                />
              </TextField>
              <Button
                type="submit"
                variant="outline"
                disabled={restoreLoading() || !restoreFile()}
              >
                {restoreLoading() ? 'Restoring…' : '⬆ Restore Backup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen()}
        onOpenChange={setConfirmOpen}
        title="Restore from backup"
        description="This will add or overwrite petitions and signatures from the backup file. Continue?"
        confirmLabel="Restore"
        onConfirm={handleRestore}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to http://localhost:3000/admin/backup, confirm the cards render, trigger a backup download, then upload a backup file and confirm the restore dialog appears before proceeding.

- [ ] **Step 3: Final typecheck across the whole frontend**

```bash
cd /Users/philhennel/Code/oPet/frontend && bun run typecheck
```

Expected: no type errors. If there are errors, fix them before committing.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/admin/BackupPage.tsx
git commit -m "refactor: rewrite admin BackupPage with UI component library"
```

---

## Self-Review

**Spec coverage:**
- ✅ All 14 page files addressed (7 public, 7 admin)
- ✅ All 4 shared components defined with full code
- ✅ Layout and AdminLayout updated
- ✅ All `<input>` → `TextField` + `TextFieldInput`/`TextFieldTextArea`
- ✅ All `<button>` → `Button`
- ✅ All `<select>` → Kobalte `Select`
- ✅ All `<input type="checkbox">` → `Checkbox`
- ✅ All progress bars → `Progress`
- ✅ All `.badge-*` spans → `StatusBadge` / `Badge`
- ✅ All `.alert-*` divs → `Alert`
- ✅ All `.card` divs → `Card` components
- ✅ All `<table>` → `Table` components
- ✅ All `confirm()` calls → `ConfirmDialog`
- ✅ Repeated pagination controls → `PaginationControls`
- ✅ Repeated stat cards → `StatCard`
- ✅ Loading states → `Skeleton`

**Type consistency:**
- `StatusBadge` accepts `status` and `type` props — used consistently throughout
- `ConfirmDialog` `open`/`onOpenChange`/`onConfirm` props — used consistently throughout
- `PaginationControls` `page`/`totalPages`/`onPageChange` props — used consistently throughout
- `StatCard` `title`/`value` props — used consistently throughout
- Kobalte `Select` uses object-based options with `optionValue="value"` and `optionTextValue="label"` consistently throughout

**Imports:** All pages import from `@/` alias (resolves to `src/`) — consistent with the project's path alias configuration.
