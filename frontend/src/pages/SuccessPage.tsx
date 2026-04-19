import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { t } from '@/lib/i18n'

export default function SuccessPage() {
  const params = useParams<{ slug: string }>()

  return (
    <div class="max-w-lg mx-auto mt-16 text-center">
      <Card>
        <CardContent class="pt-8 pb-8 space-y-4">
          <div class="text-6xl">✅</div>
          <h1 class="text-3xl font-extrabold">{t('app.thank_you_for_signing')}</h1>
          <p class="text-muted-foreground text-lg">
            {t('app.please_check_your_email_inbox_and_click_the_verification_link_to_confi')}
          </p>
          <Button variant="outline" as={A} href={`/petition/${params.slug}`}>
            ← {t('app.back_to_petition')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
