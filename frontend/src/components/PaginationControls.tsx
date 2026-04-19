import { Show } from 'solid-js'
import { Button } from '@/components/ui/button'

interface PaginationControlsProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControls(props: PaginationControlsProps) {
  return (
    <Show when={props.totalPages > 1}>
      <div class="flex items-center justify-center gap-3 mt-4">
        <Button
          variant="outline"
          size="sm"
          disabled={props.page <= 1}
          onClick={() => props.onPageChange(props.page - 1)}
        >
          ← Prev
        </Button>
        <span class="text-sm text-muted-foreground">
          Page {props.page} of {props.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={props.page >= props.totalPages}
          onClick={() => props.onPageChange(props.page + 1)}
        >
          Next →
        </Button>
      </div>
    </Show>
  )
}
