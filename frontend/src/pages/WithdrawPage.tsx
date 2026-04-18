import { createResource, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'
import { api } from '../lib/api.js'

export default function WithdrawPage() {
  const params = useParams<{ token: string }>()

  const [result] = createResource(() => params.token, api.withdrawToken)

  return (
    <div style="max-width: 500px; margin: 5rem auto; text-align: center;">
      <Show when={result.loading}>
        <p style="color: var(--color-text-muted);">Processing withdrawal…</p>
      </Show>

      <Show when={result.error}>
        <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
        <h1 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 0.75rem;">Withdrawal failed</h1>
        <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
          {(result.error as Error).message || 'This link may be invalid or expired.'}
        </p>
        <A href="/" class="btn btn-secondary">Go to homepage</A>
      </Show>

      <Show when={result()}>
        {(r) => (
          <>
            <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
            <h1 style="font-size: 1.8rem; font-weight: 700; margin-bottom: 0.75rem;">
              Signature withdrawn
            </h1>
            <p style="color: var(--color-text-muted); margin-bottom: 1.5rem;">
              Your signature for <strong>{r().petitionTitle}</strong> has been removed.
            </p>
            <A href={`/petition/${r().petitionSlug}`} class="btn btn-secondary">
              View petition
            </A>
          </>
        )}
      </Show>
    </div>
  )
}
