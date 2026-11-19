import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PublicArticleLayout } from '../../components/PublicArticleLayout'
import {
  getPublicBookById,
  getPublicBookCoverUrl,
  getPublicBookDownloadUrl,
  getPublicBookFileUrl,
  PublicCatalogServiceError,
  type PublicBook,
} from '../../lib/publicCatalogService'

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof PublicCatalogServiceError
    ? error.message
    : 'The book could not be loaded. Please try again.'
}

export function PublicBookPage() {
  const { bookId } = useParams<{ bookId: string }>()
  const [book, setBook] = useState<PublicBook | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    let active = true
    setBook(null)
    setIsLoading(true)
    setErrorMessage(null)

    if (!bookId) {
      setErrorMessage('This book is unavailable or has not been published.')
      setIsLoading(false)
      return () => {
        active = false
      }
    }

    void getPublicBookById(bookId)
      .then((loadedBook) => {
        if (active) setBook(loadedBook)
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
  }, [bookId, retryVersion])

  const coverUrl = book ? getPublicBookCoverUrl(book.cover_path) : null
  const readUrl = book ? getPublicBookFileUrl(book.file_path) : null
  const downloadUrl = book ? getPublicBookDownloadUrl(book.file_path) : null

  return (
    <PublicArticleLayout currentPage="books">
      <article className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          to="/books"
          className="inline-flex rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
        >
          All books
        </Link>

        {isLoading ? (
          <p
            role="status"
            className="mt-8 rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75"
          >
            Loading book…
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
        ) : book ? (
          <>
            <header className="mt-8">
              {book.category && (
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d4af37]">
                  {book.category}
                </p>
              )}
              <h1 className="mt-3 text-4xl font-bold leading-tight text-[#ffd700] sm:text-5xl">
                {book.title || 'Untitled book'}
              </h1>
              <p className="mt-4 text-sm text-amber-50/65">
                {book.author || 'Darul Hikmah'}
                <span aria-hidden="true"> · </span>
                {formatDate(book.published_date)}
                {book.language ? ` · ${book.language}` : ''}
              </p>
            </header>

            {coverUrl && (
              <img
                src={coverUrl}
                alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
                className="mt-8 max-h-[34rem] w-full rounded-2xl border border-[#d4af37]/20 object-contain"
              />
            )}

            {book.description && (
              <p className="mt-8 whitespace-pre-wrap text-base leading-8 text-amber-50/85">
                {book.description}
              </p>
            )}

            {readUrl && (
              <section className="mt-8" aria-label="Online book reader">
                <h2 className="text-xl font-semibold text-[#ffd700]">Read online</h2>
                <iframe
                  src={readUrl}
                  title={`${book.title || 'Book'} PDF reader`}
                  className="mt-4 h-[75vh] min-h-[32rem] w-full rounded-xl border border-[#d4af37]/25 bg-white"
                />
              </section>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {readUrl && (
                <a
                  href={readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                >
                  Open PDF
                </a>
              )}
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  className="inline-flex rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                >
                  Download PDF
                </a>
              )}
              {!readUrl && !downloadUrl && (
                <p className="text-sm text-amber-50/65">
                  No reading file is available for this book.
                </p>
              )}
            </div>
          </>
        ) : null}
      </article>
    </PublicArticleLayout>
  )
}
