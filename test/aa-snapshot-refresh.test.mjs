import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  AA_BINDING_PLAN_VERSION,
  AA_SNAPSHOT_REFRESH_VERSION,
  AASnapshotRefreshError,
  prepareAASnapshotRefresh,
  validatePreparedAASnapshotRefresh,
} from '../src/aa-snapshot-refresh.mjs'

const NOW = '2026-08-22T12:00:00.000Z'
const OLD_SNAPSHOT_ID = 'aa-fixture-2026-08-01'
const NEXT_SNAPSHOT_ID = 'aa-fixture-2026-08-22'

function route(provider, model, controls = {}) {
  const effectiveConfig = { provider, model, ...controls }
  return { effectiveConfig, identity: createHostRouteIdentity(effectiveConfig) }
}

function bindingFor(routeEntry, aaRecordId, aaSnapshotId = OLD_SNAPSHOT_ID) {
  return {
    bindingVersion: 'aa-evidence-binding/v1',
    hostRouteId: routeEntry.identity.routeId,
    effectiveConfigFingerprint: routeEntry.identity.effectiveConfigFingerprint,
    aaSnapshotId,
    aaRecordId,
    matchBasis: [`provider=${routeEntry.effectiveConfig.provider}`, `model=${routeEntry.effectiveConfig.model}`],
    limitations: ['fixture-only'],
  }
}

function planBindingFor(routeEntry, aaRecordId) {
  const binding = bindingFor(routeEntry, aaRecordId)
  delete binding.bindingVersion
  delete binding.aaSnapshotId
  return binding
}

function snapshotRecord({ id, name, score, price, latency }) {
  return {
    recordId: id,
    label: name,
    creator: { recordId: 'creator-fixture', label: 'Fixture Creator' },
    releaseDate: '2026-08-01',
    capabilityFacts: [`intelligence-index-v4.1.1=${score}`],
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: { price_1m_blended_7_to_2_to_1: price },
    performance: { median_time_to_first_answer_token_seconds: latency },
  }
}

function apiRecord({ id, name, score, price, latency, includePrice = true }) {
  return {
    id,
    name,
    slug: `${id}-slug`,
    release_date: '2026-08-01',
    model_creator: { id: 'creator-fixture', name: 'Fixture Creator' },
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: includePrice ? { price_1m_blended_7_to_2_to_1: price } : {},
    performance: { median_time_to_first_answer_token_seconds: latency },
    ignored_upstream_field: 'must not enter the minimized snapshot',
  }
}

function fixture() {
  const light = route('fixture-provider', 'fixture-light')
  const standard = route('fixture-provider', 'fixture-standard', { reasoningEffort: 'high' })
  const deep = route('fixture-provider', 'fixture-deep', { maxTokens: 4096 })
  const hostRoutes = [light.effectiveConfig, standard.effectiveConfig, deep.effectiveConfig]

  const previousSeed = {
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    bindingVersion: 'aa-evidence-binding/v1',
    snapshot: {
      snapshotId: OLD_SNAPSHOT_ID,
      source: {
        name: 'Artificial Analysis fixture',
        capturedAt: '2026-08-01T00:00:00.000Z',
      },
      records: [
        snapshotRecord({ id: 'aa-light', name: 'Light old name', score: 34, price: 1, latency: 3 }),
        snapshotRecord({ id: 'aa-standard-old', name: 'Standard old', score: 40, price: 2, latency: 4 }),
      ],
    },
    bindings: [
      bindingFor(light, 'aa-light'),
      bindingFor(standard, 'aa-standard-old'),
    ],
  }

  const acquisition = {
    schemaVersion: 1,
    acquisitionVersion: 'aa-api-acquisition/v1',
    endpoint: 'https://artificialanalysis.ai/api/v2/language/models',
    promptType: 'medium',
    capturedAt: '2026-08-22T10:00:00.000Z',
    pages: [{
      tier: 'pro',
      intelligence_index_version: 4.1,
      pagination: {
        page: 1,
        page_size: 200,
        total_pages: 1,
        has_more: false,
      },
      data: [
        apiRecord({ id: 'aa-light', name: 'Light renamed', score: 36, price: 0.5, latency: 2 }),
        apiRecord({ id: 'aa-standard-new', name: 'Standard replacement', score: 42, price: 0.8, latency: 1 }),
        apiRecord({ id: 'aa-deep', name: 'Deep new', score: 55, price: 3, latency: 5 }),
        apiRecord({ id: 'aa-unbound-incomplete', name: 'Ignored incomplete', score: 25, latency: 1, includePrice: false }),
      ],
    }],
  }

  const manifest = {
    schemaVersion: 1,
    refreshVersion: AA_SNAPSHOT_REFRESH_VERSION,
    snapshotId: NEXT_SNAPSHOT_ID,
    apiIntelligenceIndexVersion: 4.1,
    capabilityMethodologyVersion: 'v4.1.1',
    maximumAgeDays: 30,
    terms: {
      version: '1.1',
      revisedAt: '2026-08-19',
      url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf',
    },
    attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
    rights: { mode: 'internal-only' },
  }

  const bindingPlan = {
    schemaVersion: 1,
    bindingPlanVersion: AA_BINDING_PLAN_VERSION,
    bindings: [
      planBindingFor(light, 'aa-light'),
      planBindingFor(standard, 'aa-standard-new'),
      planBindingFor(deep, 'aa-deep'),
    ],
  }

  return { acquisition, bindingPlan, deep, hostRoutes, light, manifest, previousSeed, standard }
}

describe('prepareAASnapshotRefresh()', () => {
  it('deterministically minimizes bound records and reports every material change', () => {
    const input = fixture()

    const first = prepareAASnapshotRefresh({ ...input, now: NOW })
    const second = prepareAASnapshotRefresh({ ...structuredClone(input), now: NOW })

    assert.deepEqual(second, first)
    assert.match(first.digest, /^sha256:[a-f0-9]{64}$/)
    assert.equal(first.refreshVersion, 'aa-snapshot-refresh/v1')
    assert.deepEqual(
      first.seed.snapshot.records.map(record => record.recordId),
      ['aa-deep', 'aa-light', 'aa-standard-new'],
    )
    assert.equal('ignored_upstream_field' in first.seed.snapshot.records[0], false)
    assert.equal(first.seed.snapshot.source.rights.mode, 'internal-only')
    assert.deepEqual(first.report.records.added, ['aa-deep', 'aa-standard-new'])
    assert.deepEqual(first.report.records.removed, ['aa-standard-old'])
    assert.deepEqual(first.report.records.renamed, [{
      recordId: 'aa-light',
      before: 'Light old name',
      after: 'Light renamed',
    }])
    assert.equal(first.report.records.metrics.length, 1)
    assert.equal(first.report.records.metrics[0].recordId, 'aa-light')
    assert.deepEqual(first.report.bindings.added, [input.deep.identity.routeId])
    assert.deepEqual(first.report.bindings.removed, [])
    assert.deepEqual(first.report.bindings.replaced, [{
      hostRouteId: input.standard.identity.routeId,
      beforeAARecordId: 'aa-standard-old',
      afterAARecordId: 'aa-standard-new',
    }])
    assert.deepEqual(first.report.bandChanges, [{
      hostRouteId: input.light.identity.routeId,
      aaRecordId: 'aa-light',
      before: 'light',
      after: 'standard',
    }])
    assert.equal(first.report.orderingChanges.standard.before[0], input.standard.identity.routeId)
    assert.equal(first.report.orderingChanges.standard.after[0], input.light.identity.routeId)
    assert.equal(Object.isFrozen(first), true)
    assert.equal(validatePreparedAASnapshotRefresh(first), first)
  })

  it('reports an explicitly removed binding instead of silently retaining it', () => {
    const input = fixture()
    input.bindingPlan.bindings = input.bindingPlan.bindings.filter(
      binding => binding.hostRouteId !== input.standard.identity.routeId,
    )

    const prepared = prepareAASnapshotRefresh({ ...input, now: NOW })

    assert.deepEqual(prepared.report.bindings.removed, [input.standard.identity.routeId])
    assert.deepEqual(prepared.seed.snapshot.records.map(record => record.recordId), ['aa-deep', 'aa-light'])
  })

  it('rejects a bound record with missing comparison data while ignoring incomplete unbound records', () => {
    const input = fixture()
    input.bindingPlan.bindings[0].aaRecordId = 'aa-unbound-incomplete'

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error instanceof AASnapshotRefreshError && error.code === 'aa-refresh-record-incomplete',
    )
  })

  it('rejects duplicate source IDs and malformed pagination', () => {
    const duplicate = fixture()
    duplicate.acquisition.pages[0].data.push(structuredClone(duplicate.acquisition.pages[0].data[0]))
    assert.throws(
      () => prepareAASnapshotRefresh({ ...duplicate, now: NOW }),
      error => error.code === 'aa-refresh-source-invalid',
    )

    const malformedPage = fixture()
    malformedPage.acquisition.pages[0].pagination.has_more = true
    assert.throws(
      () => prepareAASnapshotRefresh({ ...malformedPage, now: NOW }),
      error => error.code === 'aa-refresh-source-invalid',
    )
  })

  it('rejects stale or methodology-mismatched acquisitions', () => {
    const stale = fixture()
    stale.acquisition.capturedAt = '2026-06-01T00:00:00.000Z'
    assert.throws(
      () => prepareAASnapshotRefresh({ ...stale, now: NOW }),
      error => error.code === 'aa-refresh-source-stale',
    )

    const changedMethodology = fixture()
    changedMethodology.acquisition.pages[0].intelligence_index_version = 4.2
    assert.throws(
      () => prepareAASnapshotRefresh({ ...changedMethodology, now: NOW }),
      error => error.code === 'aa-refresh-methodology-mismatch',
    )
  })

  it('requires explicit scope assertions for written-license distribution', () => {
    const input = fixture()
    input.manifest.rights = {
      mode: 'written-license',
      grantReference: 'outside-git/grant-2026-08',
      allowsMachineReadableDistribution: true,
      allowsModelSelectionProduct: false,
    }

    assert.throws(
      () => prepareAASnapshotRefresh({ ...input, now: NOW }),
      error => error.code === 'aa-refresh-rights-invalid',
    )

    input.manifest.rights.allowsModelSelectionProduct = true
    const prepared = prepareAASnapshotRefresh({ ...input, now: NOW })
    assert.equal(prepared.seed.snapshot.source.rights.grantReference, 'outside-git/grant-2026-08')
  })

  it('detects tampering with a prepared candidate', () => {
    const prepared = structuredClone(prepareAASnapshotRefresh({ ...fixture(), now: NOW }))
    prepared.seed.snapshot.records[0].pricing.price_1m_blended_7_to_2_to_1 = 0

    assert.throws(
      () => validatePreparedAASnapshotRefresh(prepared),
      error => error.code === 'aa-refresh-digest-mismatch',
    )
  })
})
