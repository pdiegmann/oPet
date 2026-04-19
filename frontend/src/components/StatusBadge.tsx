import { Badge } from '@/components/ui/badge'

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

interface StatusBadgeProps {
  status: PetitionStatus | SigStatus
  type?: 'petition' | 'signature'
}

export function StatusBadge(props: StatusBadgeProps) {
  const variant = () =>
    props.type === 'signature'
      ? sigVariant[props.status as SigStatus]
      : petitionVariant[props.status as PetitionStatus]

  return <Badge variant={variant()}>{props.status}</Badge>
}
