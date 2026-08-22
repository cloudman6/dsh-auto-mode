import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { runAASnapshotCLI } from '../src/aa-snapshot-cli.mjs'
import {
  createSnapshotRefreshFixture,
  SNAPSHOT_REFRESH_NOW,
} from '../test-support/aa-snapshot-refresh-fixture.mjs'

function writeJSON(path, value) {
  writeFileSync(path, `${JSON.stringify(value)}\n`, { mode: 0o600 })
}

function cliFixture() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-auto-mode-aa-cli-'))
  const input = createSnapshotRefreshFixture()
  const paths = Object.fromEntries([
    ['acquisition', input.acquisition],
    ['manifest', input.manifest],
    ['binding-plan', input.bindingPlan],
    ['host-routes', input.hostRoutes],
    ['current', input.previousSeed],
  ].map(([name, value]) => {
    const path = join(root, `${name}.json`)
    writeJSON(path, value)
    return [name, path]
  }))
  return {
    input,
    paths,
    root,
    candidate: join(root, 'candidate.json'),
    rollback: join(root, 'rollback.json'),
  }
}

function parseOutput(lines) {
  assert.equal(lines.length, 1)
  return JSON.parse(lines[0])
}

describe('AA snapshot maintainer CLI', () => {
  it('derives a deterministic private Host route identity inventory for binding review', async () => {
    const fixture = cliFixture()
    const output = join(fixture.root, 'host-route-identities.json')
    const lines = []

    await runAASnapshotCLI({
      argv: [
        'identify',
        '--private-root', fixture.root,
        '--host-routes', fixture.paths['host-routes'],
        '--output', output,
      ],
      stdout: line => lines.push(line),
    })

    const inventory = JSON.parse(readFileSync(output, 'utf8'))
    assert.equal(inventory.identityVersion, 'host-route/v1')
    assert.deepEqual(
      inventory.routes.map(route => route.hostRouteId),
      [...inventory.routes.map(route => route.hostRouteId)].sort(),
    )
    assert.deepEqual(
      new Set(inventory.routes.map(route => route.hostRouteId)),
      new Set([fixture.input.light, fixture.input.standard, fixture.input.deep]
        .map(route => route.identity.routeId)),
    )
    assert.equal(statSync(output).mode & 0o777, 0o600)
    assert.deepEqual(parseOutput(lines), { routes: 3, status: 'identified' })
  })

  it('prepares, applies, and rolls back an exact reviewed candidate', async () => {
    const fixture = cliFixture()
    const prepareOutput = []
    await runAASnapshotCLI({
      argv: [
        'prepare',
        '--private-root', fixture.root,
        '--acquisition', fixture.paths.acquisition,
        '--manifest', fixture.paths.manifest,
        '--binding-plan', fixture.paths['binding-plan'],
        '--host-routes', fixture.paths['host-routes'],
        '--current', fixture.paths.current,
        '--candidate', fixture.candidate,
        '--now', SNAPSHOT_REFRESH_NOW,
      ],
      stdout: line => prepareOutput.push(line),
    })
    const prepared = JSON.parse(readFileSync(fixture.candidate, 'utf8'))
    const prepareSummary = parseOutput(prepareOutput)
    assert.equal(prepareSummary.digest, prepared.digest)
    assert.equal(prepareSummary.snapshotId, prepared.seed.snapshot.snapshotId)
    assert.equal('report' in prepareSummary, false)
    assert.deepEqual(parseOutput([JSON.stringify(prepared.report)]), prepared.report)

    const applyOutput = []
    await runAASnapshotCLI({
      argv: [
        'apply',
        '--private-root', fixture.root,
        '--candidate', fixture.candidate,
        '--current', fixture.paths.current,
        '--rollback', fixture.rollback,
        '--approve', prepared.digest,
      ],
      stdout: line => applyOutput.push(line),
    })
    assert.equal(parseOutput(applyOutput).snapshotId, prepared.seed.snapshot.snapshotId)
    assert.deepEqual(JSON.parse(readFileSync(fixture.paths.current)), prepared.seed)

    const rollbackOutput = []
    await runAASnapshotCLI({
      argv: [
        'rollback',
        '--private-root', fixture.root,
        '--current', fixture.paths.current,
        '--rollback', fixture.rollback,
      ],
      stdout: line => rollbackOutput.push(line),
    })
    assert.equal(parseOutput(rollbackOutput).snapshotId, fixture.input.previousSeed.snapshot.snapshotId)
    assert.deepEqual(JSON.parse(readFileSync(fixture.paths.current)), fixture.input.previousSeed)
  })

  it('fetches the fixed AA pages into a private file without exposing the key', async () => {
    const fixture = cliFixture()
    const output = join(fixture.root, 'fetched.json')
    const lines = []
    const fetchImpl = async () => new Response(JSON.stringify(fixture.input.acquisition.pages[0]), {
      headers: { 'content-type': 'application/json' },
    })

    await runAASnapshotCLI({
      argv: [
        'fetch',
        '--private-root', fixture.root,
        '--output', output,
        '--captured-at', fixture.input.acquisition.capturedAt,
      ],
      env: { AA_API_KEY: 'fixture-secret' },
      fetchImpl,
      stdout: line => lines.push(line),
    })

    const acquisition = JSON.parse(readFileSync(output, 'utf8'))
    assert.equal(acquisition.endpoint, fixture.input.acquisition.endpoint)
    assert.equal(JSON.stringify(acquisition).includes('fixture-secret'), false)
    assert.deepEqual(parseOutput(lines), {
      capturedAt: fixture.input.acquisition.capturedAt,
      pages: 1,
      status: 'fetched',
    })
  })

  it('does not let prepare overwrite any of its reviewed inputs', async () => {
    const fixture = cliFixture()
    const currentBefore = readFileSync(fixture.paths.current, 'utf8')

    await assert.rejects(
      runAASnapshotCLI({
        argv: [
          'prepare',
          '--private-root', fixture.root,
          '--acquisition', fixture.paths.acquisition,
          '--manifest', fixture.paths.manifest,
          '--binding-plan', fixture.paths['binding-plan'],
          '--host-routes', fixture.paths['host-routes'],
          '--current', fixture.paths.current,
          '--candidate', join(fixture.root, '.', 'current.json'),
          '--now', SNAPSHOT_REFRESH_NOW,
        ],
        stdout: () => {},
      }),
      error => error.code === 'aa-refresh-path-invalid',
    )
    assert.equal(readFileSync(fixture.paths.current, 'utf8'), currentBefore)
  })

  it('rejects unknown commands, missing values, duplicate flags, and unrecognized flags', async () => {
    for (const argv of [
      ['unknown'],
      ['identify', '--private-root', 'one', '--host-routes', 'routes'],
      ['fetch', '--private-root'],
      ['fetch', '--private-root', 'one', '--private-root', 'two', '--output', 'out'],
      ['fetch', '--private-root', 'one', '--output', 'out', '--api-key', 'secret'],
    ]) {
      await assert.rejects(
        runAASnapshotCLI({ argv, env: {}, stdout: () => {} }),
        error => error.code === 'aa-refresh-cli-invalid',
      )
    }
  })
})
