import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import {
  BOOK_UPLOAD_LIMITS,
  BooksServiceError,
  archiveBook,
  deleteBook,
  getBooks,
  publishBook,
  saveBookChanges,
  saveBookDraft,
  validateCoverFile,
  validatePdfFile,
  type Book,
  type BookInput,
  type BooksServiceErrorKind,
} from '../../lib/booksService'

type BookStatusFilter = 'all' | 'draft' | 'published' | 'archived'
type NoticeKind = 'success' | 'warning' | 'error'

interface BookFormValues {
  title: string
  author: string
  description: string
  category: string
  language: string
  published_date: string
}

interface BookFormErrors {
  title?: string
  pdf?: string
  cover?: string
}

type PendingAction =
  | { kind: 'publish' }
  | { kind: 'archive'; book: Book }
  | { kind: 'delete'; book: Book }

const statusFilters: { label: string; value: BookStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]

const emptyForm: BookFormValues = {
  title: '',
  author: '',
  description: '',
  category: '',
  language: 'English',
  published_date: '',
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

function getFormValues(book: Book | null): BookFormValues {
  if (!book) return { ...emptyForm }

  return {
    title: book.title ?? '',
    author: book.author ?? '',
    description: book.description ?? '',
    category: book.category ?? '',
    language: book.language || 'English',
    published_date: book.published_date?.slice(0, 10) ?? '',
  }
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof BooksServiceError) return error.message
  return 'The book operation could not be completed. Please try again.'
}

function getBookInput(values: BookFormValues): BookInput {
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

export function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadErrorKind, setLoadErrorKind] = useState<BooksServiceErrorKind | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BookStatusFilter>('all')
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [formValues, setFormValues] = useState<BookFormValues>({ ...emptyForm })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null)
  const coverPreviewRef = useRef<string | null>(null)
  const [formErrors, setFormErrors] = useState<BookFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isMutating, setIsMutating] = useState(false)
  const [progressMessage, setProgressMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ kind: NoticeKind; message: string } | null>(null)

  const setCoverSelection = useCallback((file: File | null) => {
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current)
    coverPreviewRef.current = file ? URL.createObjectURL(file) : null
    setCoverPreviewUrl(coverPreviewRef.current)
    setCoverFile(file)
  }, [])

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setCoverSelection(null)
  }, [setCoverSelection])

  useEffect(
    () => () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current)
    },
    [],
  )

  const loadBooks = useCallback(async () => {
    try {
      setBooks(await getBooks())
      setLoadError(null)
      setLoadErrorKind(null)
    } catch (error: unknown) {
      if (error instanceof BooksServiceError) {
        setLoadError(error.message)
        setLoadErrorKind(error.kind)
      } else {
        setLoadError('Books could not be loaded. Please try again.')
        setLoadErrorKind('request')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) return loadBooks()
    })

    return () => {
      active = false
    }
  }, [loadBooks])

  useEffect(() => {
    if (!selectedBook && !isFormOpen && !pendingAction) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || isMutating) return
      if (pendingAction) setPendingAction(null)
      else if (isFormOpen) closeForm()
      else setSelectedBook(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closeForm, isFormOpen, isMutating, pendingAction, selectedBook])

  const filteredBooks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return books.filter((book) => {
      const matchesStatus =
        statusFilter === 'all' || book.status?.toLowerCase() === statusFilter
      const searchableText = [
        book.title,
        book.author,
        book.description,
        book.category,
        book.language,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return matchesStatus && searchableText.includes(normalizedSearch)
    })
  }, [books, search, statusFilter])

  const refreshBooks = async () => {
    setIsLoading(true)
    setLoadError(null)
    setLoadErrorKind(null)
    await loadBooks()
  }

  const openForm = (book: Book | null = null) => {
    setSelectedBook(null)
    setEditingBook(book)
    setFormValues(getFormValues(book))
    setPdfFile(null)
    setCoverSelection(null)
    setFormErrors({})
    setFormError(null)
    setProgressMessage(null)
    setNotice(null)
    setIsFormOpen(true)
  }

  const validateForm = (operation: 'draft' | 'save' | 'publish'): boolean => {
    const errors: BookFormErrors = {}
    if (!formValues.title.trim()) errors.title = 'Enter a title for this book.'

    const validateSelectedFiles =
      operation === 'publish' ||
      (operation === 'save' && editingBook?.status === 'published')

    if (validateSelectedFiles) {
      if (pdfFile) {
        const pdfError = validatePdfFile(pdfFile)
        if (pdfError) errors.pdf = pdfError
      }
      if (coverFile) {
        const coverError = validateCoverFile(coverFile)
        if (coverError) errors.cover = coverError
      }
    }

    if (operation === 'publish') {
      const needsNewFiles =
        !editingBook ||
        editingBook.status === 'draft' ||
        editingBook.status === 'archived'
      if (!pdfFile && (needsNewFiles || !editingBook?.file_path)) {
        errors.pdf = 'Choose a PDF file before publishing.'
      }
      if (!coverFile && (needsNewFiles || !editingBook?.cover_path)) {
        errors.cover = 'Choose a cover image before publishing.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const showMutationResult = async (
    resultMessage: string,
    cleanupWarning: string | null,
  ) => {
    setIsFormOpen(false)
    setCoverSelection(null)
    setSelectedBook(null)
    setFormError(null)
    setNotice({
      kind: cleanupWarning ? 'warning' : 'success',
      message: cleanupWarning ?? resultMessage,
    })
    setProgressMessage(null)
    await refreshBooks()
  }

  const saveMetadata = async () => {
    const operation = editingBook?.status === 'published' ? 'save' : 'draft'
    if (!validateForm(operation) || isMutating) return

    setIsMutating(true)
    setFormError(null)
    setNotice(null)
    setProgressMessage(editingBook ? 'Saving book changes…' : 'Saving draft…')
    try {
      const input = getBookInput(formValues)
      const result =
        !editingBook || editingBook.status === 'draft'
          ? await saveBookDraft(input, editingBook)
          : await saveBookChanges(
              input,
              editingBook,
              { pdf: pdfFile, cover: coverFile },
              setProgressMessage,
            )
      const message =
        !editingBook || editingBook.status === 'draft'
          ? 'Draft saved. No files were uploaded.'
          : 'Book changes saved.'
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
    setPendingAction({ kind: 'publish' })
  }

  const executePublish = async () => {
    if (!validateForm('publish') || isMutating) return

    setIsMutating(true)
    setFormError(null)
    setNotice(null)
    setProgressMessage('Preparing publication…')
    try {
      const result = await publishBook(
        getBookInput(formValues),
        editingBook,
        { pdf: pdfFile, cover: coverFile },
        setProgressMessage,
      )
      await showMutationResult('Book published successfully.', result.cleanupWarning)
    } catch (error: unknown) {
      setFormError(getSafeErrorMessage(error))
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const executeArchive = async (book: Book) => {
    setIsMutating(true)
    setNotice(null)
    setProgressMessage('Archiving book…')
    try {
      await archiveBook(book.id)
      setNotice({
        kind: 'success',
        message:
          'Book archived. It is hidden from the public listing, but its file and cover URLs remain public.',
      })
      await refreshBooks()
    } catch (error: unknown) {
      setNotice({ kind: 'error', message: getSafeErrorMessage(error) })
    } finally {
      setIsMutating(false)
      setProgressMessage(null)
    }
  }

  const executeDelete = async (book: Book) => {
    setIsMutating(true)
    setNotice(null)
    setProgressMessage('Deleting book record…')
    try {
      const result = await deleteBook(book, setProgressMessage)
      setSelectedBook(null)
      setNotice({
        kind: result.cleanupWarning ? 'warning' : 'success',
        message: result.cleanupWarning ?? 'Book record and associated files deleted.',
      })
      await refreshBooks()
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
      await executePublish()
    } else if (action.kind === 'archive') {
      await executeArchive(action.book)
    } else {
      await executeDelete(action.book)
    }
  }

  const pendingTitle =
    pendingAction?.kind === 'publish'
      ? 'Publish this book?'
      : pendingAction?.kind === 'archive'
        ? 'Archive this book?'
        : 'Delete this book?'

  const pendingDescription =
    pendingAction?.kind === 'publish'
      ? 'The PDF and cover will be saved in public Storage buckets. Public visitors will be able to access those files.'
      : pendingAction?.kind === 'archive'
        ? 'Archiving hides the book from the public listing. It does not make the existing public file or cover URLs private.'
        : pendingAction?.kind === 'delete'
          ? 'The book record will be deleted first, then its associated files will be removed. If Storage cleanup fails, the public files may remain.'
          : ''

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Content management</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">Books</h1>
          <p className="mt-2 text-sm text-slate-600">
            Manage book records and publish files to the public library.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          disabled={isMutating}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <span aria-hidden="true" className="text-lg leading-none">+</span>
          Add Book
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
        aria-label="Books list"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="space-y-4 border-b border-slate-200 p-4 sm:p-5">
          <div className="max-w-xl">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, author, category, or language"
              aria-label="Search books"
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
            <p className="text-sm text-slate-600">Loading books…</p>
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
              {loadErrorKind === 'permission' ? 'Access unavailable' : 'Unable to load books'}
            </p>
            <p className="mt-1 text-sm">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError(null)
                setLoadErrorKind(null)
                void loadBooks()
              }}
              className="mt-3 min-h-9 rounded-lg border border-current px-3 text-sm font-medium hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Try again
            </button>
          </div>
        ) : books.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <BookOpen aria-hidden="true" size={22} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No books found</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Add a book as a draft or publish one with its PDF and cover.
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex min-h-52 flex-col items-center justify-center px-5 text-center">
            <h2 className="text-base font-semibold text-slate-800">No matching books</h2>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5">Book</th>
                  <th scope="col" className="px-4 py-3.5">Category</th>
                  <th scope="col" className="px-4 py-3.5">Language</th>
                  <th scope="col" className="px-4 py-3.5">Publication date</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBooks.map((book) => (
                  <tr key={String(book.id)} className="align-top hover:bg-slate-50/70">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {book.title || 'Untitled book'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {book.author || 'Author not specified'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {book.category || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {book.language || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {formatDate(book.published_date)}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClasses(book.status)}`}
                      >
                        {book.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <ActionButton
                          label="View"
                          onClick={() => setSelectedBook(book)}
                          disabled={isMutating}
                        />
                        <ActionButton
                          label="Edit"
                          onClick={() => openForm(book)}
                          disabled={isMutating}
                        />
                        {book.status !== 'published' && (
                          <ActionButton
                            label="Publish"
                            onClick={() => openForm(book)}
                            disabled={isMutating}
                          />
                        )}
                        {book.status !== 'archived' && (
                          <ActionButton
                            label="Archive"
                            onClick={() => setPendingAction({ kind: 'archive', book })}
                            disabled={isMutating}
                          />
                        )}
                        <ActionButton
                          label="Delete"
                          onClick={() => setPendingAction({ kind: 'delete', book })}
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

      {selectedBook && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close book details"
            className="absolute inset-0 cursor-default bg-slate-950/50"
            onClick={() => setSelectedBook(null)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-details-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Book details</p>
                <h2 id="book-details-title" className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedBook.title || 'Untitled book'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedBook.author || 'Author not specified'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close details"
                onClick={() => setSelectedBook(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <dl className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Category</dt>
                <dd className="mt-1 text-sm text-slate-900">{selectedBook.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Language</dt>
                <dd className="mt-1 text-sm text-slate-900">{selectedBook.language || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publication date</dt>
                <dd className="mt-1 text-sm text-slate-900">
                  {formatDate(selectedBook.published_date)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusClasses(selectedBook.status)}`}
                  >
                    {selectedBook.status || 'Unknown'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {selectedBook.description || 'No description provided.'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Book file</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {selectedBook.file_path ? 'File reference recorded' : 'No file reference'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cover image</dt>
                <dd className="mt-1 text-sm text-slate-700">
                  {selectedBook.cover_path ? 'Image reference recorded' : 'No image reference'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
                <dd className="mt-1 text-sm text-slate-700">{formatDate(selectedBook.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last updated</dt>
                <dd className="mt-1 text-sm text-slate-700">{formatDate(selectedBook.updated_at)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => openForm(selectedBook)}
                className="min-h-10 rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Edit book
              </button>
            </div>
          </section>
        </div>
      )}

      {isFormOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close book form"
            disabled={isMutating}
            className="absolute inset-0 cursor-default bg-slate-950/50 disabled:cursor-wait"
            onClick={closeForm}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-form-title"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">Books management</p>
                <h2 id="book-form-title" className="mt-1 text-2xl font-semibold text-slate-900">
                  {editingBook ? 'Edit book' : 'Add book'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingBook
                    ? `Update metadata for ${editingBook.title || 'this book'}.`
                    : 'Add metadata as a draft or publish with a PDF and cover.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close book form"
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
                  <label htmlFor="book-title" className="text-sm font-medium text-slate-800">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="book-title"
                    value={formValues.title}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, title: event.target.value }))
                    }
                    disabled={isMutating}
                    aria-invalid={Boolean(formErrors.title)}
                    aria-describedby={formErrors.title ? 'book-title-error' : undefined}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                  {formErrors.title && (
                    <p id="book-title-error" className="mt-1 text-sm text-red-700">
                      {formErrors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="book-author" className="text-sm font-medium text-slate-800">Author</label>
                  <input
                    id="book-author"
                    value={formValues.author}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, author: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="book-category" className="text-sm font-medium text-slate-800">Category</label>
                  <input
                    id="book-category"
                    value={formValues.category}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, category: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="book-language" className="text-sm font-medium text-slate-800">Language</label>
                  <input
                    id="book-language"
                    value={formValues.language}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, language: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label htmlFor="book-published-date" className="text-sm font-medium text-slate-800">
                    Publication date
                  </label>
                  <input
                    id="book-published-date"
                    type="date"
                    value={formValues.published_date}
                    onChange={(event) =>
                      setFormValues((values) => ({
                        ...values,
                        published_date: event.target.value,
                      }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="book-description" className="text-sm font-medium text-slate-800">
                    Description
                  </label>
                  <textarea
                    id="book-description"
                    rows={4}
                    value={formValues.description}
                    onChange={(event) =>
                      setFormValues((values) => ({ ...values, description: event.target.value }))
                    }
                    disabled={isMutating}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="book-pdf" className="text-sm font-medium text-slate-800">
                    PDF file
                  </label>
                  <input
                    id="book-pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(event) => {
                      setPdfFile(event.target.files?.[0] ?? null)
                      setFormErrors((errors) => ({ ...errors, pdf: undefined }))
                    }}
                    disabled={isMutating}
                    className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 text-sm text-slate-700 file:mr-3 file:min-h-11 file:border-0 file:bg-emerald-50 file:px-3 file:font-medium file:text-emerald-900"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    PDF only, maximum {BOOK_UPLOAD_LIMITS.pdfBytes / 1024 / 1024} MB. {editingBook?.file_path ? 'A file is currently attached.' : 'No file is attached.'}
                  </p>
                  {pdfFile && <p className="mt-1 break-all text-xs text-slate-600">Selected: {pdfFile.name}</p>}
                  {formErrors.pdf && <p className="mt-1 text-sm text-red-700">{formErrors.pdf}</p>}
                </div>
                <div>
                  <label htmlFor="book-cover" className="text-sm font-medium text-slate-800">
                    Cover image
                  </label>
                  <input
                    id="book-cover"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) => {
                      setCoverSelection(event.target.files?.[0] ?? null)
                      setFormErrors((errors) => ({ ...errors, cover: undefined }))
                    }}
                    disabled={isMutating}
                    className="mt-1.5 block min-h-11 w-full rounded-lg border border-slate-300 text-sm text-slate-700 file:mr-3 file:min-h-11 file:border-0 file:bg-emerald-50 file:px-3 file:font-medium file:text-emerald-900"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    JPG, JPEG, or PNG, maximum {BOOK_UPLOAD_LIMITS.coverBytes / 1024 / 1024} MB. {editingBook?.cover_path ? 'A cover is currently attached.' : 'No cover is attached.'}
                  </p>
                  {coverFile && <p className="mt-1 break-all text-xs text-slate-600">Selected: {coverFile.name}</p>}
                  {formErrors.cover && <p className="mt-1 text-sm text-red-700">{formErrors.cover}</p>}
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Recommended: B5 portrait, 176 × 250 mm (approximately 1:1.42).
                    Other aspect ratios are accepted and preserved without cropping or distortion.
                  </p>
                  {coverPreviewUrl && (
                    <div className="mt-3 flex flex-wrap items-start gap-3">
                      <div className="aspect-[176/250] w-40 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-2">
                        <img
                          src={coverPreviewUrl}
                          alt="Selected cover preview with original proportions preserved"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <p className="max-w-xs pt-1 text-xs text-slate-500">
                        Preview only. The original image is uploaded without resizing or distortion.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {(!editingBook || editingBook.status === 'draft') && (
                  <p>
                    Saving as draft stores metadata only. Selected files are not uploaded.
                  </p>
                )}
                {editingBook?.status === 'published' && (
                  <p>
                    Replacement files are uploaded before the record is updated. Existing files are retained if no replacement is selected.
                  </p>
                )}
                {editingBook?.status === 'archived' && (
                  <p>
                    Saving changes keeps this book archived. Choose Publish to upload replacements and list it publicly. Existing file URLs remain public.
                  </p>
                )}
                <p className="mt-1">
                  Published files use public buckets and their URLs are publicly accessible.
                </p>
              </div>

              {formError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
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
                    : !editingBook || editingBook.status === 'draft'
                      ? 'Save Draft'
                      : 'Save Changes'}
                </button>
                {(!editingBook || editingBook.status !== 'published') && (
                  <button
                    type="button"
                    onClick={requestPublish}
                    disabled={isMutating}
                    className="min-h-10 rounded-lg bg-emerald-900 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Publish Book
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
            aria-labelledby="books-confirm-title"
            aria-describedby="books-confirm-description"
            className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <h2 id="books-confirm-title" className="text-xl font-semibold text-slate-900">
              {pendingTitle}
            </h2>
            <p id="books-confirm-description" className="mt-3 text-sm leading-6 text-slate-600">
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
                    ? 'Delete book'
                    : pendingAction.kind === 'archive'
                      ? 'Archive book'
                      : 'Publish book'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}
