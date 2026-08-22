import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import { migrateLegacyAACatalogSeed } from '../src/aa-evidence-pack-migration.mjs'
import { compileActiveAACatalog } from '../src/aa-active-catalog.mjs'

const rule = {
  schemaVersion: 1, ruleVersion: 'p/v1', providerNamespace: 'p', providerIds: ['p'],
  modelAliases: { a: 'a' },
  evidenceControls: [{ key: 'effort', source: 'reasoningEffort', required: false }],
}

function fixture() {
  const route = { provider: 'p', model: 'a', reasoningEffort: 'high', temperature: 0 }
  const identity = createHostRouteIdentity(route)
  return {
    route,
    seed: {
      schemaVersion: 1,
      catalogVersion: 'aa-evidence-catalog/v1',
      bindingVersion: 'aa-evidence-binding/v1',
      snapshot: {
        snapshotId: 'legacy-snapshot',
        source: { capturedAt: '2026-08-22T10:00:00.000Z' },
        records: [{
          recordId: 'aa-a', label: 'A', creator: { recordId: 'c', label: 'Creator' },
          releaseDate: '2026-08-01', capabilityFacts: ['fixture'],
          evaluations: { artificial_analysis_intelligence_index: 40 },
          pricing: { price_1m_blended_7_to_2_to_1: 1 },
          performance: { median_time_to_first_answer_token_seconds: 2 },
        }],
      },
      bindings: [{
        bindingVersion: 'aa-evidence-binding/v1',
        hostRouteId: identity.routeId,
        effectiveConfigFingerprint: identity.effectiveConfigFingerprint,
        aaSnapshotId: 'legacy-snapshot', aaRecordId: 'aa-a',
        matchBasis: ['legacy reviewed'], limitations: [],
      }],
    },
  }
}

const options = {
  packId: 'migrated-pack',
  normalizationRules: [rule],
  source: { methodologyVersion: 'v4.1.1', attribution: 'Fixture' },
  rights: { mode: 'internal-only' },
}

describe('legacy catalog seed migration', () => {
  it('converts reviewed exact bindings into reusable keys and preserves runtime selection', () => {
    const { route, seed } = fixture()
    const result = migrateLegacyAACatalogSeed({ seed, hostRoutes: [route], ...options })

    assert.equal(result.migrationVersion, 'aa-evidence-pack-migration/v1')
    assert.equal(result.evidencePack.snapshot.snapshotId, 'legacy-snapshot')
    assert.equal(result.evidencePack.bindingRegistry.bindings[0].aaRecordId, 'aa-a')
    assert.equal('hostRouteId' in result.evidencePack.bindingRegistry.bindings[0], false)
    assert.equal('effectiveConfigFingerprint' in result.evidencePack.bindingRegistry.bindings[0], false)
    assert.equal(result.report.migratedBindings, 1)
    assert.equal(compileActiveAACatalog({
      evidencePack: result.evidencePack,
      hostRoutes: [{ ...route, temperature: 1, maxTokens: 8192 }],
    }).entries[0].aaRecordId, 'aa-a')
  })

  it('rejects missing exact Host materialization and conflicting collapsed keys', () => {
    const { route, seed } = fixture()
    assert.throws(
      () => migrateLegacyAACatalogSeed({ seed, hostRoutes: [], ...options }),
      error => error.code === 'aa-migration-host-route-missing',
    )

    const secondRoute = { ...route, temperature: 1 }
    const secondIdentity = createHostRouteIdentity(secondRoute)
    seed.snapshot.records.push({ ...structuredClone(seed.snapshot.records[0]), recordId: 'aa-other' })
    seed.bindings.push({
      ...structuredClone(seed.bindings[0]),
      hostRouteId: secondIdentity.routeId,
      effectiveConfigFingerprint: secondIdentity.effectiveConfigFingerprint,
      aaRecordId: 'aa-other',
    })
    assert.throws(
      () => migrateLegacyAACatalogSeed({ seed, hostRoutes: [route, secondRoute], ...options }),
      error => error.code === 'aa-migration-binding-conflict',
    )
  })
})
