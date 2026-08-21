import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  createHostRouteIdentity,
  fingerprintEffectiveConfig,
  resolveAAEvidenceBinding,
} from '../src/aa-evidence-binding.mjs'

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/phase1a-mixed-providers.json', import.meta.url),
  'utf8',
))

function fixtureRoute(fixtureId) {
  return fixture.routes.find(route => route.fixtureId === fixtureId)
}

function bindingFor(route, overrides = {}) {
  const hostRoute = createHostRouteIdentity(route.effectiveConfig)
  return {
    bindingVersion: fixture.bindingVersion,
    hostRouteId: hostRoute.routeId,
    effectiveConfigFingerprint: hostRoute.effectiveConfigFingerprint,
    aaSnapshotId: fixture.snapshot.snapshotId,
    aaRecordId: route.aaRecordId,
    matchBasis: route.matchBasis,
    limitations: route.limitations,
    ...overrides,
  }
}

describe('Host route identity', () => {
  it('creates provider-neutral identities for routes with zero, one, and several execution controls', () => {
    const identities = [
      'zero-controls',
      'local-seed-flash-off',
      'several-controls',
    ].map(fixtureId => createHostRouteIdentity(fixtureRoute(fixtureId).effectiveConfig))

    for (const identity of identities) {
      assert.equal(identity.schemaVersion, 1)
      assert.match(identity.routeId, /^host-route:v1:[a-f0-9]{64}$/)
      assert.match(identity.effectiveConfigFingerprint, /^sha256:[a-f0-9]{64}$/)
      assert.equal(Object.isFrozen(identity), true)
    }
    assert.equal(new Set(identities.map(identity => identity.routeId)).size, identities.length)
  })

  it('is stable across object-key order without imposing optional provider fields', () => {
    const expected = createHostRouteIdentity({
      provider: 'fixture-openai',
      model: 'fixture-reasoning-model',
      reasoningEffort: 'high',
      temperature: 0.2,
      maxTokens: 4096,
      stop: ['END', 'DONE'],
    })
    const reordered = createHostRouteIdentity({
      stop: ['END', 'DONE'],
      maxTokens: 4096,
      temperature: 0.2,
      reasoningEffort: 'high',
      model: 'fixture-reasoning-model',
      provider: 'fixture-openai',
    })

    assert.deepEqual(reordered, expected)
  })

  it('does not collide when any Host-materialized execution option changes', () => {
    const flashOff = createHostRouteIdentity(fixtureRoute('local-seed-flash-off').effectiveConfig)
    const flashMax = createHostRouteIdentity(fixtureRoute('local-seed-flash-max').effectiveConfig)
    const proMax = createHostRouteIdentity(fixtureRoute('local-seed-pro-max').effectiveConfig)
    const reorderedStops = createHostRouteIdentity({
      ...fixtureRoute('several-controls').effectiveConfig,
      stop: ['DONE', 'END'],
    })
    const originalStops = createHostRouteIdentity(fixtureRoute('several-controls').effectiveConfig)

    assert.notEqual(flashOff.effectiveConfigFingerprint, flashMax.effectiveConfigFingerprint)
    assert.notEqual(flashMax.routeId, proMax.routeId)
    assert.notEqual(reorderedStops.routeId, originalStops.routeId)
  })

  it('rejects non-JSON, lossy, or cyclic effective configurations', () => {
    const cyclic = { provider: 'p', model: 'm' }
    cyclic.self = cyclic

    assert.throws(
      () => fingerprintEffectiveConfig({ provider: 'p', model: 'm', temperature: Number.NaN }),
      error => error.code === 'host-route-invalid',
    )
    assert.throws(
      () => fingerprintEffectiveConfig({ provider: 'p', model: 'm', extra: undefined }),
      error => error.code === 'host-route-invalid',
    )
    assert.throws(
      () => fingerprintEffectiveConfig(cyclic),
      error => error.code === 'host-route-invalid',
    )
    assert.throws(
      () => createHostRouteIdentity(null),
      error => error.code === 'host-route-invalid',
    )

    const stop = ['END']
    stop['4294967295'] = 'silently-omitted-without-validation'
    assert.throws(
      () => fingerprintEffectiveConfig({ provider: 'p', model: 'm', stop }),
      error => error.code === 'host-route-invalid',
    )
  })
})

describe('AA evidence binding', () => {
  it('resolves every mixed-provider and current local-seed fixture by exact stable IDs', () => {
    const bindings = fixture.routes.map(route => bindingFor(route))

    for (const route of fixture.routes) {
      const hostRoute = createHostRouteIdentity(route.effectiveConfig)
      const resolved = resolveAAEvidenceBinding({
        hostRoute,
        bindings: bindings.toReversed(),
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      })

      assert.deepEqual(resolved.hostRoute, hostRoute)
      assert.equal(resolved.binding.aaRecordId, route.aaRecordId)
      assert.equal(resolved.aaRecord.recordId, route.aaRecordId)
      assert.equal(Object.isFrozen(resolved), true)
      assert.equal(Object.isFrozen(resolved.binding.matchBasis), true)
      assert.equal(Object.isFrozen(resolved.aaRecord), true)
      if (resolved.aaRecord.release !== undefined) {
        assert.equal(Object.isFrozen(resolved.aaRecord.release), true)
      }
    }
  })

  it('rejects a route with no binding or more than one binding using stable reasons', () => {
    const route = fixtureRoute('zero-controls')
    const hostRoute = createHostRouteIdentity(route.effectiveConfig)
    const binding = bindingFor(route)

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-binding-missing',
    )
    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [binding, { ...binding, aaRecordId: 'aa-record-flash-off' }],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-binding-ambiguous',
    )
  })

  it('rejects stale binding versions and snapshots', () => {
    const route = fixtureRoute('zero-controls')
    const hostRoute = createHostRouteIdentity(route.effectiveConfig)

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [bindingFor(route, { bindingVersion: 'aa-evidence-binding/v0' })],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-binding-version-mismatch',
    )
    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [bindingFor(route, { aaSnapshotId: 'aa-fixture-old' })],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-binding-snapshot-mismatch',
    )
  })

  it('rejects a binding that crosses one materialized execution difference', () => {
    const flashOff = fixtureRoute('local-seed-flash-off')
    const flashMax = fixtureRoute('local-seed-flash-max')
    const hostRoute = createHostRouteIdentity(flashOff.effectiveConfig)
    const flashMaxIdentity = createHostRouteIdentity(flashMax.effectiveConfig)

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [bindingFor(flashOff, {
          effectiveConfigFingerprint: flashMaxIdentity.effectiveConfigFingerprint,
        })],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-binding-config-mismatch',
    )
  })

  it('does not fuzzy-match an AA name or slug when the stable record ID is absent', () => {
    const route = fixtureRoute('zero-controls')
    const hostRoute = createHostRouteIdentity(route.effectiveConfig)

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [bindingFor(route, { aaRecordId: 'Fixture model without execution controls' })],
        aaSnapshot: fixture.snapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-record-missing',
    )
  })

  it('requires an explicit binding change when a snapshot replaces an AA record', () => {
    const route = fixtureRoute('zero-controls')
    const hostRoute = createHostRouteIdentity(route.effectiveConfig)
    const replacementSnapshot = {
      snapshotId: 'aa-fixture-replacement',
      records: [{
        recordId: 'aa-record-no-controls-v2',
        label: 'Fixture model without execution controls',
      }],
    }
    const staleBinding = bindingFor(route, {
      aaSnapshotId: replacementSnapshot.snapshotId,
    })

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [staleBinding],
        aaSnapshot: replacementSnapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-record-missing',
    )

    const resolved = resolveAAEvidenceBinding({
      hostRoute,
      bindings: [{ ...staleBinding, aaRecordId: 'aa-record-no-controls-v2' }],
      aaSnapshot: replacementSnapshot,
      bindingVersion: fixture.bindingVersion,
    })
    assert.equal(resolved.aaRecord.recordId, 'aa-record-no-controls-v2')
  })

  it('rejects duplicate stable AA record IDs instead of choosing by discovery order', () => {
    const route = fixtureRoute('zero-controls')
    const hostRoute = createHostRouteIdentity(route.effectiveConfig)
    const duplicateSnapshot = {
      ...fixture.snapshot,
      records: [fixture.snapshot.records[0], { ...fixture.snapshot.records[0] }],
    }

    assert.throws(
      () => resolveAAEvidenceBinding({
        hostRoute,
        bindings: [bindingFor(route)],
        aaSnapshot: duplicateSnapshot,
        bindingVersion: fixture.bindingVersion,
      }),
      error => error.code === 'aa-record-id-collision',
    )
  })
})
