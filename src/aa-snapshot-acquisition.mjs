import {
  AA_API_ACQUISITION_VERSION,
  AA_LANGUAGE_MODELS_ENDPOINT,
} from './aa-snapshot-refresh.mjs'

const MAX_PAGE_BYTES = 16 * 1024 * 1024
const MAX_PAGES = 100
const MAX_JSON_DEPTH = 64
const MAX_JSON_NODES = 250_000
const REQUEST_TIMEOUT_MILLISECONDS = 30_000

export class AASnapshotAcquisitionError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AASnapshotAcquisitionError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AASnapshotAcquisitionError(code, message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function validateCapturedAt(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
    || new Date(value).toISOString() !== value) {
    invalid('aa-acquisition-config-invalid', 'capturedAt must be a canonical UTC ISO-8601 timestamp')
  }
  return value
}

function validateJSONComplexity(value) {
  const pending = [{ value, depth: 0 }]
  let nodes = 0
  while (pending.length > 0) {
    const current = pending.pop()
    nodes += 1
    if (nodes > MAX_JSON_NODES || current.depth > MAX_JSON_DEPTH) {
      invalid('aa-acquisition-response-invalid', 'AA API response JSON is too complex')
    }
    if (current.value !== null && typeof current.value === 'object') {
      for (const child of Object.values(current.value)) {
        pending.push({ value: child, depth: current.depth + 1 })
      }
    }
  }
  return value
}

async function readBoundedJSON(response) {
  const contentLength = response.headers.get('content-length')
  if (contentLength !== null) {
    const length = Number(contentLength)
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_PAGE_BYTES) {
      invalid('aa-acquisition-response-too-large', 'AA API response exceeds the 16 MiB page limit')
    }
  }
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('application/json')) {
    invalid('aa-acquisition-response-invalid', 'AA API response must be JSON')
  }

  let bytes = 0
  const chunks = []
  if (response.body === null) invalid('aa-acquisition-response-invalid', 'AA API response is empty')
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    if (bytes > MAX_PAGE_BYTES) {
      await reader.cancel()
      invalid('aa-acquisition-response-too-large', 'AA API response exceeds the 16 MiB page limit')
    }
    chunks.push(value)
  }
  const body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), bytes).toString('utf8')
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    invalid('aa-acquisition-response-invalid', 'AA API response contains invalid JSON')
  }
  return validateJSONComplexity(parsed)
}

function validatePage(page, expectedPage) {
  if (!isRecord(page) || !['pro', 'commercial'].includes(page.tier)
    || typeof page.intelligence_index_version !== 'number'
    || !Number.isFinite(page.intelligence_index_version)
    || !isRecord(page.pagination) || !Array.isArray(page.data)) {
    invalid('aa-acquisition-response-invalid', 'AA API response envelope is invalid')
  }
  const { pagination } = page
  if (pagination.page !== expectedPage
    || !Number.isInteger(pagination.page_size) || pagination.page_size < 1
    || !Number.isInteger(pagination.total_pages) || pagination.total_pages < expectedPage
    || pagination.total_pages > MAX_PAGES
    || pagination.has_more !== (expectedPage < pagination.total_pages)) {
    invalid('aa-acquisition-response-invalid', 'AA API pagination envelope is invalid')
  }
  return pagination.has_more
}

/**
 * Acquire the pinned Pro language-model pages. The API key is read only from
 * the supplied environment object and is never returned or included in errors.
 */
export async function acquireAASnapshot({
  env = process.env,
  fetchImpl = globalThis.fetch,
  capturedAt = new Date().toISOString(),
} = {}) {
  const apiKey = env?.AA_API_KEY
  if (typeof apiKey !== 'string' || apiKey.trim() === '' || apiKey.length > 4096
    || /[\r\n]/.test(apiKey)) {
    invalid('aa-acquisition-key-missing', 'AA_API_KEY must be set in the server-side environment')
  }
  if (typeof fetchImpl !== 'function') {
    invalid('aa-acquisition-config-invalid', 'fetch implementation is unavailable')
  }
  validateCapturedAt(capturedAt)

  const pages = []
  for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
    const url = new URL(AA_LANGUAGE_MODELS_ENDPOINT)
    url.searchParams.set('prompt_type', 'medium')
    url.searchParams.set('page', String(pageNumber))
    let response
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        redirect: 'error',
        headers: {
          accept: 'application/json',
          'x-api-key': apiKey,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MILLISECONDS),
      })
    } catch {
      invalid('aa-acquisition-request-failed', 'AA API request failed')
    }
    if (!(response instanceof Response) || response.status !== 200) {
      invalid('aa-acquisition-request-failed', 'AA API request failed')
    }
    const page = await readBoundedJSON(response)
    const hasMore = validatePage(page, pageNumber)
    pages.push(page)
    if (!hasMore) {
      return freezeTree({
        schemaVersion: 1,
        acquisitionVersion: AA_API_ACQUISITION_VERSION,
        endpoint: AA_LANGUAGE_MODELS_ENDPOINT,
        promptType: 'medium',
        capturedAt,
        pages,
      })
    }
  }
  invalid('aa-acquisition-response-invalid', 'AA API pagination exceeds the 100-page limit')
}
