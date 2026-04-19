import { createResource, Show } from 'solid-js'
import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'
import { api } from '@/lib/api.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { t } from '@/lib/i18n'

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
            <h1 class="text-2xl font-bold">{t('app.verification_failed')}</h1>
            <Alert variant="destructive">
              <AlertDescription>
                {(result.error as Error).message || t('app.this_link_may_be_invalid_or_expired')}
              </AlertDescription>
            </Alert>
            <Button variant="outline" as={A} href="/">{t('app.go_to_homepage')}</Button>
          </CardContent>
        </Card>
      </Show>

      <Show when={result()}>
        {(r) => (
          <Card>
            <CardContent class="pt-8 pb-8 space-y-4">
              <div class="text-5xl">✅</div>
              <h1 class="text-2xl font-bold">{t('app.email_verified')}</h1>
              <p class="text-muted-foreground">
                {t('app.your_signature_for')} <strong>{r().petitionTitle}</strong> {t('app.has_been_confirmed')}
              </p>
              <Button as={A} href={`/petition/${r().petitionSlug}`}>
                {t('app.view_petition')}
              </Button>
            </CardContent>
          </Card>
        )}
      </Show>
    </div>
  )
}
