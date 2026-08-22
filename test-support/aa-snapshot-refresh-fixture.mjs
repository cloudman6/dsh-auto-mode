import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  AA_BINDING_PLAN_VERSION,
  AA_SNAPSHOT_REFRESH_VERSION,
} from '../src/aa-snapshot-refresh.mjs'

export const SNAPSHOT_REFRESH_NOW = '2026-08-22T12:00:00.000Z'

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

export function createSnapshotRefreshFixture() {
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
      pagination: { page: 1, page_size: 200, total_pages: 1, has_more: false },
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
