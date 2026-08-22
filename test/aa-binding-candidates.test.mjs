import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { deriveStructuredBindingCandidates } from '../src/aa-binding-candidates.mjs'
import { createEvidenceRouteKey } from '../src/evidence-route-key.mjs'

function record(recordId) {
  return { recordId }
}

function rule({
  ruleVersion = 'p/v1',
  providerNamespace = 'p',
  providerIds = ['p'],
  mappings = [],
} = {}) {
  return {
    schemaVersion: 1,
    ruleVersion,
    providerNamespace,
    providerIds,
    modelAliases: { a: 'a', b: 'b' },
    evidenceControls: [{ key: 'effort', source: 'reasoningEffort', required: false }],
    aaRecordMappings: mappings,
  }
}

function mapping(aaRecordId, modelKey, effort) {
  return {
    aaRecordId,
    modelKey,
    evidenceControls: effort === undefined ? {} : { effort },
  }
}

describe('structured AA binding candidates', () => {
  it('derives dormant-capable exact bindings from stable record mappings without Host inventory', () => {
    const result = deriveStructuredBindingCandidates({
      snapshot: { records: [record('aa-a'), record('aa-b')] },
      normalizationRules: [rule({ mappings: [
        mapping('aa-b', 'b'),
        mapping('aa-a', 'a', 'high'),
      ] })],
      existingBindings: [],
    })

    assert.deepEqual(result.generated.map(candidate => candidate.aaRecordId), ['aa-a', 'aa-b'])
    assert.deepEqual(result.generated.find(candidate => candidate.aaRecordId === 'aa-a').evidenceRouteKey, {
      schemaVersion: 1,
      providerNamespace: 'p',
      modelKey: 'a',
      evidenceControls: { effort: 'high' },
    })
    assert.deepEqual(result.exclusions, [])
  })

  it('reuses identical bindings and never replaces a conflicting stable record', () => {
    const normalizationRule = rule({ mappings: [mapping('aa-a', 'a', 'high')] })
    const evidenceRouteKey = createEvidenceRouteKey(
      { provider: 'p', model: 'a', reasoningEffort: 'high' },
      normalizationRule,
    )
    const existing = {
      evidenceRouteKey,
      aaRecordId: 'aa-existing',
      ruleVersion: 'p/v1',
      matchBasis: ['reviewed'],
      limitations: [],
      quarantine: null,
    }
    const conflict = deriveStructuredBindingCandidates({
      snapshot: { records: [record('aa-a'), record('aa-existing')] },
      normalizationRules: [normalizationRule],
      existingBindings: [existing],
    })
    assert.deepEqual(conflict.generated, [])
    assert.equal(conflict.exclusions[0].reasonCode, 'aa-binding-candidate-conflict')

    const reused = deriveStructuredBindingCandidates({
      snapshot: { records: [record('aa-a')] },
      normalizationRules: [normalizationRule],
      existingBindings: [{ ...existing, aaRecordId: 'aa-a' }],
    })
    assert.deepEqual(reused.generated, [])
    assert.equal(reused.reused, 1)
    assert.deepEqual(reused.exclusions, [])
  })

  it('isolates absent records and ambiguous exact keys deterministically', () => {
    const missing = deriveStructuredBindingCandidates({
      snapshot: { records: [] },
      normalizationRules: [rule({ mappings: [mapping('aa-missing', 'a')] })],
      existingBindings: [],
    })
    assert.equal(missing.exclusions[0].reasonCode, 'aa-binding-candidate-record-missing')

    const ambiguous = deriveStructuredBindingCandidates({
      snapshot: { records: [record('aa-a'), record('aa-b')] },
      normalizationRules: [
        rule({ ruleVersion: 'a/v1', providerIds: ['p-a'], mappings: [mapping('aa-a', 'a')] }),
        rule({ ruleVersion: 'b/v1', providerIds: ['p-b'], mappings: [mapping('aa-b', 'a')] }),
      ],
      existingBindings: [],
    })
    assert.deepEqual(ambiguous.generated, [])
    assert.equal(ambiguous.exclusions[0].reasonCode, 'aa-binding-candidate-ambiguous')
  })

  it('rejects display-name, slug, and undeclared-control mapping inputs', () => {
    for (const aaRecordMapping of [
      { recordName: 'Model A', modelKey: 'a', evidenceControls: {} },
      { recordSlug: 'model-a', modelKey: 'a', evidenceControls: {} },
      { aaRecordId: 'aa-a', modelKey: 'a', evidenceControls: { temperature: 0 } },
    ]) {
      assert.throws(
        () => deriveStructuredBindingCandidates({
          snapshot: { records: [record('aa-a')] },
          normalizationRules: [rule({ mappings: [aaRecordMapping] })],
          existingBindings: [],
        }),
        error => error.code === 'evidence-route-rule-invalid',
      )
    }
  })
})
