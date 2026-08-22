import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { compileLocalAACatalog } from './aa-catalog.mjs'
import { compileActiveAACatalog } from './aa-active-catalog.mjs'
import { compileAARoutePolicyCatalog } from './aa-route-policy.mjs'
import { createHostRouteIdentity } from './aa-evidence-binding.mjs'
import { resolveFrozenAutoDecision } from './auto-decision.mjs'
import { chooseRoute, compileSeed } from './policy.mjs'
import { runTaskAssessor } from './task-assessor.mjs'

export const name = 'dsh-auto-mode'
export const inject = ['llm', 'sessions']

const SELECTION_EVENT = 'dsh-auto-mode/selection'
const RESOLUTION_FAILURE_EVENT = 'dsh-auto-mode/resolution-failure'
const MODE_EVENT = 'dsh-auto-mode/mode'
const EVIDENCE_STATUS = 'experimental-unadmitted'

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function loadSeed(config) {
  if (config.seed !== undefined) return config.seed
  if (typeof config.seedPath !== 'string' || config.seedPath.trim() === '') {
    throw new TypeError('dsh-auto-mode: Auto mode requires seed or seedPath')
  }
  const path = resolve(process.cwd(), config.seedPath)
  return JSON.parse(readFileSync(path, 'utf8'))
}

function loadRoutingArtifact(config) {
  if (config.evidencePack !== undefined) return config.evidencePack
  if (typeof config.evidencePackPath === 'string' && config.evidencePackPath.trim() !== '') {
    const path = resolve(process.cwd(), config.evidencePackPath)
    return JSON.parse(readFileSync(path, 'utf8'))
  }
  return loadSeed(config)
}

function taskText(messages) {
  if (!Array.isArray(messages)) return ''
  const fragments = []
  for (const message of messages) {
    if (!isRecord(message) || !Array.isArray(message.content)) continue
    for (const block of message.content) {
      if (isRecord(block) && block.type === 'text' && typeof block.text === 'string') {
        fragments.push(block.text)
      }
    }
  }
  return fragments.join('\n')
}

function visibleText(message) {
  if (!isRecord(message) || !Array.isArray(message.content)) return ''
  return message.content
    .filter(block => isRecord(block) && block.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
}

function previousVisibleMessages(agent) {
  if (!Array.isArray(agent.session?.events)) return []
  const messages = []
  for (const event of agent.session.events) {
    const message = event?.type === 'user/message'
      ? event.data
      : event?.type === 'assistant/message'
        ? event.data?.message
        : undefined
    const role = event?.type === 'user/message'
      ? 'user'
      : event?.type === 'assistant/message'
        ? 'assistant'
        : undefined
    const text = visibleText(message)
    if (role !== undefined && text !== '') messages.push({ role, text })
  }
  return messages
}

function isPhase3Seed(seed) {
  return isRecord(seed) && seed.catalogVersion === 'aa-evidence-catalog/v1'
}

function isEvidencePack(value) {
  return isRecord(value)
    && value.manifest?.manifestVersion === 'aa-evidence-pack-manifest/v1'
    && value.snapshot?.snapshotVersion === 'aa-snapshot/v2'
    && value.bindingRegistry?.registryVersion === 'aa-binding-registry/v1'
}

function configuredHostRoutes(config) {
  if (config.hostRoutes === undefined) return undefined
  if (!Array.isArray(config.hostRoutes)) {
    throw new TypeError('dsh-auto-mode: hostRoutes must be an array')
  }
  return config.hostRoutes
}

function reasoningCandidates(provider, model, info) {
  const efforts = info?.reasoning?.efforts
  if (!Array.isArray(efforts) || efforts.length === 0) return [{ provider, model }]
  const candidates = efforts
    .filter(effort => typeof effort?.id === 'string' && effort.id !== '')
    .map(effort => ({ provider, model, reasoningEffort: effort.id }))
  if (info.reasoning.defaultEffort === undefined) candidates.push({ provider, model })
  return candidates
}

async function discoverHostRouteCandidates(llm, signal) {
  signal?.throwIfAborted()
  const candidates = []
  for (const provider of llm.listProviders()) {
    let models
    try {
      models = await llm.listModels(provider.id)
    } catch {
      signal?.throwIfAborted()
      continue
    }
    for (const model of models) {
      try {
        const info = await llm.resolveModelInfo(provider.id, model.id, signal)
        candidates.push(...reasoningCandidates(provider.id, model.id, info))
      } catch {
        signal?.throwIfAborted()
        // One invalid exact route does not make unrelated Host routes unusable.
      }
    }
  }
  return candidates
}

async function resolveEligibleHostRoutes(llm, configured, deepFallback, signal) {
  signal?.throwIfAborted()
  let resolvedFallback
  if (deepFallback !== undefined) {
    try {
      resolvedFallback = await llm.resolveCallConfig(deepFallback, signal)
    } catch {
      signal?.throwIfAborted()
      // An unavailable configured fallback remains ineligible.
    }
  }
  const discovered = configured ?? await discoverHostRouteCandidates(llm, signal)
  const candidates = configured === undefined && resolvedFallback !== undefined
    ? [...discovered, resolvedFallback]
    : discovered
  const routes = []
  const seen = new Set()
  for (const candidate of candidates) {
    try {
      const effective = await llm.resolveCallConfig(candidate, signal)
      const identity = createHostRouteIdentity(effective)
      if (seen.has(identity.routeId)) continue
      seen.add(identity.routeId)
      routes.push(effective)
    } catch {
      signal?.throwIfAborted()
      // Availability and exact-model validation failures exclude this route.
    }
  }
  if (resolvedFallback === undefined) return { routes, deepFallback: undefined }
  const fallbackId = createHostRouteIdentity(resolvedFallback).routeId
  return {
    routes,
    deepFallback: routes.find(route => createHostRouteIdentity(route).routeId === fallbackId),
  }
}

function compilePhase3Catalog(seed, hostRoutes) {
  return compileAARoutePolicyCatalog(compileLocalAACatalog({ seed, hostRoutes }))
}

function compileEvidencePackCatalog(evidencePack, hostRoutes) {
  return compileAARoutePolicyCatalog(compileActiveAACatalog({ evidencePack, hostRoutes }))
}

function phase3SelectionIdentityMatches(value) {
  try {
    const identity = createHostRouteIdentity(value.effectiveConfig)
    return identity.routeId === value.routeId
      && identity.effectiveConfigFingerprint === value.effectiveConfigFingerprint
      && identity.provider === value.provider
      && identity.model === value.model
      && value.effectiveConfig.reasoningEffort === value.reasoningEffort
  } catch {
    return false
  }
}

function phase3EvidenceMatchesBasis(value) {
  if (value.routeBasis === 'aa-matched') {
    return value.fallback === false
      && typeof value.aaSnapshotId === 'string' && value.aaSnapshotId !== ''
      && typeof value.aaRecordId === 'string' && value.aaRecordId !== ''
      && typeof value.evidenceBindingVersion === 'string' && value.evidenceBindingVersion !== ''
      && typeof value.catalogVersion === 'string' && value.catalogVersion !== ''
      && typeof value.routePolicyVersion === 'string' && value.routePolicyVersion !== ''
  }
  return value.routeBasis === 'configured-deep-fallback'
    && value.fallback === true
    && value.handlingLevel === 'deep'
    && value.aaSnapshotId === undefined
    && value.aaRecordId === undefined
    && value.evidenceBindingVersion === undefined
    && value.catalogVersion === undefined
    && value.routePolicyVersion === undefined
}

function phase3AssessmentAuditIsValid(value) {
  return ['valid', 'fallback'].includes(value.assessmentStatus)
    && (value.taskAssessment === null || isRecord(value.taskAssessment))
    && (value.assessmentStatus !== 'valid' || isRecord(value.taskAssessment))
    && (value.assessorRoute === null || isRecord(value.assessorRoute))
    && value.assessorVersion === 'task-assessor/v1'
    && value.handlingPolicyVersion === 'task-handling-policy/v1'
}

function parseSelectionEvent(value) {
  if (!isRecord(value)) throw new TypeError('invalid dsh-auto-mode selection event')
  if (value.schemaVersion === 2) {
    if (value.mode !== 'auto'
      || value.evidenceStatus !== EVIDENCE_STATUS
      || value.status !== 'resolved'
      || value.decisionVersion !== 'auto-decision/v1'
      || typeof value.decisionId !== 'string' || value.decisionId === ''
      || !Number.isSafeInteger(value.turn) || value.turn < 0
      || !Number.isSafeInteger(value.step) || value.step < 0
      || !['light', 'standard', 'deep'].includes(value.handlingLevel)
      || !['light', 'standard', 'deep'].includes(value.requestedHandlingLevel)
      || value.tier !== undefined
      || !['aa-matched', 'configured-deep-fallback'].includes(value.routeBasis)
      || typeof value.fallback !== 'boolean'
      || typeof value.provider !== 'string' || value.provider === ''
      || typeof value.model !== 'string' || value.model === ''
      || (value.reasoningEffort !== undefined
        && (typeof value.reasoningEffort !== 'string' || value.reasoningEffort === ''))
      || !isRecord(value.effectiveConfig)
      || typeof value.routeId !== 'string' || value.routeId === ''
      || typeof value.effectiveConfigFingerprint !== 'string'
      || typeof value.reasonCode !== 'string' || value.reasonCode === ''
      || !Array.isArray(value.reasonCodes)
      || value.reasonCodes.length === 0
      || value.reasonCodes.some(code => typeof code !== 'string' || code === '')
      || new Set(value.reasonCodes).size !== value.reasonCodes.length
      || typeof value.reason !== 'string' || value.reason === ''
      || !phase3AssessmentAuditIsValid(value)
      || !phase3SelectionIdentityMatches(value)
      || !phase3EvidenceMatchesBasis(value)) {
      throw new TypeError('invalid dsh-auto-mode selection event')
    }
    return value
  }
  if (value.schemaVersion !== 1
    || value.mode !== 'auto'
    || value.evidenceStatus !== EVIDENCE_STATUS
    || !Number.isSafeInteger(value.turn) || value.turn < 0
    || !Number.isSafeInteger(value.step) || value.step < 0
    || !['fast', 'standard', 'strong', 'fallback'].includes(value.tier)
    || typeof value.provider !== 'string' || value.provider === ''
    || typeof value.model !== 'string' || value.model === ''
    || !['off', 'high', 'max'].includes(value.reasoningEffort)
    || typeof value.reasonCode !== 'string'
    || typeof value.reason !== 'string'
    || (value.aaRecordId !== undefined && typeof value.aaRecordId !== 'string')) {
    throw new TypeError('invalid dsh-auto-mode selection event')
  }
  return value
}

function parseResolutionFailureEvent(value) {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || value.mode !== 'auto'
    || value.evidenceStatus !== EVIDENCE_STATUS
    || value.status !== 'failure'
    || value.decisionVersion !== 'auto-decision/v1'
    || typeof value.decisionId !== 'string' || value.decisionId === ''
    || !Number.isSafeInteger(value.turn) || value.turn < 0
    || !Number.isSafeInteger(value.step) || value.step < 0
    || !['light', 'standard', 'deep'].includes(value.requestedHandlingLevel)
    || value.handlingLevel !== 'deep'
    || value.reasonCode !== 'auto-route-unavailable'
    || !Array.isArray(value.reasonCodes)
    || value.reasonCodes.length === 0
    || value.reasonCodes.some(code => typeof code !== 'string' || code === '')
    || new Set(value.reasonCodes).size !== value.reasonCodes.length
    || !phase3AssessmentAuditIsValid(value)
    || typeof value.reason !== 'string' || value.reason === '') {
    throw new TypeError('invalid dsh-auto-mode resolution failure event')
  }
  return value
}

function parseModeEvent(value) {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || typeof value.active !== 'boolean'
    || value.evidenceStatus !== EVIDENCE_STATUS) {
    throw new TypeError('invalid dsh-auto-mode mode event')
  }
  return value
}

function parseProjection(value) {
  if (!isRecord(value)
    || typeof value.active !== 'boolean'
    || value.evidenceStatus !== EVIDENCE_STATUS
    || (value.decision !== null && !isRecord(value.decision))
    || (value.failure !== undefined && value.failure !== null && !isRecord(value.failure))) {
    throw new TypeError('invalid dsh-auto-mode projection')
  }
  return value
}

/** Install Auto Mode on the pinned A1/A2 Host seams. */
export function apply(ctx, config = {}) {
  const mode = config.mode ?? 'manual'
  if (mode !== 'auto' && mode !== 'manual') {
    throw new TypeError('dsh-auto-mode: mode must be auto or manual')
  }
  if (mode === 'manual') return

  const seed = loadRoutingArtifact(config)
  const phase4 = isEvidencePack(seed)
  const phase3 = isPhase3Seed(seed)
  const aaInformed = phase3 || phase4
  const catalog = aaInformed ? undefined : compileSeed(seed)
  const phase3HostRoutes = aaInformed ? configuredHostRoutes(config) : undefined
  const deepFallback = aaInformed ? config.deepFallback : undefined
  const stateByAgent = new WeakMap()

  const stateFor = (agent) => {
    let state = stateByAgent.get(agent)
    if (state !== undefined) return state
    let active = true
    if (Array.isArray(agent.session?.events)) {
      for (const event of agent.session.events) {
        if (event?.type === MODE_EVENT) active = event.data.active
      }
    }
    state = { active }
    stateByAgent.set(agent, state)
    return state
  }

  ctx.sessions.registerEventNamespace({
    namespace: 'dsh-auto-mode',
    owner: 'dsh-auto-mode',
    version: 1,
    events: {
      [SELECTION_EVENT]: { parse: parseSelectionEvent },
      [RESOLUTION_FAILURE_EVENT]: { parse: parseResolutionFailureEvent },
      [MODE_EVENT]: { parse: parseModeEvent },
    },
  })

  ctx.inject(['sessionProjections'], (projectionCtx) => {
    projectionCtx.sessionProjections.register({
      key: 'dshAutoMode',
      schema: { parse: parseProjection },
      init: () => ({
        active: true,
        evidenceStatus: EVIDENCE_STATUS,
        decision: null,
        previousDecision: null,
      }),
      apply: (state, event) => {
        if (event.type === MODE_EVENT) {
          return {
            active: event.data.active,
            evidenceStatus: EVIDENCE_STATUS,
            decision: null,
            previousDecision: null,
          }
        }
        if (event.type === RESOLUTION_FAILURE_EVENT) {
          const {
            mode: _mode,
            evidenceStatus: _status,
            schemaVersion: _version,
            ...failure
          } = event.data
          return {
            active: true,
            evidenceStatus: EVIDENCE_STATUS,
            decision: null,
            previousDecision: state.decision,
            failure,
          }
        }
        if (event.type !== SELECTION_EVENT) return state
        const {
          mode: _mode,
          evidenceStatus: _status,
          schemaVersion: schemaVersion,
          status: _decisionStatus,
          ...projected
        } = event.data
        const { aaRecordId: _legacyAaRecordId, ...legacyDecision } = projected
        const decision = schemaVersion === 1 ? legacyDecision : projected
        return {
          active: true,
          evidenceStatus: EVIDENCE_STATUS,
          decision,
          previousDecision: state.decision,
          ...(state.failure === undefined ? {} : { failure: null }),
        }
      },
      view: state => state,
      stateVersion: 1,
    })
  })

  ctx.inject(['commands'], (commandCtx) => {
    commandCtx.commands.register({
      name: 'auto',
      description: 'Enable or disable experimental Auto model selection',
      input: { hint: '[off]' },
      handler: ({ agent, rawInput }) => {
        const input = rawInput.trim()
        if (input !== '' && input !== 'off') {
          return { kind: 'error', text: 'Usage: /auto [off]' }
        }
        const active = input !== 'off'
        const state = stateFor(agent)
        state.active = active
        state.turn = undefined
        state.current = undefined
        state.assembled = undefined
        agent.session.append(MODE_EVENT, {
          schemaVersion: 1,
          active,
          evidenceStatus: EVIDENCE_STATUS,
        })
        return {
          kind: 'success',
          text: active ? 'Experimental Auto enabled.' : 'Experimental Auto disabled.',
        }
      },
    })
  })

  ctx.on('agent/prepare-step', async (payload, next) => {
    const entered = await next()
    if (entered?.kind !== 'enter') return entered
    const state = stateFor(payload.agent)
    if (!state.active) return entered
    let decision = state.turn === payload.turn ? state.current : undefined
    if (decision === undefined) {
      if (aaInformed) {
        const eligibility = await resolveEligibleHostRoutes(
          ctx.llm,
          phase3HostRoutes,
          deepFallback,
          payload.signal,
        )
        const eligibleHostRoutes = eligibility.routes
        let compiledCatalog
        try {
          compiledCatalog = phase4
            ? compileEvidencePackCatalog(seed, eligibleHostRoutes)
            : compilePhase3Catalog(seed, eligibleHostRoutes)
        } catch {
          compiledCatalog = {}
        }
        const assessmentResult = await runTaskAssessor({
          llm: ctx.llm,
          catalog: compiledCatalog,
          currentMessage: taskText(payload.messages),
          previousMessages: previousVisibleMessages(payload.agent),
          signal: payload.signal,
        })
        decision = resolveFrozenAutoDecision({
          assessmentResult,
          catalog: compiledCatalog,
          eligibleHostRoutes,
          deepFallback: eligibility.deepFallback,
        })
      } else {
        decision = chooseRoute(taskText(payload.messages), catalog)
      }
    }
    state.turn = payload.turn
    state.current = decision
    stateByAgent.set(payload.agent, state)
    return entered
  })

  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
    const selectedState = isRecord(context) && isRecord(context.agent)
      ? stateFor(context.agent)
      : undefined
    const selected = selectedState?.active ? selectedState.current : undefined
    const assembled = await next()
    if (selectedState !== undefined) selectedState.assembled = selected
    if (selected === undefined || selected.status === 'failure') return assembled
    return {
      ...assembled,
      variables: {
        ...assembled.variables,
        provider: selected.selection.provider,
        model: selected.selection.model,
      },
    }
  }, { prepend: true })

  ctx.on('agent/request', async (payload, next) => {
    const resolved = await next()
    const state = stateFor(payload.agent)
    const selected = state.active ? state.assembled : undefined
    if (selected === undefined) return resolved
    if (aaInformed && selected.status === 'failure') {
      payload.agent.session.append(RESOLUTION_FAILURE_EVENT, {
        schemaVersion: 1,
        mode: 'auto',
        evidenceStatus: EVIDENCE_STATUS,
        turn: payload.turn,
        step: payload.step,
        decisionVersion: selected.decisionVersion,
        decisionId: `auto-decision:turn:${payload.turn}`,
        status: selected.status,
        requestedHandlingLevel: selected.requestedHandlingLevel,
        handlingLevel: selected.handlingLevel,
        assessmentStatus: selected.assessmentStatus,
        taskAssessment: selected.taskAssessment ?? null,
        assessorRoute: selected.assessorRoute,
        assessorVersion: selected.assessorVersion,
        handlingPolicyVersion: selected.handlingPolicyVersion,
        reasonCode: selected.reasonCode,
        reasonCodes: selected.reasonCodes,
        reason: selected.explanation,
      })
      throw new Error(`dsh-auto-mode: ${selected.explanation}`)
    }
    if (aaInformed) {
      const selection = selected.selection
      payload.agent.session.append(SELECTION_EVENT, {
        schemaVersion: 2,
        mode: 'auto',
        evidenceStatus: EVIDENCE_STATUS,
        turn: payload.turn,
        step: payload.step,
        decisionVersion: selected.decisionVersion,
        decisionId: `auto-decision:turn:${payload.turn}`,
        status: selected.status,
        requestedHandlingLevel: selected.requestedHandlingLevel,
        handlingLevel: selected.handlingLevel,
        provider: selection.provider,
        model: selection.model,
        ...(selection.reasoningEffort === undefined
          ? {}
          : { reasoningEffort: selection.reasoningEffort }),
        effectiveConfig: selection,
        routeId: selected.routeId,
        effectiveConfigFingerprint: selected.effectiveConfigFingerprint,
        routeBasis: selected.routeBasis,
        fallback: selected.fallback,
        assessmentStatus: selected.assessmentStatus,
        taskAssessment: selected.taskAssessment ?? null,
        assessorRoute: selected.assessorRoute,
        reasonCode: selected.reasonCode,
        reasonCodes: selected.reasonCodes,
        reason: selected.explanation,
        ...(selected.aaSnapshotId === undefined ? {} : { aaSnapshotId: selected.aaSnapshotId }),
        ...(selected.aaRecordId === undefined ? {} : { aaRecordId: selected.aaRecordId }),
        ...(selected.evidenceBindingVersion === undefined
          ? {}
          : { evidenceBindingVersion: selected.evidenceBindingVersion }),
        ...(selected.catalogVersion === undefined ? {} : { catalogVersion: selected.catalogVersion }),
        ...(selected.routePolicyVersion === undefined
          ? {}
          : { routePolicyVersion: selected.routePolicyVersion }),
        ...(selected.evidencePackId === undefined ? {} : { evidencePackId: selected.evidencePackId }),
        ...(selected.evidenceRouteKeyId === undefined
          ? {}
          : { evidenceRouteKeyId: selected.evidenceRouteKeyId }),
        ...(selected.bindingRegistryVersion === undefined
          ? {}
          : { bindingRegistryVersion: selected.bindingRegistryVersion }),
        ...(selected.manifestVersion === undefined
          ? {}
          : { evidencePackManifestVersion: selected.manifestVersion }),
        assessorVersion: selected.assessorVersion,
        handlingPolicyVersion: selected.handlingPolicyVersion,
      })
      return { ...selection }
    }
    payload.agent.session.append(SELECTION_EVENT, {
      schemaVersion: 1,
      mode: 'auto',
      evidenceStatus: EVIDENCE_STATUS,
      turn: payload.turn,
      step: payload.step,
      tier: selected.tier,
      provider: selected.selection.provider,
      model: selected.selection.model,
      reasoningEffort: selected.selection.reasoningEffort,
      reasonCode: selected.reasonCode,
      reason: selected.reason,
      ...selected.aaRecordId === undefined ? {} : { aaRecordId: selected.aaRecordId },
    })
    const { reasoningEffort: _inheritedEffort, ...withoutInheritedEffort } = resolved
    return {
      ...withoutInheritedEffort,
      provider: selected.selection.provider,
      model: selected.selection.model,
      reasoningEffort: selected.selection.reasoningEffort,
    }
  }, { prepend: true })
}
