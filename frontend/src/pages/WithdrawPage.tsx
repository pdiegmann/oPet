import { createResource, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'
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
