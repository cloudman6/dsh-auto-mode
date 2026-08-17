import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { chooseRoute, compileSeed } from './policy.mjs'

export const name = 'dsh-auto-mode'
export const inject = ['sessions']

const SELECTION_EVENT = 'dsh-auto-mode/selection'

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

function parseSelectionEvent(value) {
  if (!isRecord(value)
    || value.schemaVersion !== 1
    || value.mode !== 'auto'
    || value.evidenceStatus !== 'experimental-unadmitted'
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

/** Install the Phase 0P fast prototype on existing A1/A2 Host seams. */
export function apply(ctx, config = {}) {
  const mode = config.mode ?? 'manual'
  if (mode !== 'auto' && mode !== 'manual') {
    throw new TypeError('dsh-auto-mode: mode must be auto or manual')
  }
  if (mode === 'manual') return

  const catalog = compileSeed(loadSeed(config))
  const stateByAgent = new WeakMap()

  ctx.sessions.registerEventNamespace({
    namespace: 'dsh-auto-mode',
    owner: 'dsh-auto-mode',
    version: 1,
    events: {
      [SELECTION_EVENT]: { parse: parseSelectionEvent },
    },
  })

  ctx.on('agent/prepare-step', async (payload, next) => {
    const entered = await next()
    if (entered?.kind !== 'enter') return entered
    const state = stateByAgent.get(payload.agent) ?? {}
    const decision = state.turn === payload.turn && state.current !== undefined
      ? state.current
      : chooseRoute(taskText(payload.messages), catalog)
    state.turn = payload.turn
    state.current = decision
    stateByAgent.set(payload.agent, state)

    payload.agent.session.append(SELECTION_EVENT, {
      schemaVersion: 1,
      mode: 'auto',
      evidenceStatus: 'experimental-unadmitted',
      turn: payload.turn,
      step: payload.step,
      tier: decision.tier,
      provider: decision.selection.provider,
      model: decision.selection.model,
      reasoningEffort: decision.selection.reasoningEffort,
      reasonCode: decision.reasonCode,
      reason: decision.reason,
      ...decision.aaRecordId === undefined ? {} : { aaRecordId: decision.aaRecordId },
    })
    return entered
  })

  ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
    const selectedState = isRecord(context) && isRecord(context.agent)
      ? stateByAgent.get(context.agent)
      : undefined
    const selected = selectedState?.current
    const assembled = await next()
    if (selectedState !== undefined) selectedState.assembled = selected
    if (selected === undefined) return assembled
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
    const selected = stateByAgent.get(payload.agent)?.assembled
    if (selected === undefined) return resolved
    const { reasoningEffort: _inheritedEffort, ...withoutInheritedEffort } = resolved
    return {
      ...withoutInheritedEffort,
      provider: selected.selection.provider,
      model: selected.selection.model,
      reasoningEffort: selected.selection.reasoningEffort,
    }
  }, { prepend: true })
}
