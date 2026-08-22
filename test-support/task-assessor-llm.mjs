function classifierOutput(task) {
  if (task.includes('[light]')) {
    return {
      taskKind: 'coding',
      scope: 'bounded',
      complexity: 'low',
      risk: 'low',
      verifiability: 'mechanical',
      confidence: 1,
      reasons: ['explicit-single-step', 'mechanically-checkable'],
    }
  }
  if (task.includes('[standard]')) {
    return {
      taskKind: 'coding',
      scope: 'normal',
      complexity: 'medium',
      risk: 'low',
      verifiability: 'partial',
      confidence: 1,
      reasons: ['multiple-dependent-steps', 'partially-checkable'],
    }
  }
  return {
    taskKind: 'architecture',
    scope: 'broad',
    complexity: 'high',
    risk: 'medium',
    verifiability: 'partial',
    confidence: 1,
    reasons: ['open-ended-scope', 'partially-checkable'],
  }
}

function assessmentInput(options) {
  const message = options.messages?.find(candidate => candidate?.source?.plugin === 'dsh-auto-mode')
  const text = message?.content?.find(block => block?.type === 'text')?.text
  if (typeof text !== 'string') return undefined
  const separator = text.indexOf('\n')
  if (separator < 0) return undefined
  try {
    return JSON.parse(text.slice(separator + 1))
  } catch {
    return undefined
  }
}

function fixtureStream(output) {
  return (async function* () {
    yield { type: 'text-delta', index: 0, text: JSON.stringify(output) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  })()
}

export const name = 'dsh-auto-mode-task-assessor-fixture'
export const inject = ['llm']

export function apply(ctx) {
  ctx.on('llm/stream', (options, next) => {
    const input = assessmentInput(options)
    return input === undefined ? next() : fixtureStream(classifierOutput(input.currentMessage))
  })
}
