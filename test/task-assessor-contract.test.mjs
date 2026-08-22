import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { compileAARoutePolicyCatalog } from '../src/aa-route-policy.mjs'
import {
  TASK_ASSESSOR_CONTRACT_V1,
  buildTaskAssessorInput,
  evaluateTaskAssessorResult,
  resolveTaskAssessorRoute,
  taskAssessorFallback,
} from '../src/task-assessor-contract.mjs'

const fixtures = JSON.parse(readFileSync(
  new URL('./fixtures/task-assessor-contract-v1.json', import.meta.url),
  'utf8',
))

function evidenceEntry({ routeId, score, price, latency, effectiveConfig = {} }) {
  return {
    routeId,
    provider: `provider-${routeId}`,
    model: `model-${routeId}`,
    effectiveConfig: {
      provider: `provider-${routeId}`,
      model: `model-${routeId}`,
      ...effectiveConfig,
    },
    effectiveConfigFingerprint: `sha256:${routeId}`,
    aaSnapshotId: 'aa-task-assessor-fixture',
    aaRecordId: `aa-${routeId}`,
    aaRecord: {
      recordId: `aa-${routeId}`,
      evaluations: { artificial_analysis_intelligence_index: score },
      pricing: { price_1m_normalized_7_to_2_to_1: price },
      performance: { median_time_to_first_answer_token_seconds: latency },
    },
  }
}

function compiledCatalog(entries) {
  return compileAARoutePolicyCatalog({
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    aaSnapshotId: 'aa-task-assessor-fixture',
    bindingVersion: 'aa-evidence-binding/v1',
    entries,
    exclusions: [],
  })
}

describe('Task Assessor route policy', () => {
  it('dynamically resolves and freezes the price-first Light route from the current catalog', () => {
    const catalog = compiledCatalog([
      evidenceEntry({ routeId: 'light-expensive', score: 30, price: 0.2, latency: 1 }),
      evidenceEntry({ routeId: 'light-cheap', score: 31, price: 0.1, latency: 2 }),
      evidenceEntry({ routeId: 'standard-fast', score: 40, price: 0.01, latency: 1 }),
    ])

    const resolution = resolveTaskAssessorRoute(catalog)

    assert.equal(resolution.status, 'resolved')
    assert.equal(resolution.requiredLevel, 'light')
    assert.equal(resolution.resolvedLevel, 'light')
    assert.equal(resolution.route.routeId, 'light-cheap')
    assert.equal(resolution.policyVersion, 'task-assessor-route-policy/v1')
    assert.equal(Object.isFrozen(resolution), true)
  })

  it('excludes routes outside the assessor latency budget and escalates deterministically', () => {
    const catalog = compiledCatalog([
      evidenceEntry({ routeId: 'light-too-slow', score: 30, price: 0.01, latency: 6.1 }),
      evidenceEntry({ routeId: 'standard-expensive', score: 40, price: 0.2, latency: 1 }),
      evidenceEntry({ routeId: 'standard-cheap', score: 41, price: 0.1, latency: 2 }),
    ])

    const resolution = resolveTaskAssessorRoute(catalog)

    assert.equal(resolution.status, 'resolved')
    assert.equal(resolution.resolvedLevel, 'standard')
    assert.equal(resolution.route.routeId, 'standard-cheap')
    assert.equal(resolution.reasonCode, 'task-assessor-route-escalated')
  })

  it('skips route controls that conflict with the fixed assessor request contract', () => {
    const catalog = compiledCatalog([
      evidenceEntry({
        routeId: 'light-conflicting-temperature',
        score: 30,
        price: 0.01,
        latency: 1,
        effectiveConfig: { temperature: 0.2 },
      }),
      evidenceEntry({
        routeId: 'light-compatible',
        score: 31,
        price: 0.02,
        latency: 2,
        effectiveConfig: { temperature: 0, maxTokens: 512, tools: [] },
      }),
    ])

    const resolution = resolveTaskAssessorRoute(catalog)

    assert.equal(resolution.status, 'resolved')
    assert.equal(resolution.route.routeId, 'light-compatible')
  })

  it('fails closed to Deep when no catalog route meets the assessor contract', () => {
    const catalog = compiledCatalog([
      evidenceEntry({ routeId: 'missing-latency', score: 30, price: 0.01, latency: null }),
      evidenceEntry({ routeId: 'deep-too-slow', score: 50, price: 0.1, latency: 20 }),
    ])

    const resolution = resolveTaskAssessorRoute(catalog)

    assert.equal(resolution.status, 'unavailable')
    assert.equal(resolution.fallback.handlingLevel, 'deep')
    assert.equal(resolution.fallback.reasonCode, 'assessor-route-unavailable')
    assert.equal(resolution.fallback.assessment.scope, 'unknown')
  })
})

describe('Task Assessor bounded input', () => {
  it('keeps only bounded visible text and attachment metadata', () => {
    const previousMessages = Array.from({ length: 6 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      text: `message-${index}`,
    }))
    const input = buildTaskAssessorInput({
      currentMessage: 'continue',
      previousMessages,
      attachments: [{ name: 'design.pdf', mediaType: 'application/pdf', sizeBytes: 42 }],
    })

    assert.deepEqual(input.previousMessages.map(message => message.text), [
      'message-2',
      'message-3',
      'message-4',
      'message-5',
    ])
    assert.deepEqual(input.attachments, [
      { name: 'design.pdf', mediaType: 'application/pdf', sizeBytes: 42 },
    ])
    assert.equal(input.contextTruncated, true)
    assert.equal(input.attachmentsTruncated, false)
    assert.equal(Object.isFrozen(input), true)
  })

  it('rejects an oversized current message before any model call', () => {
    let failure
    try {
      buildTaskAssessorInput({
        currentMessage: 'x'.repeat(TASK_ASSESSOR_CONTRACT_V1.input.currentMessageMaxBytes + 1),
      })
    } catch (error) {
      failure = taskAssessorFallback(error.code)
    }

    assert.equal(failure.handlingLevel, 'deep')
    assert.equal(failure.reasonCode, 'assessor-input-too-large')
  })
})

describe('Task Assessor output boundary', () => {
  it('accepts the versioned valid contract fixture', () => {
    const result = evaluateTaskAssessorResult({
      kind: 'output',
      text: JSON.stringify(fixtures.valid[0].output),
    })

    assert.equal(result.status, 'valid')
    assert.equal(result.assessment.assessorVersion, 'task-assessor/v1')
    assert.equal(result.assessment.confidence, 0.8)
    assert.equal(Object.isFrozen(result), true)
  })

  it('rejects additional provider/model/effort authority and fails closed to Deep', () => {
    const result = evaluateTaskAssessorResult({
      kind: 'output',
      text: JSON.stringify(fixtures.invalid[0].output),
    })

    assert.equal(result.status, 'fallback')
    assert.equal(result.handlingLevel, 'deep')
    assert.equal(result.reasonCode, 'assessor-invalid-schema')
  })

  it('maps timeout to a stable Deep fallback', () => {
    const result = evaluateTaskAssessorResult(fixtures.timeout[0].result)

    assert.equal(result.status, 'fallback')
    assert.equal(result.handlingLevel, 'deep')
    assert.equal(result.reasonCode, 'assessor-timeout')
  })

  it('maps a valid but low-confidence assessment to Deep', () => {
    const result = evaluateTaskAssessorResult({
      kind: 'output',
      text: JSON.stringify(fixtures.lowConfidence[0].output),
    })

    assert.equal(result.status, 'fallback')
    assert.equal(result.handlingLevel, 'deep')
    assert.equal(result.reasonCode, 'assessor-low-confidence')
  })

  it('rejects pseudo-precise confidence values outside the discrete rubric', () => {
    const output = { ...fixtures.valid[0].output, confidence: 0.83 }
    const result = evaluateTaskAssessorResult({ kind: 'output', text: JSON.stringify(output) })

    assert.equal(result.status, 'fallback')
    assert.equal(result.reasonCode, 'assessor-invalid-schema')
  })
})
