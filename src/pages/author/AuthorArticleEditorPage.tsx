import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import {
  AuthorArticlesServiceError,
  createDraft,
  getMyArticleById,
  getMyArticleReviewMetadata,
  submitForReview,
  updateDraft,
  type Article,
  type ArticleInput,
  type ArticleReviewFeedback,
  type ArticleStatus,
} from '../../lib/authorArticlesService'

interface ArticleFormValues {
  title: string
  author: string
  category: string
  excerpt: string
  content: string
  cover_path: string
}

interface ArticleFormErrors {
  title?: string
  content?: string
}

const editableStatuses: ArticleStatus[] = ['draft', 'revision_requested']

function isEditableStatus(status: ArticleStatus): boolean {
  return editableStatuses.includes(status)
}

function getDisplayStatus(status: ArticleStatus): string {
  return status.replace(/_/g, ' ')
}

function getFormValues(article: Article | null, defaultAuthor: string): ArticleFormValues {
  if (!article) {
    return {
      title: '',
      author: defaultAuthor,
      category: '',
      excerpt: '',
      content: '',
      cover_path: '',
    }
  }

  return {
    title: article.title,
    author: article.author ?? '',
    category: article.category ?? '',
    excerpt: article.excerpt ?? '',
    content: article.content ?? '',
    cover_path: article.cover_path ?? '',
  }
}

function getArticleInput(values: ArticleFormValues): ArticleInput {
  return {
    title: values.title.trim(),
    author: values.author.trim() || null,
    content: values.content,
    excerpt: values.excerpt.trim() || null,
    category: values.category.trim() || null,
    cover_path: values.cover_path.trim() || null,
  }
}

function getServiceErrorMessage(error: unknown, fallback: string): string {
  return error instanceof AuthorArticlesServiceError ? error.message : fallback
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

function ReviewFeedbackPanel({
  status,
  feedback,
  isLoading,
  error,
}: {
  status: ArticleStatus
  feedback: ArticleReviewFeedback | null
  isLoading: boolean
  error: string | null
}) {
  const isRevisionRequested = status === 'revision_requested'
  const isRejected = status === 'rejected'
  const hasFeedback = Boolean(feedback?.review_note || feedback?.reviewed_at)

  if (!isLoading && !error && !hasFeedback && !isRevisionRequested && !isRejected) {
    return null
  }

  return (
    <section
      aria-label="Article review feedback"
      className="mt-5 rounded-xl border border-[#d4af37]/25 bg-black/30 p-5"
    >
      <h2 className="font-semibold text-[#ffd700]">
        {isRevisionRequested
          ? 'Requested revisions'
          : isRejected
            ? 'Review feedback'
            : 'Review information'}
      </h2>
      {isLoading ? (
        <p role="status" className="mt-2 text-sm text-amber-50/70">
          Loading review feedback…
        </p>
      ) : error ? (
        <p role="alert" className="mt-2 text-sm text-red-200">{error}</p>
      ) : (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-amber-50/80">
            {feedback?.review_note ||
              (isRevisionRequested
                ? 'The administrator requested revisions but did not include a written note.'
                : isRejected
                  ? 'The article was rejected without a written review note.'
                  : 'No written review note is available.')}
          </p>
          {feedback?.reviewed_at && (
            <p className="mt-3 text-xs text-amber-50/55">
              Reviewed {formatDate(feedback.reviewed_at)}
            </p>
          )}
        </>
      )}
    </section>
  )
}

function getRouteMessage(state: unknown, key: 'notice' | 'error'): string | null {
  if (typeof state !== 'object' || state === null || !(key in state)) return null
  const message = state[key]
  return typeof message === 'string' ? message : null
}

function FormField({
  id,
  label,
  value,
  onChange,
  disabled,
  required = false,
  error,
  multiline = false,
}: {
  id: string
  label: string
  value?: string
  onChange?: (value: string) => void
  disabled: boolean
  required?: boolean
  error?: string
  multiline?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-amber-50">
        {label} {required && <span className="text-[#ffd700]">*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={16}
          required={required}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-3 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
        />
      ) : (
        <input
          id={id}
          type="text"
          required={required}
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="min-h-11 w-full rounded-lg border border-[#d4af37]/25 bg-[#06150b]/80 px-4 py-2.5 text-white outline-none transition placeholder:text-amber-50/35 focus:border-[#ffd700] focus:ring-2 focus:ring-[#ffd700]/20 disabled:opacity-60"
        />
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  )
}

export function AuthorArticleEditorPage() {
  const { articleId } = useParams<{ articleId: string }>()
  const { session } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const metadataName = session?.user.user_metadata?.full_name
  const defaultAuthor = typeof metadataName === 'string' ? metadataName : ''
  const [article, setArticle] = useState<Article | null>(null)
  const [reviewFeedback, setReviewFeedback] = useState<ArticleReviewFeedback | null>(null)
  const [reviewFeedbackError, setReviewFeedbackError] = useState<string | null>(null)
  const [isLoadingReviewFeedback, setIsLoadingReviewFeedback] = useState(false)
  const [values, setValues] = useState<ArticleFormValues>(() =>
    getFormValues(null, defaultAuthor),
  )
  const [formErrors, setFormErrors] = useState<ArticleFormErrors>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [routeFeedbackDismissed, setRouteFeedbackDismissed] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(articleId))
  const [loadedArticleId, setLoadedArticleId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let active = true

    if (!articleId) {
      setArticle(null)
      setReviewFeedback(null)
      setReviewFeedbackError(null)
      setIsLoadingReviewFeedback(false)
      setValues(getFormValues(null, defaultAuthor))
      setLoadedArticleId(null)
      setIsLoading(false)
      setErrorMessage(null)
      return () => {
        active = false
      }
    }

    setIsLoading(true)
    setLoadedArticleId(null)
    setArticle(null)
    setReviewFeedback(null)
    setReviewFeedbackError(null)
    setIsLoadingReviewFeedback(true)
    setErrorMessage(null)

    void getMyArticleById(articleId)
      .then((loadedArticle) => {
        if (!active) return
        setArticle(loadedArticle)
        setValues(getFormValues(loadedArticle, defaultAuthor))
        setLoadedArticleId(articleId)
        void getMyArticleReviewMetadata(articleId)
          .then((feedback) => {
            if (active) setReviewFeedback(feedback)
          })
          .catch((error: unknown) => {
            if (active) {
              setReviewFeedbackError(
                getServiceErrorMessage(
                  error,
                  'Review feedback could not be loaded. Please try again.',
                ),
              )
            }
          })
          .finally(() => {
            if (active) setIsLoadingReviewFeedback(false)
          })
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(
          getServiceErrorMessage(error, 'The article could not be loaded. Please try again.'),
        )
        setLoadedArticleId(articleId)
        setIsLoadingReviewFeedback(false)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [articleId, defaultAuthor])

  const updateValue = (field: keyof ArticleFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (field === 'title' || field === 'content') {
      setFormErrors((current) => ({ ...current, [field]: undefined }))
    }
    setErrorMessage(null)
    setSuccessMessage(null)
    setRouteFeedbackDismissed(true)
  }

  const validateForm = (): boolean => {
    const errors: ArticleFormErrors = {}
    if (!values.title.trim()) errors.title = 'Enter an article title.'
    if (!values.content.trim()) errors.content = 'Enter the article content.'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveDraft = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm() || isSaving || isSubmitting) return

    setIsSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const input = getArticleInput(values)
      if (article) {
        const result = await updateDraft(article.id, input)
        setArticle((current) =>
          current
            ? {
                ...current,
                ...input,
                author: input.author ?? null,
                excerpt: input.excerpt ?? null,
                category: input.category ?? null,
                cover_path: input.cover_path ?? null,
                status: result.status,
              }
            : current,
        )
        setSuccessMessage('Your draft changes have been saved.')
      } else {
        const result = await createDraft(input)
        navigate(`/author/articles/${result.id}/edit`, {
          replace: true,
          state: { notice: 'Your draft has been saved.' },
        })
      }
    } catch (error: unknown) {
      setErrorMessage(
        getServiceErrorMessage(error, 'Your draft could not be saved. Please try again.'),
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    if (!validateForm() || isSaving || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    let newlyCreatedArticleId: string | null = null
    try {
      const input = getArticleInput(values)
      const result = article
        ? await updateDraft(article.id, input)
        : await createDraft(input)
      if (!article) newlyCreatedArticleId = result.id

      await submitForReview(result.id)

      if (article) {
        setArticle((current) =>
          current
            ? {
                ...current,
                ...input,
                author: input.author ?? null,
                excerpt: input.excerpt ?? null,
                category: input.category ?? null,
                cover_path: input.cover_path ?? null,
                status: 'pending_review',
              }
            : current,
        )
        setSuccessMessage('Your article has been submitted for review.')
      } else {
        navigate(`/author/articles/${result.id}/edit`, {
          replace: true,
          state: { notice: 'Your article has been submitted for review.' },
        })
      }
    } catch (error: unknown) {
      const message = getServiceErrorMessage(
        error,
        'Your article could not be submitted. Please try again.',
      )
      if (newlyCreatedArticleId) {
        navigate(`/author/articles/${newlyCreatedArticleId}/edit`, {
          replace: true,
          state: { error: `Draft saved, but submission failed: ${message}` },
        })
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const waitingForArticle =
    Boolean(articleId) && (isLoading || loadedArticleId !== articleId)
  const routeNotice = routeFeedbackDismissed
    ? null
    : getRouteMessage(location.state, 'notice')
  const routeError = routeFeedbackDismissed ? null : getRouteMessage(location.state, 'error')
  const displayedSuccess = successMessage ?? routeNotice
  const displayedError = errorMessage ?? routeError
  const articleStatus = article?.status

  if (waitingForArticle) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p role="status" aria-live="polite" className="text-sm text-amber-100/80">
          Loading your article…
        </p>
      </main>
    )
  }

  if (articleId && displayedError && !article) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-red-400/30 bg-red-950/30 p-6 text-red-100">
          <h1 className="text-2xl font-semibold">Article unavailable</h1>
          <p role="alert" className="mt-3 text-sm leading-6">
            {displayedError}
          </p>
          <Link
            to="/author/dashboard"
            className="mt-5 inline-flex min-h-10 items-center rounded-lg border border-[#d4af37]/35 px-4 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    )
  }

  if (article && articleStatus && !isEditableStatus(articleStatus)) {
    return (
      <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/author/dashboard"
            className="text-sm font-semibold text-amber-100/75 transition hover:text-[#ffd700]"
          >
            ← Author dashboard
          </Link>
          <section className="mt-5 rounded-2xl border border-[#d4af37]/25 bg-black/40 p-6 shadow-xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d4af37]">
              Article status
            </p>
            <h1 className="mt-2 text-2xl font-bold">{article.title}</h1>
            <p className="mt-3 inline-flex rounded-full border border-[#d4af37]/30 px-3 py-1 text-sm capitalize text-amber-50/80">
              {getDisplayStatus(articleStatus)}
            </p>
            <p className="mt-5 text-sm leading-6 text-amber-50/75">
              {articleStatus === 'pending_review'
                ? 'This article is awaiting admin review and cannot be edited or submitted again.'
                : 'Articles in this status cannot be edited from the author portal.'}
            </p>
            <ReviewFeedbackPanel
              status={articleStatus}
              feedback={reviewFeedback}
              isLoading={isLoadingReviewFeedback}
              error={reviewFeedbackError}
            />
            {displayedSuccess && (
              <p
                role="status"
                className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-950/35 p-3 text-sm text-emerald-100"
              >
                {displayedSuccess}
              </p>
            )}
            <Link
              to="/author/dashboard"
              className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-5 text-sm font-bold text-[#08200e] transition hover:brightness-110"
            >
              Return to dashboard
            </Link>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/author/dashboard"
          className="text-sm font-semibold text-amber-100/75 transition hover:text-[#ffd700]"
        >
          ← Author dashboard
        </Link>

        <header className="mt-5 rounded-2xl border border-[#d4af37]/25 bg-black/35 p-6 shadow-xl backdrop-blur-xl sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d4af37]">
            Darul Hikmah Research Center
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            {article ? 'Edit article draft' : 'Create an article'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-amber-50/75">
            Save your work as a draft, or submit it for admin review when it is ready.
          </p>
          {article && (
            <p className="mt-3 text-sm capitalize text-amber-50/60">
              Current status: {getDisplayStatus(article.status)}
            </p>
          )}
        </header>

        {displayedSuccess && (
          <p
            role="status"
            className="mt-5 rounded-lg border border-emerald-400/30 bg-emerald-950/35 p-3 text-sm text-emerald-100"
          >
            {displayedSuccess}
          </p>
        )}

        {displayedError && (
          <p
            role="alert"
            className="mt-5 rounded-lg border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
          >
            {displayedError}
          </p>
        )}

        {article && (
          <ReviewFeedbackPanel
            status={article.status}
            feedback={reviewFeedback}
            isLoading={isLoadingReviewFeedback}
            error={reviewFeedbackError}
          />
        )}

        <form
          onSubmit={(event) => void handleSaveDraft(event)}
          noValidate
          className="mt-5 space-y-5 rounded-2xl border border-[#d4af37]/20 bg-black/35 p-5 shadow-xl backdrop-blur-xl sm:p-8"
        >
          <FormField
            id="article-title"
            label="Article Title"
            value={values.title}
            onChange={(value) => updateValue('title', value)}
            disabled={isSaving || isSubmitting}
            required
            error={formErrors.title}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="article-author"
              label="Author / Byline"
              value={values.author}
              onChange={(value) => updateValue('author', value)}
              disabled={isSaving || isSubmitting}
            />
            <FormField
              id="article-category"
              label="Category"
              value={values.category}
              onChange={(value) => updateValue('category', value)}
              disabled={isSaving || isSubmitting}
            />
          </div>

          <FormField
            id="article-excerpt"
            label="Short Excerpt"
            value={values.excerpt}
            onChange={(value) => updateValue('excerpt', value)}
            disabled={isSaving || isSubmitting}
          />

          <FormField
            id="article-content"
            label="Article Content"
            value={values.content}
            onChange={(value) => updateValue('content', value)}
            disabled={isSaving || isSubmitting}
            required
            error={formErrors.content}
            multiline
          />

          <FormField
            id="article-cover-path"
            label="Cover Image Path or URL"
            value={values.cover_path}
            onChange={(value) => updateValue('cover_path', value)}
            disabled={isSaving || isSubmitting}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={isSaving || isSubmitting}
              className="min-h-12 rounded-lg border border-[#d4af37]/40 px-5 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? 'Saving draft…'
                : article?.status === 'revision_requested'
                  ? 'Save Changes'
                  : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => void handleSubmitForReview()}
              disabled={isSaving || isSubmitting}
              className="min-h-12 rounded-lg bg-gradient-to-r from-[#d4af37] via-[#ffd700] to-[#b8860b] px-5 text-sm font-bold text-[#08200e] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
          <p className="text-xs leading-5 text-amber-50/55">
            Submitting saves your latest changes and sends the article to the admin review queue.
            Authors cannot publish articles.
          </p>
        </form>
      </div>
    </main>
  )
}
