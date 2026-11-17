import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { AuthContext, type AdminStatus } from './useAuth'

const configurationError =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(Boolean(supabase))
  const [sessionError, setSessionError] = useState<string | null>(
    supabase ? null : configurationError,
  )
  const [adminStatus, setAdminStatus] = useState<AdminStatus>(
    supabase ? 'checking' : 'error',
  )
  const [authorizationError, setAuthorizationError] = useState<string | null>(
    supabase ? null : configurationError,
  )
  const [adminCheckVersion, setAdminCheckVersion] = useState(0)

  useEffect(() => {
    if (!supabase) return

    let active = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setAdminStatus(nextSession ? 'checking' : 'not-admin')
      setAuthorizationError(null)
      setSessionError(null)
      setIsSessionLoading(false)
    })

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setSession(null)
          setAdminStatus('not-admin')
          setAuthorizationError(null)
          setSessionError(error.message)
        } else {
          setSession(data.session)
          setAdminStatus(data.session ? 'checking' : 'not-admin')
          setAuthorizationError(null)
          setSessionError(null)
        }
        setIsSessionLoading(false)
      })
      .catch((error: unknown) => {
        if (!active) return
        setSession(null)
        setAdminStatus('not-admin')
        setAuthorizationError(null)
        setSessionError(getErrorMessage(error))
        setIsSessionLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const client = supabase
    if (isSessionLoading || !session || !client) return

    let active = true
    const verifyAdmin = async () => {
      try {
        const { data, error } = await client.rpc('is_cms_admin')
        if (!active) return
        if (error) {
          setAdminStatus('error')
          setAuthorizationError(error.message)
        } else if (data === true) {
          setAdminStatus('admin')
        } else {
          setAdminStatus('not-admin')
        }
      } catch (error: unknown) {
        if (!active) return
        setAdminStatus('error')
        setAuthorizationError(getErrorMessage(error))
      }
    }

    void verifyAdmin()

    return () => {
      active = false
    }
  }, [session, isSessionLoading, adminCheckVersion])

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) throw new Error(configurationError)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      if (!data.session) {
        throw new Error('No active session was returned. Check the email confirmation settings.')
      }

      setSession(data.session)
      setAdminStatus('checking')
      setAuthorizationError(null)
      setSessionError(null)
      setIsSessionLoading(false)
    },
    [],
  )

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error(configurationError)

    const { error } = await supabase.auth.signOut()
    if (error) throw error

    setSession(null)
    setAuthorizationError(null)
    setAdminStatus('not-admin')
  }, [])

  const refreshAdminStatus = useCallback(() => {
    setAdminStatus('checking')
    setAuthorizationError(null)
    setAdminCheckVersion((version) => version + 1)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isSessionLoading,
      sessionError,
      adminStatus,
      authorizationError,
      signInWithPassword,
      signOut,
      refreshAdminStatus,
    }),
    [
      session,
      isSessionLoading,
      sessionError,
      adminStatus,
      authorizationError,
      signInWithPassword,
      signOut,
      refreshAdminStatus,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
