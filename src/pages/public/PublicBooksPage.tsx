import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPublicBookCoverUrl,
  getPublicBooks,
  PublicCatalogServiceError,
  type PublicBook,
} from '../../lib/publicCatalogService'
import { PublicArticleLayout } from '../../components/PublicArticleLayout'

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function getErrorMessage(error: unknown): string {
  return error instanceof PublicCatalogServiceError
    ? error.message
    : 'Published books could not be loaded. Please try again.'
}

export function PublicBooksPage() {
  const [books, setBooks] = useState<PublicBook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setErrorMessage(null)

    void getPublicBooks()
      .then((loadedBooks) => {
        if (active) setBooks(loadedBooks)
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
  }, [retryVersion])

  return (
    <PublicArticleLayout currentPage="books">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">
            Darul Hikmah Research Center
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#ffd700] sm:text-5xl">
            Books
          </h1>
          <p className="mt-4 text-base leading-7 text-amber-50/75">
            Browse books published by Darul Hikmah.
          </p>
        </header>

        {isLoading ? (
          <p
            role="status"
            className="rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75"
          >
            Loading books…
          </p>
        ) : errorMessage ? (
          <div
            role="alert"
            className="mx-auto max-w-2xl rounded-2xl border border-red-300/30 bg-red-950/30 p-6 text-center"
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
        ) : books.length === 0 ? (
          <p className="rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75">
            No published books are available yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => {
              const coverUrl = getPublicBookCoverUrl(book.cover_path)

              return (
                <article
                  key={String(book.id)}
                  className="overflow-hidden rounded-2xl border border-[#d4af37]/20 bg-black/35 shadow-xl transition hover:border-[#d4af37]/50"
                >
                  {coverUrl && (
                    <img
                      src={coverUrl}
                      alt={book.title ? `Cover of ${book.title}` : 'Book cover'}
                      loading="lazy"
                      className="aspect-[3/2] w-full object-cover"
                    />
                  )}
                  <div className="flex h-full flex-col p-5 sm:p-6">
                    {book.category && (
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                        {book.category}
                      </p>
                    )}
                    <h2 className="mt-2 text-2xl font-semibold leading-snug text-[#ffd700]">
                      <Link
                        to={`/books/${encodeURIComponent(String(book.id))}`}
                        className="transition hover:text-amber-100"
                      >
                        {book.title || 'Untitled book'}
                      </Link>
                    </h2>
                    <p className="mt-2 text-sm text-amber-50/65">
                      {book.author || 'Darul Hikmah'}
                      <span aria-hidden="true"> · </span>
                      {formatDate(book.published_date)}
                    </p>
                    {book.language && (
                      <p className="mt-2 text-sm text-amber-50/65">
                        Language: {book.language}
                      </p>
                    )}
                    {book.description && (
                      <p className="mt-4 flex-1 whitespace-pre-wrap text-sm leading-6 text-amber-50/75">
                        {book.description}
                      </p>
                    )}
                    <Link
                      to={`/books/${encodeURIComponent(String(book.id))}`}
                      className="mt-5 inline-flex w-fit items-center rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                    >
                      View book
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </PublicArticleLayout>
  )
}
