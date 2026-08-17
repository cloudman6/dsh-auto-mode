import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { chooseRoute, compileSeed } from './policy.mjs'

export const name = 'dsh-auto-mode'
export const inject = ['sessions']

const SELECTION_EVENT = 'dsh-auto-mode/selection'
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
    || (value.decision !== null && !isRecord(value.decision))) {
    throw new TypeError('invalid dsh-auto-mode projection')
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
        if (event.type !== SELECTION_EVENT) return state
        const { aaRecordId: _aaRecordId, mode: _mode, evidenceStatus: _status, schemaVersion: _version, ...decision } = event.data
        return {
          active: true,
          evidenceStatus: EVIDENCE_STATUS,
          decision,
          previousDecision: state.decision,
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
    const decision = state.turn === payload.turn && state.current !== undefined
      ? state.current
      : chooseRoute(taskText(payload.messages), catalog)
    state.turn = payload.turn
    state.current = decision
    stateByAgent.set(payload.agent, state)

    payload.agent.session.append(SELECTION_EVENT, {
      schemaVersion: 1,
      mode: 'auto',
      evidenceStatus: EVIDENCE_STATUS,
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
      ? stateFor(context.agent)
      : undefined
    const selected = selectedState?.active ? selectedState.current : undefined
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
    const state = stateFor(payload.agent)
    const selected = state.active ? state.assembled : undefined
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
