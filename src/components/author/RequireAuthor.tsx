import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function RequireAuthor({ children }: { children: ReactNode }) {
  const { session, isSessionLoading, sessionError } = useAuth()
  const location = useLocation()

  if (isSessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p role="status" aria-live="polite" className="text-sm text-amber-100/80">
          Checking your author session…
        </p>
      </main>
    )
  }

  if (sessionError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/25 bg-black/45 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <h1 className="text-2xl font-bold">Unable to restore your session</h1>
          <p role="alert" className="mt-3 text-sm leading-6 text-red-200">
            {sessionError}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-5 py-3 font-semibold text-[#08200e] hover:brightness-110"
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
        to="/author/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}
