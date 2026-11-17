import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import { supabase } from '../../lib/supabaseClient'
import { AuthorAuthLayout } from '../../components/author/AuthorAuthLayout'

export function AuthorRegisterPage() {
  const { session, isSessionLoading } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    setErrorMessage(null)

    if (!fullName.trim()) {
      setErrorMessage('Enter your full name.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    const client = supabase
    if (!client) {
      setErrorMessage('Author registration is unavailable because Supabase is not configured.')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (error) throw error
      if (!data.session) {
        setErrorMessage(
          'Your account was created, but no active session was returned. Check that email confirmation is disabled, then sign in.',
        )
        return
      }

      navigate('/author/dashboard', { replace: true })
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to create your author account.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthorAuthLayout
      title="Create an author account"
      description="Register to access the Darul Hikmah Research Center author portal."
      footer={
        <p className="text-sm text-amber-100/75">
          Already registered?{' '}
          <Link
            to="/author/login"
            className="font-semibold text-[#ffd700] underline decoration-[#d4af37]/50 underline-offset-4 hover:text-white"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="author-full-name" className="mb-2 block text-sm font-medium text-amber-50">
            Full Name
          </label>
          <input
            id="author-full-name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="author-register-email" className="mb-2 block text-sm font-medium text-amber-50">
            Email
          </label>
          <input
            id="author-register-email"
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
          <label htmlFor="author-register-password" className="mb-2 block text-sm font-medium text-amber-50">
            Password
          </label>
          <input
            id="author-register-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="author-confirm-password" className="mb-2 block text-sm font-medium text-amber-50">
            Confirm Password
          </label>
          <input
            id="author-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthorAuthLayout>
  )
}
