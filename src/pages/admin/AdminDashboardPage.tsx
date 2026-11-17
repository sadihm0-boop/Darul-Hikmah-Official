import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

export function AdminDashboardPage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setErrorMessage(null)

    try {
      await signOut()
      navigate('/admin/login', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
              Darul Hikmah
            </p>
            <h1 className="text-3xl font-bold">Admin dashboard</h1>
            <p className="mt-2 text-sm text-amber-50/70">
              Signed in as {session?.user.email ?? 'administrator'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded-lg border border-[#d4af37]/40 px-5 py-3 font-semibold text-[#ffd700] transition hover:bg-[#d4af37]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        {errorMessage && (
          <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-950/40 p-4 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Authentication is ready</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/75">
            Administrator access was verified. Content management features are outside this authentication phase.
          </p>
        </section>
      </div>
    </main>
  )
}
