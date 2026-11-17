import { supabase } from './supabaseClient'

export interface Book {
  id: number | string
  title: string | null
  author: string | null
  description: string | null
  category: string | null
  language: string | null
  file_path: string | null
  cover_path: string | null
  published_date: string | null
  created_at: string | null
  updated_at: string | null
  status: string | null
}

export type BookStatus = 'draft' | 'published' | 'archived'
export type BooksServiceErrorKind =
  | 'configuration'
  | 'permission'
  | 'request'
  | 'validation'
  | 'cleanup'

export interface BookInput {
  title: string
  author: string
  description: string
  category: string
  language: string
  published_date: string
}

export interface BookFiles {
  pdf: File | null
  cover: File | null
}

export interface BooksMutationResult {
  cleanupWarning: string | null
}

export class BooksServiceError extends Error {
  readonly kind: BooksServiceErrorKind

  constructor(kind: BooksServiceErrorKind, message: string) {
    super(message)
    this.name = 'BooksServiceError'
    this.kind = kind
  }
}

export const BOOK_UPLOAD_LIMITS = {
  pdfBytes: 100 * 1024 * 1024,
  coverBytes: 10 * 1024 * 1024,
} as const

const bookColumns =
  'id, title, author, description, category, language, file_path, cover_path, published_date, created_at, updated_at, status'
const permissionErrorCodes = new Set(['401', '403', '42501', 'PGRST301', 'PGRST302'])
const coverExtensionsByMime: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

type StorageBucket = 'books' | 'covers'

interface StorageObject {
  bucket: StorageBucket
  path: string
}

interface BookRecord {
  title: string
  author: string | null
  description: string | null
  category: string | null
  language: string
  file_path: string | null
  cover_path: string | null
  published_date: string | null
  status: BookStatus
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined
  if ('statusCode' in error && typeof error.statusCode === 'string') {
    return error.statusCode
  }
  if (
    'status' in error &&
    (typeof error.status === 'number' || typeof error.status === 'string')
  ) {
    return String(error.status)
  }
  if ('code' in error && typeof error.code === 'string') return error.code
  return undefined
}

function toServiceError(error: unknown): BooksServiceError {
  if (error instanceof BooksServiceError) return error
  if (permissionErrorCodes.has(getErrorCode(error) ?? '')) {
    return new BooksServiceError(
      'permission',
      'You do not have permission to manage books or their files. Confirm your administrator access and try again.',
    )
  }
  return new BooksServiceError(
    'request',
    'The book operation could not be completed. Please try again.',
  )
}

function requireClient() {
  if (!supabase) {
    throw new BooksServiceError(
      'configuration',
      'Books are unavailable because Supabase is not configured.',
    )
  }
  return supabase
}

function requireTitle(title: string): void {
  if (!title.trim()) {
    throw new BooksServiceError('validation', 'Enter a title for this book.')
  }
}

export function validatePdfFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (file.type !== 'application/pdf' || extension !== '.pdf') {
    return 'Choose a PDF file with the .pdf extension.'
  }
  if (file.size === 0 || file.size > BOOK_UPLOAD_LIMITS.pdfBytes) {
    const limitMb = BOOK_UPLOAD_LIMITS.pdfBytes / 1024 / 1024
    return `The PDF must be at most ${limitMb} MB and cannot be empty.`
  }
  return null
}

export function validateCoverFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const allowedExtensions = coverExtensionsByMime[file.type]
  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return 'Choose a JPG or PNG image with a matching file extension.'
  }
  if (file.size === 0 || file.size > BOOK_UPLOAD_LIMITS.coverBytes) {
    const limitMb = BOOK_UPLOAD_LIMITS.coverBytes / 1024 / 1024
    return `The cover image must be at most ${limitMb} MB and cannot be empty.`
  }
  return null
}

function normalizeOptional(value: string): string | null {
  return value.trim() || null
}

function makeRecord(
  input: BookInput,
  status: BookStatus,
  filePath: string | null,
  coverPath: string | null,
  publishedDate: string | null,
): BookRecord {
  return {
    title: input.title.trim(),
    author: normalizeOptional(input.author),
    description: normalizeOptional(input.description),
    category: normalizeOptional(input.category),
    language: input.language.trim() || 'English',
    file_path: filePath,
    cover_path: coverPath,
    published_date: publishedDate,
    status,
  }
}

async function insertBook(record: BookRecord): Promise<void> {
  const client = requireClient()
  try {
    const { error } = await client.from('books').insert(record)
    if (error) throw toServiceError(error)
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

async function updateBookRecord(
  id: Book['id'],
  record: Partial<BookRecord>,
): Promise<void> {
  const client = requireClient()
  try {
    const { data, error } = await client
      .from('books')
      .update(record)
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new BooksServiceError(
        'request',
        'This book could not be updated. It may have been removed or your access may have changed.',
      )
    }
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

function makeObjectPath(file: File): string {
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== 'function') {
    throw new BooksServiceError(
      'request',
      'Secure file paths are unavailable in this browser. Use a secure browser context and try again.',
    )
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  return `${globalThis.crypto.randomUUID()}${extension}`
}

async function uploadObject(
  bucket: StorageBucket,
  file: File,
  uploadedObjects: StorageObject[],
): Promise<string> {
  const client = requireClient()
  const path = makeObjectPath(file)
  uploadedObjects.push({ bucket, path })

  try {
    const { error } = await client.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })
    if (error) {
      const errorCode = getErrorCode(error)?.toLowerCase()
      if (errorCode === '413' || errorCode === 'entitytoolarge' || errorCode === 'payloadtoolarge') {
        const limitMb =
          (bucket === 'books'
            ? BOOK_UPLOAD_LIMITS.pdfBytes
            : BOOK_UPLOAD_LIMITS.coverBytes) /
          1024 /
          1024
        const fileType = bucket === 'books' ? 'PDF' : 'cover image'
        throw new BooksServiceError(
          'validation',
          `Storage rejected the ${fileType} for size. The client-side limit is ${limitMb} MB; try a smaller file or check the bucket upload limit.`,
        )
      }
      throw toServiceError(error)
    }
    return path
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

function isSafeObjectPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('://') &&
    !path.split('/').some((segment) => segment === '..')
  )
}

async function removeObjects(objects: StorageObject[]): Promise<boolean> {
  if (objects.length === 0) return true

  const client = supabase
  if (!client) return false
  const pathsByBucket = new Map<StorageBucket, Set<string>>()
  let allRemoved = true
  for (const object of objects) {
    if (!isSafeObjectPath(object.path)) {
      allRemoved = false
      continue
    }
    const paths = pathsByBucket.get(object.bucket) ?? new Set<string>()
    paths.add(object.path)
    pathsByBucket.set(object.bucket, paths)
  }

  for (const [bucket, paths] of pathsByBucket) {
    try {
      const { error } = await client.storage.from(bucket).remove([...paths])
      if (error) allRemoved = false
    } catch {
      allRemoved = false
    }
  }
  return allRemoved
}

async function withUploadRollback<T>(
  uploadedObjects: StorageObject[],
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error: unknown) {
    const cleanupSucceeded = await removeObjects(uploadedObjects)
    if (!cleanupSucceeded) {
      throw new BooksServiceError(
        'cleanup',
        'The book was not saved, and one or more newly uploaded public files may remain. Contact an administrator to review Storage cleanup.',
      )
    }
    throw toServiceError(error)
  }
}

function makePublishedDate(input: BookInput, existing: Book | null): string {
  return (
    input.published_date ||
    existing?.published_date ||
    new Date().toISOString().slice(0, 10)
  )
}

async function savePublishedBook(
  input: BookInput,
  existing: Book | null,
  files: BookFiles,
  onProgress?: (message: string) => void,
): Promise<BooksMutationResult> {
  requireTitle(input.title)
  if (files.pdf) {
    const validationError = validatePdfFile(files.pdf)
    if (validationError) throw new BooksServiceError('validation', validationError)
  }
  if (files.cover) {
    const validationError = validateCoverFile(files.cover)
    if (validationError) throw new BooksServiceError('validation', validationError)
  }

  const needsFreshFiles =
    !existing || existing.status === 'draft' || existing.status === 'archived'
  const currentPdfPath = needsFreshFiles ? null : existing.file_path
  const currentCoverPath = needsFreshFiles ? null : existing.cover_path
  if (!files.pdf && !currentPdfPath) {
    throw new BooksServiceError('validation', 'Choose a PDF file before publishing.')
  }
  if (!files.cover && !currentCoverPath) {
    throw new BooksServiceError('validation', 'Choose a cover image before publishing.')
  }

  const client = requireClient()
  const uploadedObjects: StorageObject[] = []
  let nextPdfPath = currentPdfPath
  let nextCoverPath = currentCoverPath

  await withUploadRollback(uploadedObjects, async () => {
    if (files.pdf) {
      onProgress?.('Uploading PDF…')
      nextPdfPath = await uploadObject('books', files.pdf, uploadedObjects)
    }
    if (files.cover) {
      onProgress?.('Uploading cover image…')
      nextCoverPath = await uploadObject('covers', files.cover, uploadedObjects)
    }

    onProgress?.('Saving book record…')
    const record = makeRecord(
      input,
      'published',
      nextPdfPath,
      nextCoverPath,
      makePublishedDate(input, existing),
    )

    if (existing) {
      await updateBookRecord(existing.id, record)
    } else {
      const { error } = await client.from('books').insert(record)
      if (error) throw toServiceError(error)
    }
  })

  const replacedObjects: StorageObject[] = []
  if (existing?.file_path && existing.file_path !== nextPdfPath) {
    replacedObjects.push({ bucket: 'books', path: existing.file_path })
  }
  if (existing?.cover_path && existing.cover_path !== nextCoverPath) {
    replacedObjects.push({ bucket: 'covers', path: existing.cover_path })
  }

  if (replacedObjects.length > 0) onProgress?.('Removing replaced files…')
  const cleanupSucceeded = await removeObjects(replacedObjects)
  return {
    cleanupWarning: cleanupSucceeded
      ? null
      : 'The book was saved, but one or more replaced public files could not be removed and may remain accessible.',
  }
}

export async function getBooks(): Promise<Book[]> {
  const client = requireClient()
  try {
    const { data, error } = await client
      .from('books')
      .select(bookColumns)
      .order('created_at', { ascending: false })
      .overrideTypes<Book[], { merge: false }>()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new BooksServiceError('request', 'Books could not be loaded. Please try again.')
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function saveBookDraft(
  input: BookInput,
  existing: Book | null,
): Promise<BooksMutationResult> {
  requireTitle(input.title)
  const record = makeRecord(
    input,
    'draft',
    existing?.file_path ?? null,
    existing?.cover_path ?? null,
    input.published_date || null,
  )

  if (existing) {
    await updateBookRecord(existing.id, record)
  } else {
    await insertBook(record)
  }
  return { cleanupWarning: null }
}

export async function saveBookChanges(
  input: BookInput,
  existing: Book,
  files: BookFiles,
  onProgress?: (message: string) => void,
): Promise<BooksMutationResult> {
  requireTitle(input.title)

  if (existing.status === 'published' && (files.pdf || files.cover)) {
    return savePublishedBook(input, existing, files, onProgress)
  }

  const status: BookStatus =
    existing.status === 'archived'
      ? 'archived'
      : existing.status === 'published'
        ? 'published'
        : 'draft'
  const record = makeRecord(
    input,
    status,
    existing.file_path,
    existing.cover_path,
    status === 'draft'
      ? input.published_date || null
      : input.published_date || existing.published_date,
  )
  await updateBookRecord(existing.id, record)
  return { cleanupWarning: null }
}

export async function publishBook(
  input: BookInput,
  existing: Book | null,
  files: BookFiles,
  onProgress?: (message: string) => void,
): Promise<BooksMutationResult> {
  return savePublishedBook(input, existing, files, onProgress)
}

export async function archiveBook(id: Book['id']): Promise<void> {
  await updateBookRecord(id, { status: 'archived' })
}

export async function deleteBook(
  book: Book,
  onProgress?: (message: string) => void,
): Promise<BooksMutationResult> {
  const client = requireClient()
  try {
    onProgress?.('Deleting book record…')
    const { data, error } = await client
      .from('books')
      .delete()
      .eq('id', book.id)
      .select('id')
      .maybeSingle()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new BooksServiceError(
        'request',
        'This book could not be deleted. It may have been removed or your access may have changed.',
      )
    }
  } catch (error: unknown) {
    throw toServiceError(error)
  }

  const associatedObjects: StorageObject[] = []
  if (book.file_path) associatedObjects.push({ bucket: 'books', path: book.file_path })
  if (book.cover_path) associatedObjects.push({ bucket: 'covers', path: book.cover_path })

  if (associatedObjects.length > 0) onProgress?.('Removing associated files…')
  return {
    cleanupWarning: (await removeObjects(associatedObjects))
      ? null
      : 'The book record was deleted, but one or more associated public files could not be removed and may remain accessible.',
  }
}
