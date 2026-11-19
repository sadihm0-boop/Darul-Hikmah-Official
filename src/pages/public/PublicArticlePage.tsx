import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicArticleLayout } from '../../components/PublicArticleLayout'
import {
  getPublicArticleById,
  getPublicArticleCoverUrl,
  PublicArticlesServiceError,
  type PublicArticle,
} from '../../lib/publicArticlesService'

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof PublicArticlesServiceError
    ? error.message
    : 'The article could not be loaded. Please try again.'
}

export function PublicArticlePage() {
  const { articleId } = useParams<{ articleId: string }>()
  const [article, setArticle] = useState<PublicArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    let active = true
    setArticle(null)
    setIsLoading(true)
    setErrorMessage(null)

    if (!articleId) {
      setErrorMessage('This article is unavailable or has not been published.')
      setIsLoading(false)
      return () => {
        active = false
      }
    }

    void getPublicArticleById(articleId)
      .then((loadedArticle) => {
        if (active) setArticle(loadedArticle)
      })
      .catch((error: unknown) => {
        if (active) setErrorMessage(getErrorMessage(error))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [articleId, retryVersion])

  const coverUrl = article
    ? getPublicArticleCoverUrl(article.cover_path)
    : null

  return (
    <PublicArticleLayout currentPage="articles">
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          to="/articles"
          className="inline-flex rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
        >
          All articles
        </Link>

        {isLoading ? (
          <p
            role="status"
            className="mt-8 rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75"
          >
            Loading article…
          </p>
        ) : errorMessage ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-300/30 bg-red-950/30 p-6 text-center"
          >
            <p className="text-sm text-red-100">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setRetryVersion((version) => version + 1)}
              className="mt-4 rounded-lg border border-[#d4af37]/40 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
            >
              Try again
            </button>
          </div>
        ) : article ? (
          <>
            <header className="mt-8">
              {article.category && (
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                  {article.category}
                </p>
              )}
              <h1 className="mt-3 text-4xl font-bold leading-tight text-[#ffd700] sm:text-5xl">
                {article.title}
              </h1>
              <p className="mt-4 text-sm text-amber-50/65">
                {article.author || 'Darul Hikmah'}
                <span aria-hidden="true"> · </span>
                {formatDate(article.published_at)}
              </p>
              {article.excerpt && (
                <p className="mt-6 border-l-2 border-[#d4af37]/60 pl-4 text-lg leading-8 text-amber-50/80">
                  {article.excerpt}
                </p>
              )}
            </header>

            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                className="mt-8 max-h-[34rem] w-full rounded-2xl border border-[#d4af37]/20 object-cover"
              />
            )}

            <div className="mt-8 whitespace-pre-wrap break-words text-base leading-8 text-amber-50/85">
              {article.content || 'No article content is available.'}
            </div>
          </>
        ) : null}
      </article>
    </PublicArticleLayout>
  )
}
