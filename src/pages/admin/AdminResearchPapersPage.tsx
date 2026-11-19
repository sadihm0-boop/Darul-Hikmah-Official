import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import {
  RESEARCH_PAPER_UPLOAD_LIMITS,
  ResearchPapersServiceError,
  archiveResearchPaper,
  deleteResearchPaper,
  getResearchPaperPublicUrl,
  getResearchPapers,
  publishResearchPaper,
  saveResearchPaperChanges,
  saveResearchPaperDraft,
  validateResearchPaperPdf,
  type ResearchPaper,
  type ResearchPaperInput,
  type ResearchPaperStatus,
  type ResearchPapersServiceErrorKind,
} from '../../lib/researchPapersService'

type StatusFilter = 'all' | ResearchPaperStatus
type NoticeKind = 'success' | 'warning' | 'error'

interface ResearchPaperFormValues {
  title: string
  author: string
  abstract: string
  keywords: string[]
  category: string
  journal_name: string
  publication_date: string
}

interface FormErrors {
  title?: string
  pdf?: string
}

type PendingAction =
  | { kind: 'publish'; paper: ResearchPaper | null }
  | { kind: 'archive'; paper: ResearchPaper }
  | { kind: 'delete'; paper: ResearchPaper }

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

const emptyForm: ResearchPaperFormValues = {
  title: '',
  author: '',
  abstract: '',
  keywords: [],
  category: '',
  journal_name: '',
  publication_date: '',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getStatusClasses(status: string | null): string {
  switch (status?.toLowerCase()) {
    case 'published':
      return 'bg-emerald-50 text-emerald-800 ring-emerald-700/15'
    case 'draft':
      return 'bg-amber-50 text-amber-800 ring-amber-700/15'
    case 'archived':
      return 'bg-slate-100 text-slate-700 ring-slate-500/15'
    default:
      return 'bg-slate-50 text-slate-600 ring-slate-500/15'
  }
}

function getFormValues(paper: ResearchPaper | null): ResearchPaperFormValues {
  if (!paper) return { ...emptyForm, keywords: [] }

  return {
    title: paper.title ?? '',
    author: paper.author ?? '',
    abstract: paper.abstract ?? '',
    keywords: paper.keywords ?? [],
    category: paper.category ?? '',
    journal_name: paper.journal_name ?? '',
    publication_date: paper.publication_date?.slice(0, 10) ?? '',
  }
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ResearchPapersServiceError) return error.message
  return 'The research paper operation could not be completed. Please try again.'
}

function getResearchPaperInput(values: ResearchPaperFormValues): ResearchPaperInput {
  return { ...values }
}

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="min-h-8 rounded-md border border-slate-200 px-2 text-xs font-medium text-slate-700 hover:border-emerald-800/30 hover:bg-emerald-50 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  )
}

export function AdminResearchPapersPage() {
  const [papers, setPapers] = useState<ResearchPaper[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadErrorKind, setLoadErrorKind] =
    useState<ResearchPapersServiceErrorKind | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPaper, setEditingPaper] = useState<ResearchPaper | null>(null)
  const [formValues, setFormValues] = useState<ResearchPaperFormValues>({
    ...emptyForm,
  })
  const [keywordInput, setKeywordInput] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string } | null>(
    null,
  )

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setPdfFile(null)
    setKeywordInput('')
  }, [])

  const loadPapers = useCallback(async () => {
    try {
      setPapers(await getResearchPapers())
      setLoadError(null)
      setLoadErrorKind(null)
    } catch (error: unknown) {
      if (error instanceof ResearchPapersServiceError) {
        setLoadError(error.message)
        setLoadErrorKind(error.kind)
      } else {
        setLoadError('Research Papers could not be loaded. Please try again.')
        setLoadErrorKind('request')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) return loadPapers()
    })

    return () => {
      active = false
    }
  }, [loadPapers])

  useEffect(() => {
    if (!selectedPaper && !isFormOpen && !pendingAction) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isMutating) return
      if (pendingAction) setPendingAction(null)
      else if (isFormOpen) closeForm()
      else setSelectedPaper(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeForm, isFormOpen, isMutating, pendingAction, selectedPaper])

  const filteredPapers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return papers.filter((paper) => {
      const matchesStatus =
        statusFilter === 'all' || paper.status?.toLowerCase() === statusFilter
      const searchableText = [
        paper.title,
        paper.author,
        paper.journal_name,
        paper.category,
        ...(paper.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && searchableText.includes(normalizedSearch)
    })
  }, [papers, search, statusFilter])

  const refreshPapers = async () => {
    setIsLoading(true)
    setLoadError(null)
    setLoadErrorKind(null)
    await loadPapers()
  }

  const openForm = (paper: ResearchPaper | null = null) => {
    setSelectedPaper(null)
    setEditingPaper(paper)
    setFormValues(getFormValues(paper))
    setKeywordInput('')
    setPdfFile(null)
    setFormErrors({})
    setFormError(null)
    setProgressMessage(null)
    setNotice(null)
    setIsFormOpen(true)
  }

  const validateForm = (operation: 'draft' | 'save' | 'publish'): boolean => {
    const errors: FormErrors = {}
    if (!formValues.title.trim()) {
      errors.title = 'Enter a title for this research paper.'
    }

    if (operation === 'publish' && pdfFile) {
      const pdfError = validateResearchPaperPdf(pdfFile)
      if (pdfError) errors.pdf = pdfError
    }
    if (operation === 'save' && editingPaper?.status === 'published' && pdfFile) {
      const pdfError = validateResearchPaperPdf(pdfFile)
      if (pdfError) errors.pdf = pdfError
    }
    if (operation === 'publish' && !pdfFile) {
      errors.pdf = 'Choose a PDF file before publishing.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showMutationResult = async (
    resultMessage: string,
    cleanupWarning: string | null,
  ) => {
    setIsFormOpen(false)
    setPdfFile(null)
    setSelectedPaper(null)
    setFormError(null)
    setNotice({
      kind: cleanupWarning ? 'warning' : 'success',
      message: cleanupWarning ?? resultMessage,
    })
    setProgressMessage(null)
    await refreshPapers()
  }

  const saveMetadata = async () => {
    const isDraft = !editingPaper || editingPaper.status === 'draft'
    if (!validateForm(isDraft ? 'draft' : 'save') || isMutating) return

    setIsMutating(true)
    setFormError(null)
    setNotice(null)
    setProgressMessage(isDraft ? 'Saving draft…' : 'Saving research paper changes…')
    try {
      const input = getResearchPaperInput(formValues)
      const result = isDraft
        ? await saveResearchPaperDraft(input, editingPaper)
        : await saveResearchPaperChanges(
            input,
            editingPaper,
            pdfFile,
            setProgressMessage,
          )
      const message = isDraft
        ? 'Draft saved. No PDF was uploaded.'
        : editingPaper?.status === 'archived' && pdfFile
          ? 'Changes saved. The selected PDF was not uploaded; use Publish to upload it.'
          : 'Research paper changes saved.'
      await showMutationResult(message, result.cleanupWarning)
    } catch (error: unknown) {
      setFormError(getSafeErrorMessage(error))
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const requestPublish = () => {
    if (!validateForm('publish') || isMutating) return
    setPendingAction({ kind: 'publish', paper: editingPaper })
  }

  const executePublish = async (paper: ResearchPaper | null) => {
    if (!validateForm('publish') || isMutating) return

    setIsMutating(true)
    setFormError(null)
    setNotice(null)
    setProgressMessage('Preparing publication…')
    try {
      const result = await publishResearchPaper(
        getResearchPaperInput(formValues),
        paper,
        pdfFile,
        setProgressMessage,
      )
      await showMutationResult(
        'Research paper published successfully.',
        result.cleanupWarning,
      )
    } catch (error: unknown) {
      setFormError(getSafeErrorMessage(error))
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const executeArchive = async (paper: ResearchPaper) => {
    setIsMutating(true)
    setNotice(null)
    setProgressMessage('Archiving research paper…')
    try {
      await archiveResearchPaper(paper.id)
      setNotice({
        kind: 'success',
        message:
          'Research paper archived. Its PDF is not removed, and its public URL remains accessible.',
      })
      await refreshPapers()
    } catch (error: unknown) {
      setNotice({ kind: 'error', message: getSafeErrorMessage(error) })
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const executeDelete = async (paper: ResearchPaper) => {
    setIsMutating(true)
    setNotice(null)
    setProgressMessage('Deleting research paper record…')
    try {
      const result = await deleteResearchPaper(paper, setProgressMessage)
      setSelectedPaper(null)
      setNotice({
        kind: result.cleanupWarning ? 'warning' : 'success',
        message:
          result.cleanupWarning ??
          'Research paper record and associated PDF deleted.',
      })
      await refreshPapers()
    } catch (error: unknown) {
      setNotice({ kind: 'error', message: getSafeErrorMessage(error) })
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const confirmPendingAction = async () => {
    if (!pendingAction || isMutating) return
    const action = pendingAction
    setPendingAction(null)

    if (action.kind === 'publish') {
      await executePublish(action.paper)
    } else if (action.kind === 'archive') {
      await executeArchive(action.paper)
    } else {
      await executeDelete(action.paper)
    }
  }

  const addKeywords = (rawValue: string) => {
    const additions = rawValue
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)
    if (additions.length > 0) {
      setFormValues((values) => ({
        ...values,
        keywords: [...new Set([...values.keywords, ...additions])],
      }))
    }
    setKeywordInput('')
  }

  const pendingTitle =
    pendingAction?.kind === 'publish'
      ? 'Publish this research paper?'
      : pendingAction?.kind === 'archive'
        ? 'Archive this research paper?'
        : 'Delete this research paper?'

  const pendingDescription =
    pendingAction?.kind === 'publish'
      ? 'The PDF will be uploaded to a public Storage bucket. Anyone with its public URL can access it.'
      : pendingAction?.kind === 'archive'
        ? 'Archiving changes the record status but does not remove its PDF or make its public URL private.'
        : pendingAction?.kind === 'delete'
          ? 'The database record will be deleted first, then its PDF will be removed. If Storage cleanup fails, the public file may remain.'
          : ''

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Content management</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Research Papers</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage research metadata and publish papers with a PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          disabled={isMutating}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Add Research Paper
        </button>
      </header>

      {notice && (
        <div
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            notice.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : notice.kind === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          {notice.message}
        </div>
      )}

      {isMutating && progressMessage && (
        <p
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {progressMessage}
        </p>
      )}

      <section
        aria-label="Research Papers list"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
          <div className="max-w-xl">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, author, journal, category, or keywords"
              aria-label="Search Research Papers"
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
            />
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filter by status">
            {statusFilters.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                aria-pressed={statusFilter === value}
                onClick={() => setStatusFilter(value)}
                className={`min-h-9 rounded-full border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
                  statusFilter === value
                    ? 'border-emerald-900 bg-emerald-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-700/40 hover:bg-emerald-50 hover:text-emerald-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div
            role="status"
            className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 text-center"
          >
            <span
              aria-hidden="true"
              className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent"
            />
            <p className="text-sm text-slate-600">Loading Research Papers…</p>
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className={`m-5 rounded-lg border px-4 py-4 sm:m-6 ${
              loadErrorKind === 'permission'
                ? 'border-amber-200 bg-amber-50 text-amber-950'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <p className="text-sm font-semibold">
              {loadErrorKind === 'permission' ? 'Access unavailable' : 'Unable to load Research Papers'}
            </p>
            <p className="mt-1 text-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError(null)
                setLoadErrorKind(null)
                void loadPapers()
              }}
              className="mt-3 min-h-9 rounded-lg border border-current px-3 text-sm font-medium hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Try again
            </button>
          </div>
        ) : papers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <BookOpen aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No research papers found
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Add a paper as a draft or publish one with its PDF.
            </p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
            <h2 className="text-base font-semibold text-slate-800">
              No matching research papers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Research paper</th>
                  <th scope="col" className="px-4 py-3.5">Journal</th>
                  <th scope="col" className="px-4 py-3.5">Category</th>
                  <th scope="col" className="px-4 py-3.5">Publication date</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} className="align-top hover:bg-slate-50/70">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {paper.title || 'Untitled research paper'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {paper.author || 'Author not specified'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {paper.journal_name || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {paper.category || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {formatDate(paper.publication_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClasses(paper.status)}`}
                      >
                        {paper.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ActionButton
                          label="View"
                          onClick={() => setSelectedPaper(paper)}
                          disabled={isMutating}
                        />
                        <ActionButton
                          label="Edit"
                          onClick={() => openForm(paper)}
                          disabled={isMutating}
                        />
                        {paper.status !== 'published' && (
                          <ActionButton
                            label="Publish"
                            onClick={() => openForm(paper)}
                            disabled={isMutating}
                          />
                        )}
                        {paper.status !== 'archived' && (
                          <ActionButton
                            label="Archive"
                            onClick={() => setPendingAction({ kind: 'archive', paper })}
                            disabled={isMutating}
                          />
                        )}
                        <ActionButton
                          label="Delete"
                          onClick={() => setPendingAction({ kind: 'delete', paper })}
                          disabled={isMutating}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPaper && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close research paper details"
            className="absolute inset-0 cursor-default bg-slate-950/50"
            onClick={() => setSelectedPaper(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-paper-details-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Research paper details</p>
                <h2
                  id="research-paper-details-title"
                  className="mt-1 text-2xl font-semibold text-slate-900"
                >
                  {selectedPaper.title || 'Untitled research paper'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedPaper.author || 'Author not specified'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelectedPaper(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Journal</dt>
                <dd className="mt-1 text-sm text-slate-900">{selectedPaper.journal_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt>
                <dd className="mt-1 text-sm text-slate-900">{selectedPaper.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publication date</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(selectedPaper.publication_date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClasses(selectedPaper.status)}`}
                  >
                    {selectedPaper.status}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Abstract</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedPaper.abstract || 'No abstract provided.'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keywords</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {selectedPaper.keywords?.length ? (
                    selectedPaper.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {keyword}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No keywords provided.</span>
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">PDF</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {getResearchPaperPublicUrl(selectedPaper.file_path) ? (
                    <a
                      href={getResearchPaperPublicUrl(selectedPaper.file_path) ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-emerald-900 underline decoration-emerald-700/40 underline-offset-2 hover:text-emerald-700"
                    >
                      <BookOpen aria-hidden="true" size={16} />
                      Open public PDF
                    </a>
                  ) : (
                    'No PDF reference'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                <dd className="mt-1 text-sm text-slate-700">{formatDate(selectedPaper.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</dt>
                <dd className="mt-1 text-sm text-slate-700">{formatDate(selectedPaper.updated_at)}</dd>
              </div>
            </dl>

            <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              The Storage bucket is public. Archiving a paper does not make an existing PDF URL private.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedPaper(null)}
                className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openForm(selectedPaper)}
                className="min-h-10 rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Edit research paper
              </button>
            </div>
          </section>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close research paper form"
            disabled={isMutating}
            className="absolute inset-0 cursor-default bg-slate-950/50 disabled:cursor-wait"
            onClick={closeForm}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="research-paper-form-title"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Research Papers management</p>
                <h2
                  id="research-paper-form-title"
                  className="mt-1 text-2xl font-semibold text-slate-900"
                >
                  {editingPaper ? 'Edit research paper' : 'Add research paper'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingPaper
                    ? `Update metadata for ${editingPaper.title || 'this research paper'}.`
                    : 'Save metadata as a draft or publish with a PDF.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close form"
                disabled={isMutating}
                onClick={closeForm}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <form
              className="mt-6 space-y-5"
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void saveMetadata()
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="research-paper-title" className="text-sm font-medium text-slate-800">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="research-paper-title"
                    value={formValues.title}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, title: event.target.value }))
                    }
                    disabled={isMutating}
                    aria-invalid={Boolean(formErrors.title)}
                    aria-describedby={formErrors.title ? 'research-paper-title-error' : undefined}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                  {formErrors.title && (
                    <p id="research-paper-title-error" className="mt-1 text-sm text-red-700">
                      {formErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="research-paper-author" className="text-sm font-medium text-slate-800">
                    Author
                  </label>
                  <input
                    id="research-paper-author"
                    value={formValues.author}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, author: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="research-paper-category" className="text-sm font-medium text-slate-800">
                    Category
                  </label>
                  <input
                    id="research-paper-category"
                    value={formValues.category}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, category: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="research-paper-journal" className="text-sm font-medium text-slate-800">
                    Journal Name
                  </label>
                  <input
                    id="research-paper-journal"
                    value={formValues.journal_name}
                    onChange={(event) =>
                      setFormValues((values) => ({
                        ...values,
                        journal_name: event.target.value,
                      }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="research-paper-publication-date" className="text-sm font-medium text-slate-800">
                    Publication Date
                  </label>
                  <input
                    id="research-paper-publication-date"
                    type="date"
                    value={formValues.publication_date}
                    onChange={(event) =>
                      setFormValues((values) => ({
                        ...values,
                        publication_date: event.target.value,
                      }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="research-paper-abstract" className="text-sm font-medium text-slate-800">
                    Abstract
                  </label>
                  <textarea
                    id="research-paper-abstract"
                    rows={5}
                    value={formValues.abstract}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, abstract: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="research-paper-keywords" className="text-sm font-medium text-slate-800">
                    Keywords
                  </label>
                  <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                    <input
                      id="research-paper-keywords"
                      value={keywordInput}
                      onChange={(event) => setKeywordInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          addKeywords(keywordInput)
                        }
                      }}
                      disabled={isMutating}
                      placeholder="Add a keyword; separate multiple with commas"
                      className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => addKeywords(keywordInput)}
                      disabled={isMutating || !keywordInput.trim()}
                      className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add keyword
                    </button>
                  </div>
                  {formValues.keywords.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {formValues.keywords.map((keyword, index) => (
                        <li key={`${keyword}-${index}`}>
                          <button
                            type="button"
                            onClick={() =>
                              setFormValues((values) => ({
                                ...values,
                                keywords: values.keywords.filter((_, itemIndex) => itemIndex !== index),
                              }))
                            }
                            disabled={isMutating}
                            aria-label={`Remove keyword ${keyword}`}
                            className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                          >
                            {keyword} <span aria-hidden="true">×</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">
                      Keywords are saved as a PostgreSQL text array.
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <label htmlFor="research-paper-pdf" className="text-sm font-medium text-slate-800">
                  PDF file
                </label>
                <input
                  id="research-paper-pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0] ?? null
                    if (!selectedFile) {
                      setPdfFile(null)
                      setFormErrors((errors) => ({ ...errors, pdf: undefined }))
                      return
                    }

                    const pdfError = validateResearchPaperPdf(selectedFile)
                    if (pdfError) {
                      setPdfFile(null)
                      event.target.value = ''
                      setFormErrors((errors) => ({ ...errors, pdf: pdfError }))
                      return
                    }

                    setPdfFile(selectedFile)
                    setFormErrors((errors) => ({ ...errors, pdf: undefined }))
                  }}
                  disabled={isMutating}
                  className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 text-sm text-slate-700 file:mr-3 file:min-h-11 file:border-0 file:bg-emerald-50 file:px-3 file:font-medium file:text-emerald-900"
                />
                <p className="mt-1 text-xs text-slate-500">
                  PDF only, maximum {RESEARCH_PAPER_UPLOAD_LIMITS.pdfBytes / 1024 / 1024} MB.{' '}
                  {editingPaper?.file_path
                    ? 'A PDF is currently attached.'
                    : 'No PDF is currently attached.'}
                </p>
                {pdfFile && (
                  <p className="mt-1 break-all text-xs text-slate-600">
                    Selected: {pdfFile.name}
                  </p>
                )}
                {formErrors.pdf && <p className="mt-1 text-sm text-red-700">{formErrors.pdf}</p>}
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {(!editingPaper || editingPaper.status === 'draft') && (
                  <p>Saving as draft stores metadata only. The selected PDF is not uploaded.</p>
                )}
                {editingPaper?.status === 'published' && (
                  <p>
                    Saving changes preserves the existing PDF unless a valid replacement is selected.
                    A replacement is uploaded before the record is updated.
                  </p>
                )}
                {editingPaper?.status === 'archived' && (
                  <p>
                    Saving changes updates metadata only. Use Publish with a selected PDF to publish
                    this paper.
                  </p>
                )}
                <p className="mt-1">
                  The Storage bucket is public. Published PDF URLs are accessible to anyone who has
                  the URL; archiving does not make them private.
                </p>
                <p className="mt-1">
                  The 100 MB limit is enforced in this browser. The bucket has no server-side file
                  size or MIME restriction configured, so an upstream or platform limit may still
                  reject larger uploads.
                </p>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
                >
                  {formError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={isMutating}
                  className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isMutating}
                  className="min-h-10 rounded-lg border border-emerald-900 px-4 text-sm font-medium text-emerald-900 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMutating
                    ? 'Saving…'
                    : !editingPaper || editingPaper.status === 'draft'
                      ? 'Save Draft'
                      : 'Save Changes'}
                </button>
                {(!editingPaper || editingPaper.status !== 'published') && (
                  <button
                    type="button"
                    onClick={requestPublish}
                    disabled={isMutating}
                    className="min-h-10 rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publish Research Paper
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingAction && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Cancel confirmation"
            className="absolute inset-0 cursor-default bg-slate-950/50"
            onClick={() => setPendingAction(null)}
          />
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="research-papers-confirm-title"
            aria-describedby="research-papers-confirm-description"
            className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <h2 id="research-papers-confirm-title" className="text-xl font-semibold text-slate-900">
              {pendingTitle}
            </h2>
            <p
              id="research-papers-confirm-description"
              className="mt-3 text-sm leading-6 text-slate-600"
            >
              {pendingDescription}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingAction(null)}
                disabled={isMutating}
                className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmPendingAction()}
                disabled={isMutating}
                className={`min-h-10 rounded-lg px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  pendingAction.kind === 'delete'
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-emerald-900 hover:bg-emerald-800'
                }`}
              >
                {isMutating
                  ? 'Working…'
                  : pendingAction.kind === 'delete'
                    ? 'Delete research paper'
                    : pendingAction.kind === 'archive'
                      ? 'Archive research paper'
                      : 'Publish research paper'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
