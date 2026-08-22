import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { compileAARoutePolicyCatalog } from '../src/aa-route-policy.mjs'
import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import { resolveFrozenAutoDecision } from '../src/auto-decision.mjs'

function route({
  model,
  score,
  price = 1,
  latency = 1,
  reasoningEffort,
  temperature,
}) {
  const effectiveConfig = {
    provider: 'fixture-provider',
    model,
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    ...(temperature === undefined ? {} : { temperature }),
  }
  const identity = createHostRouteIdentity(effectiveConfig)
  return {
    ...identity,
    effectiveConfig,
    aaSnapshotId: 'aa-auto-decision-fixture',
    aaRecordId: `aa-${model}`,
    bindingVersion: 'aa-evidence-binding/v1',
    evidenceBinding: {
      bindingVersion: 'aa-evidence-binding/v1',
      hostRouteId: identity.routeId,
      effectiveConfigFingerprint: identity.effectiveConfigFingerprint,
      aaSnapshotId: 'aa-auto-decision-fixture',
      aaRecordId: `aa-${model}`,
      matchBasis: ['fixture'],
      limitations: [],
    },
    aaRecord: {
      recordId: `aa-${model}`,
      evaluations: { artificial_analysis_intelligence_index: score },
      pricing: { price_1m_normalized_7_to_2_to_1: price },
      performance: { median_time_to_first_answer_token_seconds: latency },
    },
    capabilityFacts: ['fixture'],
  }
}

function catalog(entries) {
  return compileAARoutePolicyCatalog({
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    aaSnapshotId: 'aa-auto-decision-fixture',
    bindingVersion: 'aa-evidence-binding/v1',
    entries,
    exclusions: [],
  })
}

function assessment(handlingLevel) {
  return {
    contractVersion: 'task-assessor-contract/v1',
    assessorVersion: 'task-assessor/v1',
    routePolicyVersion: 'task-assessor-route-policy/v1',
    handlingPolicyVersion: 'task-handling-policy/v1',
    assessmentStatus: 'valid',
    assessment: {
      taskKind: 'coding',
      scope: handlingLevel === 'light' ? 'bounded' : 'normal',
      complexity: handlingLevel === 'deep' ? 'high' : 'low',
      risk: 'low',
      verifiability: 'mechanical',
      confidence: 1,
      reasons: ['mechanically-checkable'],
      assessorVersion: 'task-assessor/v1',
    },
    decision: {
      policyVersion: 'task-handling-policy/v1',
      handlingLevel,
      reasonCodes: [`fixture-${handlingLevel}`],
      explanation: `${handlingLevel} fixture assessment`,
    },
    assessorRoute: null,
  }
}

describe('resolveFrozenAutoDecision()', () => {
  it('resolves Light, Standard, and Deep through one AA price-first contract', () => {
    const routes = [
      route({ model: 'light', score: 30, reasoningEffort: 'off' }),
      route({ model: 'standard', score: 40, reasoningEffort: 'high' }),
      route({ model: 'deep', score: 55, reasoningEffort: 'max' }),
    ]
    const compiled = catalog(routes)

    for (const handlingLevel of ['light', 'standard', 'deep']) {
      const decision = resolveFrozenAutoDecision({
        assessmentResult: assessment(handlingLevel),
        catalog: compiled,
        eligibleHostRoutes: routes.map(candidate => candidate.effectiveConfig),
      })

      assert.equal(decision.status, 'resolved')
      assert.equal(decision.requestedHandlingLevel, handlingLevel)
      assert.equal(decision.handlingLevel, handlingLevel)
      assert.equal(decision.selection.model, handlingLevel)
      assert.equal(decision.routeBasis, 'aa-matched')
      assert.equal(decision.fallback, false)
      assert.equal(decision.aaSnapshotId, 'aa-auto-decision-fixture')
      assert.equal(Object.isFrozen(decision), true)
      assert.equal(Object.isFrozen(decision.selection), true)
    }
  })

  it('applies Host constraints before price ordering and preserves the complete effective config', () => {
    const cheaper = route({ model: 'cheaper', score: 40, price: 0.1, reasoningEffort: 'low' })
    const eligible = route({
      model: 'eligible',
      score: 40,
      price: 0.2,
      reasoningEffort: 'high',
      temperature: 0.2,
    })

    const decision = resolveFrozenAutoDecision({
      assessmentResult: assessment('standard'),
      catalog: catalog([cheaper, eligible]),
      eligibleHostRoutes: [eligible.effectiveConfig],
    })

    assert.deepEqual(decision.selection, {
      provider: 'fixture-provider',
      model: 'eligible',
      reasoningEffort: 'high',
      temperature: 0.2,
    })
    assert.equal(decision.routeId, eligible.routeId)
  })

  it('escalates monotonically when the requested level has no eligible route', () => {
    const light = route({ model: 'light', score: 30 })
    const standard = route({ model: 'standard', score: 40 })

    const decision = resolveFrozenAutoDecision({
      assessmentResult: assessment('light'),
      catalog: catalog([light, standard]),
      eligibleHostRoutes: [standard.effectiveConfig],
    })

    assert.equal(decision.status, 'resolved')
    assert.equal(decision.requestedHandlingLevel, 'light')
    assert.equal(decision.handlingLevel, 'standard')
    assert.equal(decision.selection.model, 'standard')
    assert.ok(decision.reasonCodes.includes('auto-route-level-escalated'))
    assert.match(decision.explanation, /escalated from Light to Standard/)
  })

  it('uses only an explicitly configured Host-valid Deep fallback', () => {
    const unmatchedFallback = { provider: 'fixture-provider', model: 'fallback' }

    const decision = resolveFrozenAutoDecision({
      assessmentResult: assessment('standard'),
      catalog: catalog([]),
      eligibleHostRoutes: [unmatchedFallback],
      deepFallback: unmatchedFallback,
    })

    assert.equal(decision.status, 'resolved')
    assert.equal(decision.requestedHandlingLevel, 'standard')
    assert.equal(decision.handlingLevel, 'deep')
    assert.equal(decision.routeBasis, 'configured-deep-fallback')
    assert.equal(decision.fallback, true)
    assert.deepEqual(decision.selection, unmatchedFallback)
    assert.equal(decision.aaSnapshotId, undefined)
    assert.equal(decision.aaRecordId, undefined)
    assert.ok(decision.reasonCodes.includes('auto-route-configured-deep-fallback'))
    assert.match(decision.explanation, /^Deep fallback:/)
  })

  it('fails visibly instead of reusing a configured fallback that is not Host-valid', () => {
    const decision = resolveFrozenAutoDecision({
      assessmentResult: assessment('deep'),
      catalog: catalog([]),
      eligibleHostRoutes: [],
      deepFallback: { provider: 'fixture-provider', model: 'stale-fallback' },
    })

    assert.equal(decision.status, 'failure')
    assert.equal(decision.selection, undefined)
    assert.equal(decision.reasonCode, 'auto-route-unavailable')
    assert.match(decision.explanation, /no Host-valid AA-matched route or configured Deep fallback/)
  })

  it('uses a valid fallback for an invalid catalog and otherwise returns the same explicit failure', () => {
    const fallback = { provider: 'fixture-provider', model: 'fallback', reasoningEffort: 'high' }
    const withFallback = resolveFrozenAutoDecision({
      assessmentResult: assessment('deep'),
      catalog: {},
      eligibleHostRoutes: [fallback],
      deepFallback: fallback,
    })
    const withoutFallback = resolveFrozenAutoDecision({
      assessmentResult: assessment('deep'),
      catalog: {},
      eligibleHostRoutes: [],
    })

    assert.equal(withFallback.routeBasis, 'configured-deep-fallback')
    assert.ok(withFallback.reasonCodes.includes('auto-route-catalog-invalid'))
    assert.equal(withoutFallback.status, 'failure')
    assert.ok(withoutFallback.reasonCodes.includes('auto-route-catalog-invalid'))
  })

  it('fails closed to Deep when the assessment contract itself is malformed', () => {
    const deep = route({ model: 'deep', score: 55 })

    const decision = resolveFrozenAutoDecision({
      assessmentResult: {},
      catalog: catalog([deep]),
      eligibleHostRoutes: [deep.effectiveConfig],
    })

    assert.equal(decision.requestedHandlingLevel, 'deep')
    assert.equal(decision.handlingLevel, 'deep')
    assert.equal(decision.selection.model, 'deep')
    assert.ok(decision.reasonCodes.includes('auto-assessment-invalid'))
  })
})
