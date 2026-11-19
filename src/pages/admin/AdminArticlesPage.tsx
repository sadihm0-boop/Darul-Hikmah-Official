import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  AdminArticlesServiceError,
  getAdminArticleReviewMetadata,
  getAdminArticles,
  transitionAdminArticle,
  type AdminArticleAction,
  type AdminArticle,
} from '../../lib/adminArticlesService'
import type {
  AdminArticleReviewMetadata,
  ArticleStatus,
} from '../../lib/authorArticlesService'

type ReviewMetadataState =
  | { articleId: string; status: 'loading' }
  | { articleId: string; status: 'loaded'; metadata: AdminArticleReviewMetadata }
  | { articleId: string; status: 'error'; message: string }

type ArticleActionPanel = {
  articleId: string
  action: AdminArticleAction
}

function getAvailableActions(status: ArticleStatus): AdminArticleAction[] {
  switch (status) {
    case 'pending_review':
      return ['publish', 'request_revision', 'reject', 'archive']
    case 'draft':
    case 'revision_requested':
    case 'rejected':
      return ['publish', 'archive']
    case 'published':
      return ['archive']
    case 'archived':
      return ['publish']
    default:
      return []
  }
}

function getActionLabel(action: AdminArticleAction): string {
  switch (action) {
    case 'publish':
      return 'Publish'
    case 'request_revision':
      return 'Request revision'
    case 'reject':
      return 'Reject'
    case 'archive':
      return 'Archive'
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof AdminArticlesServiceError ? error.message : fallback
}

function getStatusClasses(status: string): string {
  switch (status) {
    case 'published':
      return 'bg-emerald-50 text-emerald-800'
    case 'revision_requested':
      return 'bg-amber-50 text-amber-800'
    case 'rejected':
      return 'bg-red-50 text-red-800'
    case 'pending_review':
      return 'bg-blue-50 text-blue-800'
    case 'archived':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-50 text-slate-600'
  }
}

export function AdminArticlesPage() {
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null)
  const [reviewMetadataState, setReviewMetadataState] =
    useState<ReviewMetadataState | null>(null)
  const [isLoadingArticles, setIsLoadingArticles] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionPanel, setActionPanel] = useState<ArticleActionPanel | null>(null)
  const [actionNote, setActionNote] = useState('')
  const [actionError, setActionError] = useState<{
    articleId: string
    message: string
  } | null>(null)
  const [actionSuccess, setActionSuccess] = useState<{
    articleId: string
    message: string
  } | null>(null)
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  const [reviewMetadataRefreshKey, setReviewMetadataRefreshKey] = useState(0)
  const actionRequestInFlight = useRef(false)

  useEffect(() => {
    let active = true

    void getAdminArticles()
      .then((loadedArticles) => {
        if (!active) return
        setArticles(loadedArticles)
        const firstArticleId = loadedArticles[0]?.id ?? null
        if (firstArticleId) {
          setReviewMetadataState({ articleId: firstArticleId, status: 'loading' })
        }
        setSelectedArticleId(firstArticleId)
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(getErrorMessage(error, 'Articles could not be loaded.'))
        }
      })
      .finally(() => {
        if (active) setIsLoadingArticles(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    if (!selectedArticleId) {
      setReviewMetadataState(null)
      return () => {
        active = false
      }
    }

    setReviewMetadataState({ articleId: selectedArticleId, status: 'loading' })

    void getAdminArticleReviewMetadata(selectedArticleId)
      .then((metadata) => {
        if (active) {
          setReviewMetadataState({
            articleId: selectedArticleId,
            status: 'loaded',
            metadata,
          })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setReviewMetadataState({
            articleId: selectedArticleId,
            status: 'error',
            message: getErrorMessage(error, 'Review metadata could not be loaded.'),
          })
        }
      })

    return () => {
      active = false
    }
  }, [selectedArticleId, reviewMetadataRefreshKey])

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === selectedArticleId) ?? null,
    [articles, selectedArticleId],
  )
  const currentReviewMetadataState = selectedArticleId
    ? reviewMetadataState?.articleId === selectedArticleId
      ? reviewMetadataState
      : { articleId: selectedArticleId, status: 'loading' as const }
    : null
  const currentActionPanel =
    actionPanel?.articleId === selectedArticleId ? actionPanel : null
  const currentActionError =
    actionError?.articleId === selectedArticleId ? actionError.message : null
  const currentActionSuccess =
    actionSuccess?.articleId === selectedArticleId ? actionSuccess.message : null

  const openActionPanel = (articleId: string, action: AdminArticleAction) => {
    setActionPanel({ articleId, action })
    setActionNote('')
    setActionError(null)
    setActionSuccess(null)
  }

  const handleActionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentActionPanel || actionRequestInFlight.current) return

    const { articleId, action } = currentActionPanel
    const note = actionNote.trim()
    if (
      (action === 'request_revision' || action === 'reject') &&
      note.length === 0
    ) {
      setActionError({
        articleId,
        message: 'Enter a review note before continuing.',
      })
      return
    }

    actionRequestInFlight.current = true
    setIsSubmittingAction(true)
    setActionError(null)
    setActionSuccess(null)

    try {
      await transitionAdminArticle(
        articleId,
        action,
        action === 'publish' ? null : note || null,
      )
      setActionPanel(null)
      setActionNote('')
      setActionSuccess({
        articleId,
        message: `${getActionLabel(action)} completed.`,
      })
      setReviewMetadataState({ articleId, status: 'loading' })
      setReviewMetadataRefreshKey((key) => key + 1)

      try {
        const refreshedArticles = await getAdminArticles()
        setArticles(refreshedArticles)
        if (!refreshedArticles.some((article) => article.id === articleId)) {
          setSelectedArticleId(refreshedArticles[0]?.id ?? null)
        }
        setLoadError(null)
      } catch (error: unknown) {
        setLoadError(
          getErrorMessage(
            error,
            'The action succeeded, but the article list could not be refreshed.',
          ),
        )
      }
    } catch (error: unknown) {
      setActionError({
        articleId,
        message: getErrorMessage(error, 'The article action could not be completed.'),
      })
    } finally {
      actionRequestInFlight.current = false
      setIsSubmittingAction(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-800">Content management</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">Articles</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review article content and securely retrieve its review metadata.
        </p>
      </header>

      {loadError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}
        </p>
      )}
      {currentActionSuccess && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {currentActionSuccess}
        </p>
      )}

      {isLoadingArticles ? (
        <p role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          Loading articles…
        </p>
      ) : articles.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No articles are available.
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
          <nav aria-label="Articles" className="space-y-2">
            {articles.map((article) => (
              <button
                key={article.id}
                type="button"
                disabled={isSubmittingAction}
                aria-pressed={article.id === selectedArticleId}
                onClick={() => {
                  if (article.id === selectedArticleId) return
                  setReviewMetadataState({ articleId: article.id, status: 'loading' })
                  setActionPanel(null)
                  setActionError(null)
                  setActionSuccess(null)
                  setSelectedArticleId(article.id)
                }}
                className={`w-full rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  article.id === selectedArticleId
                    ? 'border-emerald-700 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-emerald-700/40'
                }`}
              >
                <span className="block font-semibold text-slate-900">
                  {article.title}
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  {article.author || 'Author not specified'}
                </span>
                <span className="mt-3 flex items-center justify-between gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${getStatusClasses(article.status)}`}>
                    {article.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    Updated {formatDate(article.updated_at)}
                  </span>
                </span>
              </button>
            ))}
          </nav>

          {selectedArticle && (
            <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <header className="border-b border-slate-200 pb-4">
                <p className="text-sm font-medium text-emerald-800">
                  {selectedArticle.author || 'Author not specified'}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.excerpt && (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {selectedArticle.excerpt}
                  </p>
                )}
              </header>

              <section className="py-5">
                <h3 className="font-semibold text-slate-900">Article content</h3>
                <div className="mt-3 max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {selectedArticle.content || 'No article content.'}
                </div>
              </section>

              <section aria-labelledby="article-admin-actions" className="border-t border-slate-200 py-5">
                <h3 id="article-admin-actions" className="font-semibold text-slate-900">
                  Admin actions
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getAvailableActions(selectedArticle.status).map((action) => (
                    <button
                      key={action}
                      type="button"
                      disabled={isSubmittingAction}
                      onClick={() => openActionPanel(selectedArticle.id, action)}
                      className="rounded-lg border border-emerald-800 px-3 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {getActionLabel(action)}
                    </button>
                  ))}
                </div>

                {currentActionPanel && (
                  <form
                    className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4"
                    onSubmit={(event) => void handleActionSubmit(event)}
                  >
                    {currentActionPanel.action === 'publish' ? (
                      <p className="text-sm text-slate-700">
                        Publish this article?
                      </p>
                    ) : (
                      <label className="block text-sm font-medium text-slate-700">
                        Review note
                        {currentActionPanel.action === 'archive'
                          ? ' (optional)'
                          : ' (required)'}
                        <textarea
                          value={actionNote}
                          onChange={(event) => setActionNote(event.target.value)}
                          required={
                            currentActionPanel.action === 'request_revision' ||
                            currentActionPanel.action === 'reject'
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
                        />
                      </label>
                    )}

                    {currentActionError && (
                      <p role="alert" className="text-sm text-red-700">
                        {currentActionError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingAction}
                        className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingAction
                          ? 'Applying…'
                          : `Confirm ${getActionLabel(currentActionPanel.action)}`}
                      </button>
                      <button
                        type="button"
                        disabled={isSubmittingAction}
                        onClick={() => setActionPanel(null)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      {isSubmittingAction && (
                        <span role="status" className="text-sm text-slate-600">
                          Updating article…
                        </span>
                      )}
                    </div>
                  </form>
                )}
              </section>

              <section aria-labelledby="article-review-metadata" className="border-t border-slate-200 pt-5">
                <h3 id="article-review-metadata" className="font-semibold text-slate-900">
                  Review metadata
                </h3>
                {currentReviewMetadataState?.status === 'loading' ? (
                  <p role="status" className="mt-3 text-sm text-slate-600">
                    Loading review metadata…
                  </p>
                ) : currentReviewMetadataState?.status === 'error' ? (
                  <p role="alert" className="mt-3 text-sm text-red-700">
                    {currentReviewMetadataState.message}
                  </p>
                ) : currentReviewMetadataState?.status === 'loaded' ? (
                  <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-slate-600">Review note</dt>
                      <dd className="mt-1 whitespace-pre-wrap text-slate-900">
                        {currentReviewMetadataState.metadata.review_note || 'No review note provided.'}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Reviewed</dt>
                      <dd className="mt-1 text-slate-900">
                        {formatDate(currentReviewMetadataState.metadata.reviewed_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-600">Reviewer ID</dt>
                      <dd className="mt-1 break-all font-mono text-xs text-slate-900">
                        {currentReviewMetadataState.metadata.reviewed_by || '—'}
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </section>
            </article>
          )}
        </div>
      )}
    </section>
  )
}
