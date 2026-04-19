import { useParams } from '@solidjs/router'
import { A } from '@solidjs/router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
