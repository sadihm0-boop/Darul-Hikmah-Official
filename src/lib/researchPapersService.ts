import { supabase } from './supabaseClient'

export type ResearchPaperStatus = 'draft' | 'published' | 'archived'
export type ResearchPapersServiceErrorKind =
  | 'configuration'
  | 'permission'
  | 'request'
  | 'validation'
  | 'cleanup'

export interface ResearchPaper {
  id: string
  title: string
  author: string | null
  abstract: string | null
  keywords: string[] | null
  category: string | null
  file_path: string | null
  publication_date: string | null
  journal_name: string | null
  created_at: string | null
  updated_at: string | null
  status: ResearchPaperStatus
}

export interface ResearchPaperInput {
  title: string
  author: string
  abstract: string
  keywords: string[]
  category: string
  journal_name: string
  publication_date: string
}

export interface ResearchPaperMutationResult {
  cleanupWarning: string | null
}

export class ResearchPapersServiceError extends Error {
  readonly kind: ResearchPapersServiceErrorKind

  constructor(kind: ResearchPapersServiceErrorKind, message: string) {
    super(message)
    this.name = 'ResearchPapersServiceError'
    this.kind = kind
  }
}

export const RESEARCH_PAPER_UPLOAD_LIMITS = {
  pdfBytes: 100 * 1024 * 1024,
} as const

const storageBucket = 'research-papers'
const researchPaperColumns =
  'id, title, author, abstract, keywords, category, file_path, publication_date, journal_name, created_at, updated_at, status'
const permissionErrorCodes = new Set(['401', '403', '42501', 'PGRST301', 'PGRST302'])

interface ResearchPaperRecord {
  title: string
  author: string | null
  abstract: string | null
  keywords: string[] | null
  category: string | null
  file_path: string | null
  publication_date: string | null
  journal_name: string | null
  status: ResearchPaperStatus
}

function getErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined

  if (
    'statusCode' in error &&
    (typeof error.statusCode === 'string' || typeof error.statusCode === 'number')
  ) {
    return String(error.statusCode)
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

function toServiceError(error: unknown): ResearchPapersServiceError {
  if (error instanceof ResearchPapersServiceError) return error

  if (permissionErrorCodes.has(getErrorCode(error) ?? '')) {
    return new ResearchPapersServiceError(
      'permission',
      'You do not have permission to manage research papers or their PDF files. Confirm your administrator access and try again.',
    )
  }

  return new ResearchPapersServiceError(
    'request',
    'The research paper operation could not be completed. Please try again.',
  )
}

function requireClient() {
  if (!supabase) {
    throw new ResearchPapersServiceError(
      'configuration',
      'Research Papers are unavailable because Supabase is not configured.',
    )
  }
  return supabase
}

function requireTitle(title: string): void {
  if (!title.trim()) {
    throw new ResearchPapersServiceError(
      'validation',
      'Enter a title for this research paper.',
    )
  }
}

export function validateResearchPaperPdf(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (file.type !== 'application/pdf' || extension !== '.pdf') {
    return 'Choose a PDF file with the .pdf extension.'
  }
  if (file.size === 0 || file.size > RESEARCH_PAPER_UPLOAD_LIMITS.pdfBytes) {
    return 'The PDF must be at most 100 MB and cannot be empty.'
  }
  return null
}

function normalizeOptional(value: string): string | null {
  return value.trim() || null
}

function makeRecord(
  input: ResearchPaperInput,
  status: ResearchPaperStatus,
  filePath: string | null,
): ResearchPaperRecord {
  const keywords = [...new Set(input.keywords.map((keyword) => keyword.trim()).filter(Boolean))]

  return {
    title: input.title.trim(),
    author: normalizeOptional(input.author),
    abstract: normalizeOptional(input.abstract),
    keywords: keywords.length > 0 ? keywords : null,
    category: normalizeOptional(input.category),
    file_path: filePath,
    publication_date: input.publication_date || null,
    journal_name: normalizeOptional(input.journal_name),
    status,
  }
}

async function insertResearchPaper(record: ResearchPaperRecord): Promise<void> {
  const client = requireClient()
  try {
    const { error } = await client.from('research_papers').insert(record)
    if (error) throw toServiceError(error)
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

async function updateResearchPaperRecord(
  id: ResearchPaper['id'],
  record: Partial<ResearchPaperRecord>,
): Promise<void> {
  const client = requireClient()
  try {
    const { data, error } = await client
      .from('research_papers')
      .update(record)
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new ResearchPapersServiceError(
        'request',
        'This research paper could not be updated. It may have been removed or your access may have changed.',
      )
    }
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

function makeObjectPath(): string {
  if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== 'function') {
    throw new ResearchPapersServiceError(
      'request',
      'Secure file paths are unavailable in this browser. Use a secure browser context and try again.',
    )
  }

  return `${globalThis.crypto.randomUUID()}.pdf`
}

function isSafeObjectPath(path: string): boolean {
  return (
    path.length > 0 &&
    !path.startsWith('/') &&
    !path.includes('://') &&
    !path.split('/').some((segment) => segment === '..')
  )
}

async function uploadPdf(file: File, uploadedPaths: string[]): Promise<string> {
  const client = requireClient()
  const validationError = validateResearchPaperPdf(file)
  if (validationError) {
    throw new ResearchPapersServiceError('validation', validationError)
  }

  const path = makeObjectPath()
  uploadedPaths.push(path)

  try {
    const { error } = await client.storage.from(storageBucket).upload(path, file, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false,
    })

    if (error) {
      const errorCode = getErrorCode(error)?.toLowerCase()
      if (
        errorCode === '413' ||
        errorCode === 'entitytoolarge' ||
        errorCode === 'payloadtoolarge'
      ) {
        throw new ResearchPapersServiceError(
          'validation',
          'Storage rejected this PDF as too large. The client-side maximum is 100 MB; an upstream or platform upload limit may still apply.',
        )
      }
      throw toServiceError(error)
    }
    return path
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

async function removePdf(path: string): Promise<boolean> {
  if (!isSafeObjectPath(path) || !supabase) return false

  try {
    const { error } = await supabase.storage.from(storageBucket).remove([path])
    return !error
  } catch {
    return false
  }
}

async function removeUploadedPdfs(paths: string[]): Promise<boolean> {
  if (paths.length === 0) return true

  const safePaths = paths.filter(isSafeObjectPath)
  if (!supabase || safePaths.length !== paths.length) return false

  try {
    const { error } = await supabase.storage.from(storageBucket).remove(safePaths)
    return !error
  } catch {
    return false
  }
}

async function withUploadRollback<T>(
  uploadedPaths: string[],
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error: unknown) {
    const cleanupSucceeded = await removeUploadedPdfs(uploadedPaths)
    if (!cleanupSucceeded) {
      throw new ResearchPapersServiceError(
        'cleanup',
        'The research paper was not saved, and its newly uploaded public PDF may remain in Storage. Ask an administrator to review Storage cleanup.',
      )
    }
    throw toServiceError(error)
  }
}

export async function getResearchPapers(): Promise<ResearchPaper[]> {
  const client = requireClient()
  try {
    const { data, error } = await client
      .from('research_papers')
      .select(researchPaperColumns)
      .order('created_at', { ascending: false })
      .overrideTypes<ResearchPaper[], { merge: false }>()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new ResearchPapersServiceError(
        'request',
        'Research Papers could not be loaded. Please try again.',
      )
    }
    return data
  } catch (error: unknown) {
    throw toServiceError(error)
  }
}

export async function saveResearchPaperDraft(
  input: ResearchPaperInput,
  existing: ResearchPaper | null,
): Promise<ResearchPaperMutationResult> {
  requireTitle(input.title)
  const record = makeRecord(input, 'draft', null)

  if (existing) {
    if (existing.status !== 'draft') {
      throw new ResearchPapersServiceError(
        'validation',
        'Only draft research papers can be saved as drafts.',
      )
    }
    await updateResearchPaperRecord(existing.id, record)
  } else {
    await insertResearchPaper(record)
  }

  const cleanupSucceeded = existing?.file_path ? await removePdf(existing.file_path) : true
  return {
    cleanupWarning: cleanupSucceeded
      ? null
      : 'The draft was saved without a PDF reference, but a previously attached public PDF could not be removed and may remain accessible.',
  }
}

export async function saveResearchPaperChanges(
  input: ResearchPaperInput,
  existing: ResearchPaper,
  pdfFile: File | null,
  onProgress?: (message: string) => void,
): Promise<ResearchPaperMutationResult> {
  requireTitle(input.title)
  if (existing.status === 'draft') {
    throw new ResearchPapersServiceError(
      'validation',
      'Use Save Draft to update a draft research paper.',
    )
  }

  const shouldReplacePdf = existing.status === 'published' && pdfFile !== null
  if (shouldReplacePdf && pdfFile) {
    const validationError = validateResearchPaperPdf(pdfFile)
    if (validationError) {
      throw new ResearchPapersServiceError('validation', validationError)
    }
  }

  const uploadedPaths: string[] = []
  let nextFilePath = existing.file_path

  if (shouldReplacePdf && pdfFile) {
    await withUploadRollback(uploadedPaths, async () => {
      onProgress?.('Uploading replacement PDF…')
      nextFilePath = await uploadPdf(pdfFile, uploadedPaths)
      onProgress?.('Saving research paper record…')
      await updateResearchPaperRecord(
        existing.id,
        makeRecord(input, existing.status, nextFilePath),
      )
    })
  } else {
    onProgress?.('Saving research paper record…')
    await updateResearchPaperRecord(
      existing.id,
      makeRecord(input, existing.status, nextFilePath),
    )
  }

  if (
    shouldReplacePdf &&
    existing.file_path &&
    existing.file_path !== nextFilePath
  ) {
    onProgress?.('Removing replaced PDF…')
    const cleanupSucceeded = await removePdf(existing.file_path)
    return {
      cleanupWarning: cleanupSucceeded
        ? null
        : 'The research paper was saved, but its replaced public PDF could not be removed and may remain accessible.',
    }
  }

  return { cleanupWarning: null }
}

export async function publishResearchPaper(
  input: ResearchPaperInput,
  existing: ResearchPaper | null,
  pdfFile: File | null,
  onProgress?: (message: string) => void,
): Promise<ResearchPaperMutationResult> {
  requireTitle(input.title)
  if (!pdfFile) {
    throw new ResearchPapersServiceError(
      'validation',
      'Choose a PDF file before publishing.',
    )
  }

  const validationError = validateResearchPaperPdf(pdfFile)
  if (validationError) {
    throw new ResearchPapersServiceError('validation', validationError)
  }

  const uploadedPaths: string[] = []
  let nextFilePath: string | null = null

  await withUploadRollback(uploadedPaths, async () => {
    onProgress?.('Uploading PDF…')
    nextFilePath = await uploadPdf(pdfFile, uploadedPaths)
    onProgress?.('Saving research paper record…')
    const record = makeRecord(input, 'published', nextFilePath)

    if (existing) {
      await updateResearchPaperRecord(existing.id, record)
    } else {
      await insertResearchPaper(record)
    }
  })

  if (existing?.file_path && existing.file_path !== nextFilePath) {
    onProgress?.('Removing replaced PDF…')
    const cleanupSucceeded = await removePdf(existing.file_path)
    return {
      cleanupWarning: cleanupSucceeded
        ? null
        : 'The research paper was published, but its replaced public PDF could not be removed and may remain accessible.',
    }
  }

  return { cleanupWarning: null }
}

export async function archiveResearchPaper(id: ResearchPaper['id']): Promise<void> {
  await updateResearchPaperRecord(id, { status: 'archived' })
}

export async function deleteResearchPaper(
  paper: ResearchPaper,
  onProgress?: (message: string) => void,
): Promise<ResearchPaperMutationResult> {
  const client = requireClient()
  try {
    onProgress?.('Deleting research paper record…')
    const { data, error } = await client
      .from('research_papers')
      .delete()
      .eq('id', paper.id)
      .select('id')
      .maybeSingle()

    if (error) throw toServiceError(error)
    if (!data) {
      throw new ResearchPapersServiceError(
        'request',
        'This research paper could not be deleted. It may have been removed or your access may have changed.',
      )
    }
  } catch (error: unknown) {
    throw toServiceError(error)
  }

  if (!paper.file_path) return { cleanupWarning: null }

  onProgress?.('Removing associated PDF…')
  return {
    cleanupWarning: (await removePdf(paper.file_path))
      ? null
      : 'The research paper record was deleted, but its public PDF could not be removed and may remain accessible.',
  }
}

export function getResearchPaperPublicUrl(filePath: string | null): string | null {
  if (!filePath || !isSafeObjectPath(filePath) || !supabase) return null
  return supabase.storage.from(storageBucket).getPublicUrl(filePath).data.publicUrl
}
