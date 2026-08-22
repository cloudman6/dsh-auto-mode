import { acquireAASnapshot } from './aa-snapshot-acquisition.mjs'
import {
  createHostRouteIdentity,
  HOST_ROUTE_IDENTITY_VERSION,
} from './aa-evidence-binding.mjs'
import {
  applyPreparedAASnapshotFiles,
  assertDistinctPrivateJSONPaths,
  readPrivateJSONFile,
  rollbackAASnapshotFiles,
  writePrivateJSONFile,
} from './aa-snapshot-files.mjs'
import { prepareAASnapshotRefresh } from './aa-snapshot-refresh.mjs'

const COMMANDS = Object.freeze({
  identify: Object.freeze({
    required: Object.freeze(['private-root', 'host-routes', 'output']),
    optional: Object.freeze([]),
  }),
  fetch: Object.freeze({
    required: Object.freeze(['private-root', 'output']),
    optional: Object.freeze(['captured-at']),
  }),
  prepare: Object.freeze({
    required: Object.freeze([
      'private-root',
      'acquisition',
      'manifest',
      'binding-plan',
      'host-routes',
      'current',
      'candidate',
    ]),
    optional: Object.freeze(['now']),
  }),
  apply: Object.freeze({
    required: Object.freeze(['private-root', 'candidate', 'current', 'rollback', 'approve']),
    optional: Object.freeze([]),
  }),
  rollback: Object.freeze({
    required: Object.freeze(['private-root', 'current', 'rollback']),
    optional: Object.freeze([]),
  }),
})

export class AASnapshotCLIError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'AASnapshotCLIError'
    this.code = code
  }
}

function invalid(message) {
  throw new AASnapshotCLIError('aa-refresh-cli-invalid', message)
}

function parseArguments(argv) {
  if (!Array.isArray(argv) || typeof argv[0] !== 'string' || COMMANDS[argv[0]] === undefined) {
    invalid('command must be identify, fetch, prepare, apply, or rollback')
  }
  const command = argv[0]
  const specification = COMMANDS[command]
  const allowed = new Set([...specification.required, ...specification.optional])
  const flags = {}
  for (let index = 1; index < argv.length; index += 2) {
    const token = argv[index]
    const value = argv[index + 1]
    if (typeof token !== 'string' || !/^--[a-z]+(?:-[a-z]+)*$/.test(token)
      || typeof value !== 'string' || value === '' || value.startsWith('--')) {
      invalid('every option must be a --name value pair')
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

/** Execute one maintainer-only offline snapshot operation. */
export async function runAASnapshotCLI({
  argv,
  env = process.env,
  fetchImpl = globalThis.fetch,
  stdout = console.log,
} = {}) {
  const { command, flags } = parseArguments(argv)
  const allowedRoot = flags['private-root']

  if (command === 'identify') {
    assertDistinctPrivateJSONPaths({
      allowedRoot,
      filePaths: [flags['host-routes'], flags.output],
    })
    const hostRoutes = readPrivateJSONFile({ allowedRoot, filePath: flags['host-routes'] })
    if (!Array.isArray(hostRoutes)) invalid('--host-routes must contain a JSON array')
    const seen = new Set()
    const routes = hostRoutes.map(effectiveConfig => {
      const identity = createHostRouteIdentity(effectiveConfig)
      if (seen.has(identity.routeId)) invalid(`duplicate Host route ${identity.routeId}`)
      seen.add(identity.routeId)
      return {
        hostRouteId: identity.routeId,
        effectiveConfigFingerprint: identity.effectiveConfigFingerprint,
        provider: identity.provider,
        model: identity.model,
        effectiveConfig,
      }
    }).sort((left, right) => {
      if (left.hostRouteId < right.hostRouteId) return -1
      if (left.hostRouteId > right.hostRouteId) return 1
      return 0
    })
    writePrivateJSONFile({
      allowedRoot,
      filePath: flags.output,
      value: { schemaVersion: 1, identityVersion: HOST_ROUTE_IDENTITY_VERSION, routes },
    })
    emit(stdout, { routes: routes.length, status: 'identified' })
    return
  }

  if (command === 'fetch') {
    const acquisition = await acquireAASnapshot({
      env,
      fetchImpl,
      ...(flags['captured-at'] === undefined ? {} : { capturedAt: flags['captured-at'] }),
    })
    writePrivateJSONFile({ allowedRoot, filePath: flags.output, value: acquisition })
    emit(stdout, {
      capturedAt: acquisition.capturedAt,
      pages: acquisition.pages.length,
      status: 'fetched',
    })
    return
  }

  if (command === 'prepare') {
    assertDistinctPrivateJSONPaths({
      allowedRoot,
      filePaths: [
        flags.acquisition,
        flags.manifest,
        flags['binding-plan'],
        flags['host-routes'],
        flags.current,
        flags.candidate,
      ],
    })
    const prepared = prepareAASnapshotRefresh({
      acquisition: readPrivateJSONFile({ allowedRoot, filePath: flags.acquisition }),
      manifest: readPrivateJSONFile({ allowedRoot, filePath: flags.manifest }),
      bindingPlan: readPrivateJSONFile({ allowedRoot, filePath: flags['binding-plan'] }),
      hostRoutes: readPrivateJSONFile({ allowedRoot, filePath: flags['host-routes'] }),
      previousSeed: readPrivateJSONFile({ allowedRoot, filePath: flags.current }),
      ...(flags.now === undefined ? {} : { now: flags.now }),
    })
    writePrivateJSONFile({ allowedRoot, filePath: flags.candidate, value: prepared })
    emit(stdout, {
      digest: prepared.digest,
      snapshotId: prepared.seed.snapshot.snapshotId,
      status: 'prepared',
    })
    return
  }

  if (command === 'apply') {
    const result = applyPreparedAASnapshotFiles({
      preparedPath: flags.candidate,
      currentSeedPath: flags.current,
      rollbackSeedPath: flags.rollback,
      approvalDigest: flags.approve,
      allowedRoot,
    })
    emit(stdout, { ...result, status: 'applied' })
    return
  }

  const result = rollbackAASnapshotFiles({
    currentSeedPath: flags.current,
    rollbackSeedPath: flags.rollback,
    allowedRoot,
  })
  emit(stdout, { ...result, status: 'rolled-back' })
}
