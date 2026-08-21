import { createHash } from 'node:crypto'

export const HOST_ROUTE_IDENTITY_SCHEMA_VERSION = 1
export const HOST_ROUTE_IDENTITY_VERSION = 'host-route/v1'
export const AA_EVIDENCE_BINDING_VERSION = 'aa-evidence-binding/v1'

/** Error with a stable machine-readable reason code for route/evidence data. */
export class AAEvidenceBindingError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'AAEvidenceBindingError'
    this.code = code
  }
}

function invalidHostRoute(message) {
  throw new AAEvidenceBindingError('host-route-invalid', message)
}

function canonicalJson(
  value,
  path = 'effectiveConfig',
  active = new WeakSet(),
  invalid = invalidHostRoute,
) {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid(`${path} must contain only finite numbers`)
    return JSON.stringify(value)
  }
  if (typeof value !== 'object') {
    invalid(`${path} must contain only JSON values`)
  }
  if (active.has(value)) invalid(`${path} must not contain cycles`)
  active.add(value)
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value)
      for (const key of ownKeys) {
        if (key === 'length') continue
        const index = typeof key === 'string' ? Number(key) : Number.NaN
        const descriptor = typeof key === 'string' ? Object.getOwnPropertyDescriptor(value, key) : undefined
        if (!Number.isSafeInteger(index) || index < 0 || index >= value.length || String(index) !== key
          || descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
          invalid(`${path} must not contain non-index array properties`)
        }
      }
      const entries = []
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid(`${path} must not contain sparse arrays`)
        entries.push(canonicalJson(value[index], `${path}[${index}]`, active, invalid))
      }
      return `[${entries.join(',')}]`
    }

    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) {
      invalid(`${path} must contain only plain objects and arrays`)
    }
    const keys = Reflect.ownKeys(value)
    for (const key of keys) {
      if (typeof key !== 'string') invalid(`${path} must not contain symbol keys`)
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')) {
        invalid(`${path}.${key} must be an enumerable data property`)
      }
    }
    return `{${keys.sort().map(key => (
      `${JSON.stringify(key)}:${canonicalJson(value[key], `${path}.${key}`, active, invalid)}`
    )).join(',')}}`
  } finally {
    active.delete(value)
  }
}

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function requiredIdentityString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    invalidHostRoute(`${path} must be a non-empty string`)
  }
  return value
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function routeIdFor(provider, model, effectiveConfigFingerprint) {
  const identityKey = canonicalJson({
    effectiveConfigFingerprint,
    model,
    provider,
    version: HOST_ROUTE_IDENTITY_VERSION,
  }, 'hostRouteIdentity')
  return `host-route:v1:${sha256(identityKey)}`
}

/**
 * Fingerprint one complete Host-materialized request configuration.
 * Plain JSON object keys are canonicalized; array order remains material.
 * Lossy JSON values and properties are rejected with `host-route-invalid`.
 */
export function fingerprintEffectiveConfig(effectiveConfig) {
  if (effectiveConfig === null || typeof effectiveConfig !== 'object' || Array.isArray(effectiveConfig)) {
    invalidHostRoute('effectiveConfig must be an object')
  }
  const serialized = canonicalJson(effectiveConfig)
  return `sha256:${sha256(serialized)}`
}

/**
 * Create the provider-neutral identity of one effective Host route.
 * Provider-specific controls stay inside the fingerprint instead of becoming
 * mandatory cross-provider identity fields.
 */
export function createHostRouteIdentity(effectiveConfig) {
  const effectiveConfigFingerprint = fingerprintEffectiveConfig(effectiveConfig)
  const provider = requiredIdentityString(effectiveConfig.provider, 'effectiveConfig.provider')
  const model = requiredIdentityString(effectiveConfig.model, 'effectiveConfig.model')
  return Object.freeze({
    schemaVersion: HOST_ROUTE_IDENTITY_SCHEMA_VERSION,
    routeId: routeIdFor(provider, model, effectiveConfigFingerprint),
    provider,
    model,
    effectiveConfigFingerprint,
  })
}

function invalid(code, message) {
  throw new AAEvidenceBindingError(code, message)
}

function normalizedHostRoute(value) {
  const serialized = canonicalJson(value, 'hostRoute', new WeakSet(), invalidHostRoute)
  const route = JSON.parse(serialized)
  if (route === null || typeof route !== 'object' || Array.isArray(route)) {
    invalid('host-route-invalid', 'hostRoute must be an object')
  }
  if (route.schemaVersion !== HOST_ROUTE_IDENTITY_SCHEMA_VERSION) {
    invalid('host-route-invalid', 'hostRoute.schemaVersion must be 1')
  }
  const provider = requiredIdentityString(route.provider, 'hostRoute.provider')
  const model = requiredIdentityString(route.model, 'hostRoute.model')
  if (typeof route.effectiveConfigFingerprint !== 'string'
    || !/^sha256:[a-f0-9]{64}$/.test(route.effectiveConfigFingerprint)) {
    invalid('host-route-invalid', 'hostRoute.effectiveConfigFingerprint must be a SHA-256 fingerprint')
  }
  const expectedRouteId = routeIdFor(provider, model, route.effectiveConfigFingerprint)
  if (route.routeId !== expectedRouteId) {
    invalid('host-route-invalid', 'hostRoute.routeId does not match its identity fields')
  }
  return Object.freeze({
    schemaVersion: HOST_ROUTE_IDENTITY_SCHEMA_VERSION,
    routeId: expectedRouteId,
    provider,
    model,
    effectiveConfigFingerprint: route.effectiveConfigFingerprint,
  })
}

function requiredBindingString(value, path) {
  if (typeof value !== 'string' || value.trim() === '') {
    invalid('aa-binding-invalid', `${path} must be a non-empty string`)
  }
  return value
}

function stringList(value, path, { allowEmpty }) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    invalid('aa-binding-invalid', `${path} must be ${allowEmpty ? 'an' : 'a non-empty'} array`)
  }
  const normalized = value.map((entry, index) => requiredBindingString(entry, `${path}[${index}]`))
  if (new Set(normalized).size !== normalized.length) {
    invalid('aa-binding-invalid', `${path} must not contain duplicates`)
  }
  return Object.freeze(normalized)
}

function normalizedBinding(value) {
  const fail = message => invalid('aa-binding-invalid', message)
  const serialized = canonicalJson(value, 'binding', new WeakSet(), fail)
  const binding = JSON.parse(serialized)
  const expectedKeys = [
    'aaRecordId',
    'aaSnapshotId',
    'bindingVersion',
    'effectiveConfigFingerprint',
    'hostRouteId',
    'limitations',
    'matchBasis',
  ]
  if (Object.keys(binding).sort().join('\u0000') !== expectedKeys.join('\u0000')) {
    invalid('aa-binding-invalid', 'binding must contain exactly the version 1 binding fields')
  }
  return Object.freeze({
    bindingVersion: requiredBindingString(binding.bindingVersion, 'binding.bindingVersion'),
    hostRouteId: requiredBindingString(binding.hostRouteId, 'binding.hostRouteId'),
    effectiveConfigFingerprint: requiredBindingString(
      binding.effectiveConfigFingerprint,
      'binding.effectiveConfigFingerprint',
    ),
    aaSnapshotId: requiredBindingString(binding.aaSnapshotId, 'binding.aaSnapshotId'),
    aaRecordId: requiredBindingString(binding.aaRecordId, 'binding.aaRecordId'),
    matchBasis: stringList(binding.matchBasis, 'binding.matchBasis', { allowEmpty: false }),
    limitations: stringList(binding.limitations, 'binding.limitations', { allowEmpty: true }),
  })
}

function snapshotRecordIndex(value) {
  const fail = message => invalid('aa-snapshot-invalid', message)
  const serializedSnapshot = canonicalJson(value, 'aaSnapshot', new WeakSet(), fail)
  const normalizedSnapshot = JSON.parse(serializedSnapshot)
  if (normalizedSnapshot === null || typeof normalizedSnapshot !== 'object'
    || Array.isArray(normalizedSnapshot)) {
    invalid('aa-snapshot-invalid', 'aaSnapshot must be an object')
  }
  if (typeof normalizedSnapshot.snapshotId !== 'string'
    || normalizedSnapshot.snapshotId.trim() === '') {
    invalid('aa-snapshot-invalid', 'aaSnapshot.snapshotId must be a non-empty string')
  }
  if (!Array.isArray(normalizedSnapshot.records)) {
    invalid('aa-snapshot-invalid', 'aaSnapshot.records must be an array')
  }
  const records = new Map()
  for (let index = 0; index < normalizedSnapshot.records.length; index += 1) {
    const record = normalizedSnapshot.records[index]
    if (record === null || typeof record !== 'object' || Array.isArray(record)
      || typeof record.recordId !== 'string' || record.recordId.trim() === '') {
      invalid('aa-snapshot-invalid', `aaSnapshot.records[${index}].recordId must be a non-empty string`)
    }
    if (records.has(record.recordId)) {
      invalid('aa-record-id-collision', `AA record ID ${record.recordId} occurs more than once`)
    }
    records.set(record.recordId, freezeTree(record))
  }
  return { snapshotId: normalizedSnapshot.snapshotId, records }
}

/**
 * Resolve one Host route through exactly one reviewed binding and AA record.
 * The resolver performs no name, slug, version, or latest-record inference.
 * Contract failures throw {@link AAEvidenceBindingError} with a stable `code`.
 */
export function resolveAAEvidenceBinding({
  hostRoute,
  bindings,
  aaSnapshot,
  bindingVersion,
}) {
  const normalizedRoute = normalizedHostRoute(hostRoute)
  if (bindingVersion !== AA_EVIDENCE_BINDING_VERSION) {
    invalid('aa-binding-version-unsupported', `unsupported binding version: ${bindingVersion}`)
  }
  if (!Array.isArray(bindings)) invalid('aa-binding-invalid', 'bindings must be an array')
  const snapshot = snapshotRecordIndex(aaSnapshot)
  const candidates = []
  for (const binding of bindings) {
    const descriptor = binding !== null && typeof binding === 'object' && !Array.isArray(binding)
      ? Object.getOwnPropertyDescriptor(binding, 'hostRouteId')
      : undefined
    if (descriptor?.enumerable !== true || !Object.hasOwn(descriptor, 'value')
      || typeof descriptor.value !== 'string') {
      invalid('aa-binding-invalid', 'every binding must contain a string hostRouteId')
    }
    if (descriptor.value === normalizedRoute.routeId) candidates.push(binding)
  }
  if (candidates.length === 0) {
    invalid('aa-binding-missing', `no AA evidence binding exists for ${normalizedRoute.routeId}`)
  }
  if (candidates.length > 1) {
    invalid('aa-binding-ambiguous', `more than one AA evidence binding exists for ${normalizedRoute.routeId}`)
  }

  const binding = normalizedBinding(candidates[0])
  if (binding.bindingVersion !== bindingVersion) {
    invalid('aa-binding-version-mismatch', 'binding version does not match the requested binding rule')
  }
  if (binding.aaSnapshotId !== snapshot.snapshotId) {
    invalid('aa-binding-snapshot-mismatch', 'binding snapshot does not match the frozen AA snapshot')
  }
  if (binding.effectiveConfigFingerprint !== normalizedRoute.effectiveConfigFingerprint) {
    invalid('aa-binding-config-mismatch', 'binding fingerprint does not match the effective Host route')
  }
  const aaRecord = snapshot.records.get(binding.aaRecordId)
  if (aaRecord === undefined) {
    invalid('aa-record-missing', `AA record ${binding.aaRecordId} is absent from snapshot ${snapshot.snapshotId}`)
  }
  return Object.freeze({
    hostRoute: normalizedRoute,
    binding,
    aaRecord,
  })
}
