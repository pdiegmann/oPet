import { createSignal, Show } from 'solid-js'
import { adminApi } from '@/lib/api.js'
import { getToken, isAdmin } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function BackupPage() {
  if (!isAdmin()) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Only admins can create or restore backups.</AlertDescription>
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
      setSuccess('Backup downloaded successfully.')
    } catch {
      setError('Backup failed. Please try again.')
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
        `Restore complete — ${result.restoredPetitions} petition(s) and ${result.restoredSignatures} signature(s) restored.`,
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Restore failed. Please check the backup file and try again.')
    } finally {
      setRestoreLoading(false)
    }
  }

  return (
    <>
      <ConfirmDialog
        open={showRestoreConfirm()}
        onOpenChange={setShowRestoreConfirm}
        title="Restore from backup?"
        description="This will add or overwrite petitions and signatures from the backup file. No data will be deleted."
        confirmLabel="Restore"
        onConfirm={() => {
          const f = pendingFile()
          if (f) doRestore(f)
        }}
      />

      <div class="max-w-lg space-y-4">
        <h1 class="text-2xl font-bold">Backup &amp; Restore</h1>

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
            <CardTitle>Create Backup</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm text-muted-foreground">
              Download a full JSON backup of all petitions and their signatures.
            </p>
            <Button onClick={handleBackup} disabled={backupLoading()}>
              {backupLoading() ? 'Creating backup…' : 'Download Backup'}
            </Button>
          </CardContent>
        </Card>

        {/* Restore */}
        <Card>
          <CardHeader>
            <CardTitle>Restore from Backup</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <p class="text-sm text-muted-foreground">
              Upload a previously downloaded backup file. Existing petitions and signatures will be
              updated; missing ones will be added. No data will be deleted.
            </p>
            <form onSubmit={handleRestore}>
              <div class="space-y-1">
                <label class="text-sm font-medium" for="backupFile">
                  Backup file (.json)
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
                {restoreLoading() ? 'Restoring…' : 'Restore Backup'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
