import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

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

  sessions = {
    registerEventNamespace: registration => {
      this.namespace = registration
      return () => {}
    },
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

function agent() {
  const events = []
  return {
    session: {
      append(type, data) {
        events.push({ type, data })
      },
    },
    events,
  }
}

describe('DSH Auto Mode plugin', () => {
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
})
