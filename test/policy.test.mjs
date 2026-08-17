import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { chooseRoute, compileSeed } from '../src/policy.mjs'

const seed = {
  schemaVersion: 1,
  source: {
    name: 'Artificial Analysis',
    capturedAt: '2026-08-17T00:00:00.000Z',
    url: 'https://artificialanalysis.ai/models',
  },
  routes: {
    fast: {
      selection: {
        provider: 'deepseek-official',
        model: 'deepseek-v4-flash',
        reasoningEffort: 'off',
      },
      aa: { recordId: 'flash-off', label: 'Flash non-reasoning' },
    },
    standard: {
      selection: {
        provider: 'deepseek-official',
        model: 'deepseek-v4-flash',
        reasoningEffort: 'max',
      },
      aa: { recordId: 'flash-max', label: 'Flash max' },
    },
    strong: {
      selection: {
        provider: 'deepseek-official',
        model: 'deepseek-v4-pro',
        reasoningEffort: 'max',
      },
      aa: { recordId: 'pro-max', label: 'Pro max' },
    },
  },
  fallback: {
    provider: 'deepseek-official',
    model: 'deepseek-v4-pro',
    reasoningEffort: 'max',
  },
}

describe('compileSeed()', () => {
  it('accepts three exact, distinct provider/model/effort mappings', () => {
    const catalog = compileSeed(seed)

    assert.deepEqual(catalog.routes.fast.selection, seed.routes.fast.selection)
    assert.equal(catalog.evidenceStatus, 'experimental-unadmitted')
    assert.equal(Object.isFrozen(catalog), true)
  })

  it('falls back when a tier has an invalid reasoning effort', () => {
    const invalid = structuredClone(seed)
    invalid.routes.fast.selection.reasoningEffort = 'medium'

    const decision = chooseRoute('Format this README.', compileSeed(invalid))

    assert.equal(decision.tier, 'fallback')
    assert.equal(decision.reasonCode, 'invalid-tier-mapping')
  })

  it('falls back when a tier duplicates another exact mapping', () => {
    const invalid = structuredClone(seed)
    invalid.routes.standard.selection = structuredClone(invalid.routes.fast.selection)

    const decision = chooseRoute('Add input validation.', compileSeed(invalid))

    assert.equal(decision.tier, 'fallback')
    assert.equal(decision.reasonCode, 'invalid-tier-mapping')
  })
})

describe('chooseRoute()', () => {
  const catalog = compileSeed(seed)

  it('routes simple documentation work to fast', () => {
    const decision = chooseRoute('Fix a typo and format this README.', catalog)

    assert.equal(decision.tier, 'fast')
    assert.equal(decision.selection.reasoningEffort, 'off')
    assert.equal(decision.evidenceStatus, 'experimental-unadmitted')
  })

  it('routes ordinary coding work to standard', () => {
    const decision = chooseRoute('Add input validation to this API and update its tests.', catalog)

    assert.equal(decision.tier, 'standard')
    assert.equal(decision.selection.model, 'deepseek-v4-flash')
    assert.equal(decision.selection.reasoningEffort, 'max')
  })

  it('routes security and concurrency work to strong even when fast words also appear', () => {
    const decision = chooseRoute('Summarize and fix this authentication race condition.', catalog)

    assert.equal(decision.tier, 'strong')
    assert.equal(decision.selection.model, 'deepseek-v4-pro')
    assert.match(decision.reason, /high-complexity/)
  })

  it('uses the configured fixed strong fallback when the selected tier is missing', () => {
    const missingFast = compileSeed({
      ...seed,
      routes: { standard: seed.routes.standard, strong: seed.routes.strong },
    })

    const decision = chooseRoute('Format this README.', missingFast)

    assert.equal(decision.tier, 'fallback')
    assert.deepEqual(decision.selection, seed.fallback)
    assert.equal(decision.reasonCode, 'missing-tier-mapping')
  })
})
