import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  migrateAAEvidencePackV1ToV2,
  migrateLegacyAACatalogSeed,
} from '../src/aa-evidence-pack-migration.mjs'
import { compileActiveAACatalog } from '../src/aa-active-catalog.mjs'
import { evidenceComponentDigest } from '../src/aa-evidence-pack.mjs'
import { AA_ROUTE_POLICY_V1 } from '../src/aa-route-policy.mjs'

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
  source: {
    methodologyVersion: 'v4.1.1',
    terms: { version: '1.1', revisedAt: '2026-08-19', url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf' },
    attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
  },
  rights: { mode: 'internal-only' },
}

describe('legacy catalog seed migration', () => {
  it('converts reviewed exact bindings into reusable keys and preserves runtime selection', () => {
    const { route, seed } = fixture()
    const result = migrateLegacyAACatalogSeed({ seed, hostRoutes: [route], ...options })

    assert.equal(result.migrationVersion, 'aa-evidence-pack-migration/v2')
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

  it('adapts one validated v1 Pack and preserves legacy price provenance', () => {
    const { route, seed } = fixture()
    const current = migrateLegacyAACatalogSeed({ seed, hostRoutes: [route], ...options }).evidencePack
    const legacy = structuredClone(current)
    legacy.snapshot.snapshotVersion = 'aa-snapshot/v2'
    legacy.snapshot.records = legacy.snapshot.records.map(record => ({
      ...record,
      pricing: {
        price_1m_blended_7_to_2_to_1: record.pricing.price_1m_normalized_7_to_2_to_1,
      },
    }))
    legacy.routePolicy = AA_ROUTE_POLICY_V1
    legacy.manifest.runtimeCompatibility = {
      contract: 'aa-evidence-pack-runtime/v1', minimumVersion: 1, maximumVersion: 1,
    }
    legacy.manifest.components.snapshot = {
      version: 'aa-snapshot/v2', digest: evidenceComponentDigest(legacy.snapshot),
    }
    legacy.manifest.components.routePolicy = {
      version: 'aa-route-policy/v1', digest: evidenceComponentDigest(legacy.routePolicy),
    }

    const migrated = migrateAAEvidencePackV1ToV2(legacy)

    assert.equal(migrated.snapshot.snapshotVersion, 'aa-snapshot/v3')
    assert.equal(migrated.routePolicy.policyVersion, 'aa-route-policy/v2')
    assert.equal(migrated.snapshot.records[0].pricing.normalization.basis, 'legacy-aa-blended')
    assert.deepEqual(
      Object.keys(migrated.snapshot.records[0].pricing.normalization).sort(),
      ['basis', 'version'],
    )
    assert.equal(compileActiveAACatalog({ evidencePack: legacy, hostRoutes: [route] }).entries.length, 1)

    const tampered = structuredClone(legacy)
    tampered.snapshot.records[0].label = 'tampered'
    assert.throws(
      () => migrateAAEvidencePackV1ToV2(tampered),
      error => error.code === 'aa-evidence-pack-digest-mismatch',
    )
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
