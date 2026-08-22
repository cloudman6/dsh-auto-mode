import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import { runAAEvidencePackCLI } from '../src/aa-evidence-pack-cli.mjs'
import { validateAAEvidencePack } from '../src/aa-evidence-pack.mjs'

function writeJSON(path, value) {
  writeFileSync(path, `${JSON.stringify(value)}\n`, { mode: 0o600 })
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'aa-evidence-pack-cli-'))
  const route = { provider: 'p', model: 'a', reasoningEffort: 'high', temperature: 0 }
  const identity = createHostRouteIdentity(route)
  const values = {
    seed: {
      schemaVersion: 1,
      catalogVersion: 'aa-evidence-catalog/v1',
      bindingVersion: 'aa-evidence-binding/v1',
      snapshot: {
        snapshotId: 'legacy-snapshot',
        source: { capturedAt: '2026-08-22T10:00:00.000Z' },
        records: [{
          recordId: 'aa-a', label: 'A', creator: { recordId: 'c', label: 'Creator' },
          releaseDate: '2026-08-01', evaluations: { artificial_analysis_intelligence_index: 40 },
          pricing: { price_1m_blended_7_to_2_to_1: 1 },
          performance: { median_time_to_first_answer_token_seconds: 2 },
        }],
      },
      bindings: [{
        bindingVersion: 'aa-evidence-binding/v1',
        hostRouteId: identity.routeId,
        effectiveConfigFingerprint: identity.effectiveConfigFingerprint,
        aaSnapshotId: 'legacy-snapshot', aaRecordId: 'aa-a',
        matchBasis: ['reviewed'], limitations: [],
      }],
    },
    hostRoutes: [route],
    rules: [{
      schemaVersion: 1, ruleVersion: 'p/v1', providerNamespace: 'p', providerIds: ['p'],
      modelAliases: { a: 'a' },
      evidenceControls: [{ key: 'effort', source: 'reasoningEffort', required: false }],
    }],
    source: {
      methodologyVersion: 'v4.1.1',
      terms: {
        version: '1.1', revisedAt: '2026-08-19',
        url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf',
      },
      attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
    },
    rights: { mode: 'internal-only' },
  }
  const paths = Object.fromEntries(Object.entries(values).map(([name, value]) => {
    const path = join(root, `${name}.json`)
    writeJSON(path, value)
    return [name, path]
  }))
  return { root, paths, output: join(root, 'pack.json') }
}

describe('AA Evidence Pack CLI', () => {
  it('fetches a private Free acquisition without exposing the key', async () => {
    const value = fixture()
    const acquisitionPath = join(value.root, 'acquisition.json')
    const calls = []
    const lines = []
    const page = {
      tier: 'free', intelligence_index_version: 4.1,
      pagination: { page: 1, page_size: 200, total_pages: 1, has_more: false },
      data: [],
    }

    const result = await runAAEvidencePackCLI({
      argv: [
        'fetch', '--private-root', value.root, '--output', acquisitionPath,
        '--captured-at', '2026-08-22T10:00:00.000Z',
      ],
      env: { AA_API_KEY: 'fixture-free-secret' },
      fetchImpl: async (url, options) => {
        calls.push({ url: String(url), options })
        return new Response(JSON.stringify(page), { headers: { 'content-type': 'application/json' } })
      },
      stdout: line => lines.push(line),
    })

    assert.equal(calls[0].url, 'https://artificialanalysis.ai/api/v2/language/models/free?page=1')
    assert.equal(result.acquisitionVersion, 'aa-api-acquisition/v2')
    assert.equal(JSON.stringify(result).includes('fixture-free-secret'), false)
    assert.equal(lines.join('').includes('fixture-free-secret'), false)
    assert.equal(readFileSync(acquisitionPath, 'utf8').includes('fixture-free-secret'), false)
  })

  it('migrates a private legacy seed and emits only a bounded summary', () => {
    const value = fixture()
    const lines = []

    runAAEvidencePackCLI({
      argv: [
        'migrate',
        '--private-root', value.root,
        '--seed', value.paths.seed,
        '--host-routes', value.paths.hostRoutes,
        '--rules', value.paths.rules,
        '--source', value.paths.source,
        '--rights', value.paths.rights,
        '--pack-id', 'migrated-pack',
        '--output', value.output,
      ],
      stdout: line => lines.push(line),
    })

    const pack = JSON.parse(readFileSync(value.output, 'utf8'))
    validateAAEvidencePack(pack)
    assert.equal(pack.manifest.packId, 'migrated-pack')
    assert.equal(statSync(value.output).mode & 0o777, 0o600)
    assert.deepEqual(JSON.parse(lines[0]), {
      migratedRecords: 1,
      migratedBindings: 1,
      collapsedBindings: 0,
      packId: 'migrated-pack',
      status: 'migrated',
    })
    assert.equal(lines.length, 1)
  })

  it('fails closed on unknown commands and options', () => {
    for (const argv of [
      ['unknown'],
      ['migrate', '--private-root', 'root'],
      ['rollback', '--private-root', 'root', '--current', 'current', '--rollback'],
      ['rollback', '--private-root', 'root', '--current', 'current', '--rollback', 'old', '--secret', 'x'],
    ]) {
      assert.throws(
        () => runAAEvidencePackCLI({ argv, stdout: () => {} }),
        error => error.code === 'aa-evidence-pack-cli-invalid',
      )
    }
  })
})
