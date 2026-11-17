import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function AdminLoginPage() {
  const {
    signInWithPassword,
    session,
    isSessionLoading,
    sessionError,
    adminStatus,
  } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isSessionLoading || (session && adminStatus === 'checking')) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p role="status" aria-live="polite" className="text-sm text-amber-100/80">
          Checking your session…
        </p>
      </main>
    )
  }

  if (session && adminStatus === 'admin') {
    return <Navigate to="/admin" replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await signInWithPassword(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-[#d4af37]/25 bg-black/45 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-10">
        <header className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
            Darul Hikmah
          </p>
          <h1 className="text-3xl font-bold">Administrator sign in</h1>
          <p className="mt-3 text-sm leading-6 text-amber-50/75">
            Sign in with an authorized administrator account.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-sm font-medium text-amber-50">
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="mb-2 block text-sm font-medium text-amber-50">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20"
            />
          </div>

          {sessionError && (
            <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
              {sessionError}
            </p>
          )}

          {errorMessage && (
            <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          {session && adminStatus === 'error' && (
            <p role="alert" className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200">
              Admin authorization could not be verified. Please retry later.
            </p>
          )}

          {session && adminStatus === 'not-admin' && (
            <p role="alert" className="rounded-lg border border-amber-400/30 bg-amber-950/30 p-3 text-sm text-amber-100">
              This account is not authorized to access the admin area.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-5 py-3 font-bold text-[#08200e] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-7 border-t border-white/10 pt-5 text-center">
          <Link to="/" className="text-sm text-amber-100/75 transition hover:text-[#ffd700]">
            Return to the public website
          </Link>
        </div>
      </section>
    </main>
  )
}
