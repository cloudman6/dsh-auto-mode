import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  compileLocalAACatalog,
  compileLocalAACatalogFromFile,
} from '../src/aa-catalog.mjs'

const fixture = JSON.parse(readFileSync(
  new URL('./fixtures/phase1-task2-catalog.json', import.meta.url),
  'utf8',
))

describe('compileLocalAACatalog()', () => {
  it('loads a local JSON seed and compiles it through the same validation boundary', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-auto-mode-aa-catalog-'))
    const seedPath = join(root, 'aa-catalog-seed.json')
    writeFileSync(seedPath, `${JSON.stringify(fixture.seed)}\n`)

    assert.deepEqual(
      compileLocalAACatalogFromFile({ seedPath, hostRoutes: fixture.hostRoutes }),
      compileLocalAACatalog(fixture),
    )

    writeFileSync(seedPath, '{ invalid json\n')
    assert.throws(
      () => compileLocalAACatalogFromFile({ seedPath, hostRoutes: fixture.hostRoutes }),
      error => error.code === 'aa-catalog-seed-invalid',
    )

    writeFileSync(seedPath, Buffer.alloc(1024 * 1024 + 1, 0x20))
    assert.throws(
      () => compileLocalAACatalogFromFile({ seedPath, hostRoutes: fixture.hostRoutes }),
      error => error.code === 'aa-catalog-seed-too-large',
    )
  })

  it('joins mixed-provider Host routes only through validated explicit bindings', () => {
    const catalog = compileLocalAACatalog(fixture)

    assert.equal(catalog.schemaVersion, 1)
    assert.equal(catalog.catalogVersion, 'aa-evidence-catalog/v1')
    assert.equal(catalog.aaSnapshotId, 'aa-fixture-2026-08-21')
    assert.equal(catalog.bindingVersion, 'aa-evidence-binding/v1')
    assert.equal(catalog.entries.length, 5)
    assert.deepEqual(catalog.exclusions, [])
    assert.equal(Object.isFrozen(catalog), true)

    for (const entry of catalog.entries) {
      assert.equal(entry.routeId, entry.hostRoute.routeId)
      assert.equal(entry.provider, entry.effectiveConfig.provider)
      assert.equal(entry.model, entry.effectiveConfig.model)
      assert.equal(entry.effectiveConfigFingerprint, entry.hostRoute.effectiveConfigFingerprint)
      assert.equal(entry.aaSnapshotId, catalog.aaSnapshotId)
      assert.equal(entry.aaRecordId, entry.aaRecord.recordId)
      assert.equal(entry.bindingVersion, catalog.bindingVersion)
      assert.equal(entry.evidenceBinding.hostRouteId, entry.routeId)
      assert.equal(entry.capabilityFacts, entry.aaRecord.capabilityFacts)
      assert.equal(entry.capabilityFacts.length > 0, true)
      assert.equal(Object.isFrozen(entry), true)
      assert.equal(Object.isFrozen(entry.effectiveConfig), true)
      assert.equal(Object.isFrozen(entry.capabilityFacts), true)
    }
    assert.deepEqual(
      catalog.entries.map(entry => entry.routeId),
      catalog.entries.map(entry => entry.routeId).toSorted(),
    )
  })

  it('produces the same frozen catalog regardless of discovery order', () => {
    const reversed = structuredClone(fixture)
    reversed.hostRoutes.reverse()
    reversed.seed.bindings.reverse()
    reversed.seed.snapshot.records.reverse()

    assert.deepEqual(compileLocalAACatalog(reversed), compileLocalAACatalog(fixture))
  })

  it('excludes unmatched Host routes and bindings that name no current Host route', () => {
    const input = structuredClone(fixture)
    const removed = input.seed.bindings.shift()
    input.seed.bindings.push({
      ...removed,
      hostRouteId: `host-route:v1:${'f'.repeat(64)}`,
    })

    const catalog = compileLocalAACatalog(input)

    assert.equal(catalog.entries.length, 4)
    assert.deepEqual(catalog.exclusions, [
      {
        source: 'binding',
        hostRouteId: `host-route:v1:${'f'.repeat(64)}`,
        reasonCode: 'aa-binding-host-route-missing',
      },
      {
        source: 'host-route',
        hostRouteId: removed.hostRouteId,
        reasonCode: 'aa-binding-missing',
      },
    ])
  })

  it('isolates a malformed binding row instead of invalidating unrelated routes', () => {
    const input = structuredClone(fixture)
    input.seed.bindings.push({ aaRecordId: 'malformed-row-without-host-route' })

    const catalog = compileLocalAACatalog(input)

    assert.equal(catalog.entries.length, 5)
    assert.deepEqual(catalog.exclusions, [{
      source: 'binding',
      bindingIndex: 5,
      reasonCode: 'aa-binding-invalid',
    }])
  })

  it('excludes ambiguous, configuration-crossing, and stale bindings with Phase 1A reasons', () => {
    const ambiguous = structuredClone(fixture)
    ambiguous.seed.bindings.push(structuredClone(ambiguous.seed.bindings[0]))
    assert.equal(
      compileLocalAACatalog(ambiguous).exclusions[0].reasonCode,
      'aa-binding-ambiguous',
    )

    const crossing = structuredClone(fixture)
    crossing.seed.bindings[0].effectiveConfigFingerprint = crossing.seed.bindings[1].effectiveConfigFingerprint
    assert.equal(
      compileLocalAACatalog(crossing).exclusions[0].reasonCode,
      'aa-binding-config-mismatch',
    )

    const stale = structuredClone(fixture)
    stale.seed.snapshot.records = stale.seed.snapshot.records.filter(
      record => record.recordId !== stale.seed.bindings[0].aaRecordId,
    )
    assert.equal(
      compileLocalAACatalog(stale).exclusions[0].reasonCode,
      'aa-record-missing',
    )
  })

  it('excludes a matched AA record whose capability facts are absent or malformed', () => {
    const missing = structuredClone(fixture)
    delete missing.seed.snapshot.records[0].capabilityFacts
    assert.equal(
      compileLocalAACatalog(missing).exclusions[0].reasonCode,
      'aa-capability-facts-invalid',
    )

    const duplicate = structuredClone(fixture)
    duplicate.seed.snapshot.records[0].capabilityFacts = ['score=45', 'score=45']
    assert.equal(
      compileLocalAACatalog(duplicate).exclusions[0].reasonCode,
      'aa-capability-facts-invalid',
    )
  })

  it('rejects an invalid seed contract before catalog compilation', () => {
    const input = structuredClone(fixture)
    input.seed.schemaVersion = 2

    assert.throws(
      () => compileLocalAACatalog(input),
      error => error.code === 'aa-catalog-invalid',
    )
    assert.throws(
      () => compileLocalAACatalog(null),
      error => error.code === 'aa-catalog-invalid',
    )

    const missingSnapshotId = structuredClone(fixture)
    delete missingSnapshotId.seed.snapshot.snapshotId
    assert.throws(
      () => compileLocalAACatalog(missingSnapshotId),
      error => error.code === 'aa-catalog-invalid',
    )
  })
})
