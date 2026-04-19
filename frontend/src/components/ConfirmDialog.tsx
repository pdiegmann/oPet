import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{props.title}</AlertDialogTitle>
        <AlertDialogDescription>{props.description}</AlertDialogDescription>
        <div class="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t('app.cancel')}
          </Button>
          <Button
            variant={props.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={() => {
              props.onOpenChange(false)
              props.onConfirm()
            }}
          >
            {props.confirmLabel ?? t('app.confirm')}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
