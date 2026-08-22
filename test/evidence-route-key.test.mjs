import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  createEvidenceRouteKey,
  evidenceRouteKeyId,
  validateProviderNormalizationRule,
} from '../src/evidence-route-key.mjs'

const rule = {
  schemaVersion: 1,
  ruleVersion: 'fixture-provider/v1',
  providerNamespace: 'fixture-provider',
  providerIds: ['fixture', 'fixture-official'],
  modelAliases: { 'Model A': 'model-a', 'model-a': 'model-a' },
  evidenceControls: [
    { key: 'reasoningEffort', source: 'reasoningEffort', required: false },
    { key: 'variant', source: 'variant', required: false },
  ],
}

describe('EvidenceRouteKey', () => {
  it('ignores execution-only defaults while ExecutionFingerprint retains them', () => {
    const firstConfig = {
      provider: 'fixture', model: 'Model A', reasoningEffort: 'high', temperature: 0, maxTokens: 4096,
    }
    const secondConfig = {
      provider: 'fixture', model: 'Model A', reasoningEffort: 'high', temperature: 1, maxTokens: 8192,
    }
    const firstKey = createEvidenceRouteKey(firstConfig, rule)
    const secondKey = createEvidenceRouteKey(secondConfig, rule)

    assert.deepEqual(secondKey, firstKey)
    assert.equal(evidenceRouteKeyId(secondKey), evidenceRouteKeyId(firstKey))
    assert.notEqual(
      createHostRouteIdentity(firstConfig).effectiveConfigFingerprint,
      createHostRouteIdentity(secondConfig).effectiveConfigFingerprint,
    )
  })

  it('cannot collide across model, reasoning, variant, or provider namespace', () => {
    const base = createEvidenceRouteKey({ provider: 'fixture', model: 'Model A', reasoningEffort: 'high' }, rule)
    const changes = [
      createEvidenceRouteKey({ provider: 'fixture', model: 'model-a', reasoningEffort: 'low' }, rule),
      createEvidenceRouteKey({ provider: 'fixture', model: 'model-a', reasoningEffort: 'high', variant: 'dated' }, rule),
      createEvidenceRouteKey({ provider: 'fixture', model: 'model-b', reasoningEffort: 'high' }, {
        ...rule, modelAliases: { ...rule.modelAliases, 'model-b': 'model-b' },
      }),
      createEvidenceRouteKey({ provider: 'other', model: 'model-a', reasoningEffort: 'high' }, {
        ...rule, providerNamespace: 'other', providerIds: ['other'],
      }),
    ]
    for (const changed of changes) assert.notEqual(evidenceRouteKeyId(changed), evidenceRouteKeyId(base))
  })

  it('supports providers with zero evidence controls and rejects fuzzy or ambiguous normalization', () => {
    const zeroControlRule = { ...rule, ruleVersion: 'zero/v1', evidenceControls: [] }
    assert.deepEqual(
      createEvidenceRouteKey({ provider: 'fixture', model: 'Model A' }, zeroControlRule).evidenceControls,
      {},
    )
    assert.throws(
      () => createEvidenceRouteKey({ provider: 'fixture', model: 'MODEL A' }, rule),
      error => error.code === 'evidence-route-model-unmapped',
    )
    assert.throws(
      () => createEvidenceRouteKey({ provider: 'unknown', model: 'Model A' }, rule),
      error => error.code === 'evidence-route-provider-mismatch',
    )
    assert.throws(
      () => validateProviderNormalizationRule({
        ...rule,
        evidenceControls: [
          { key: 'effort', source: 'reasoningEffort', required: false },
          { key: 'mode', source: 'reasoningEffort', required: false },
        ],
      }),
      error => error.code === 'evidence-route-rule-ambiguous',
    )
  })
})
