import { createSignal, Show } from 'solid-js'
import { adminApi } from '@/lib/api.js'
import { getToken, isAdmin } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { t } from '@/lib/i18n'

export default function BackupPage() {
  if (!isAdmin()) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('app.only_admins_can_create_or_restore_backups')}</AlertDescription>
      </Alert>
    )
  }

  const token = getToken() ?? ''
  const [backupLoading, setBackupLoading] = createSignal(false)
  const [restoreLoading, setRestoreLoading] = createSignal(false)
  const [restoreFile, setRestoreFile] = createSignal<File | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = createSignal(false)
  const [pendingFile, setPendingFile] = createSignal<File | null>(null)

  async function handleBackup() {
    setError(null)
    setSuccess(null)
    setBackupLoading(true)
    try {
      await adminApi.backup(token)
      setSuccess(t('app.backup_downloaded_successfully'))
    } catch {
      setError(t('app.backup_failed_please_try_again'))
    } finally {
      setBackupLoading(false)
    }
  }

  async function handleRestore(e: Event) {
    e.preventDefault()
    const file = restoreFile()
    if (!file) return
    setPendingFile(file)
    setShowRestoreConfirm(true)
  }

  async function doRestore(file: File) {
    setError(null)
    setSuccess(null)
    setRestoreLoading(true)
    try {
      const result = await adminApi.restore(token, file)
      setSuccess(
        t('app.restore_complete_var_petition_s_and_var_signature_s_restored', {
          petitions: result.restoredPetitions,
          signatures: result.restoredSignatures,
        }),
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('app.restore_failed_please_check_the_backup_file_and_try_again'))
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={showRestoreConfirm()}
        onOpenChange={setShowRestoreConfirm}
        title={t('app.restore_from_backup_2')}
        description={t('app.this_will_add_or_overwrite_petitions_and_signatures_from_the_backup_fi')}
        confirmLabel={t('app.restore')}
        onConfirm={() => {
          const f = pendingFile()
          if (f) doRestore(f)
        }}
      />

      <div class="max-w-lg space-y-4">
        <h1 class="text-2xl font-bold">{t('app.backup_restore')}</h1>

        <Show when={error()}>
          <Alert variant="destructive">
            <AlertDescription>{error()}</AlertDescription>
          </Alert>
        </Show>
        <Show when={success()}>
          <Alert>
            <AlertDescription>{success()}</AlertDescription>
          </Alert>
        </Show>

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle>{t('app.create_backup')}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm text-muted-foreground">
              {t('app.download_a_full_json_backup_of_all_petitions_and_their_signatures')}
            </p>
            <Button onClick={handleBackup} disabled={backupLoading()}>
              {backupLoading() ? t('app.creating_backup') : t('app.download_backup')}
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader>
            <CardTitle>{t('app.restore_from_backup')}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm text-muted-foreground">
              {t('app.upload_a_previously_downloaded_backup_file_existing_petitions_and_sign')}
            </p>
            <form onSubmit={handleRestore}>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="backupFile">
                  {t('app.backup_file_json')}
                </label>
                <input
                  id="backupFile"
                  type="file"
                  accept=".json,application/json"
                  required
                  onChange={(e) => setRestoreFile(e.currentTarget.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" variant="secondary" disabled={restoreLoading() || !restoreFile()} class="mt-3">
                {restoreLoading() ? t('app.restoring') : t('app.restore_backup')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
