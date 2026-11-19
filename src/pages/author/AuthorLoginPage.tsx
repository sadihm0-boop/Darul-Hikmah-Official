import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { AuthorAuthLayout } from '../../components/author/AuthorAuthLayout'

export function AuthorLoginPage() {
  const { signInWithPassword, session, isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isSessionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p role="status" aria-live="polite" className="text-sm text-amber-100/80">
          Checking your session…
        </p>
      </main>
    )
  }

  if (session) return <Navigate to="/author/dashboard" replace />

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await signInWithPassword(email.trim(), password)
      navigate('/author/dashboard', { replace: true })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthorAuthLayout
      title="Author sign in"
      description="Sign in to continue to your Research Center author portal."
      footer={
        <p className="text-sm text-amber-100/75">
          Need an account?{' '}
          <Link
            to="/author/register"
            className="font-semibold text-[#ffd700] underline decoration-[#d4af37]/50 underline-offset-4 hover:text-white"
          >
            Register
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="author-login-email" className="mb-2 block text-sm font-medium text-amber-50">
            Email
          </label>
          <input
            id="author-login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="author-login-password" className="mb-2 block text-sm font-medium text-amber-50">
            Password
          </label>
          <input
            id="author-login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {errorMessage}
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
    </AuthorAuthLayout>
  )
}
