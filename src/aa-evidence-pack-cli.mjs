import {
  applyPreparedEvidencePackFiles,
  rollbackEvidencePackFiles,
} from './aa-evidence-pack-files.mjs'
import { migrateLegacyAACatalogSeed } from './aa-evidence-pack-migration.mjs'
import { prepareAAEvidencePackRefresh } from './aa-evidence-pack-refresh.mjs'
import {
  assertDistinctPrivateJSONPaths,
  readPrivateJSONFile,
  writePrivateJSONFile,
} from './aa-snapshot-files.mjs'

const COMMANDS = Object.freeze({
  migrate: {
    required: ['private-root', 'seed', 'host-routes', 'rules', 'source', 'rights', 'pack-id', 'output'],
    optional: [],
  },
  prepare: {
    required: [
      'private-root', 'current', 'acquisition', 'source', 'rights', 'host-routes',
      'snapshot-id', 'pack-id', 'output',
    ],
    optional: ['now', 'maximum-age-days'],
  },
  apply: {
    required: ['private-root', 'prepared', 'current', 'rollback'],
    optional: [],
  },
  rollback: {
    required: ['private-root', 'current', 'rollback'],
    optional: [],
  },
})

export class AAEvidencePackCLIError extends Error {
  constructor(message) {
    super(message)
    this.name = 'AAEvidencePackCLIError'
    this.code = 'aa-evidence-pack-cli-invalid'
  }
}

function invalid(message) {
  throw new AAEvidencePackCLIError(message)
}

function parseArguments(argv) {
  const command = argv?.[0]
  const specification = COMMANDS[command]
  if (specification === undefined) invalid('command must be migrate, prepare, apply, or rollback')
  const allowed = new Set([...specification.required, ...specification.optional])
  const flags = {}
  for (let index = 1; index < argv.length; index += 2) {
    const token = argv[index]
    const value = argv[index + 1]
    if (typeof token !== 'string' || !/^--[a-z]+(?:-[a-z]+)*$/.test(token)
      || typeof value !== 'string' || value === '' || value.startsWith('--')) {
      invalid('every option must be one --name value pair')
    }
    const name = token.slice(2)
    if (!allowed.has(name)) invalid(`unrecognized --${name} option for ${command}`)
    if (Object.hasOwn(flags, name)) invalid(`--${name} must occur exactly once`)
    flags[name] = value
  }
  for (const name of specification.required) {
    if (!Object.hasOwn(flags, name)) invalid(`--${name} is required for ${command}`)
  }
  return { command, flags }
}

function emit(stdout, value) {
  if (typeof stdout !== 'function') invalid('stdout must be a function')
  stdout(JSON.stringify(value))
}

function read(allowedRoot, filePath) {
  return readPrivateJSONFile({ allowedRoot, filePath })
}

/** Execute one private, offline Evidence Pack lifecycle command. */
export function runAAEvidencePackCLI({ argv, stdout = console.log } = {}) {
  const { command, flags } = parseArguments(argv)
  const allowedRoot = flags['private-root']

  if (command === 'migrate') {
    assertDistinctPrivateJSONPaths({
      allowedRoot,
      filePaths: [flags.seed, flags['host-routes'], flags.rules, flags.source, flags.rights, flags.output],
    })
    const result = migrateLegacyAACatalogSeed({
      seed: read(allowedRoot, flags.seed),
      hostRoutes: read(allowedRoot, flags['host-routes']),
      normalizationRules: read(allowedRoot, flags.rules),
      source: read(allowedRoot, flags.source),
      rights: read(allowedRoot, flags.rights),
      packId: flags['pack-id'],
    })
    writePrivateJSONFile({ allowedRoot, filePath: flags.output, value: result.evidencePack })
    emit(stdout, { ...result.report, packId: result.evidencePack.manifest.packId, status: 'migrated' })
    return result
  }

  if (command === 'prepare') {
    assertDistinctPrivateJSONPaths({
      allowedRoot,
      filePaths: [
        flags.current, flags.acquisition, flags.source, flags.rights, flags['host-routes'], flags.output,
      ],
    })
    let maximumAgeDays
    if (flags['maximum-age-days'] !== undefined) {
      maximumAgeDays = Number(flags['maximum-age-days'])
      if (!Number.isInteger(maximumAgeDays)) invalid('--maximum-age-days must be an integer')
    }
    const prepared = prepareAAEvidencePackRefresh({
      previousPack: read(allowedRoot, flags.current),
      acquisition: read(allowedRoot, flags.acquisition),
      source: read(allowedRoot, flags.source),
      rights: read(allowedRoot, flags.rights),
      hostRoutes: read(allowedRoot, flags['host-routes']),
      snapshotId: flags['snapshot-id'],
      packId: flags['pack-id'],
      ...(flags.now === undefined ? {} : { now: flags.now }),
      ...(maximumAgeDays === undefined ? {} : { maximumAgeDays }),
    })
    writePrivateJSONFile({ allowedRoot, filePath: flags.output, value: prepared })
    emit(stdout, {
      classification: prepared.classification,
      autoApplicable: prepared.autoApplicable,
      reasonCode: prepared.reasonCode,
      status: 'prepared',
    })
    return prepared
  }

  if (command === 'apply') {
    const result = applyPreparedEvidencePackFiles({
      allowedRoot,
      preparedPath: flags.prepared,
      currentPath: flags.current,
      rollbackPath: flags.rollback,
    })
    emit(stdout, { ...result, status: 'applied' })
    return result
  }

  const result = rollbackEvidencePackFiles({
    allowedRoot,
    currentPath: flags.current,
    rollbackPath: flags.rollback,
  })
  emit(stdout, { ...result, status: 'rolled-back' })
  return result
}
