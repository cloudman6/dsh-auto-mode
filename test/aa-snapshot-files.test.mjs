import assert from 'node:assert/strict'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, it } from 'node:test'

import {
  applyPreparedAASnapshotFiles,
  AASnapshotFileError,
  rollbackAASnapshotFiles,
  readPrivateJSONFile,
  writePrivateJSONFile,
} from '../src/aa-snapshot-files.mjs'
import {
  prepareAASnapshotRefresh,
} from '../src/aa-snapshot-refresh.mjs'
import {
  createSnapshotRefreshFixture,
  SNAPSHOT_REFRESH_NOW,
} from '../test-support/aa-snapshot-refresh-fixture.mjs'

function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function fileFixture() {
  const root = mkdtempSync(join(tmpdir(), 'dsh-auto-mode-aa-refresh-'))
  const input = createSnapshotRefreshFixture()
  const prepared = prepareAASnapshotRefresh({ ...input, now: SNAPSHOT_REFRESH_NOW })
  const currentSeedPath = join(root, 'current.json')
  const preparedPath = join(root, 'candidate.json')
  const rollbackSeedPath = join(root, 'previous.json')
  writeFileSync(currentSeedPath, `${JSON.stringify(input.previousSeed)}\n`, { mode: 0o600 })
  writeFileSync(preparedPath, `${JSON.stringify(prepared)}\n`, { mode: 0o600 })
  return { currentSeedPath, input, prepared, preparedPath, rollbackSeedPath, root }
}

describe('AA snapshot private files', () => {
  it('reads only bounded JSON files inside the private root', () => {
    const paths = fileFixture()

    assert.deepEqual(
      readPrivateJSONFile({ allowedRoot: paths.root, filePath: paths.currentSeedPath }),
      paths.input.previousSeed,
    )
  })

  it('applies an approved candidate atomically and preserves the previous valid seed', () => {
    const paths = fileFixture()

    const result = applyPreparedAASnapshotFiles({
      ...paths,
      allowedRoot: paths.root,
      approvalDigest: paths.prepared.digest,
    })

    assert.equal(result.snapshotId, paths.prepared.seed.snapshot.snapshotId)
    assert.deepEqual(readJSON(paths.currentSeedPath), paths.prepared.seed)
    assert.deepEqual(readJSON(paths.rollbackSeedPath), paths.input.previousSeed)
    assert.equal(statSync(paths.currentSeedPath).mode & 0o777, 0o600)
    assert.equal(statSync(paths.rollbackSeedPath).mode & 0o777, 0o600)
  })

  it('restores the previous valid seed and leaves the rollback copy intact', () => {
    const paths = fileFixture()
    applyPreparedAASnapshotFiles({
      ...paths,
      allowedRoot: paths.root,
      approvalDigest: paths.prepared.digest,
    })

    const result = rollbackAASnapshotFiles({
      currentSeedPath: paths.currentSeedPath,
      rollbackSeedPath: paths.rollbackSeedPath,
      allowedRoot: paths.root,
    })

    assert.equal(result.snapshotId, paths.input.previousSeed.snapshot.snapshotId)
    assert.deepEqual(readJSON(paths.currentSeedPath), paths.input.previousSeed)
    assert.deepEqual(readJSON(paths.rollbackSeedPath), paths.input.previousSeed)
  })

  it('does not change the active seed when approval or predecessor checks fail', () => {
    const wrongApproval = fileFixture()
    const original = readFileSync(wrongApproval.currentSeedPath, 'utf8')
    assert.throws(
      () => applyPreparedAASnapshotFiles({
        ...wrongApproval,
        allowedRoot: wrongApproval.root,
        approvalDigest: `sha256:${'0'.repeat(64)}`,
      }),
      error => error.code === 'aa-refresh-approval-mismatch',
    )
    assert.equal(readFileSync(wrongApproval.currentSeedPath, 'utf8'), original)
    assert.equal(existsSync(wrongApproval.rollbackSeedPath), false)

    const stale = fileFixture()
    const changed = structuredClone(stale.input.previousSeed)
    changed.snapshot.snapshotId = 'changed-after-review'
    writeFileSync(stale.currentSeedPath, `${JSON.stringify(changed)}\n`, { mode: 0o600 })
    assert.throws(
      () => applyPreparedAASnapshotFiles({
        ...stale,
        allowedRoot: stale.root,
        approvalDigest: stale.prepared.digest,
      }),
      error => error.code === 'aa-refresh-predecessor-mismatch',
    )
    assert.deepEqual(readJSON(stale.currentSeedPath), changed)
    assert.equal(existsSync(stale.rollbackSeedPath), false)
  })

  it('rejects malformed candidates and paths outside the private root', () => {
    const malformed = fileFixture()
    writeFileSync(malformed.preparedPath, '{ malformed\n', { mode: 0o600 })
    assert.throws(
      () => applyPreparedAASnapshotFiles({
        ...malformed,
        allowedRoot: malformed.root,
        approvalDigest: malformed.prepared.digest,
      }),
      error => error instanceof AASnapshotFileError && error.code === 'aa-refresh-file-invalid',
    )
    assert.equal(existsSync(malformed.rollbackSeedPath), false)

    const root = mkdtempSync(join(tmpdir(), 'dsh-auto-mode-aa-private-'))
    const outside = join(dirname(root), 'outside-aa-refresh.json')
    assert.throws(
      () => writePrivateJSONFile({ allowedRoot: root, filePath: outside, value: {} }),
      error => error.code === 'aa-refresh-path-outside-private-root',
    )
    assert.equal(existsSync(outside), false)
  })
})
