import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { compileAARoutePolicyCatalog } from '../src/aa-route-policy.mjs'
import {
  TASK_HANDLING_POLICY_VERSION,
  mapTaskAssessment,
  runTaskAssessor,
} from '../src/task-assessor.mjs'
import { evaluateTaskAssessorResult } from '../src/task-assessor-contract.mjs'

const fixtures = JSON.parse(readFileSync(
  new URL('./fixtures/task-assessor-tasks-v1.json', import.meta.url),
  'utf8',
))

function evidenceEntry({ routeId = 'assessor-light', score = 30, latency = 1 } = {}) {
  return {
    routeId,
    provider: 'fixture-provider',
    model: 'fixture-model',
    effectiveConfig: {
      provider: 'fixture-provider',
      model: 'fixture-model',
      reasoningEffort: 'low',
    },
    effectiveConfigFingerprint: `sha256:${routeId}`,
    aaSnapshotId: 'aa-task-assessor-fixture',
    aaRecordId: `aa-${routeId}`,
    aaRecord: {
      recordId: `aa-${routeId}`,
      evaluations: { artificial_analysis_intelligence_index: score },
      pricing: { price_1m_blended_7_to_2_to_1: 0.1 },
      performance: { median_time_to_first_answer_token_seconds: latency },
    },
  }
}

function compiledCatalog(entries = [evidenceEntry()]) {
  return compileAARoutePolicyCatalog({
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    aaSnapshotId: 'aa-task-assessor-fixture',
    bindingVersion: 'aa-evidence-binding/v1',
    entries,
    exclusions: [],
  })
}

function fakeLlm(chunks) {
  const calls = []
  return {
    calls,
    async * stream(options) {
      calls.push(options)
      for (const chunk of chunks) yield chunk
    },
  }
}

function outputChunks(output) {
  const text = JSON.stringify(output)
  const midpoint = Math.floor(text.length / 2)
  return [
    { type: 'text-delta', index: 0, text: text.slice(0, midpoint) },
    { type: 'text-delta', index: 0, text: text.slice(midpoint) },
    { type: 'finish', reason: { kind: 'stop' } },
  ]
}

describe('deterministic Task handling policy', () => {
  it('maps representative coding, debugging, research, writing, architecture, and security fixtures', () => {
    for (const fixture of fixtures.tasks.filter(candidate => candidate.expectedFallback === undefined)) {
      const assessment = evaluateTaskAssessorResult({
        kind: 'output',
        text: JSON.stringify(fixture.output),
      })

      const decision = mapTaskAssessment(assessment)

      assert.equal(decision.policyVersion, TASK_HANDLING_POLICY_VERSION, fixture.name)
      assert.equal(decision.handlingLevel, fixture.expectedLevel, fixture.name)
      assert.equal(typeof decision.explanation, 'string', fixture.name)
      assert.ok(decision.reasonCodes.length > 0, fixture.name)
    }
  })

  it('forces Deep for unknown scope even when every other field looks Light', () => {
    const assessment = evaluateTaskAssessorResult({
      kind: 'output',
      text: JSON.stringify({
        taskKind: 'coding',
        scope: 'unknown',
        complexity: 'low',
        risk: 'low',
        verifiability: 'mechanical',
        confidence: 0.8,
        reasons: ['missing-material-context'],
      }),
    })

    const decision = mapTaskAssessment(assessment)

    assert.equal(decision.handlingLevel, 'deep')
    assert.ok(decision.reasonCodes.includes('task-scope-unknown'))
  })

  it('maps repeated validated inputs to byte-for-byte equivalent decisions', () => {
    const fixture = fixtures.tasks.find(candidate => candidate.name === 'debugging')
    const assessment = evaluateTaskAssessorResult({
      kind: 'output',
      text: JSON.stringify(fixture.output),
    })

    const first = mapTaskAssessment(assessment)
    const second = mapTaskAssessment(assessment)

    assert.deepEqual(first, second)
    assert.equal(first.explanation, second.explanation)
  })
})

describe('one-shot Task Assessor execution', () => {
  it('calls the frozen route exactly once outside the agent loop with no tools', async () => {
    const fixture = fixtures.tasks.find(candidate => candidate.name === 'bounded coding')
    const llm = fakeLlm(outputChunks(fixture.output))

    const result = await runTaskAssessor({
      llm,
      catalog: compiledCatalog(),
      currentMessage: fixture.currentMessage,
    })

    assert.equal(llm.calls.length, 1)
    assert.equal(llm.calls[0].provider, 'fixture-provider')
    assert.equal(llm.calls[0].model, 'fixture-model')
    assert.equal(llm.calls[0].reasoningEffort, 'low')
    assert.equal(llm.calls[0].temperature, 0)
    assert.equal(llm.calls[0].maxTokens, 512)
    assert.deepEqual(llm.calls[0].tools, [])
    assert.equal(Object.isFrozen(llm.calls[0]), true)
    assert.equal(Object.isFrozen(llm.calls[0].messages[0]), true)
    assert.equal(llm.calls[0].purpose, undefined)
    assert.ok(llm.calls[0].signal instanceof AbortSignal)
    assert.equal(llm.calls[0].messages.length, 1)
    assert.equal(llm.calls[0].messages[0].source.plugin, 'dsh-auto-mode')
    assert.equal(result.assessmentStatus, 'valid')
    assert.equal(result.decision.handlingLevel, 'light')
    assert.equal(result.assessorRoute.routeId, 'assessor-light')
    assert.equal(result.assessorRoute.effectiveConfigFingerprint, 'sha256:assessor-light')
    assert.equal(Object.hasOwn(result.assessment, 'provider'), false)
    assert.equal(Object.hasOwn(result.assessment, 'model'), false)
  })

  it('maps invalid output, provider failure, max-token truncation, and timeout to stable Deep fallbacks', async () => {
    const cases = [
      {
        name: 'invalid output',
        chunks: [...outputChunks({ route: 'forbidden' })],
        reasonCode: 'assessor-invalid-schema',
      },
      {
        name: 'empty output',
        chunks: [{ type: 'finish', reason: { kind: 'stop' } }],
        reasonCode: 'assessor-empty-output',
      },
      {
        name: 'invalid json',
        chunks: [
          { type: 'text-delta', index: 0, text: 'not json' },
          { type: 'finish', reason: { kind: 'stop' } },
        ],
        reasonCode: 'assessor-invalid-json',
      },
      {
        name: 'provider failure',
        chunks: [{
          type: 'finish',
          reason: { kind: 'error', failure: { code: 'RATE_LIMIT', message: 'rate limited' } },
        }],
        reasonCode: 'assessor-provider-error',
      },
      {
        name: 'unexpected provider abort',
        chunks: [{
          type: 'finish',
          reason: { kind: 'aborted', failure: { code: 'ABORTED', message: 'provider aborted' } },
        }],
        reasonCode: 'assessor-provider-error',
      },
      {
        name: 'max-token truncation',
        chunks: [
          { type: 'text-delta', index: 0, text: '{"taskKind":"coding"' },
          { type: 'finish', reason: { kind: 'max-tokens' } },
        ],
        reasonCode: 'assessor-provider-error',
      },
      {
        name: 'timeout',
        chunks: [{
          type: 'finish',
          reason: { kind: 'aborted', failure: { code: 'ABORTED', message: 'deadline' } },
        }],
        reasonCode: 'assessor-timeout',
      },
    ]

    for (const fixture of cases) {
      const llm = fakeLlm(fixture.chunks)
      const result = await runTaskAssessor({
        llm,
        catalog: compiledCatalog(),
        currentMessage: fixture.name,
        ...(fixture.name === 'timeout' ? { timeoutSignal: AbortSignal.abort() } : {}),
      })

      assert.equal(result.assessmentStatus, 'fallback', fixture.name)
      assert.equal(result.decision.handlingLevel, 'deep', fixture.name)
      assert.deepEqual(result.decision.reasonCodes, [fixture.reasonCode], fixture.name)
    }
  })

  it('enforces the total deadline even when the stream ignores its AbortSignal', async () => {
    const calls = []
    const llm = {
      calls,
      stream(options) {
        calls.push(options)
        return {
          [Symbol.asyncIterator]() {
            return {
              next: () => new Promise(() => {}),
              return: () => Promise.resolve({ done: true }),
            }
          },
        }
      },
    }

    const result = await runTaskAssessor({
      llm,
      catalog: compiledCatalog(),
      currentMessage: 'bounded task',
      timeoutSignal: AbortSignal.timeout(10),
    })

    assert.equal(calls.length, 1)
    assert.equal(result.assessmentStatus, 'fallback')
    assert.deepEqual(result.decision.reasonCodes, ['assessor-timeout'])
  })

  it('does not call a provider when no eligible assessor route exists', async () => {
    const llm = fakeLlm([])
    const result = await runTaskAssessor({
      llm,
      catalog: compiledCatalog([evidenceEntry({ latency: 20 })]),
      currentMessage: 'bounded task',
    })

    assert.equal(llm.calls.length, 0)
    assert.equal(result.assessmentStatus, 'fallback')
    assert.equal(result.decision.handlingLevel, 'deep')
    assert.deepEqual(result.decision.reasonCodes, ['assessor-route-unavailable'])
    assert.equal(result.assessorRoute, null)
  })

  it('does not call a provider when the assessor catalog is invalid', async () => {
    const llm = fakeLlm([])
    const result = await runTaskAssessor({
      llm,
      catalog: {},
      currentMessage: 'bounded task',
    })

    assert.equal(llm.calls.length, 0)
    assert.deepEqual(result.decision.reasonCodes, ['assessor-catalog-invalid'])
    assert.match(result.decision.explanation, /^Deep fallback:/)
  })

  it('enforces input and streamed-output byte limits at the call boundary', async () => {
    const inputLlm = fakeLlm([])
    const inputResult = await runTaskAssessor({
      llm: inputLlm,
      catalog: compiledCatalog(),
      currentMessage: 'x'.repeat(16 * 1024 + 1),
    })

    assert.equal(inputLlm.calls.length, 0)
    assert.deepEqual(inputResult.decision.reasonCodes, ['assessor-input-too-large'])

    const outputLlm = fakeLlm([
      { type: 'text-delta', index: 0, text: 'x'.repeat(8 * 1024 + 1) },
      { type: 'finish', reason: { kind: 'stop' } },
    ])
    const outputResult = await runTaskAssessor({
      llm: outputLlm,
      catalog: compiledCatalog(),
      currentMessage: 'bounded task',
    })

    assert.equal(outputLlm.calls.length, 1)
    assert.deepEqual(outputResult.decision.reasonCodes, ['assessor-output-too-large'])
  })

  it('maps the ambiguous fixture through low-confidence fallback without trusting its attributes', async () => {
    const fixture = fixtures.tasks.find(candidate => candidate.name === 'ambiguous request')
    const llm = fakeLlm(outputChunks(fixture.output))

    const result = await runTaskAssessor({
      llm,
      catalog: compiledCatalog(),
      currentMessage: fixture.currentMessage,
    })

    assert.equal(result.assessmentStatus, 'fallback')
    assert.equal(result.decision.handlingLevel, 'deep')
    assert.deepEqual(result.decision.reasonCodes, [fixture.expectedFallback])
  })

  it('propagates caller cancellation instead of starting or continuing the user task', async () => {
    const controller = new AbortController()
    controller.abort(new Error('user cancelled'))
    const llm = fakeLlm([])

    await assert.rejects(
      runTaskAssessor({
        llm,
        catalog: compiledCatalog(),
        currentMessage: 'bounded task',
        signal: controller.signal,
      }),
      /user cancelled/,
    )
    assert.equal(llm.calls.length, 0)
  })
})
