import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AdminStatus = 'checking' | 'admin' | 'not-admin' | 'error'

interface AuthContextValue {
  session: Session | null
  isSessionLoading: boolean
  sessionError: string | null
  adminStatus: AdminStatus
  authorizationError: string | null
  signInWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshAdminStatus: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }
  return context
}
