import { createHash } from 'node:crypto'

export const EVIDENCE_ROUTE_KEY_SCHEMA_VERSION = 1
export const EVIDENCE_ROUTE_KEY_VERSION = 'evidence-route-key/v1'
export const PROVIDER_NORMALIZATION_RULE_SCHEMA_VERSION = 1

const SAFE_KEY = /^[A-Za-z][A-Za-z0-9_.-]{0,127}$/
const SAFE_VALUE_TYPES = new Set(['string', 'number', 'boolean'])

export class EvidenceRouteKeyError extends TypeError {
  constructor(code, message) {
    super(message)
    this.name = 'EvidenceRouteKeyError'
    this.code = code
  }
}

function invalid(code, message) {
  throw new EvidenceRouteKeyError(code, message)
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function boundedString(value, path) {
  if (typeof value !== 'string' || value.trim() === '' || value.length > 256
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    invalid('evidence-route-rule-invalid', `${path} must be a bounded non-empty string`)
  }
  return value
}

function canonicalJson(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('evidence-route-key-invalid', 'key contains a non-finite number')
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (!isRecord(value)) invalid('evidence-route-key-invalid', 'key must contain only JSON values')
  return `{${Object.keys(value).sort().map(
    key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
  ).join(',')}}`
}

function freezeTree(value) {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function validateAliases(aliases, path) {
  if (!isRecord(aliases) || Object.keys(aliases).length === 0) {
    invalid('evidence-route-rule-invalid', `${path} must be a non-empty exact alias map`)
  }
  const normalized = {}
  for (const source of Object.keys(aliases).sort()) {
    boundedString(source, `${path} source`)
    normalized[source] = boundedString(aliases[source], `${path}.${source}`)
  }
  return normalized
}

/** Validate one exact, provider-scoped normalization rule. */
export function validateProviderNormalizationRule(value) {
  if (!isRecord(value) || value.schemaVersion !== PROVIDER_NORMALIZATION_RULE_SCHEMA_VERSION) {
    invalid('evidence-route-rule-invalid', 'normalization rule must use schemaVersion 1')
  }
  const ruleVersion = boundedString(value.ruleVersion, 'rule.ruleVersion')
  const providerNamespace = boundedString(value.providerNamespace, 'rule.providerNamespace')
  if (!Array.isArray(value.providerIds) || value.providerIds.length === 0) {
    invalid('evidence-route-rule-invalid', 'rule.providerIds must be a non-empty array')
  }
  const providerIds = value.providerIds.map((entry, index) => boundedString(entry, `rule.providerIds[${index}]`))
  if (new Set(providerIds).size !== providerIds.length) {
    invalid('evidence-route-rule-ambiguous', 'rule.providerIds must not contain duplicates')
  }
  const modelAliases = validateAliases(value.modelAliases, 'rule.modelAliases')
  if (!Array.isArray(value.evidenceControls)) {
    invalid('evidence-route-rule-invalid', 'rule.evidenceControls must be an array')
  }
  const controlKeys = new Set()
  const controlSources = new Set()
  const evidenceControls = value.evidenceControls.map((control, index) => {
    if (!isRecord(control) || !SAFE_KEY.test(control.key) || !SAFE_KEY.test(control.source)
      || typeof control.required !== 'boolean') {
      invalid('evidence-route-rule-invalid', `rule.evidenceControls[${index}] is invalid`)
    }
    if (controlKeys.has(control.key) || controlSources.has(control.source)) {
      invalid('evidence-route-rule-ambiguous', 'evidence control keys and sources must be unique')
    }
    controlKeys.add(control.key)
    controlSources.add(control.source)
    const normalized = { key: control.key, source: control.source, required: control.required }
    if (control.aliases !== undefined) normalized.aliases = validateAliases(control.aliases, `rule.evidenceControls[${index}].aliases`)
    return normalized
  }).sort((left, right) => left.key.localeCompare(right.key))
  return freezeTree({
    schemaVersion: PROVIDER_NORMALIZATION_RULE_SCHEMA_VERSION,
    ruleVersion,
    providerNamespace,
    providerIds: [...providerIds].sort(),
    modelAliases,
    evidenceControls,
  })
}

function validateControlValue(value, path) {
  if (!SAFE_VALUE_TYPES.has(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) {
    invalid('evidence-route-control-invalid', `${path} must be a string, finite number, or boolean`)
  }
  if (typeof value === 'string' && (value.trim() === '' || value.length > 256)) {
    invalid('evidence-route-control-invalid', `${path} must be a bounded non-empty string`)
  }
  return value
}

/** Derive one exact EvidenceRouteKey without including execution-only controls. */
export function createEvidenceRouteKey(effectiveConfig, normalizationRule) {
  if (!isRecord(effectiveConfig)) {
    invalid('evidence-route-config-invalid', 'effectiveConfig must be an object')
  }
  const rule = validateProviderNormalizationRule(normalizationRule)
  if (!rule.providerIds.includes(effectiveConfig.provider)) {
    invalid('evidence-route-provider-mismatch', 'effectiveConfig.provider is not declared by the rule')
  }
  const modelKey = rule.modelAliases[effectiveConfig.model]
  if (modelKey === undefined) {
    invalid('evidence-route-model-unmapped', 'effectiveConfig.model has no exact model alias')
  }
  const evidenceControls = {}
  for (const control of rule.evidenceControls) {
    let value = effectiveConfig[control.source]
    if (value === undefined) {
      if (control.required) {
        invalid('evidence-route-control-missing', `effectiveConfig.${control.source} is required`)
      }
      continue
    }
    value = validateControlValue(value, `effectiveConfig.${control.source}`)
    if (control.aliases !== undefined) {
      const alias = control.aliases[String(value)]
      if (alias === undefined) {
        invalid('evidence-route-control-unmapped', `effectiveConfig.${control.source} has no exact alias`)
      }
      value = alias
    }
    evidenceControls[control.key] = value
  }
  return freezeTree({
    schemaVersion: EVIDENCE_ROUTE_KEY_SCHEMA_VERSION,
    providerNamespace: rule.providerNamespace,
    modelKey,
    evidenceControls,
  })
}

/** Stable exact identity used by registries and deterministic sorting. */
export function evidenceRouteKeyId(key) {
  if (!isRecord(key) || key.schemaVersion !== EVIDENCE_ROUTE_KEY_SCHEMA_VERSION
    || typeof key.providerNamespace !== 'string' || key.providerNamespace.trim() === ''
    || typeof key.modelKey !== 'string' || key.modelKey.trim() === ''
    || !isRecord(key.evidenceControls)) {
    invalid('evidence-route-key-invalid', 'EvidenceRouteKey is invalid')
  }
  for (const [name, value] of Object.entries(key.evidenceControls)) {
    if (!SAFE_KEY.test(name)) invalid('evidence-route-key-invalid', 'EvidenceRouteKey control name is invalid')
    validateControlValue(value, `evidenceRouteKey.evidenceControls.${name}`)
  }
  const digest = createHash('sha256').update(canonicalJson({
    version: EVIDENCE_ROUTE_KEY_VERSION,
    schemaVersion: EVIDENCE_ROUTE_KEY_SCHEMA_VERSION,
    providerNamespace: key.providerNamespace,
    modelKey: key.modelKey,
    evidenceControls: key.evidenceControls,
  }), 'utf8').digest('hex')
  return `evidence-route-key:v1:${digest}`
}
