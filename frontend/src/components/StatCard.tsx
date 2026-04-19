import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
}

export function StatCard(props: StatCardProps) {
  return (
    <Card class="text-center">
      <CardHeader class="pb-2">
        <CardTitle class="text-sm font-medium text-muted-foreground">{props.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="text-3xl font-bold">
          {typeof props.value === 'number' ? props.value.toLocaleString() : props.value}
        </div>
      </CardContent>
    </Card>
  )
}
