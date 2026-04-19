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

type RoleOption = { value: AdminUserRole; label: string }

const ROLE_OPTIONS: RoleOption[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'reader', label: 'Reader' },
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
        throw new Error('Organizer and reader users must be assigned to at least one petition.')
      }

      const payload = {
        email: email(),
        ...(password() ? { password: password() } : {}),
        role: role().value,
        petitionIds: role().value === 'admin' ? [] : selectedPetitionIds(),
      }

      if (editUserId()) {
        await adminApi.updateUser(token, editUserId()!, payload)
        setSuccess('User updated successfully.')
      } else {
        if (!password()) throw new Error('Password is required for new users.')
        await adminApi.createUser(token, {
          email: payload.email,
          password: payload.password!,
          role: payload.role,
          petitionIds: payload.petitionIds,
        })
        setSuccess('User created successfully.')
      }

      resetForm()
      refetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save user')
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
      setSuccess('User deleted successfully.')
      refetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setDeleteTargetId(null)
    }
  }

  if (!isAdmin()) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Only admins can manage users.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div class="space-y-6">
      <h1 class="text-2xl font-bold">Users</h1>

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
          <CardTitle>{editUserId() ? 'Edit user' : 'Create user'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <TextField>
                <TextFieldLabel>Email</TextFieldLabel>
                <TextFieldInput
                  type="email"
                  required
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </TextField>

              <TextField>
                <TextFieldLabel>
                  {editUserId() ? 'Password (optional, min 12 chars)' : 'Password (min 12 chars)'}
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
              <label class="text-sm font-medium">Role</label>
              <Select
                options={ROLE_OPTIONS}
                optionValue="value"
                optionTextValue="label"
                value={role()}
                onChange={(opt) => { if (opt) setRole(opt) }}
                itemComponent={(p) => <SelectItem item={p.item}>{p.item.rawValue.label}</SelectItem>}
              >
                <SelectTrigger class="w-[240px]">
                  <SelectValue<RoleOption>>{(s) => s.selectedOption().label}</SelectValue>
                </SelectTrigger>
                <SelectContent />
              </Select>
            </div>

            <Show when={role().value !== 'admin'}>
              <div class="space-y-2">
                <p class="text-sm font-medium">Assigned petitions</p>
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
                {submitting() ? 'Saving…' : editUserId() ? 'Save user' : 'Create user'}
              </Button>
              <Show when={editUserId()}>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>
              </Show>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Assigned petitions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
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
                        ? 'All petitions'
                        : user.petitions.map((p) => p.title).join(', ') || 'None assigned'}
                    </TableCell>
                    <TableCell class="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div class="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => startEdit(user.id)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(user.id)}>
                          Delete
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
        title="Delete user"
        description="Delete this user account? This cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
