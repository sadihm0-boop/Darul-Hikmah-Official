import { useEffect, useState } from 'react'
import {
  getPublicResearchPaperDownloadUrl,
  getPublicResearchPaperFileUrl,
  getPublicResearchPapers,
  PublicCatalogServiceError,
  type PublicResearchPaper,
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
    : 'Published research papers could not be loaded. Please try again.'
}

export function PublicResearchPapersPage() {
  const [papers, setPapers] = useState<PublicResearchPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setErrorMessage(null)

    void getPublicResearchPapers()
      .then((loadedPapers) => {
        if (active) setPapers(loadedPapers)
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
    <PublicArticleLayout currentPage="research-papers">
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d4af37]">
            Darul Hikmah Research Center
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#ffd700] sm:text-5xl">
            Research Papers
          </h1>
          <p className="mt-4 text-base leading-7 text-amber-50/75">
            Explore research published by Darul Hikmah and its contributors.
          </p>
        </header>

        {isLoading ? (
          <p
            role="status"
            className="rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75"
          >
            Loading research papers…
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
        ) : papers.length === 0 ? (
          <p className="rounded-2xl border border-[#d4af37]/20 bg-black/35 p-8 text-center text-amber-50/75">
            No published research papers are available yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper) => {
              const readUrl = getPublicResearchPaperFileUrl(paper.file_path)
              const downloadUrl = getPublicResearchPaperDownloadUrl(paper.file_path)

              return (
                <article
                  key={paper.id}
                  className="flex flex-col rounded-2xl border border-[#d4af37]/20 bg-black/35 p-5 shadow-xl transition hover:border-[#d4af37]/50 sm:p-6"
                >
                  {paper.category && (
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d4af37]">
                      {paper.category}
                    </p>
                  )}
                  <h2 className="mt-2 text-2xl font-semibold leading-snug text-[#ffd700]">
                    {paper.title}
                  </h2>
                  <p className="mt-2 text-sm text-amber-50/65">
                    {paper.author || 'Darul Hikmah'}
                    <span aria-hidden="true"> · </span>
                    {formatDate(paper.publication_date)}
                  </p>
                  {paper.journal_name && (
                    <p className="mt-2 text-sm text-amber-50/65">
                      {paper.journal_name}
                    </p>
                  )}
                  {paper.abstract && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-amber-50/75">
                      {paper.abstract}
                    </p>
                  )}
                  {paper.keywords && paper.keywords.length > 0 && (
                    <ul
                      aria-label="Keywords"
                      className="mt-4 flex flex-wrap gap-2"
                    >
                      {paper.keywords.map((keyword, index) => (
                        <li
                          key={`${keyword}-${index}`}
                          className="rounded-full border border-[#d4af37]/25 px-2.5 py-1 text-xs text-amber-50/75"
                        >
                          {keyword}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(readUrl || downloadUrl) && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {readUrl && (
                        <a
                          href={readUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                        >
                          View / Read
                        </a>
                      )}
                      {downloadUrl && (
                        <a
                          href={downloadUrl}
                          className="inline-flex w-fit items-center rounded-lg border border-[#d4af37]/35 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:border-[#ffd700] hover:text-[#ffd700]"
                        >
                          Download PDF
                        </a>
                      )}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </PublicArticleLayout>
  )
}
