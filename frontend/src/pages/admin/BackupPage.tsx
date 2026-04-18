import { createSignal, Show } from 'solid-js'
import { adminApi } from '../../lib/api.js'
import { getToken } from '../../stores/auth.js'

export default function BackupPage() {
  const token = getToken() ?? ''
  const [backupLoading, setBackupLoading] = createSignal(false)
  const [restoreLoading, setRestoreLoading] = createSignal(false)
  const [restoreFile, setRestoreFile] = createSignal<File | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)

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
    if (!confirm('This will add or overwrite petitions and signatures from the backup file. Continue?')) return
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
    <div style="max-width: 560px;">
      <h1 class="page-title">Backup & Restore</h1>

      <Show when={error()}>
        <div class="alert alert-error">{error()}</div>
      </Show>
      <Show when={success()}>
        <div class="alert alert-success">{success()}</div>
      </Show>

      {/* Backup */}
      <div class="card" style="margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">Create Backup</h2>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Download a full JSON backup of all petitions and their signatures.
        </p>
        <button class="btn btn-primary" onClick={handleBackup} disabled={backupLoading()}>
          {backupLoading() ? 'Creating backup…' : '⬇ Download Backup'}
        </button>
      </div>

      {/* Restore */}
      <div class="card">
        <h2 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem;">Restore from Backup</h2>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
          Upload a previously downloaded backup file. Existing petitions and signatures will be
          updated; missing ones will be added. No data will be deleted.
        </p>
        <form onSubmit={handleRestore}>
          <div class="form-group">
            <label for="backupFile">Backup file (.json)</label>
            <input
              id="backupFile"
              type="file"
              accept=".json,application/json"
              required
              onChange={(e) => setRestoreFile(e.currentTarget.files?.[0] ?? null)}
            />
          </div>
          <button
            type="submit"
            class="btn btn-secondary"
            disabled={restoreLoading() || !restoreFile()}
          >
            {restoreLoading() ? 'Restoring…' : '⬆ Restore Backup'}
          </button>
        </form>
      </div>
    </div>
  )
}
