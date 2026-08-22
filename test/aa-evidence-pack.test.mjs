import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  buildAAEvidencePack,
  buildPolicyEligibleAASnapshot,
  evidenceComponentDigest,
  serializeEvidenceComponent,
  validateAAEvidencePack,
} from '../src/aa-evidence-pack.mjs'
import { AA_ROUTE_POLICY_V1 } from '../src/aa-route-policy.mjs'

const capturedAt = '2026-08-22T10:00:00.000Z'

function apiRecord(id, score, price, latency = null) {
  return {
    id,
    name: `Model ${id}`,
    slug: `model-${id}`,
    release_date: '2026-08-01',
    model_creator: { id: `creator-${id}`, name: `Creator ${id}` },
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: { price_1m_blended_7_to_2_to_1: price },
    performance: { median_time_to_first_answer_token_seconds: latency },
    ignored: 'not retained',
  }
}

function acquisition(records, pages = 1) {
  const chunks = Array.from({ length: pages }, () => [])
  records.forEach((record, index) => chunks[index % pages].push(record))
  return {
    schemaVersion: 1,
    acquisitionVersion: 'aa-api-acquisition/v1',
    endpoint: 'https://artificialanalysis.ai/api/v2/language/models',
    promptType: 'medium',
    capturedAt,
    pages: chunks.map((data, index) => ({
      tier: 'pro',
      intelligence_index_version: 4.1,
      pagination: {
        page: index + 1,
        page_size: 200,
        total_pages: chunks.length,
        has_more: index + 1 < chunks.length,
      },
      data,
    })),
  }
}

function source() {
  return {
    methodologyVersion: 'v4.1.1',
    terms: {
      version: '1.1',
      revisedAt: '2026-08-19',
      url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf',
    },
    attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
  }
}

function registry() {
  return {
    schemaVersion: 1,
    registryVersion: 'aa-binding-registry/v1',
    normalizationRules: [{
      schemaVersion: 1,
      ruleVersion: 'fixture-normalization/v1',
      providerNamespace: 'fixture',
      providerIds: ['fixture'],
      modelAliases: { 'model-a': 'model-a', 'model-b': 'model-b' },
      evidenceControls: [{ key: 'reasoningEffort', source: 'reasoningEffort', required: false }],
    }],
    bindings: [{
      evidenceRouteKey: {
        schemaVersion: 1,
        providerNamespace: 'fixture',
        modelKey: 'model-a',
        evidenceControls: { reasoningEffort: 'high' },
      },
      aaRecordId: 'a',
      ruleVersion: 'fixture-normalization/v1',
      matchBasis: ['provider namespace', 'exact model', 'exact reasoning effort'],
      limitations: ['synthetic fixture'],
      quarantine: null,
    }],
  }
}

describe('Evidence Pack contracts', () => {
  it('retains every policy-eligible record across all pages independently of bindings', () => {
    const sourceBundle = acquisition([
      apiRecord('c', 55, 3, 5),
      apiRecord('a', 32, 1, 2),
      apiRecord('b', 42, 2),
      { ...apiRecord('incomplete', 20, 1), pricing: {} },
    ], 2)

    const result = buildPolicyEligibleAASnapshot({
      acquisition: sourceBundle,
      snapshotId: 'aa-snapshot-fixture',
      source: source(),
      rights: { mode: 'internal-only' },
    })

    assert.deepEqual(result.snapshot.records.map(record => record.recordId), ['a', 'b', 'c'])
    assert.deepEqual(result.exclusions, [{ recordId: 'incomplete', reasonCode: 'aa-price-missing' }])
    assert.equal(result.snapshot.records[1].performance.median_time_to_first_answer_token_seconds, null)
    assert.equal('ignored' in result.snapshot.records[0], false)
    assert.equal(Object.isFrozen(result), true)
  })

  it('is deterministic under page and record reordering', () => {
    const records = [apiRecord('a', 32, 1), apiRecord('b', 42, 2)]
    const first = buildPolicyEligibleAASnapshot({
      acquisition: acquisition(records, 2), snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
    })
    const secondAcquisition = acquisition(records.toReversed(), 2)
    secondAcquisition.pages.reverse()
    secondAcquisition.pages.forEach((page, index, pages) => {
      page.pagination.page = index + 1
      page.pagination.total_pages = pages.length
      page.pagination.has_more = index + 1 < pages.length
    })
    const second = buildPolicyEligibleAASnapshot({
      acquisition: secondAcquisition, snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
    })

    assert.deepEqual(second, first)
  })

  it('validates independent components, digests, runtime compatibility, and rights', () => {
    const snapshot = buildPolicyEligibleAASnapshot({
      acquisition: acquisition([apiRecord('a', 32, 1)]),
      snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
    }).snapshot
    const pack = buildAAEvidencePack({
      packId: 'pack-fixture',
      snapshot,
      bindingRegistry: registry(),
      routePolicy: AA_ROUTE_POLICY_V1,
      runtimeCompatibility: {
        contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
        minimumVersion: 1,
        maximumVersion: 1,
      },
      rights: { mode: 'internal-only' },
    })

    assert.equal(validateAAEvidencePack(pack), pack)
    assert.match(pack.manifest.components.snapshot.digest, /^sha256:[a-f0-9]{64}$/)
    assert.equal(pack.manifest.components.snapshot.digest, evidenceComponentDigest(pack.snapshot))
    assert.equal(Object.isFrozen(pack), true)

    const tampered = structuredClone(pack)
    tampered.snapshot.records[0].pricing.price_1m_blended_7_to_2_to_1 = 0
    assert.throws(() => validateAAEvidencePack(tampered), error => error.code === 'aa-evidence-pack-digest-mismatch')

    const incompatible = structuredClone(pack)
    incompatible.manifest.runtimeCompatibility.minimumVersion = 2
    assert.throws(
      () => validateAAEvidencePack(incompatible),
      error => error.code === 'aa-evidence-pack-runtime-incompatible',
    )

    const publicWithoutGrant = structuredClone(pack)
    publicWithoutGrant.manifest.rights = { mode: 'written-license' }
    assert.throws(
      () => validateAAEvidencePack(publicWithoutGrant),
      error => error.code === 'aa-evidence-pack-rights-invalid',
    )
  })

  it('rejects duplicate source IDs and duplicate registry keys', () => {
    assert.throws(
      () => buildPolicyEligibleAASnapshot({
        acquisition: acquisition([apiRecord('a', 32, 1), apiRecord('a', 33, 2)]),
        snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
      }),
      error => error.code === 'aa-snapshot-record-id-duplicate',
    )

    const duplicateRegistry = registry()
    duplicateRegistry.bindings.push(structuredClone(duplicateRegistry.bindings[0]))
    const snapshot = buildPolicyEligibleAASnapshot({
      acquisition: acquisition([apiRecord('a', 32, 1)]),
      snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
    }).snapshot
    assert.throws(
      () => buildAAEvidencePack({
        packId: 'pack', snapshot, bindingRegistry: duplicateRegistry,
        routePolicy: AA_ROUTE_POLICY_V1,
        runtimeCompatibility: { contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT, minimumVersion: 1, maximumVersion: 1 },
        rights: { mode: 'internal-only' },
      }),
      error => error.code === 'aa-binding-registry-key-duplicate',
    )
  })

  it('rejects oversized and accessor-backed nondeterministic components', () => {
    assert.throws(
      () => serializeEvidenceComponent({ payload: 'x'.repeat(16 * 1024 * 1024) }),
      error => error.code === 'aa-evidence-pack-component-too-large',
    )
    const accessor = {}
    Object.defineProperty(accessor, 'value', { enumerable: true, get: () => 'unstable' })
    assert.throws(
      () => serializeEvidenceComponent(accessor),
      error => error.code === 'aa-evidence-pack-invalid',
    )
  })

  it('canonicalizes Registry permutations while allowing two exact keys to cite one stable record', () => {
    const snapshot = buildPolicyEligibleAASnapshot({
      acquisition: acquisition([apiRecord('a', 32, 1)]),
      snapshotId: 'snapshot', source: source(), rights: { mode: 'internal-only' },
    }).snapshot
    const firstRegistry = registry()
    firstRegistry.bindings.push({
      ...structuredClone(firstRegistry.bindings[0]),
      evidenceRouteKey: {
        ...structuredClone(firstRegistry.bindings[0].evidenceRouteKey),
        modelKey: 'model-b',
      },
    })
    const secondRegistry = structuredClone(firstRegistry)
    secondRegistry.bindings.reverse()
    const input = {
      packId: 'pack', snapshot, routePolicy: AA_ROUTE_POLICY_V1,
      runtimeCompatibility: {
        contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT, minimumVersion: 1, maximumVersion: 1,
      },
      rights: { mode: 'internal-only' },
    }

    const first = buildAAEvidencePack({ ...input, bindingRegistry: firstRegistry })
    const second = buildAAEvidencePack({ ...input, bindingRegistry: secondRegistry })
    assert.deepEqual(second, first)
    assert.equal(first.bindingRegistry.bindings.filter(binding => binding.aaRecordId === 'a').length, 2)
  })
})
