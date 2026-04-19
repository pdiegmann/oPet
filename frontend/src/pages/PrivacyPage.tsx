import { A } from '@solidjs/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { t } from '@/lib/i18n'

export default function PrivacyPage() {
  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-extrabold mb-6">{t('app.privacy_policy')}</h1>

      <div class="space-y-4">
        <Card>
          <CardHeader><CardTitle>{t('app.1_data_we_collect')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>{t('app.when_you_sign_a_petition_we_collect_your_full_name_email_address_and_o')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('app.2_how_we_use_your_data')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>{t('app.your_data_is_used_solely_to_verify_your_signature_and_if_you_opt_in_to')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('app.3_your_rights')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>{t('app.you_have_the_right_to_withdraw_your_signature_at_any_time_by_using_the')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('app.4_data_retention')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>{t('app.we_retain_signature_data_for_as_long_as_the_associated_petition_is_act')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('app.5_cookies')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>{t('app.this_platform_uses_only_functional_cookies_necessary_for_admin_authent')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('app.6_contact')}</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              {t('app.for_privacy_related_enquiries_please_use_the_contact_details_in_the')}{' '}
              <A href="/imprint" class="underline">{t('app.imprint')}</A>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
