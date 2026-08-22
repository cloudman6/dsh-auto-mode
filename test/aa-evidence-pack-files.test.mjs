import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  applyPreparedEvidencePackFiles,
  rollbackEvidencePackFiles,
} from '../src/aa-evidence-pack-files.mjs'
import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  buildAAEvidencePack,
  buildPolicyEligibleAASnapshot,
} from '../src/aa-evidence-pack.mjs'
import { prepareAAEvidencePackRefresh } from '../src/aa-evidence-pack-refresh.mjs'
import { AA_ROUTE_POLICY_V1 } from '../src/aa-route-policy.mjs'

const rights = { mode: 'internal-only' }
const source = { methodologyVersion: 'v4.1.1', terms: { version: '1.1' }, attribution: 'Fixture' }
const rule = {
  schemaVersion: 1, ruleVersion: 'fixture/v1', providerNamespace: 'fixture',
  providerIds: ['p'], modelAliases: { a: 'a' }, evidenceControls: [],
}

function acquisition(score) {
  return {
    schemaVersion: 1, acquisitionVersion: 'aa-api-acquisition/v1',
    endpoint: 'https://artificialanalysis.ai/api/v2/language/models', promptType: 'medium',
    capturedAt: '2026-08-22T10:00:00.000Z',
    pages: [{
      tier: 'pro', intelligence_index_version: 4.1,
      pagination: { page: 1, page_size: 200, total_pages: 1, has_more: false },
      data: [{
        id: 'a', name: 'A', slug: 'a', model_creator: { id: 'c', name: 'C' },
        evaluations: { artificial_analysis_intelligence_index: score },
        pricing: { price_1m_blended_7_to_2_to_1: 1 },
        performance: { median_time_to_first_answer_token_seconds: 1 },
      }],
    }],
  }
}

function initialPack() {
  const snapshot = buildPolicyEligibleAASnapshot({
    acquisition: acquisition(30), snapshotId: 'old', source, rights,
  }).snapshot
  return buildAAEvidencePack({
    packId: 'old-pack', snapshot,
    bindingRegistry: {
      schemaVersion: 1, registryVersion: 'aa-binding-registry/v1', normalizationRules: [rule], bindings: [],
    },
    routePolicy: AA_ROUTE_POLICY_V1,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT, minimumVersion: 1, maximumVersion: 1,
    },
    rights,
  })
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'aa-pack-files-'))
  const current = initialPack()
  const prepared = prepareAAEvidencePackRefresh({
    previousPack: current, acquisition: acquisition(31), snapshotId: 'next', packId: 'next-pack',
    source, rights,
  })
  const currentPath = join(root, 'active.json')
  const preparedPath = join(root, 'prepared.json')
  const rollbackPath = join(root, 'rollback.json')
  writeFileSync(currentPath, `${JSON.stringify(current)}\n`, { mode: 0o600 })
  writeFileSync(preparedPath, `${JSON.stringify(prepared)}\n`, { mode: 0o600 })
  return { root, current, prepared, currentPath, preparedPath, rollbackPath }
}

function read(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

describe('local Evidence Pack activation', () => {
  it('automatically activates GREEN/AMBER packs atomically and preserves rollback', () => {
    const value = fixture()
    const result = applyPreparedEvidencePackFiles({ allowedRoot: value.root, ...value })

    assert.equal(result.packId, 'next-pack')
    assert.equal(result.classification, 'GREEN')
    assert.deepEqual(read(value.currentPath), value.prepared.evidencePack)
    assert.equal(read(value.rollbackPath).pack.manifest.packId, 'old-pack')
    assert.equal(statSync(value.currentPath).mode & 0o777, 0o600)

    const restored = rollbackEvidencePackFiles({
      allowedRoot: value.root, currentPath: value.currentPath, rollbackPath: value.rollbackPath,
    })
    assert.equal(restored.packId, 'old-pack')
    assert.deepEqual(read(value.currentPath), value.current)
  })

  it('rejects RED, tampered, incompatible, and stale-predecessor updates before mutation', () => {
    const tampered = fixture()
    const original = readFileSync(tampered.currentPath, 'utf8')
    const candidate = read(tampered.preparedPath)
    candidate.evidencePack.snapshot.records[0].label = 'tampered'
    writeFileSync(tampered.preparedPath, `${JSON.stringify(candidate)}\n`, { mode: 0o600 })
    assert.throws(
      () => applyPreparedEvidencePackFiles({ allowedRoot: tampered.root, ...tampered }),
      error => error.code === 'aa-evidence-refresh-digest-mismatch',
    )
    assert.equal(readFileSync(tampered.currentPath, 'utf8'), original)

    const stale = fixture()
    const changed = { ...stale.current, manifest: { ...stale.current.manifest, packId: 'changed' } }
    writeFileSync(stale.currentPath, `${JSON.stringify(changed)}\n`, { mode: 0o600 })
    assert.throws(
      () => applyPreparedEvidencePackFiles({ allowedRoot: stale.root, ...stale }),
      error => ['aa-evidence-pack-digest-mismatch', 'aa-evidence-pack-predecessor-mismatch'].includes(error.code),
    )
  })
})
