import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  buildAAEvidencePack,
} from '../src/aa-evidence-pack.mjs'
import {
  AA_ACTIVE_CATALOG_VERSION,
  compileActiveAACatalog,
} from '../src/aa-active-catalog.mjs'
import { AA_ROUTE_POLICY_V2, compileAARoutePolicyCatalog } from '../src/aa-route-policy.mjs'
import { createEvidenceRouteKey } from '../src/evidence-route-key.mjs'

const rule = {
  schemaVersion: 1,
  ruleVersion: 'fixture/v1',
  providerNamespace: 'fixture',
  providerIds: ['p'],
  modelAliases: { a: 'a', b: 'b', c: 'c', unbound: 'unbound' },
  evidenceControls: [{ key: 'effort', source: 'reasoningEffort', required: false }],
}

function record(recordId, score, price) {
  return {
    recordId,
    label: recordId,
    slug: recordId,
    creator: { recordId: 'creator', label: 'Creator' },
    releaseDate: null,
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: {
      price_1m_normalized_7_to_2_to_1: price,
      normalization: { version: 'aa-price-normalization/v1', basis: 'legacy-aa-blended' },
    },
    performance: { median_time_to_first_answer_token_seconds: 1 },
  }
}

function binding(model, aaRecordId, quarantine = null, controls = {}) {
  return {
    evidenceRouteKey: createEvidenceRouteKey({ provider: 'p', model, ...controls }, rule),
    aaRecordId,
    ruleVersion: rule.ruleVersion,
    matchBasis: ['fixture exact identity'],
    limitations: [],
    quarantine,
  }
}

function pack() {
  const rights = { mode: 'internal-only' }
  return buildAAEvidencePack({
    packId: 'fixture-pack',
    snapshot: {
      schemaVersion: 1,
      snapshotVersion: 'aa-snapshot/v3',
      snapshotId: 'fixture-snapshot',
      capturedAt: '2026-08-22T10:00:00.000Z',
      source: {
        methodologyVersion: 'v4.1.1',
        terms: { version: '1.1', revisedAt: '2026-08-19', url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf' },
        attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
      },
      rights,
      records: [record('aa-a', 30, 1), record('aa-b', 40, 2), record('aa-c', 55, 3)],
    },
    bindingRegistry: {
      schemaVersion: 1,
      registryVersion: 'aa-binding-registry/v1',
      normalizationRules: [rule],
      bindings: [
        binding('a', 'aa-a'),
        binding('b', 'aa-b', null, { reasoningEffort: 'high' }),
        binding('c', 'aa-c', { reasonCode: 'aa-bound-record-missing' }),
      ],
    },
    routePolicy: AA_ROUTE_POLICY_V2,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
      minimumVersion: 2,
      maximumVersion: 2,
    },
    rights,
  })
}

describe('runtime Active Catalog', () => {
  it('derives active, dormant, and quarantined state from current Host routes', () => {
    const active = compileActiveAACatalog({
      evidencePack: pack(),
      hostRoutes: [
        { provider: 'p', model: 'a', temperature: 0 },
        { provider: 'p', model: 'c' },
        { provider: 'p', model: 'unbound' },
      ],
    })

    assert.equal(active.catalogVersion, AA_ACTIVE_CATALOG_VERSION)
    assert.deepEqual(active.entries.map(entry => entry.aaRecordId), ['aa-a'])
    assert.match(active.entries[0].executionFingerprint, /^sha256:/)
    assert.match(active.entries[0].evidenceRouteKeyId, /^evidence-route-key:v1:/)
    assert.deepEqual(
      Object.fromEntries(active.bindingStates.map(state => [state.aaRecordId, state.status])),
      { 'aa-a': 'active', 'aa-b': 'dormant', 'aa-c': 'quarantined' },
    )
    assert.deepEqual(
      new Set(active.exclusions.map(exclusion => exclusion.reasonCode)),
      new Set(['aa-binding-quarantined', 'aa-binding-missing']),
    )
  })

  it('automatically activates a dormant binding and preserves evidence across execution-only changes', () => {
    const first = compileActiveAACatalog({
      evidencePack: pack(),
      hostRoutes: [{ provider: 'p', model: 'b', reasoningEffort: 'high', temperature: 0 }],
    })
    const second = compileActiveAACatalog({
      evidencePack: pack(),
      hostRoutes: [{ provider: 'p', model: 'b', reasoningEffort: 'high', temperature: 1, maxTokens: 8192 }],
    })

    assert.equal(first.entries[0].aaRecordId, 'aa-b')
    assert.equal(second.entries[0].aaRecordId, 'aa-b')
    assert.equal(first.entries[0].evidenceRouteKeyId, second.entries[0].evidenceRouteKeyId)
    assert.notEqual(first.entries[0].executionFingerprint, second.entries[0].executionFingerprint)
    assert.equal(second.bindingStates.find(state => state.aaRecordId === 'aa-b').status, 'active')
  })

  it('feeds the existing price-first policy without changing ordering semantics', () => {
    const active = compileActiveAACatalog({
      evidencePack: pack(),
      hostRoutes: [
        { provider: 'p', model: 'a' },
        { provider: 'p', model: 'b', reasoningEffort: 'high' },
      ],
    })
    const routed = compileAARoutePolicyCatalog(active)

    assert.equal(routed.levels.light[0].aaRecordId, 'aa-a')
    assert.equal(routed.levels.standard[0].aaRecordId, 'aa-b')
  })

  it('fails unrelated routes closed without invalidating valid entries', () => {
    const active = compileActiveAACatalog({
      evidencePack: pack(),
      hostRoutes: [
        { provider: 'p', model: 'a' },
        { provider: 'unknown', model: 'x' },
        { provider: 'p', model: 'unknown-model' },
      ],
    })

    assert.deepEqual(active.entries.map(entry => entry.aaRecordId), ['aa-a'])
    assert.deepEqual(
      new Set(active.exclusions.map(exclusion => exclusion.reasonCode)),
      new Set(['evidence-route-rule-missing', 'evidence-route-model-unmapped']),
    )
  })
})
