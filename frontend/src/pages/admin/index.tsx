import { Navigate } from '@solidjs/router'
import { isAuthenticated } from '@/stores/auth.js'

export default function AdminIndex() {
  return <Navigate href={isAuthenticated() ? '/admin/dashboard' : '/admin/login'} />
}
