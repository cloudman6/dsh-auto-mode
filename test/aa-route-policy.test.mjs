import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { compileLocalAACatalog } from '../src/aa-catalog.mjs'
import {
  AA_ROUTE_POLICY_V2,
  compileAARoutePolicyCatalog,
  resolveAARoute,
} from '../src/aa-route-policy.mjs'

const task2Fixture = JSON.parse(readFileSync(
  new URL('./fixtures/phase1-task2-catalog.json', import.meta.url),
  'utf8',
))

for (const record of task2Fixture.seed.snapshot.records) {
  const blended = record.pricing.price_1m_blended_7_to_2_to_1
  record.pricing = { price_1m_normalized_7_to_2_to_1: blended }
}

function evidenceEntry({
  routeId,
  score,
  price = 1,
  latency = 1,
}) {
  return {
    routeId,
    aaSnapshotId: 'aa-fixture-2026-08-21',
    aaRecordId: `aa-${routeId}`,
    aaRecord: {
      recordId: `aa-${routeId}`,
      evaluations: {
        artificial_analysis_intelligence_index: score,
      },
      pricing: {
        price_1m_normalized_7_to_2_to_1: price,
      },
      performance: {
        median_time_to_first_answer_token_seconds: latency,
      },
    },
  }
}

function evidenceCatalog(entries) {
  return {
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    aaSnapshotId: 'aa-fixture-2026-08-21',
    bindingVersion: 'aa-evidence-binding/v1',
    entries,
    exclusions: [],
  }
}

function permutations(values) {
  if (values.length < 2) return [values]
  return values.flatMap((value, index) => permutations([
    ...values.slice(0, index),
    ...values.slice(index + 1),
  ]).map(rest => [value, ...rest]))
}

describe('compileAARoutePolicyCatalog()', () => {
  it('consumes the frozen Task 2 evidence catalog without a live AA request', () => {
    const evidence = compileLocalAACatalog(task2Fixture)
    const catalog = compileAARoutePolicyCatalog(evidence)

    assert.deepEqual(
      Object.fromEntries(Object.entries(catalog.levels).map(
        ([level, entries]) => [level, entries.map(entry => entry.aaRecordId)],
      )),
      {
        light: ['deepseek-v4-flash-non-reasoning'],
        standard: ['aa-record-several-controls', 'aa-record-no-controls'],
        deep: ['deepseek-v4-flash', 'deepseek-v4-pro'],
      },
    )
    assert.equal(resolveAARoute(catalog, 'standard').route.aaRecordId, 'aa-record-several-controls')
    assert.equal(resolveAARoute(catalog, 'deep').route.aaRecordId, 'deepseek-v4-flash')
  })

  it('assigns every boundary score to exactly one versioned handling level', () => {
    const catalog = compileAARoutePolicyCatalog(evidenceCatalog([
      evidenceEntry({ routeId: 'route-light', score: 34.999 }),
      evidenceEntry({ routeId: 'route-standard-min', score: 35 }),
      evidenceEntry({ routeId: 'route-standard-max', score: 49.999 }),
      evidenceEntry({ routeId: 'route-deep', score: 50 }),
    ]))

    assert.equal(catalog.policyVersion, 'aa-route-policy/v2')
    assert.deepEqual(catalog.bandPolicy, AA_ROUTE_POLICY_V2.bandPolicy)
    assert.deepEqual(catalog.levels.light.map(entry => entry.routeId), ['route-light'])
    assert.deepEqual(
      catalog.levels.standard.map(entry => entry.routeId),
      ['route-standard-max', 'route-standard-min'],
    )
    assert.deepEqual(catalog.levels.deep.map(entry => entry.routeId), ['route-deep'])
    assert.deepEqual(catalog.exclusions, [])
    assert.equal(Object.isFrozen(catalog), true)
  })

  it('excludes missing capability or price but retains missing latency explicitly', () => {
    const missingCapability = evidenceEntry({ routeId: 'missing-capability', score: 40 })
    delete missingCapability.aaRecord.evaluations
    const missingPrice = evidenceEntry({ routeId: 'missing-price', score: 40 })
    delete missingPrice.aaRecord.pricing
    const missingLatency = evidenceEntry({ routeId: 'missing-latency', score: 40 })
    delete missingLatency.aaRecord.performance

    const catalog = compileAARoutePolicyCatalog(evidenceCatalog([
      missingLatency,
      missingPrice,
      missingCapability,
    ]))

    assert.deepEqual(catalog.levels.standard.map(entry => entry.routeId), ['missing-latency'])
    assert.equal(catalog.levels.standard[0].aaLatencySeconds, null)
    assert.deepEqual(catalog.exclusions, [
      { hostRouteId: 'missing-capability', reasonCode: 'aa-capability-missing' },
      { hostRouteId: 'missing-price', reasonCode: 'aa-price-missing' },
    ])
  })

  it('excludes invalid numeric capability and price with stable reasons', () => {
    const invalidCapability = evidenceEntry({ routeId: 'invalid-capability', score: -1 })
    const invalidPrice = evidenceEntry({ routeId: 'invalid-price', score: 40, price: -1 })

    const catalog = compileAARoutePolicyCatalog(evidenceCatalog([
      invalidPrice,
      invalidCapability,
    ]))

    assert.deepEqual(catalog.exclusions, [
      { hostRouteId: 'invalid-capability', reasonCode: 'aa-capability-invalid' },
      { hostRouteId: 'invalid-price', reasonCode: 'aa-price-invalid' },
    ])
  })

  it('rejects an unsupported evidence-catalog contract', () => {
    const stale = evidenceCatalog([])
    stale.catalogVersion = 'aa-evidence-catalog/v0'

    assert.throws(
      () => compileAARoutePolicyCatalog(stale),
      error => error.code === 'aa-route-policy-invalid',
    )
  })
})

describe('resolveAARoute()', () => {
  it('orders one level by price, latency, then stable route identity', () => {
    const input = evidenceCatalog([
      evidenceEntry({ routeId: 'route-z', score: 40, price: 1, latency: 4 }),
      evidenceEntry({ routeId: 'route-c', score: 40, price: 0.5, latency: 3 }),
      evidenceEntry({ routeId: 'route-b', score: 40, price: 0.5, latency: 2 }),
      evidenceEntry({ routeId: 'route-a', score: 40, price: 0.5, latency: 2 }),
    ])

    const decision = resolveAARoute(compileAARoutePolicyCatalog(input), 'standard')

    assert.equal(decision.route.routeId, 'route-a')
    assert.equal(decision.reasonCode, 'aa-price-first')
    assert.match(decision.explanation, /Standard/)
    assert.match(decision.explanation, /normalized AA-reported price/)
  })

  it('puts missing latency after measured latency for an equal price', () => {
    const missingLatency = evidenceEntry({ routeId: 'route-a', score: 40, price: 0.5 })
    delete missingLatency.aaRecord.performance
    const measured = evidenceEntry({ routeId: 'route-z', score: 40, price: 0.5, latency: 20 })

    const decision = resolveAARoute(
      compileAARoutePolicyCatalog(evidenceCatalog([missingLatency, measured])),
      'standard',
    )

    assert.equal(decision.route.routeId, 'route-z')
  })

  it('produces the same catalog and winner for every discovery-order permutation', () => {
    const entries = [
      evidenceEntry({ routeId: 'route-c', score: 40, price: 0.7, latency: 1 }),
      evidenceEntry({ routeId: 'route-b', score: 40, price: 0.6, latency: 5 }),
      evidenceEntry({ routeId: 'route-a', score: 40, price: 0.6, latency: 5 }),
    ]
    const expected = compileAARoutePolicyCatalog(evidenceCatalog(entries))
    const expectedDecision = resolveAARoute(expected, 'standard')

    for (const permutation of permutations(entries)) {
      const actual = compileAARoutePolicyCatalog(evidenceCatalog(permutation))
      assert.deepEqual(actual, expected)
      assert.deepEqual(resolveAARoute(actual, 'standard'), expectedDecision)
    }
  })

  it('fails explicitly for an invalid or empty handling level', () => {
    const catalog = compileAARoutePolicyCatalog(evidenceCatalog([
      evidenceEntry({ routeId: 'route-light', score: 20 }),
    ]))

    assert.throws(
      () => resolveAARoute(catalog, 'fast'),
      error => error.code === 'aa-handling-level-invalid',
    )
    assert.throws(
      () => resolveAARoute(catalog, 'deep'),
      error => error.code === 'aa-route-unavailable',
    )
  })
})
