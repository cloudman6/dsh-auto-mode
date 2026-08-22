import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import { apply } from '../src/plugin.mjs'

function seed() {
  return {
    schemaVersion: 1,
    source: {
      name: 'Artificial Analysis',
      capturedAt: '2026-08-17T00:00:00.000Z',
      url: 'https://artificialanalysis.ai/models',
    },
    routes: {
      fast: {
        selection: { provider: 'p', model: 'flash', reasoningEffort: 'off' },
        aa: { recordId: 'fast', label: 'Fast' },
      },
      standard: {
        selection: { provider: 'p', model: 'flash', reasoningEffort: 'high' },
        aa: { recordId: 'standard', label: 'Standard' },
      },
      strong: {
        selection: { provider: 'p', model: 'pro', reasoningEffort: 'max' },
        aa: { recordId: 'strong', label: 'Strong' },
      },
    },
    fallback: { provider: 'p', model: 'pro', reasoningEffort: 'max' },
  }
}

class FakeContext {
  listeners = new Map()
  namespace
  command
  projection

  llm = {
    calls: [],
    outputs: [],
    providers: [],
    models: new Map(),
    modelInfo: new Map(),
    listProviders() {
      return this.providers.map(id => ({ id, name: id }))
    },
    async listModels(provider) {
      return this.models.get(provider) ?? []
    },
    async resolveModelInfo(provider, model) {
      return this.modelInfo.get(`${provider}\u0000${model}`) ?? {
        provider,
        id: model,
        name: model,
      }
    },
    async resolveCallConfig(config) {
      return structuredClone(config)
    },
    async * stream(options) {
      this.calls.push(options)
      const output = this.outputs.shift()
      if (output === undefined) {
        yield { type: 'finish', reason: { kind: 'error', failure: { code: 'FIXTURE', message: 'missing fixture output' } } }
        return
      }
      yield { type: 'text-delta', index: 0, text: JSON.stringify(output) }
      yield { type: 'finish', reason: { kind: 'stop' } }
    },
  }

  sessions = {
    registerEventNamespace: registration => {
      this.namespace = registration
      return () => {}
    },
  }

  commands = {
    register: command => {
      this.command = command
      return () => {}
    },
  }

  sessionProjections = {
    register: projection => {
      this.projection = projection
      return () => {}
    },
  }

  inject(_dependencies, callback) {
    callback(this)
  }

  on(name, listener) {
    const listeners = this.listeners.get(name) ?? []
    listeners.push(listener)
    this.listeners.set(name, listeners)
    return () => this.listeners.set(name, listeners.filter(candidate => candidate !== listener))
  }

  async waterfall(name, args, terminal) {
    const listeners = this.listeners.get(name) ?? []
    const invoke = index => index === listeners.length
      ? terminal()
      : listeners[index](...args, () => invoke(index + 1))
    return invoke(0)
  }
}

function phase3Route({ model, score, price = 1, effort, temperature }) {
  const effectiveConfig = {
    provider: 'p',
    model,
    ...(effort === undefined ? {} : { reasoningEffort: effort }),
    ...(temperature === undefined ? {} : { temperature }),
  }
  const identity = createHostRouteIdentity(effectiveConfig)
  return {
    effectiveConfig,
    identity,
    record: {
      recordId: `aa-${model}`,
      label: model,
      capabilityFacts: ['fixture'],
      evaluations: { artificial_analysis_intelligence_index: score },
      pricing: { price_1m_blended_7_to_2_to_1: price },
      performance: { median_time_to_first_answer_token_seconds: 1 },
    },
  }
}

function phase3Seed(routes) {
  return {
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    bindingVersion: 'aa-evidence-binding/v1',
    snapshot: {
      snapshotId: 'aa-phase3-plugin-fixture',
      records: routes.map(route => route.record),
    },
    bindings: routes.map(route => ({
      bindingVersion: 'aa-evidence-binding/v1',
      hostRouteId: route.identity.routeId,
      effectiveConfigFingerprint: route.identity.effectiveConfigFingerprint,
      aaSnapshotId: 'aa-phase3-plugin-fixture',
      aaRecordId: route.record.recordId,
      matchBasis: ['fixture'],
      limitations: [],
    })),
  }
}

function assessmentOutput({ level }) {
  if (level === 'light') {
    return {
      taskKind: 'coding',
      scope: 'bounded',
      complexity: 'low',
      risk: 'low',
      verifiability: 'mechanical',
      confidence: 1,
      reasons: ['explicit-single-step', 'mechanically-checkable'],
    }
  }
  if (level === 'standard') {
    return {
      taskKind: 'coding',
      scope: 'normal',
      complexity: 'medium',
      risk: 'low',
      verifiability: 'partial',
      confidence: 1,
      reasons: ['multiple-dependent-steps', 'partially-checkable'],
    }
  }
  return {
    taskKind: 'architecture',
    scope: 'broad',
    complexity: 'high',
    risk: 'medium',
    verifiability: 'partial',
    confidence: 1,
    reasons: ['open-ended-scope', 'partially-checkable'],
  }
}

function agent() {
  const events = []
  return {
    session: {
      events,
      append(type, data) {
        events.push({ type, data })
      },
    },
    events,
  }
}

describe('DSH Auto Mode plugin', () => {
  it('freezes one Phase 3 decision across assembly, request, Session facts, and cold UI projection', async () => {
    const light = phase3Route({ model: 'light', score: 30, effort: 'off' })
    const standard = phase3Route({
      model: 'standard',
      score: 40,
      effort: 'high',
      temperature: 0.2,
    })
    const deep = phase3Route({ model: 'deep', score: 55, effort: 'max' })
    const ctx = new FakeContext()
    ctx.llm.outputs.push(assessmentOutput({ level: 'standard' }))
    apply(ctx, {
      mode: 'auto',
      seed: phase3Seed([light, standard, deep]),
      hostRoutes: [light.effectiveConfig, standard.effectiveConfig, deep.effectiveConfig],
      deepFallback: deep.effectiveConfig,
    })
    const subject = agent()
    const signal = new AbortController().signal

    await ctx.waterfall(
      'agent/prepare-step',
      [{
        agent: subject,
        messages: [{ role: 'user', content: [{ type: 'text', text: 'Change two related files.' }] }],
        turn: 1,
        step: 0,
        signal,
      }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    const assembled = await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    const request = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve({ provider: 'manual', model: 'manual', reasoningEffort: 'off' }),
    )

    assert.equal(ctx.llm.calls.length, 1)
    assert.equal(ctx.llm.calls[0].model, 'light', 'the assessor uses its own frozen route')
    assert.deepEqual(assembled.variables, { provider: 'p', model: 'standard' })
    assert.deepEqual(request, standard.effectiveConfig)
    const selection = subject.events.find(event => event.type === 'dsh-auto-mode/selection')
    assert.equal(selection.data.schemaVersion, 2)
    assert.equal(selection.data.handlingLevel, 'standard')
    assert.equal(selection.data.provider, request.provider)
    assert.equal(selection.data.model, request.model)
    assert.equal(selection.data.reasoningEffort, request.reasoningEffort)
    assert.equal(selection.data.effectiveConfig.temperature, request.temperature)
    assert.equal(selection.data.routeBasis, 'aa-matched')
    assert.equal(selection.data.aaSnapshotId, 'aa-phase3-plugin-fixture')
    assert.equal(selection.data.assessmentStatus, 'valid')
    assert.equal(selection.data.assessorRoute.model, 'light')
    assert.equal(selection.data.taskAssessment.scope, 'normal')
    assert.throws(
      () => ctx.namespace.events['dsh-auto-mode/selection'].parse({
        ...selection.data,
        effectiveConfig: { ...selection.data.effectiveConfig, model: 'tampered' },
      }),
      /invalid dsh-auto-mode selection event/,
    )
    assert.throws(
      () => ctx.namespace.events['dsh-auto-mode/selection'].parse({
        ...selection.data,
        tier: 'strong',
      }),
      /invalid dsh-auto-mode selection event/,
    )

    await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages: [], turn: 1, step: 1, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    const secondRequest = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 1, signal }],
      () => Promise.resolve({ provider: 'manual', model: 'manual' }),
    )
    const selections = subject.events.filter(event => event.type === 'dsh-auto-mode/selection')
    assert.equal(ctx.llm.calls.length, 1, 'later steps in one turn reuse the assessment')
    assert.deepEqual(secondRequest, request)
    assert.match(selections[0].data.decisionId, /^auto-decision:turn:/)
    assert.equal(selections[0].data.decisionId, selections[1].data.decisionId)

    const coldCtx = new FakeContext()
    apply(coldCtx, {
      mode: 'auto',
      seed: phase3Seed([light, standard, deep]),
      hostRoutes: [light.effectiveConfig, standard.effectiveConfig, deep.effectiveConfig],
      deepFallback: deep.effectiveConfig,
    })
    const projected = subject.events.reduce(
      (state, event) => coldCtx.projection.apply(state, event),
      coldCtx.projection.init(),
    )
    assert.equal(projected.decision.provider, request.provider)
    assert.equal(projected.decision.model, request.model)
    assert.equal(projected.decision.reasoningEffort, request.reasoningEffort)
    assert.equal(projected.decision.reason, selection.data.reason)
    assert.equal(projected.decision.routeId, selection.data.routeId)
  })

  it('persists an explicit configured Deep fallback without attaching unmatched AA evidence', async () => {
    const light = phase3Route({ model: 'light', score: 30, effort: 'off' })
    const fallback = { provider: 'p', model: 'fallback' }
    const effectiveFallback = { ...fallback, reasoningEffort: 'high' }
    const ctx = new FakeContext()
    ctx.llm.resolveCallConfig = async config => (
      config.model === 'fallback' ? structuredClone(effectiveFallback) : structuredClone(config)
    )
    ctx.llm.outputs.push(assessmentOutput({ level: 'deep' }))
    apply(ctx, {
      mode: 'auto',
      seed: phase3Seed([light]),
      hostRoutes: [light.effectiveConfig, fallback],
      deepFallback: fallback,
    })
    const subject = agent()
    const signal = new AbortController().signal

    await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages: [{ content: [{ type: 'text', text: 'Design the system.' }] }], turn: 1, step: 0, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    const request = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve({ provider: 'manual', model: 'manual' }),
    )

    const selection = subject.events.find(event => event.type === 'dsh-auto-mode/selection')
    assert.deepEqual(request, effectiveFallback)
    assert.equal(selection.data.routeBasis, 'configured-deep-fallback')
    assert.equal(selection.data.fallback, true)
    assert.equal(selection.data.aaSnapshotId, undefined)
    assert.equal(selection.data.aaRecordId, undefined)
  })

  it('discovers the current provider/model/effort inventory when no Host allowlist is configured', async () => {
    const light = phase3Route({ model: 'light', score: 30, effort: 'off' })
    const standard = phase3Route({ model: 'standard', score: 40, effort: 'high' })
    const deep = phase3Route({ model: 'deep', score: 55, effort: 'max' })
    const ctx = new FakeContext()
    ctx.llm.providers.push('p')
    ctx.llm.models.set('p', [light, standard, deep].map(candidate => ({
      provider: 'p',
      id: candidate.effectiveConfig.model,
      name: candidate.effectiveConfig.model,
    })))
    for (const candidate of [light, standard, deep]) {
      const effort = candidate.effectiveConfig.reasoningEffort
      ctx.llm.modelInfo.set(`p\u0000${candidate.effectiveConfig.model}`, {
        provider: 'p',
        id: candidate.effectiveConfig.model,
        name: candidate.effectiveConfig.model,
        reasoning: {
          efforts: [{ id: effort, name: effort }],
          defaultEffort: effort,
        },
      })
    }
    ctx.llm.outputs.push(assessmentOutput({ level: 'standard' }))
    apply(ctx, {
      mode: 'auto',
      seed: phase3Seed([light, standard, deep]),
      deepFallback: deep.effectiveConfig,
    })
    const subject = agent()
    const signal = new AbortController().signal

    await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages: [{ content: [{ type: 'text', text: 'Change two files.' }] }], turn: 1, step: 0, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    const request = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve({ provider: 'manual', model: 'manual' }),
    )

    assert.deepEqual(request, standard.effectiveConfig)
  })

  it('propagates caller cancellation during Host route materialization', async () => {
    const light = phase3Route({ model: 'light', score: 30, effort: 'off' })
    const ctx = new FakeContext()
    const controller = new AbortController()
    const cancellation = new Error('cancel route discovery')
    ctx.llm.resolveCallConfig = async () => {
      controller.abort(cancellation)
      throw cancellation
    }
    apply(ctx, {
      mode: 'auto',
      seed: phase3Seed([light]),
      hostRoutes: [light.effectiveConfig],
    })

    await assert.rejects(
      ctx.waterfall(
        'agent/prepare-step',
        [{
          agent: agent(),
          messages: [{ content: [{ type: 'text', text: 'Do not continue.' }] }],
          turn: 1,
          step: 0,
          signal: controller.signal,
        }],
        () => Promise.resolve({ kind: 'enter' }),
      ),
      error => error === cancellation,
    )
    assert.equal(ctx.llm.calls.length, 0)
  })

  it('persists and throws an explicit no-route failure before provider dispatch', async () => {
    const light = phase3Route({ model: 'light', score: 30, effort: 'off' })
    const ctx = new FakeContext()
    ctx.llm.outputs.push(assessmentOutput({ level: 'deep' }))
    apply(ctx, {
      mode: 'auto',
      seed: phase3Seed([light]),
      hostRoutes: [light.effectiveConfig],
    })
    const subject = agent()
    const signal = new AbortController().signal

    await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages: [{ content: [{ type: 'text', text: 'Design the system.' }] }], turn: 1, step: 0, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    let terminalCalls = 0
    await assert.rejects(
      ctx.waterfall(
        'agent/request',
        [{ agent: subject, turn: 1, step: 0, signal }],
        () => {
          terminalCalls += 1
          return Promise.resolve({ provider: 'manual', model: 'manual' })
        },
      ),
      /no Host-valid AA-matched route or configured Deep fallback/,
    )

    assert.equal(terminalCalls, 1)
    const failure = subject.events.find(event => event.type === 'dsh-auto-mode/resolution-failure')
    assert.equal(failure.data.reasonCode, 'auto-route-unavailable')
    assert.equal(failure.data.status, 'failure')
    assert.equal(failure.data.assessmentStatus, 'valid')
    assert.equal(failure.data.taskAssessment.scope, 'broad')
    assert.equal(failure.data.assessorRoute.model, 'light')
    assert.deepEqual(
      ctx.namespace.events['dsh-auto-mode/resolution-failure'].parse(failure.data),
      failure.data,
    )
  })

  it('freezes one Auto choice across assembly and agent/request and records its explanation', async () => {
    const ctx = new FakeContext()
    apply(ctx, { mode: 'auto', seed: seed() })
    const subject = agent()
    const signal = new AbortController().signal
    const messages = [{ content: [{ type: 'text', text: 'Fix an authentication race condition.' }] }]

    await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages, turn: 1, step: 0, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    assert.deepEqual(subject.events, [])
    const assembled = await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    const request = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve({ provider: 'manual', model: 'manual', reasoningEffort: 'off' }),
    )

    assert.deepEqual(assembled.variables, { provider: 'p', model: 'pro' })
    assert.deepEqual(request, { provider: 'p', model: 'pro', reasoningEffort: 'max' })
    assert.deepEqual(subject.events, [{
      type: 'dsh-auto-mode/selection',
      data: {
        schemaVersion: 1,
        mode: 'auto',
        evidenceStatus: 'experimental-unadmitted',
        turn: 1,
        step: 0,
        tier: 'strong',
        provider: 'p',
        model: 'pro',
        reasoningEffort: 'max',
        reasonCode: 'high-complexity-task',
        reason: 'Matched a high-complexity or high-consequence task signal.',
        aaRecordId: 'strong',
      },
    }])
  })

  it('leaves assembly, requests, and Session events untouched in Manual mode', async () => {
    const ctx = new FakeContext()
    apply(ctx, { mode: 'manual' })
    const subject = agent()
    const signal = new AbortController().signal

    const prepared = await ctx.waterfall(
      'agent/prepare-step',
      [{ agent: subject, messages: [], turn: 1, step: 0, signal }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    const assembled = await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: { provider: 'manual', model: 'manual' } }),
    )
    const manual = { provider: 'manual', model: 'manual', reasoningEffort: 'high' }
    const request = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve(manual),
    )

    assert.deepEqual(prepared, { kind: 'enter' })
    assert.deepEqual(assembled.variables, { provider: 'manual', model: 'manual' })
    assert.equal(request, manual)
    assert.deepEqual(subject.events, [])
  })

  it('switches Auto per session through /auto and projects the preceding route for UI transition feedback', async () => {
    const ctx = new FakeContext()
    apply(ctx, { mode: 'auto', seed: seed() })
    const subject = agent()
    const signal = new AbortController().signal
    const payload = {
      agent: subject,
      messages: [{ content: [{ type: 'text', text: 'Rename this variable.' }] }],
      turn: 1,
      step: 0,
      signal,
    }

    const disabled = await ctx.command.handler({ agent: subject, rawInput: 'off', signal })
    assert.deepEqual(disabled, { kind: 'success', text: 'Experimental Auto disabled.' })
    await ctx.waterfall('agent/prepare-step', [payload], () => Promise.resolve({ kind: 'enter' }))
    const manual = { provider: 'manual', model: 'manual', reasoningEffort: 'high' }
    const untouched = await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 1, step: 0, signal }],
      () => Promise.resolve(manual),
    )
    assert.equal(untouched, manual)

    const enabled = await ctx.command.handler({ agent: subject, rawInput: '', signal })
    assert.deepEqual(enabled, { kind: 'success', text: 'Experimental Auto enabled.' })
    await ctx.waterfall(
      'agent/prepare-step',
      [{ ...payload, turn: 2 }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 2, step: 0, signal }],
      () => Promise.resolve(manual),
    )
    await ctx.waterfall(
      'agent/prepare-step',
      [{ ...payload, messages: [{ content: [{ type: 'text', text: 'Investigate a security incident.' }] }], turn: 3 }],
      () => Promise.resolve({ kind: 'enter' }),
    )
    await ctx.waterfall(
      'system-prompt/assemble',
      [{}, { agent: subject }],
      () => Promise.resolve({ variables: {} }),
    )
    await ctx.waterfall(
      'agent/request',
      [{ agent: subject, turn: 3, step: 0, signal }],
      () => Promise.resolve(manual),
    )

    const projected = subject.events.reduce(
      (state, event) => ctx.projection.apply(state, event),
      ctx.projection.init(),
    )
    assert.deepEqual(ctx.projection.view(projected), {
      active: true,
      evidenceStatus: 'experimental-unadmitted',
      decision: {
        turn: 3,
        step: 0,
        tier: 'strong',
        provider: 'p',
        model: 'pro',
        reasoningEffort: 'max',
        reasonCode: 'high-complexity-task',
        reason: 'Matched a high-complexity or high-consequence task signal.',
      },
      previousDecision: {
        turn: 2,
        step: 0,
        tier: 'fast',
        provider: 'p',
        model: 'flash',
        reasoningEffort: 'off',
        reasonCode: 'bounded-simple-task',
        reason: 'Matched a bounded low-complexity task signal.',
      },
    })
  })
})
