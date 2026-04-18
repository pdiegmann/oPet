import type { JwtPayload } from './middleware/auth.js'

export type AppVariables = {
  user: JwtPayload
}
