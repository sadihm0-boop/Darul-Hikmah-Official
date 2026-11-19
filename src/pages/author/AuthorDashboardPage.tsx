import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  AuthorDashboardServiceError,
  getAuthorDashboardData,
  type AuthorDashboardData,
} from '../../lib/authorDashboardService'
import {
  AuthorArticlesServiceError,
  getMyArticles,
  getMyArticleReviewMetadata,
  type ArticleReviewFeedback,
  type ArticleSummary,
} from '../../lib/authorArticlesService'

type ReviewFeedbackByArticle = Record<string, ArticleReviewFeedback | null>
type ReviewErrorByArticle = Record<string, string>
type ReviewLoadingByArticle = Record<string, boolean>

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function AuthorDashboardPage() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<AuthorDashboardData | null>(null)
  const [articles, setArticles] = useState<ArticleSummary[]>([])
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedbackByArticle>({})
  const [reviewErrors, setReviewErrors] = useState<ReviewErrorByArticle>({})
  const [reviewFeedbackLoading, setReviewFeedbackLoading] =
    useState<ReviewLoadingByArticle>({})
  const reviewFeedbackCache = useRef(new Map<string, ArticleReviewFeedback>())
  const reviewFeedbackRequests = useRef(
    new Map<string, Promise<ArticleReviewFeedback>>(),
  )
  const [dashboardUserId, setDashboardUserId] = useState<string | null>(null)
  const isMounted = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const userId = session?.user.id ?? null
  const userIdRef = useRef(userId)
  userIdRef.current = userId
  const hasCurrentUserDashboard = dashboardUserId === userId
  const visibleDashboardData = hasCurrentUserDashboard ? dashboardData : null
  const visibleArticles = hasCurrentUserDashboard ? articles : []
  const visibleReviewFeedback: ReviewFeedbackByArticle = hasCurrentUserDashboard
    ? reviewFeedback
    : {}
  const visibleReviewErrors: ReviewErrorByArticle = hasCurrentUserDashboard
    ? reviewErrors
    : {}
  const visibleReviewFeedbackLoading: ReviewLoadingByArticle = hasCurrentUserDashboard
    ? reviewFeedbackLoading
    : {}
  const visibleLoadError = hasCurrentUserDashboard ? loadError : null
  const visibleIsLoading = !hasCurrentUserDashboard || isLoading
  const email = session?.user.email ?? null
  const metadataName = session?.user.user_metadata?.full_name
  const metadataFullName = typeof metadataName === 'string' ? metadataName : null

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    setDashboardUserId(userId)
    setDashboardData(null)
    setArticles([])
    setReviewFeedback({})
    setReviewErrors({})
    setReviewFeedbackLoading({})
    setLoadError(null)
    setIsLoading(true)
  }, [userId])

  const loadReviewFeedback = useCallback(
    async (articleId: string, isActive: () => boolean) => {
      if (!userId || !isActive()) return

      const cacheKey = `${userId}:${articleId}`
      setReviewFeedbackLoading((current) => ({ ...current, [articleId]: true }))
      setReviewErrors((current) => {
        const next = { ...current }
        delete next[articleId]
        return next
      })

      try {
        let feedback = reviewFeedbackCache.current.get(cacheKey)
        if (!feedback) {
          let request = reviewFeedbackRequests.current.get(cacheKey)
          if (!request) {
            request = getMyArticleReviewMetadata(articleId)
              .then((result) => {
                reviewFeedbackCache.current.set(cacheKey, result)
                return result
              })
              .finally(() => {
                reviewFeedbackRequests.current.delete(cacheKey)
              })
            reviewFeedbackRequests.current.set(cacheKey, request)
          }
          feedback = await request
        }

        if (!isActive()) return
        setReviewFeedback((current) => ({ ...current, [articleId]: feedback }))
      } catch (error: unknown) {
        if (!isActive()) return
        setReviewErrors((current) => ({
          ...current,
          [articleId]:
            error instanceof AuthorArticlesServiceError
              ? error.message
              : 'Review feedback could not be loaded.',
        }))
      } finally {
        if (isActive()) {
          setReviewFeedbackLoading((current) => ({ ...current, [articleId]: false }))
        }
      }
    },
    [userId],
  )

  const loadDashboard = useCallback(async (isActive: () => boolean) => {
    if (!userId) {
      if (isActive()) {
        setLoadError('Your author session is unavailable. Sign in again to continue.')
        setIsLoading(false)
      }
      return
    }

    if (isActive()) {
      setIsLoading(true)
      setLoadError(null)
    }
    try {
      const [nextDashboardData, nextArticles] = await Promise.all([
        getAuthorDashboardData(userId, email),
        getMyArticles(),
      ])
      if (!isActive()) return
      setDashboardData(nextDashboardData)
      setArticles(nextArticles)

      const feedbackArticles = nextArticles.filter(
        (article) =>
          article.status === 'revision_requested' || article.status === 'rejected',
      )
      void Promise.all(
        feedbackArticles.map((article) =>
          loadReviewFeedback(article.id, isActive),
        ),
      )
    } catch (error: unknown) {
      if (isActive()) {
        setLoadError(
          error instanceof AuthorDashboardServiceError
            ? error.message
            : 'Your author dashboard could not be loaded. Please try again.',
        )
      }
    } finally {
      if (isActive()) setIsLoading(false)
    }
  }, [email, loadReviewFeedback, userId])

  useEffect(() => {
    let active = true
    const requestUserId = userId
    void Promise.resolve().then(() => {
      if (active) {
        return loadDashboard(
          () => active && userIdRef.current === requestUserId,
        )
      }
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
    { label: 'Total Articles', value: visibleDashboardData?.totalArticles },
    { label: 'Draft', value: visibleDashboardData?.draftArticles },
    { label: 'Pending Review', value: visibleDashboardData?.pendingReviewArticles },
    { label: 'Published', value: visibleDashboardData?.publishedArticles },
  ]

  if (!hasCurrentUserDashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p role="status" aria-live="polite" className="text-sm text-amber-100/80">
          Loading your profile and article statistics…
        </p>
      </main>
    )
  }

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
              {visibleDashboardData?.fullName || metadataFullName
                ? `, ${visibleDashboardData?.fullName || metadataFullName}`
                : ''}
            </p>
            <p className="mt-1 text-sm text-amber-50/60">
              {visibleDashboardData?.email ?? email ?? 'Email unavailable'}
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

        {(errorMessage || visibleLoadError) && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {errorMessage || visibleLoadError}
          </p>
        )}

        {visibleLoadError ? (
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
        ) : visibleIsLoading ? (
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

            {visibleDashboardData?.totalArticles === 0 ? (
              <section className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <h2 className="text-2xl font-semibold">No articles yet</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-50/75">
                  Create a draft to begin preparing an article for review.
                </p>
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-[#d4af37]/20 bg-[#008000]/10 p-6 shadow-xl backdrop-blur-xl sm:p-8">
                <h2 className="text-2xl font-semibold">Your articles</h2>
                <ul className="mt-5 space-y-3">
                  {visibleArticles.map((article) => {
                    const hasReviewFeedback =
                      article.status === 'revision_requested' || article.status === 'rejected'
                    const feedback = visibleReviewFeedback[article.id]
                    const feedbackError = visibleReviewErrors[article.id]
                    const isFeedbackLoading =
                      visibleReviewFeedbackLoading[article.id] ?? false

                    return (
                      <li
                        key={article.id}
                        className="rounded-xl border border-[#d4af37]/20 bg-black/25 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-amber-50">{article.title}</h3>
                            <p className="mt-1 text-xs capitalize text-amber-50/60">
                              {article.status.replace(/_/g, ' ')} · Updated {formatDate(article.updated_at)}
                            </p>
                          </div>
                          <Link
                            to={`/author/articles/${article.id}/edit`}
                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d4af37]/35 px-3 text-xs font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                          >
                            {article.status === 'draft' || article.status === 'revision_requested'
                              ? 'Open article'
                              : 'View article'}
                          </Link>
                        </div>
                        {hasReviewFeedback && (
                          <div className="mt-4 border-t border-white/10 pt-3">
                            <h4 className="text-sm font-semibold text-[#ffd700]">
                              {article.status === 'revision_requested'
                                ? 'Requested revisions'
                                : 'Review feedback'}
                            </h4>
                            {feedbackError ? (
                              <div className="mt-2">
                                <p role="alert" className="text-sm text-red-200">
                                  {feedbackError}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const requestUserId = userId
                                    void loadReviewFeedback(
                                      article.id,
                                      () =>
                                        isMounted.current &&
                                        userIdRef.current === requestUserId,
                                    )
                                  }}
                                  className="mt-2 min-h-9 rounded-lg border border-[#d4af37]/35 px-3 text-xs font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                                >
                                  Try again
                                </button>
                              </div>
                            ) : isFeedbackLoading ? (
                              <p role="status" className="mt-2 text-sm text-amber-50/60">
                                Loading review feedback…
                              </p>
                            ) : (
                              <>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-50/80">
                                  {feedback?.review_note ||
                                    (article.status === 'revision_requested'
                                      ? 'The administrator requested revisions but did not include a written note.'
                                      : 'The article was rejected without a written review note.')}
                                </p>
                                {feedback?.reviewed_at && (
                                  <p className="mt-2 text-xs text-amber-50/55">
                                    Reviewed {formatDate(feedback.reviewed_at)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            to="/author/articles/new"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-6 text-sm font-bold text-[#08200e] transition hover:brightness-110"
          >
            Submit New Article
          </Link>
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
