import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'

export default function SuccessPage() {
  const params = useParams<{ slug: string }>()

  return (
    <div style="max-width: 560px; margin: 4rem auto; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
      <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem;">
        Thank you for signing!
      </h1>
      <p style="color: var(--color-text-muted); font-size: 1.05rem; margin-bottom: 2rem;">
        Please check your email inbox and click the verification link to confirm your signature.
      </p>
      <A href={`/petition/${params.slug}`} class="btn btn-secondary">
        ← Back to petition
      </A>
    </div>
  )
}
