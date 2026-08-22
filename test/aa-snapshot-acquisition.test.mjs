import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  acquireAAFreeSnapshot,
  acquireAASnapshot,
  AASnapshotAcquisitionError,
} from '../src/aa-snapshot-acquisition.mjs'
import { createSnapshotRefreshFixture } from '../test-support/aa-snapshot-refresh-fixture.mjs'

function jsonResponse(value, init = {}) {
  const body = JSON.stringify(value)
  return new Response(body, {
    status: init.status ?? 200,
    headers: {
      'content-type': 'application/json',
      'content-length': String(Buffer.byteLength(body)),
      ...init.headers,
    },
  })
}

describe('acquireAASnapshot()', () => {
  it('fetches every Free-shaped page without Pro query parameters or credential persistence', async () => {
    const freeRecord = {
      id: 'free-a',
      name: 'Free A (high)',
      model_creator: { id: 'creator-a', name: 'Creator A' },
      evaluations: { artificial_analysis_intelligence_index: 42 },
      pricing: { price_1m_input_tokens: 1, price_1m_output_tokens: 3 },
      performance: { median_time_to_first_answer_token_seconds: 2 },
    }
    const pageOne = {
      tier: 'free',
      intelligence_index_version: 4.1,
      pagination: { page: 1, page_size: 1, total_pages: 2, has_more: true },
      data: [freeRecord],
    }
    const pageTwo = {
      ...structuredClone(pageOne),
      tier: 'commercial',
      pagination: { page: 2, page_size: 1, total_pages: 2, has_more: false },
      data: [{ ...freeRecord, id: 'free-b', name: 'Free B' }],
    }
    const calls = []
    const acquisition = await acquireAAFreeSnapshot({
      env: { AA_API_KEY: 'fixture-free-secret' },
      capturedAt: '2026-08-22T10:00:00.000Z',
      fetchImpl: async (url, options) => {
        calls.push({ url: String(url), options })
        return jsonResponse(calls.length === 1 ? pageOne : pageTwo)
      },
    })

    assert.deepEqual(calls.map(call => call.url), [
      'https://artificialanalysis.ai/api/v2/language/models/free?page=1',
      'https://artificialanalysis.ai/api/v2/language/models/free?page=2',
    ])
    assert.equal(acquisition.schemaVersion, 2)
    assert.equal(acquisition.acquisitionVersion, 'aa-api-acquisition/v2')
    assert.equal(acquisition.responseShape, 'free')
    assert.equal(acquisition.pages.length, 2)
    assert.equal(JSON.stringify(acquisition).includes('fixture-free-secret'), false)
    assert.equal(Object.isFrozen(acquisition), true)
  })

  it('accepts only documented caller tiers for the Free-shaped endpoint', async () => {
    const envelope = {
      tier: 'pro',
      intelligence_index_version: 4.1,
      pagination: { page: 1, page_size: 1, total_pages: 1, has_more: false },
      data: [],
    }
    const result = await acquireAAFreeSnapshot({
      env: { AA_API_KEY: 'secret' },
      capturedAt: '2026-08-22T10:00:00.000Z',
      fetchImpl: async () => jsonResponse(envelope),
    })
    assert.equal(result.pages[0].tier, 'pro')

    await assert.rejects(
      acquireAAFreeSnapshot({
        env: { AA_API_KEY: 'secret' },
        capturedAt: '2026-08-22T10:00:00.000Z',
        fetchImpl: async () => jsonResponse({ ...envelope, tier: 'enterprise' }),
      }),
      error => error.code === 'aa-acquisition-response-invalid',
    )
  })

  it('fetches every page from the fixed server-side endpoint without persisting the key', async () => {
    const pageOne = structuredClone(createSnapshotRefreshFixture().acquisition.pages[0])
    const pageTwo = structuredClone(pageOne)
    pageOne.data = pageOne.data.slice(0, 2)
    pageTwo.data = pageTwo.data.slice(2)
    pageOne.pagination = { page: 1, page_size: 2, total_pages: 2, has_more: true }
    pageTwo.pagination = { page: 2, page_size: 2, total_pages: 2, has_more: false }
    const calls = []
    const fetchImpl = async (url, options) => {
      calls.push({ url: String(url), options })
      return jsonResponse(calls.length === 1 ? pageOne : pageTwo)
    }

    const acquisition = await acquireAASnapshot({
      env: { AA_API_KEY: 'fixture-secret-key' },
      fetchImpl,
      capturedAt: '2026-08-22T10:00:00.000Z',
    })

    assert.equal(calls.length, 2)
    assert.equal(
      calls[0].url,
      'https://artificialanalysis.ai/api/v2/language/models?prompt_type=medium&page=1',
    )
    assert.equal(
      calls[1].url,
      'https://artificialanalysis.ai/api/v2/language/models?prompt_type=medium&page=2',
    )
    assert.equal(calls[0].options.redirect, 'error')
    assert.equal(calls[0].options.headers['x-api-key'], 'fixture-secret-key')
    assert.equal(JSON.stringify(acquisition).includes('fixture-secret-key'), false)
    assert.equal(acquisition.pages.length, 2)
    assert.equal(Object.isFrozen(acquisition), true)
  })

  it('rejects a missing key before making a request', async () => {
    let calls = 0

    await assert.rejects(
      acquireAASnapshot({
        env: {},
        fetchImpl: async () => { calls += 1 },
        capturedAt: '2026-08-22T10:00:00.000Z',
      }),
      error => error instanceof AASnapshotAcquisitionError
        && error.code === 'aa-acquisition-key-missing',
    )
    assert.equal(calls, 0)
  })

  it('rejects oversized, non-JSON, and unsuccessful responses without echoing response bodies', async () => {
    await assert.rejects(
      acquireAASnapshot({
        env: { AA_API_KEY: 'secret' },
        capturedAt: '2026-08-22T10:00:00.000Z',
        fetchImpl: async () => jsonResponse({}, { headers: { 'content-length': String(17 * 1024 * 1024) } }),
      }),
      error => error.code === 'aa-acquisition-response-too-large',
    )

    await assert.rejects(
      acquireAASnapshot({
        env: { AA_API_KEY: 'secret' },
        capturedAt: '2026-08-22T10:00:00.000Z',
        fetchImpl: async () => new Response('<html>not json</html>', {
          headers: { 'content-type': 'text/html' },
        }),
      }),
      error => error.code === 'aa-acquisition-response-invalid',
    )

    await assert.rejects(
      acquireAASnapshot({
        env: { AA_API_KEY: 'secret' },
        capturedAt: '2026-08-22T10:00:00.000Z',
        fetchImpl: async () => new Response('provider-internal-secret', { status: 401 }),
      }),
      error => error.code === 'aa-acquisition-request-failed'
        && !error.message.includes('provider-internal-secret')
        && !error.message.includes('secret'),
    )
  })

  it('rejects a bounded-size JSON depth bomb before recursive consumers see it', async () => {
    const nested = `${'['.repeat(65)}null${']'.repeat(65)}`
    const body = `{"tier":"pro","intelligence_index_version":4.1,"pagination":{"page":1,"page_size":1,"total_pages":1,"has_more":false},"data":[{"ignored":${nested}}]}`

    await assert.rejects(
      acquireAASnapshot({
        env: { AA_API_KEY: 'secret' },
        capturedAt: '2026-08-22T10:00:00.000Z',
        fetchImpl: async () => new Response(body, {
          headers: { 'content-type': 'application/json' },
        }),
      }),
      error => error.code === 'aa-acquisition-response-invalid',
    )
  })
})
