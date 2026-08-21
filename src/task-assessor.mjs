import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'

import {
  TASK_ASSESSOR_CONTRACT_V1,
  TASK_ASSESSOR_ROUTE_POLICY_VERSION,
  TASK_ASSESSOR_VERSION,
  buildTaskAssessorInput,
  evaluateTaskAssessorResult,
  isTaskAssessorRouteCompatible,
  resolveTaskAssessorRoute,
  taskAssessorFallback,
} from './task-assessor-contract.mjs'

export const TASK_HANDLING_POLICY_VERSION = 'task-handling-policy/v1'

const FALLBACK_EXPLANATIONS = Object.freeze({
  'assessor-catalog-invalid': 'Deep fallback: the assessor catalog is invalid',
  'assessor-empty-output': 'Deep fallback: the assessor returned no output',
  'assessor-input-too-large': 'Deep fallback: the assessor input exceeded its byte limit',
  'assessor-invalid-json': 'Deep fallback: the assessor output was not valid JSON',
  'assessor-invalid-schema': 'Deep fallback: the assessor output violated its schema',
  'assessor-low-confidence': 'Deep fallback: the assessor confidence was below 0.8',
  'assessor-output-too-large': 'Deep fallback: the assessor output exceeded its byte limit',
  'assessor-provider-error': 'Deep fallback: the assessor provider call failed',
  'assessor-route-unavailable': 'Deep fallback: no compatible assessor route was available',
  'assessor-timeout': 'Deep fallback: the assessor exceeded its total deadline',
})

const DEEP_REASON_LABELS = Object.freeze({
  'task-kind-unknown': 'unknown task kind',
  'task-scope-broad': 'broad scope',
  'task-scope-unknown': 'unknown scope',
  'task-complexity-high': 'high complexity',
  'task-complexity-unknown': 'unknown complexity',
  'task-risk-high': 'high risk',
  'task-risk-unknown': 'unknown risk',
  'task-verifiability-none': 'no direct verification path',
  'task-verifiability-unknown': 'unknown verifiability',
  'task-open-ended-scope': 'open-ended scope',
  'task-context-missing': 'material context is missing',
  'task-intent-ambiguous': 'task intent is ambiguous',
  'task-security-sensitive': 'security-sensitive work',
  'task-external-effect-risk': 'destructive or external effects',
  'task-not-checkable': 'result is not directly checkable',
})

const STANDARD_REASON_LABELS = Object.freeze({
  'task-scope-normal': 'normal scope',
  'task-complexity-medium': 'medium complexity',
  'task-risk-medium': 'medium risk',
  'task-verifiability-partial': 'partially checkable result',
  'task-multiple-dependent-steps': 'multiple dependent steps',
  'task-cross-file-change': 'cross-file change',
  'task-partially-checkable': 'partial verification',
  'task-shape-standard': 'ordinary task shape',
})

function freezeTree(value) {
  const freezeable = Array.isArray(value)
    || (value !== null
      && typeof value === 'object'
      && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null))
  if (freezeable && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeTree(child)
    Object.freeze(value)
  }
  return value
}

function invalid(message) {
  throw new TypeError(message)
}

function reasonCodesForDeep(assessment) {
  const reasons = []
  if (assessment.taskKind === 'unknown') reasons.push('task-kind-unknown')
  if (assessment.scope === 'broad') reasons.push('task-scope-broad')
  if (assessment.scope === 'unknown') reasons.push('task-scope-unknown')
  if (assessment.complexity === 'high') reasons.push('task-complexity-high')
  if (assessment.complexity === 'unknown') reasons.push('task-complexity-unknown')
  if (assessment.risk === 'high') reasons.push('task-risk-high')
  if (assessment.risk === 'unknown') reasons.push('task-risk-unknown')
  if (assessment.verifiability === 'none') reasons.push('task-verifiability-none')
  if (assessment.verifiability === 'unknown') reasons.push('task-verifiability-unknown')

  const semanticReasons = new Map([
    ['open-ended-scope', 'task-open-ended-scope'],
    ['missing-material-context', 'task-context-missing'],
    ['ambiguous-intent', 'task-intent-ambiguous'],
    ['security-sensitive', 'task-security-sensitive'],
    ['destructive-or-external-effect', 'task-external-effect-risk'],
    ['not-checkable', 'task-not-checkable'],
  ])
  for (const [source, policyReason] of semanticReasons) {
    if (assessment.reasons.includes(source)) reasons.push(policyReason)
  }
  return reasons
}

function reasonCodesForStandard(assessment) {
  const reasons = []
  if (assessment.scope === 'normal') reasons.push('task-scope-normal')
  if (assessment.complexity === 'medium') reasons.push('task-complexity-medium')
  if (assessment.risk === 'medium') reasons.push('task-risk-medium')
  if (assessment.verifiability === 'partial') reasons.push('task-verifiability-partial')
  if (assessment.reasons.includes('multiple-dependent-steps')) {
    reasons.push('task-multiple-dependent-steps')
  }
  if (assessment.reasons.includes('cross-file-change')) reasons.push('task-cross-file-change')
  if (assessment.reasons.includes('partially-checkable')) reasons.push('task-partially-checkable')
  if (reasons.length === 0) reasons.push('task-shape-standard')
  return reasons
}

function explanation(level, reasonCodes, labels) {
  const details = reasonCodes.map(code => labels[code]).join('; ')
  return `${level[0].toUpperCase()}${level.slice(1)}: ${details}`
}

/** Map one validated assessment outcome through deterministic Host-owned policy. */
export function mapTaskAssessment(outcome) {
  if (outcome?.status === 'fallback'
    && outcome.handlingLevel === 'deep'
    && typeof FALLBACK_EXPLANATIONS[outcome.reasonCode] === 'string') {
    return freezeTree({
      policyVersion: TASK_HANDLING_POLICY_VERSION,
      handlingLevel: 'deep',
      reasonCodes: [outcome.reasonCode],
      explanation: FALLBACK_EXPLANATIONS[outcome.reasonCode],
    })
  }
  if (outcome?.status !== 'valid'
    || outcome.assessment?.assessorVersion !== TASK_ASSESSOR_VERSION
    || !Array.isArray(outcome.assessment.reasons)) {
    invalid('Task handling policy requires a validated Task Assessor outcome')
  }

  const { assessment } = outcome
  const deepReasons = reasonCodesForDeep(assessment)
  if (deepReasons.length > 0) {
    return freezeTree({
      policyVersion: TASK_HANDLING_POLICY_VERSION,
      handlingLevel: 'deep',
      reasonCodes: deepReasons,
      explanation: explanation('deep', deepReasons, DEEP_REASON_LABELS),
    })
  }

  const light = assessment.scope === 'bounded'
    && assessment.complexity === 'low'
    && assessment.risk === 'low'
    && assessment.verifiability === 'mechanical'
    && !assessment.reasons.includes('multiple-dependent-steps')
    && !assessment.reasons.includes('cross-file-change')
    && !assessment.reasons.includes('partially-checkable')
  if (light) {
    return freezeTree({
      policyVersion: TASK_HANDLING_POLICY_VERSION,
      handlingLevel: 'light',
      reasonCodes: ['task-bounded-low-risk-mechanical'],
      explanation: 'Light: bounded low-risk task with a mechanically checkable result',
    })
  }

  const standardReasons = reasonCodesForStandard(assessment)
  return freezeTree({
    policyVersion: TASK_HANDLING_POLICY_VERSION,
    handlingLevel: 'standard',
    reasonCodes: standardReasons,
    explanation: explanation('standard', standardReasons, STANDARD_REASON_LABELS),
  })
}

function callerCancellation(signal) {
  if (!signal?.aborted) return undefined
  return signal.reason instanceof Error ? signal.reason : new Error('Task Assessor caller aborted')
}

function routeAudit(resolution) {
  const { route } = resolution
  const reasoningEffort = route.effectiveConfig.reasoningEffort
  return freezeTree({
    policyVersion: resolution.policyVersion,
    contractVersion: resolution.contractVersion,
    catalogVersion: resolution.catalogVersion,
    routeId: route.routeId,
    provider: route.provider,
    model: route.model,
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
    effectiveConfigFingerprint: route.effectiveConfigFingerprint,
    resolvedLevel: resolution.resolvedLevel,
    aaSnapshotId: resolution.aaSnapshotId,
    reasonCode: resolution.reasonCode,
  })
}

function resultFromOutcome(outcome, assessorRoute) {
  return freezeTree({
    contractVersion: TASK_ASSESSOR_CONTRACT_V1.contractVersion,
    assessorVersion: TASK_ASSESSOR_VERSION,
    routePolicyVersion: TASK_ASSESSOR_ROUTE_POLICY_VERSION,
    handlingPolicyVersion: TASK_HANDLING_POLICY_VERSION,
    assessmentStatus: outcome.status,
    assessment: outcome.assessment,
    decision: mapTaskAssessment(outcome),
    assessorRoute,
  })
}

function timeoutOutcome() {
  return taskAssessorFallback('assessor-timeout')
}

async function collectOutput(llm, options, timeoutSignal, callerSignal) {
  let text = ''
  let finish
  let iterator
  let completed = false
  try {
    iterator = llm.stream(options)[Symbol.asyncIterator]()
    while (true) {
      const item = await nextWithAbort(iterator, options.signal)
      if (item.done) {
        completed = true
        break
      }
      const { value: chunk } = item
      const cancelled = callerCancellation(callerSignal)
      if (cancelled) throw cancelled
      if (timeoutSignal.aborted) return timeoutOutcome()

      if (chunk?.type === 'text-delta') {
        if (typeof chunk.text !== 'string') return taskAssessorFallback('assessor-provider-error')
        if (Buffer.byteLength(text, 'utf8') + Buffer.byteLength(chunk.text, 'utf8')
          > TASK_ASSESSOR_CONTRACT_V1.output.maxBytes) {
          return taskAssessorFallback('assessor-output-too-large')
        }
        text += chunk.text
      } else if (chunk?.type === 'tool-call-delta') {
        return taskAssessorFallback('assessor-provider-error')
      } else if (chunk?.type === 'finish') {
        finish = chunk.reason
      }
    }
  } catch (error) {
    const cancelled = callerCancellation(callerSignal)
    if (cancelled) throw cancelled
    if (timeoutSignal.aborted || error?.name === 'TimeoutError') return timeoutOutcome()
    return taskAssessorFallback('assessor-provider-error')
  } finally {
    if (!completed && iterator?.return !== undefined) {
      try {
        Promise.resolve(iterator.return()).catch(() => {})
      } catch {
        // The call outcome above remains authoritative; cleanup cannot rewrite it.
      }
    }
  }

  const cancelled = callerCancellation(callerSignal)
  if (cancelled) throw cancelled
  if (timeoutSignal.aborted) return timeoutOutcome()
  if (finish?.kind !== 'stop') return taskAssessorFallback('assessor-provider-error')
  return evaluateTaskAssessorResult({ kind: 'output', text })
}

function nextWithAbort(iterator, signal) {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const aborted = () => {
      cleanup()
      reject(signal.reason instanceof Error ? signal.reason : new Error('Task Assessor aborted'))
    }
    const cleanup = () => signal.removeEventListener('abort', aborted)
    signal.addEventListener('abort', aborted, { once: true })
    if (signal.aborted) {
      aborted()
      return
    }
    Promise.resolve()
      .then(() => iterator.next())
      .then(
        item => {
          cleanup()
          resolve(item)
        },
        error => {
          cleanup()
          reject(error)
        },
      )
  })
}

/** Execute exactly one frozen, tool-free Task Assessor call and map its result. */
export async function runTaskAssessor({
  llm,
  catalog,
  currentMessage,
  previousMessages = [],
  attachments = [],
  signal,
  timeoutSignal: earlierTimeoutSignal,
} = {}) {
  if (llm === null || typeof llm !== 'object' || typeof llm.stream !== 'function') {
    invalid('runTaskAssessor requires an llm service with stream(options)')
  }
  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    invalid('runTaskAssessor signal must be an AbortSignal')
  }
  if (earlierTimeoutSignal !== undefined && !(earlierTimeoutSignal instanceof AbortSignal)) {
    invalid('runTaskAssessor timeoutSignal must be an AbortSignal')
  }
  const cancelled = callerCancellation(signal)
  if (cancelled) throw cancelled

  const resolution = resolveTaskAssessorRoute(catalog)
  if (resolution.status !== 'resolved') return resultFromOutcome(resolution.fallback, null)
  if (!isTaskAssessorRouteCompatible(resolution.route)) {
    return resultFromOutcome(taskAssessorFallback('assessor-route-unavailable'), null)
  }

  let input
  try {
    input = buildTaskAssessorInput({ currentMessage, previousMessages, attachments })
  } catch (error) {
    if (error?.code === 'assessor-input-too-large') {
      return resultFromOutcome(taskAssessorFallback(error.code), routeAudit(resolution))
    }
    throw error
  }

  // Node 22 supplies timeout signals and first-reason-preserving composition.
  // Source: https://nodejs.org/download/release/v22.15.0/docs/api/globals.html#static-method-abortsignaltimeoutdelay
  // Source: https://nodejs.org/download/release/v22.15.0/docs/api/globals.html#static-method-abortsignalanysignals
  const contractTimeoutSignal = AbortSignal.timeout(TASK_ASSESSOR_CONTRACT_V1.request.timeoutMs)
  const timeoutSignal = earlierTimeoutSignal === undefined
    ? contractTimeoutSignal
    : AbortSignal.any([contractTimeoutSignal, earlierTimeoutSignal])
  const callSignal = signal === undefined
    ? timeoutSignal
    : AbortSignal.any([signal, timeoutSignal])
  if (timeoutSignal.aborted) {
    return resultFromOutcome(timeoutOutcome(), routeAudit(resolution))
  }

  const config = resolution.route.effectiveConfig
  const options = freezeTree({
    provider: resolution.route.provider,
    model: resolution.route.model,
    ...(config.reasoningEffort === undefined ? {} : { reasoningEffort: config.reasoningEffort }),
    messages: [{
      // Source: https://nodejs.org/download/release/v22.16.0/docs/api/crypto.html#cryptorandomuuidoptions
      id: randomUUID(),
      role: 'user',
      content: [{
        type: 'text',
        text: `Classify the task represented by this JSON value:\n${JSON.stringify(input)}`,
      }],
      source: { kind: 'plugin', plugin: 'dsh-auto-mode' },
    }],
    system: TASK_ASSESSOR_CONTRACT_V1.prompt.system,
    tools: [],
    temperature: TASK_ASSESSOR_CONTRACT_V1.request.temperature,
    maxTokens: TASK_ASSESSOR_CONTRACT_V1.request.maxTokens,
    signal: callSignal,
  })
  const outcome = await collectOutput(llm, options, timeoutSignal, signal)
  return resultFromOutcome(outcome, routeAudit(resolution))
}
