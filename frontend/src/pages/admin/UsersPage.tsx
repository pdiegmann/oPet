import { createResource, createSignal, For, Show } from 'solid-js'
import { adminApi, AdminUserRole } from '@/lib/api.js'
import { getToken, isAdmin } from '@/stores/auth.js'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { TextField, TextFieldInput, TextFieldLabel } from '@/components/ui/text-field'
import { t } from '@/lib/i18n'

type RoleOption = { value: AdminUserRole; label: string }

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'admin', label: 'app.role_admin' },
  { value: 'organizer', label: 'app.role_organizer' },
  { value: 'reader', label: 'app.role_reader' },
]

export default function UsersPage() {
  const token = getToken() ?? ''

  const [users, { refetch: refetchUsers }] = createResource(() => adminApi.getUsers(token))
  const [petitions] = createResource(() => adminApi.getPetitions(token, { page: 1, limit: 100 }))

  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [role, setRole] = createSignal<RoleOption>(ROLE_OPTIONS[2])
  const [selectedPetitionIds, setSelectedPetitionIds] = createSignal<string[]>([])

  const [editUserId, setEditUserId] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [success, setSuccess] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)
  const [deleteTargetId, setDeleteTargetId] = createSignal<string | null>(null)

  function resetForm() {
    setEmail('')
    setPassword('')
    setRole(ROLE_OPTIONS[2])
    setSelectedPetitionIds([])
    setEditUserId(null)
  }

  function togglePetition(petitionId: string, checked: boolean) {
    setSelectedPetitionIds((prev) => {
      if (checked) {
        if (prev.includes(petitionId)) return prev
        return [...prev, petitionId]
      }
      return prev.filter((id) => id !== petitionId)
    })
  }

  function startEdit(userId: string) {
    const user = users()?.find((u) => u.id === userId)
    if (!user) return
    setEditUserId(user.id)
    setEmail(user.email)
    setPassword('')
    setRole(ROLE_OPTIONS.find((opt) => opt.value === user.role) ?? ROLE_OPTIONS[2])
    setSelectedPetitionIds(user.petitionIds)
    setError(null)
    setSuccess(null)
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    if (submitting()) return

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (role().value !== 'admin' && selectedPetitionIds().length === 0) {
        throw new Error(t('app.organizer_and_reader_users_must_be_assigned_to_at_least_one_petition'))
      }

      const payload = {
        email: email(),
        ...(password() ? { password: password() } : {}),
        role: role().value,
        petitionIds: role().value === 'admin' ? [] : selectedPetitionIds(),
      }

      if (editUserId()) {
        await adminApi.updateUser(token, editUserId()!, payload)
        setSuccess(t('app.user_updated_successfully'))
      } else {
        if (!password()) throw new Error(t('app.password_is_required_for_new_users'))
        await adminApi.createUser(token, {
          email: payload.email,
          password: payload.password!,
          role: payload.role,
          petitionIds: payload.petitionIds,
        })
        setSuccess(t('app.user_created_successfully'))
      }

      resetForm()
      refetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('app.failed_to_save_user'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    const userId = deleteTargetId()
    if (!userId) return
    setError(null)
    setSuccess(null)
    try {
      await adminApi.deleteUser(token, userId)
      setSuccess(t('app.user_deleted_successfully'))
      refetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('app.failed_to_delete_user'))
    } finally {
      setDeleteTargetId(null)
    }
  }

  if (!isAdmin()) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('app.only_admins_can_manage_users')}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">{t('app.users')}</h1>

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

      <Card>
        <CardHeader>
          <CardTitle>{editUserId() ? t('app.edit_user') : t('app.create_user')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <TextField>
                <TextFieldLabel>{t('app.email')}</TextFieldLabel>
                <TextFieldInput
                  type="email"
                  required
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>
                  {editUserId() ? t('app.password_optional_min_12_chars') : t('app.password_min_12_chars')}
                </TextFieldLabel>
                <TextFieldInput
                  type="password"
                  required={!editUserId()}
                  minlength={12}
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                />
              </TextField>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-medium">{t('app.role')}</label>
              <Select
                options={ROLE_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={role()}
                onChange={(opt) => { if (opt) setRole(opt) }}
                itemComponent={(p) => <SelectItem item={p.item}>{t(p.item.rawValue.label)}</SelectItem>}
              >
                <SelectTrigger class="w-[240px]">
                  <SelectValue<RoleOption>>{(s) => t(s.selectedOption().label)}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <Show when={role().value !== 'admin'}>
              <div class="space-y-2">
                <p class="text-sm font-medium">{t('app.assigned_petitions')}</p>
                <div class="grid grid-cols-2 gap-2">
                  <For each={petitions()?.petitions ?? []}>
                    {(petition) => {
                      const checked = () => selectedPetitionIds().includes(petition.id)
                      return (
                        <label class="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={checked()}
                            onChange={(next) => togglePetition(petition.id, next)}
                          />
                          <span>{petition.title}</span>
                        </label>
                      )
                    }}
                  </For>
                </div>
              </div>
            </Show>

            <div class="flex gap-2">
              <Button type="submit" disabled={submitting()}>
                {submitting() ? t('app.saving') : editUserId() ? t('app.save_user') : t('app.create_user')}
              </Button>
              <Show when={editUserId()}>
                <Button type="button" variant="outline" onClick={resetForm}>{t('app.cancel_edit')}</Button>
              </Show>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('app.existing_users')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('app.email')}</TableHead>
                <TableHead>{t('app.role')}</TableHead>
                <TableHead>{t('app.assigned_petitions')}</TableHead>
                <TableHead>{t('app.created')}</TableHead>
                <TableHead>{t('app.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={users() ?? []}>
                {(user) => (
                  <TableRow>
                    <TableCell>{user.email}</TableCell>
                    <TableCell class="capitalize">{user.role}</TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {user.role === 'admin'
                        ? t('app.all_petitions')
                        : user.petitions.map((p) => p.title).join(', ') || t('app.none_assigned')}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div class="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(user.id)}>
                          {t('app.edit')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(user.id)}>
                          {t('app.delete')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteTargetId() !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
        title={t('app.delete_user')}
        description={t('app.delete_this_user_account_this_cannot_be_undone')}
        confirmLabel={t('app.delete')}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
