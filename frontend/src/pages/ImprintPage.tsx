import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ImprintPage() {
  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-extrabold mb-6">Imprint</h1>

      <div class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Operator</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              This service is operated by the organisation or individual who deployed this instance of
              oPet. Please update this page with your actual contact information before going live.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              Email: <a href="mailto:admin@example.com" class="underline">admin@example.com</a><br />
              Address: 123 Example Street, 12345 Example City, Country
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Source</CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              oPet is open-source software. The source code is available at{' '}
              <a href="https://github.com/pdiegmann/oPet" target="_blank" rel="noopener noreferrer" class="underline">
                github.com/pdiegmann/oPet
              </a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
