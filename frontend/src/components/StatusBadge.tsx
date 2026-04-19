import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'

type PetitionStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'
type SigStatus = 'pending' | 'verified' | 'withdrawn'

const petitionVariant: Record<PetitionStatus, 'default' | 'secondary' | 'outline' | 'success' | 'warning'> = {
  draft: 'secondary',
  active: 'success',
  paused: 'warning',
  completed: 'default',
  archived: 'outline',
}

const sigVariant: Record<SigStatus, 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  verified: 'success',
  withdrawn: 'error',
}

const petitionStatusKey: Record<PetitionStatus, string> = {
  draft: 'app.status_draft',
  active: 'app.status_active',
  paused: 'app.status_paused',
  completed: 'app.status_completed',
  archived: 'app.status_archived',
}

const signatureStatusKey: Record<SigStatus, string> = {
  pending: 'app.status_pending',
  verified: 'app.status_verified',
  withdrawn: 'app.status_withdrawn',
}

export type { PetitionStatus, SigStatus }

interface StatusBadgeProps {
  status: PetitionStatus | SigStatus
  type?: 'petition' | 'signature'
}

export function StatusBadge(props: StatusBadgeProps) {
  const variant = () =>
    props.type === 'signature'
      ? sigVariant[props.status as SigStatus]
      : petitionVariant[props.status as PetitionStatus]

  const labelKey = () =>
    props.type === 'signature'
      ? signatureStatusKey[props.status as SigStatus]
      : petitionStatusKey[props.status as PetitionStatus]

  return <Badge variant={variant()}>{t(labelKey())}</Badge>
}
