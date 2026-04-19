import { A } from '@solidjs/router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-extrabold mb-6">Privacy Policy</h1>

      <div class="space-y-4">
        <Card>
          <CardHeader><CardTitle>1. Data we collect</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              When you sign a petition, we collect your full name, email address, and optionally your city, country,
              and a comment. We also log your IP address for rate-limiting purposes only.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>2. How we use your data</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              Your data is used solely to verify your signature and, if you opt in, to send you updates about
              the petition you signed. We do not sell or share your data with third parties except as required
              by law or as explicitly consented to.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>3. Your rights</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              You have the right to withdraw your signature at any time by using the withdrawal link provided
              in your confirmation email. You may also request deletion of your personal data by contacting us.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>4. Data retention</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              We retain signature data for as long as the associated petition is active, plus 90 days thereafter.
              Withdrawn signatures are anonymised after 30 days.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>5. Cookies</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              This platform uses only functional cookies necessary for admin authentication. No tracking
              or advertising cookies are used.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>6. Contact</CardTitle></CardHeader>
          <CardContent class="text-sm text-muted-foreground leading-relaxed">
            <p>
              For privacy-related enquiries, please use the contact details in the{' '}
              <A href="/imprint" class="underline">Imprint</A>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
