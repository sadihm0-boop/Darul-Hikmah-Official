import { useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

function LoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <div role="status" aria-live="polite">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#d4af37]/30 border-t-[#ffd700]" />
        <p className="text-sm tracking-wide text-amber-100/80">
          Verifying your administrator access…
        </p>
      </div>
    </main>
  )
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const {
    session,
    isSessionLoading,
    sessionError,
    adminStatus,
    authorizationError,
    refreshAdminStatus,
    signOut,
  } = useAuth()
  const location = useLocation()
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (isSessionLoading || (session && adminStatus === 'checking')) {
    return <LoadingState />
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-black/50 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="mb-3 text-2xl font-bold">Unable to restore session</h1>
          <p role="alert" className="mb-6 text-sm text-red-200">{sessionError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#08200e] hover:bg-[#ffd700]"
          >
            Try again
          </button>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  if (adminStatus === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-black/50 p-8 shadow-2xl backdrop-blur-xl">
          <h1 className="mb-3 text-2xl font-bold">Admin access could not be verified</h1>
          <p role="alert" className="mb-6 text-sm text-red-200">
            {authorizationError ?? 'The administrator check failed. Access is denied until it succeeds.'}
          </p>
          <button
            type="button"
            onClick={refreshAdminStatus}
            className="rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#08200e] hover:bg-[#ffd700]"
          >
            Retry verification
          </button>
        </section>
      </main>
    )
  }

  if (adminStatus !== 'admin') {
    const handleSignOut = async () => {
      setIsSigningOut(true)
      setLogoutError(null)
      try {
        await signOut()
      } catch (error) {
        setLogoutError(error instanceof Error ? error.message : 'Unable to sign out.')
      } finally {
        setIsSigningOut(false)
      }
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/30 bg-black/50 p-8 text-center shadow-2xl backdrop-blur-xl">
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-[#d4af37]">Darul Hikmah</p>
          <h1 className="mb-3 text-2xl font-bold">Administrator access required</h1>
          <p className="mb-6 text-sm leading-6 text-amber-50/80">
            This account is signed in, but it is not authorized to access the admin area.
          </p>
          {logoutError && <p role="alert" className="mb-4 text-sm text-red-200">{logoutError}</p>}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-lg bg-[#d4af37] px-5 py-3 font-semibold text-[#08200e] hover:bg-[#ffd700] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </section>
      </main>
    )
  }

  return children
}
