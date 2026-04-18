export default function ImprintPage() {
  return (
    <div style="max-width: 720px; margin: 0 auto;">
      <h1 class="page-title">Imprint</h1>

      <div class="card" style="line-height: 1.8;">
        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem;">Operator</h2>
        <p style="margin-bottom: 1rem;">
          This service is operated by the organisation or individual who deployed this instance of
          oPet. Please update this page with your actual contact information before going live.
        </p>

        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem;">Contact</h2>
        <p style="margin-bottom: 1rem;">
          Email: <a href="mailto:admin@example.com">admin@example.com</a><br />
          Address: 123 Example Street, 12345 Example City, Country
        </p>

        <h2 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem;">Open Source</h2>
        <p>
          oPet is open-source software. The source code is available at{' '}
          <a href="https://github.com/pdiegmann/oPet" target="_blank" rel="noopener noreferrer">
            github.com/pdiegmann/oPet
          </a>.
        </p>
      </div>
    </div>
  )
}
