import {
  assertDistinctPrivateJSONPaths,
  readPrivateJSONFile,
  writePrivateJSONFile,
} from './aa-snapshot-files.mjs'
import {
  evidenceComponentDigest,
  validateAAEvidencePack,
} from './aa-evidence-pack.mjs'
import { validatePreparedAAEvidencePackRefresh } from './aa-evidence-pack-refresh.mjs'

export const AA_EVIDENCE_PACK_ROLLBACK_VERSION = 'aa-evidence-pack-rollback/v1'

export class AAEvidencePackFileError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AAEvidencePackFileError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new AAEvidencePackFileError(code, message)
}

function validateRollback(value) {
  if (value?.schemaVersion !== 1
    || value?.rollbackVersion !== AA_EVIDENCE_PACK_ROLLBACK_VERSION
    || typeof value.packDigest !== 'string' || value.pack === undefined) {
    invalid('aa-evidence-pack-rollback-invalid', 'rollback artifact is invalid')
  }
  try {
    validateAAEvidencePack(value.pack)
  } catch {
    invalid('aa-evidence-pack-rollback-invalid', 'rollback Evidence Pack is invalid')
  }
  if (evidenceComponentDigest(value.pack) !== value.packDigest) {
    invalid('aa-evidence-pack-rollback-invalid', 'rollback Evidence Pack digest does not match')
  }
  return value.pack
}

/** Apply a validated GREEN or isolated AMBER update without a human approval token. */
export function applyPreparedEvidencePackFiles({
  allowedRoot,
  preparedPath,
  currentPath,
  rollbackPath,
}) {
  assertDistinctPrivateJSONPaths({
    allowedRoot,
    filePaths: [preparedPath, currentPath, rollbackPath],
  })
  const prepared = readPrivateJSONFile({ allowedRoot, filePath: preparedPath })
  try {
    validatePreparedAAEvidencePackRefresh(prepared)
  } catch (error) {
    invalid(error.code ?? 'aa-evidence-pack-update-invalid', error.message)
  }
  const current = readPrivateJSONFile({ allowedRoot, filePath: currentPath })
  try {
    validateAAEvidencePack(current)
  } catch (error) {
    invalid(error.code ?? 'aa-evidence-pack-update-invalid', error.message)
  }
  if (evidenceComponentDigest(current) !== prepared.previousPackDigest) {
    invalid('aa-evidence-pack-predecessor-mismatch', 'active Evidence Pack changed after refresh preparation')
  }
  const rollback = {
    schemaVersion: 1,
    rollbackVersion: AA_EVIDENCE_PACK_ROLLBACK_VERSION,
    packDigest: evidenceComponentDigest(current),
    pack: current,
  }
  writePrivateJSONFile({ allowedRoot, filePath: rollbackPath, value: rollback })
  writePrivateJSONFile({ allowedRoot, filePath: currentPath, value: prepared.evidencePack })
  return Object.freeze({
    classification: prepared.classification,
    packId: prepared.evidencePack.manifest.packId,
    snapshotId: prepared.evidencePack.snapshot.snapshotId,
    rollbackPackId: current.manifest.packId,
  })
}

/** Restore the last validated local pack while retaining the rollback artifact. */
export function rollbackEvidencePackFiles({ allowedRoot, currentPath, rollbackPath }) {
  assertDistinctPrivateJSONPaths({ allowedRoot, filePaths: [currentPath, rollbackPath] })
  const pack = validateRollback(readPrivateJSONFile({ allowedRoot, filePath: rollbackPath }))
  writePrivateJSONFile({ allowedRoot, filePath: currentPath, value: pack })
  return Object.freeze({ packId: pack.manifest.packId, snapshotId: pack.snapshot.snapshotId })
}
