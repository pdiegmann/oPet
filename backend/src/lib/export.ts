import { stringify } from 'csv-stringify/sync'
import { prisma } from '../db.js'

export interface ExportFilters {
  petitionId?: string
  verified?: boolean
  withdrawn?: boolean
  country?: string
}

export async function exportSignatures(
  format: 'csv' | 'json',
  filters: ExportFilters,
  allowedPetitionIds?: string[],
): Promise<{ data: string; contentType: string; filename: string }> {
  const where = {
    ...(filters.petitionId ? { petitionId: filters.petitionId } : {}),
    ...(allowedPetitionIds ? { petitionId: { in: allowedPetitionIds } } : {}),
    ...(filters.verified !== undefined ? { verified: filters.verified } : {}),
    ...(filters.withdrawn !== undefined ? { withdrawn: filters.withdrawn } : {}),
    ...(filters.country ? { country: filters.country } : {}),
  }

  const signatures = await prisma.signature.findMany({
    where,
    include: { petition: { select: { title: true, slug: true } } },
    orderBy: { createdAt: 'asc' },
  })

  const rows = signatures.map((s) => ({
    id: s.id,
    petition_slug: s.petition.slug,
    petition_title: s.petition.title,
    full_name: s.fullName,
    email: s.email,
    city: s.city ?? '',
    country: s.country ?? '',
    comment: s.comment ?? '',
    verified: s.verified,
    withdrawn: s.withdrawn,
    public_opt_in: s.publicOptIn,
    updates_opt_in: s.updatesOptIn,
    recipient_share_opt_in: s.recipientShareOptIn,
    created_at: s.createdAt.toISOString(),
    verified_at: s.verifiedAt?.toISOString() ?? '',
    withdrawn_at: s.withdrawnAt?.toISOString() ?? '',
  }))

  if (format === 'json') {
    return {
      data: JSON.stringify(rows, null, 2),
      contentType: 'application/json',
      filename: 'signatures.json',
    }
  }

  const csv = stringify(rows, { header: true })
  return {
    data: csv,
    contentType: 'text/csv',
    filename: 'signatures.csv',
  }
}
