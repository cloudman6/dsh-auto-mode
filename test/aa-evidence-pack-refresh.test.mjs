import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  buildAAEvidencePack,
  buildPolicyEligibleAASnapshot,
} from '../src/aa-evidence-pack.mjs'
import {
  prepareAAEvidencePackRefresh,
  validatePreparedAAEvidencePackRefresh,
} from '../src/aa-evidence-pack-refresh.mjs'
import { AA_ROUTE_POLICY_V1 } from '../src/aa-route-policy.mjs'
import { createEvidenceRouteKey } from '../src/evidence-route-key.mjs'

const rights = { mode: 'internal-only' }
const source = {
  methodologyVersion: 'v4.1.1',
  terms: { version: '1.1', revisedAt: '2026-08-19', url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf' },
  attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
}
const rule = {
  schemaVersion: 1,
  ruleVersion: 'fixture/v1',
  providerNamespace: 'fixture',
  providerIds: ['p'],
  modelAliases: { a: 'a', b: 'b', new: 'new' },
  evidenceControls: [],
  aaRecordMappings: [],
}

function apiRecord(id, score = 30, price = 1) {
  return {
    id, name: id, slug: id, release_date: '2026-08-01',
    model_creator: { id: 'creator', name: 'Creator' },
    evaluations: { artificial_analysis_intelligence_index: score },
    pricing: { price_1m_blended_7_to_2_to_1: price },
    performance: { median_time_to_first_answer_token_seconds: 1 },
  }
}

function acquisition(records, methodology = 4.1) {
  return {
    schemaVersion: 1,
    acquisitionVersion: 'aa-api-acquisition/v1',
    endpoint: 'https://artificialanalysis.ai/api/v2/language/models',
    promptType: 'medium',
    capturedAt: '2026-08-22T10:00:00.000Z',
    pages: [{
      tier: 'pro', intelligence_index_version: methodology,
      pagination: { page: 1, page_size: 200, total_pages: 1, has_more: false },
      data: records,
    }],
  }
}

function binding(model, id) {
  return {
    evidenceRouteKey: createEvidenceRouteKey({ provider: 'p', model }, rule),
    aaRecordId: id,
    ruleVersion: rule.ruleVersion,
    matchBasis: ['fixture'], limitations: [], quarantine: null,
  }
}

function initialPack() {
  const snapshot = buildPolicyEligibleAASnapshot({
    acquisition: acquisition([apiRecord('a'), apiRecord('b', 40, 2)]),
    snapshotId: 'snapshot-old', source, rights,
  }).snapshot
  return buildAAEvidencePack({
    packId: 'pack-old', snapshot,
    bindingRegistry: {
      schemaVersion: 1, registryVersion: 'aa-binding-registry/v1', normalizationRules: [rule],
      bindings: [binding('a', 'a'), binding('b', 'b')],
    },
    routePolicy: AA_ROUTE_POLICY_V1,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT, minimumVersion: 1, maximumVersion: 1,
    },
    rights,
  })
}

describe('exception-driven Evidence Pack refresh', () => {
  it('classifies metric-only and unbound-record changes GREEN without approval', () => {
    const prepared = prepareAAEvidencePackRefresh({
      previousPack: initialPack(),
      acquisition: acquisition([apiRecord('a', 31, 0.8), apiRecord('b', 40, 2), apiRecord('unbound', 50, 3)]),
      snapshotId: 'snapshot-green', packId: 'pack-green', source, rights,
      hostRoutes: [{ provider: 'p', model: 'a', temperature: 1 }],
    })

    assert.equal(prepared.classification, 'GREEN')
    assert.equal(prepared.autoApplicable, true)
    assert.deepEqual(prepared.report.records.added, ['unbound'])
    assert.deepEqual(prepared.report.records.metricChanges.map(change => change.recordId), ['a'])
    assert.equal(validatePreparedAAEvidencePackRefresh(prepared), prepared)
  })

  it('automatically materializes an exact rule candidate and activates its current Host route', () => {
    const previous = structuredClone(initialPack())
    previous.bindingRegistry.normalizationRules[0].aaRecordMappings = [{
      aaRecordId: 'new-record', modelKey: 'new', evidenceControls: {},
    }]
    const rebuilt = buildAAEvidencePack({
      packId: previous.manifest.packId,
      snapshot: previous.snapshot,
      bindingRegistry: previous.bindingRegistry,
      routePolicy: previous.routePolicy,
      runtimeCompatibility: previous.manifest.runtimeCompatibility,
      rights,
    })
    const prepared = prepareAAEvidencePackRefresh({
      previousPack: rebuilt,
      acquisition: acquisition([apiRecord('a'), apiRecord('b', 40, 2), apiRecord('new-record', 42, 1)]),
      snapshotId: 'snapshot-generated', packId: 'pack-generated', source, rights,
      hostRoutes: [{ provider: 'p', model: 'new' }],
    })

    assert.equal(prepared.classification, 'GREEN')
    assert.deepEqual(prepared.report.bindings.generated, ['new-record'])
    assert.equal(prepared.report.hostImpact.activeRouteIds.length, 1)
    assert.equal(
      prepared.evidencePack.bindingRegistry.bindings.find(entry => entry.aaRecordId === 'new-record')
        .matchBasis[0],
      'structured stable AA record mapping in fixture/v1',
    )
  })

  it('classifies a structured candidate conflict AMBER without replacing the reviewed binding', () => {
    const previous = structuredClone(initialPack())
    previous.bindingRegistry.normalizationRules[0].aaRecordMappings = [{
      aaRecordId: 'replacement', modelKey: 'a', evidenceControls: {},
    }]
    const rebuilt = buildAAEvidencePack({
      packId: previous.manifest.packId,
      snapshot: previous.snapshot,
      bindingRegistry: previous.bindingRegistry,
      routePolicy: previous.routePolicy,
      runtimeCompatibility: previous.manifest.runtimeCompatibility,
      rights,
    })
    const prepared = prepareAAEvidencePackRefresh({
      previousPack: rebuilt,
      acquisition: acquisition([apiRecord('a'), apiRecord('b', 40, 2), apiRecord('replacement', 45, 1)]),
      snapshotId: 'snapshot-conflict', packId: 'pack-conflict', source, rights,
    })

    assert.equal(prepared.classification, 'AMBER')
    assert.equal(prepared.report.bindings.candidateExclusions[0].reasonCode, 'aa-binding-candidate-conflict')
    assert.equal(
      prepared.evidencePack.bindingRegistry.bindings.find(entry => entry.evidenceRouteKey.modelKey === 'a')
        .aaRecordId,
      'a',
    )
  })

  it('classifies missing bound records and new unbound Host routes AMBER and isolates them', () => {
    const prepared = prepareAAEvidencePackRefresh({
      previousPack: initialPack(),
      acquisition: acquisition([apiRecord('a')]),
      snapshotId: 'snapshot-amber', packId: 'pack-amber', source, rights,
      hostRoutes: [{ provider: 'p', model: 'a' }, { provider: 'p', model: 'new' }],
    })

    assert.equal(prepared.classification, 'AMBER')
    assert.equal(prepared.autoApplicable, true)
    const quarantined = prepared.evidencePack.bindingRegistry.bindings.find(entry => entry.aaRecordId === 'b')
    assert.equal(quarantined.quarantine.reasonCode, 'aa-bound-record-missing')
    assert.deepEqual(prepared.report.bindings.quarantined, ['b'])
    assert.ok(prepared.report.hostImpact.exclusions.some(entry => entry.reasonCode === 'aa-binding-missing'))
  })

  it('classifies methodology or rights contract changes RED and retains no candidate', () => {
    const methodology = prepareAAEvidencePackRefresh({
      previousPack: initialPack(), acquisition: acquisition([apiRecord('a')], 4.2),
      snapshotId: 'snapshot-red', packId: 'pack-red', source, rights,
    })
    assert.equal(methodology.classification, 'RED')
    assert.equal(methodology.autoApplicable, false)
    assert.equal(methodology.evidencePack, null)
    assert.equal(methodology.reasonCode, 'aa-snapshot-methodology-mismatch')

    const changedRights = prepareAAEvidencePackRefresh({
      previousPack: initialPack(), acquisition: acquisition([apiRecord('a')]),
      snapshotId: 'snapshot-red-rights', packId: 'pack-red-rights', source,
      rights: {
        mode: 'written-license', grantReference: 'new-grant',
        allowsMachineReadableDistribution: true, allowsModelSelectionProduct: true,
      },
    })
    assert.equal(changedRights.classification, 'RED')
    assert.equal(changedRights.reasonCode, 'aa-refresh-rights-contract-changed')
  })

  it('detects tampering with a prepared valid update', () => {
    const prepared = structuredClone(prepareAAEvidencePackRefresh({
      previousPack: initialPack(), acquisition: acquisition([apiRecord('a'), apiRecord('b', 40, 2)]),
      snapshotId: 'snapshot-next', packId: 'pack-next', source, rights,
    }))
    prepared.evidencePack.snapshot.records[0].pricing.price_1m_blended_7_to_2_to_1 = 0

    assert.throws(
      () => validatePreparedAAEvidencePackRefresh(prepared),
      error => error.code === 'aa-evidence-refresh-digest-mismatch',
    )
  })
})
