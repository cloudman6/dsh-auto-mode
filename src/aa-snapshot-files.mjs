import { randomUUID } from 'node:crypto'
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'

import {
  snapshotSeedDigest,
  validatePreparedAASnapshotRefresh,
} from './aa-snapshot-refresh.mjs'

const MAX_PRIVATE_JSON_BYTES = 16 * 1024 * 1024
export const AA_SNAPSHOT_ROLLBACK_VERSION = 'aa-snapshot-rollback/v1'
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/

export class AASnapshotFileError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AASnapshotFileError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AASnapshotFileError(code, message)
}

function privatePath(allowedRoot, filePath) {
  if (typeof allowedRoot !== 'string' || typeof filePath !== 'string') {
    invalid('aa-refresh-path-invalid', 'allowedRoot and filePath must be strings')
  }
  let root
  let parent
  try {
    root = realpathSync(allowedRoot)
    parent = realpathSync(dirname(resolve(filePath)))
  } catch {
    invalid('aa-refresh-path-invalid', 'private root and target parent must already exist')
  }
  const target = join(parent, basename(resolve(filePath)))
  const parentRelative = relative(root, parent)
  const targetRelative = relative(root, target)
  if (parentRelative === '..' || parentRelative.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
    || isAbsolute(parentRelative)
    || targetRelative === '..' || targetRelative.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
    || isAbsolute(targetRelative)) {
    invalid('aa-refresh-path-outside-private-root', 'snapshot files must remain inside the private root')
  }
  if (existsSync(target) && lstatSync(target).isSymbolicLink()) {
    invalid('aa-refresh-path-invalid', 'snapshot file paths must not be symbolic links')
  }
  return target
}

function serializedJSON(value) {
  let text
  try {
    text = `${JSON.stringify(value, null, 2)}\n`
  } catch {
    invalid('aa-refresh-file-invalid', 'snapshot JSON must contain only serializable values')
  }
  if (Buffer.byteLength(text) > MAX_PRIVATE_JSON_BYTES) {
    invalid('aa-refresh-file-too-large', 'snapshot JSON exceeds the 16 MiB private-file limit')
  }
  return text
}

function atomicWrite(target, text) {
  const temporary = join(dirname(target), `.${basename(target)}.${randomUUID()}.tmp`)
  let descriptor
  try {
    descriptor = openSync(temporary, 'wx', 0o600)
    writeFileSync(descriptor, text, 'utf8')
    fsyncSync(descriptor)
    closeSync(descriptor)
    descriptor = undefined
    renameSync(temporary, target)
  } catch (error) {
    if (descriptor !== undefined) closeSync(descriptor)
    if (existsSync(temporary)) unlinkSync(temporary)
    if (error instanceof AASnapshotFileError) throw error
    invalid('aa-refresh-file-write-failed', 'failed to atomically write a private snapshot file')
  }
}

/** Read one bounded JSON artifact from inside the caller's private root. */
export function readPrivateJSONFile({ allowedRoot, filePath }) {
  const target = privatePath(allowedRoot, filePath)
  let bytes
  try {
    bytes = readFileSync(target)
  } catch {
    invalid('aa-refresh-file-invalid', 'snapshot file must be readable JSON')
  }
  if (bytes.byteLength > MAX_PRIVATE_JSON_BYTES) {
    invalid('aa-refresh-file-too-large', 'snapshot file exceeds the 16 MiB private-file limit')
  }
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    invalid('aa-refresh-file-invalid', 'snapshot file must be readable JSON')
  }
}

/** Atomically write one mode-0600 JSON artifact inside the caller's private root. */
export function writePrivateJSONFile({ allowedRoot, filePath, value }) {
  const target = privatePath(allowedRoot, filePath)
  atomicWrite(target, serializedJSON(value))
  return target
}

function rollbackEnvelope(seed) {
  return {
    schemaVersion: 1,
    rollbackVersion: AA_SNAPSHOT_ROLLBACK_VERSION,
    seedDigest: snapshotSeedDigest(seed),
    seed,
  }
}

function validatedRollbackSeed(value) {
  const expectedKeys = ['rollbackVersion', 'schemaVersion', 'seed', 'seedDigest']
  if (value === null || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join('\u0000') !== expectedKeys.join('\u0000')
    || value.schemaVersion !== 1
    || value.rollbackVersion !== AA_SNAPSHOT_ROLLBACK_VERSION
    || !DIGEST_PATTERN.test(value.seedDigest)) {
    invalid('aa-refresh-rollback-invalid', 'rollback file must use aa-snapshot-rollback/v1')
  }
  let actualDigest
  try {
    actualDigest = snapshotSeedDigest(value.seed)
  } catch {
    invalid('aa-refresh-rollback-invalid', 'rollback file contains an invalid seed')
  }
  if (actualDigest !== value.seedDigest) {
    invalid('aa-refresh-rollback-invalid', 'rollback seed does not match its saved digest')
  }
  return value.seed
}

/** Apply exactly the candidate digest reviewed by the maintainer. */
export function applyPreparedAASnapshotFiles({
  preparedPath,
  currentSeedPath,
  rollbackSeedPath,
  approvalDigest,
  allowedRoot,
}) {
  const preparedTarget = privatePath(allowedRoot, preparedPath)
  const currentTarget = privatePath(allowedRoot, currentSeedPath)
  const rollbackTarget = privatePath(allowedRoot, rollbackSeedPath)
  if (new Set([preparedTarget, currentTarget, rollbackTarget]).size !== 3) {
    invalid('aa-refresh-path-invalid', 'candidate, active, and rollback paths must be distinct')
  }
  const prepared = readPrivateJSONFile({ allowedRoot, filePath: preparedTarget })
  if (approvalDigest !== prepared.digest) {
    invalid('aa-refresh-approval-mismatch', 'approval digest does not match the reviewed candidate')
  }
  const currentSeed = readPrivateJSONFile({ allowedRoot, filePath: currentTarget })
  let currentDigest
  try {
    validatePreparedAASnapshotRefresh(prepared, { previousSeed: currentSeed })
    currentDigest = snapshotSeedDigest(currentSeed)
  } catch (error) {
    invalid(error.code ?? 'aa-refresh-file-invalid', error.message)
  }
  if (currentDigest !== prepared.previousSeedDigest) {
    invalid('aa-refresh-predecessor-mismatch', 'active seed changed after candidate review')
  }

  atomicWrite(rollbackTarget, serializedJSON(rollbackEnvelope(currentSeed)))
  atomicWrite(currentTarget, serializedJSON(prepared.seed))
  return Object.freeze({
    digest: prepared.digest,
    snapshotId: prepared.seed.snapshot.snapshotId,
    rollbackSnapshotId: currentSeed.snapshot.snapshotId,
  })
}

/** Restore the saved valid seed without deleting the rollback copy. */
export function rollbackAASnapshotFiles({ currentSeedPath, rollbackSeedPath, allowedRoot }) {
  const currentTarget = privatePath(allowedRoot, currentSeedPath)
  const rollbackTarget = privatePath(allowedRoot, rollbackSeedPath)
  if (currentTarget === rollbackTarget) {
    invalid('aa-refresh-path-invalid', 'active and rollback paths must be distinct')
  }
  const rollbackSeed = validatedRollbackSeed(
    readPrivateJSONFile({ allowedRoot, filePath: rollbackTarget }),
  )
  atomicWrite(currentTarget, serializedJSON(rollbackSeed))
  return Object.freeze({ snapshotId: rollbackSeed.snapshot.snapshotId })
}
