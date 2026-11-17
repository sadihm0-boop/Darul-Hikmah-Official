import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  AuthorDashboardServiceError,
  getAuthorDashboardData,
  type AuthorDashboardData,
} from '../../lib/authorDashboardService'

export function AuthorDashboardPage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<AuthorDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitNotice, setSubmitNotice] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const userId = session?.user.id ?? null
  const email = session?.user.email ?? null
  const metadataName = session?.user.user_metadata?.full_name
  const metadataFullName = typeof metadataName === 'string' ? metadataName : null

  const loadDashboard = useCallback(async () => {
    if (!userId) {
      setLoadError('Your author session is unavailable. Sign in again to continue.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    try {
      setDashboardData(await getAuthorDashboardData(userId, email))
    } catch (error: unknown) {
      setLoadError(
        error instanceof AuthorDashboardServiceError
          ? error.message
          : 'Your author dashboard could not be loaded. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [email, userId])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) return loadDashboard()
    })

    return () => {
      active = false
    }
  }, [loadDashboard, refreshVersion])

  const handleSignOut = async () => {
    setIsSigningOut(true)
    setErrorMessage(null)
    try {
      await signOut()
      navigate('/author/login', { replace: true })
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign out.')
    } finally {
      setIsSigningOut(false)
    }
  }

  const statistics = [
    { label: 'Total Articles', value: dashboardData?.totalArticles },
    { label: 'Draft', value: dashboardData?.draftArticles },
    { label: 'Pending Review', value: dashboardData?.pendingReviewArticles },
    { label: 'Published', value: dashboardData?.publishedArticles },
  ]

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 rounded-2xl border border-[#d4af37]/25 bg-black/35 p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
              Darul Hikmah Research Center
            </p>
            <h1 className="mt-2 text-3xl font-bold">Author dashboard</h1>
            <p className="mt-2 text-sm text-amber-50/75">
              Welcome
              {dashboardData?.fullName || metadataFullName
                ? `, ${dashboardData?.fullName || metadataFullName}`
                : ''}
            </p>
            <p className="mt-1 text-sm text-amber-50/60">
              {dashboardData?.email ?? email ?? 'Email unavailable'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isSigningOut}
            className="min-h-10 rounded-lg border border-[#d4af37]/35 px-4 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </header>

        {(errorMessage || loadError) && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {errorMessage || loadError}
          </p>
        )}

        {loadError ? (
          <section className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <h2 className="text-2xl font-semibold">Dashboard data unavailable</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/75">
              We could not load your profile and article statistics.
            </p>
            <button
              type="button"
              onClick={() => setRefreshVersion((version) => version + 1)}
              className="mt-6 min-h-10 rounded-lg border border-[#d4af37]/35 px-4 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
            >
              Try again
            </button>
          </section>
        ) : isLoading ? (
          <section
            role="status"
            className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl"
          >
            <p className="text-sm text-amber-50/75">Loading your profile and article statistics…</p>
          </section>
        ) : (
          <>
            <section
              aria-label="Article statistics"
              className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {statistics.map(({ label, value }) => (
                <article
                  key={label}
                  className="rounded-2xl border border-[#d4af37]/20 bg-black/35 p-5 shadow-lg backdrop-blur-xl"
                >
                  <p className="text-sm font-medium text-amber-50/70">{label}</p>
                  <p className="mt-3 text-3xl font-bold text-[#ffd700]">
                    {value ?? '—'}
                  </p>
                </article>
              ))}
            </section>

            {dashboardData?.totalArticles === 0 ? (
              <section className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <h2 className="text-2xl font-semibold">No articles yet</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/75">
                  You have not submitted any articles. Article submission will be available in a
                  future phase.
                </p>
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <h2 className="text-2xl font-semibold">Your articles</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/75">
                  Your article totals are shown above. Article submission tools are not available
                  yet.
                </p>
              </section>
            )}
          </>
        )}

        {submitNotice && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-amber-400/30 bg-amber-950/30 p-3 text-sm text-amber-100"
          >
            {submitNotice}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setSubmitNotice('Article submission is not available yet.')}
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-6 text-sm font-bold text-[#08200e] transition hover:brightness-110"
          >
            Submit New Article
          </button>
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d4af37]/35 px-5 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
          >
            Visit the public website
          </Link>
        </div>
      </div>
    </main>
  )
}
