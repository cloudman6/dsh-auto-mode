import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { spawn } from 'node:child_process'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dshRoot = process.env.DSH_FORK_ROOT
const runIntegration = typeof dshRoot === 'string' && dshRoot !== ''

function quoteYaml(value) {
  return `'${value.replaceAll("'", "''")}'`
}

function seed() {
  return {
    schemaVersion: 1,
    source: {
      name: 'Artificial Analysis',
      capturedAt: '2026-08-17T00:00:00.000Z',
      url: 'https://artificialanalysis.ai/models',
    },
    routes: {
      fast: {
        selection: { provider: 'cli-mock', model: 'cli-fast', reasoningEffort: 'off' },
        aa: { recordId: 'fixture-fast', label: 'Fixture fast' },
      },
      standard: {
        selection: { provider: 'cli-mock', model: 'cli-standard', reasoningEffort: 'high' },
        aa: { recordId: 'fixture-standard', label: 'Fixture standard' },
      },
      strong: {
        selection: { provider: 'cli-mock', model: 'cli-strong', reasoningEffort: 'high' },
        aa: { recordId: 'fixture-strong', label: 'Fixture strong' },
      },
    },
    fallback: { provider: 'cli-mock', model: 'cli-strong', reasoningEffort: 'high' },
  }
}

async function run(task, mode) {
  const root = await mkdtemp(join(process.env.TMPDIR ?? tmpdir(), 'codex-dsh-auto-loader.'))
  const seedPath = join(root, 'seed.json')
  const configPath = join(root, 'cordis.yml')
  const pluginPath = join(projectRoot, 'src/plugin.mjs')
  const mockPath = join(dshRoot, 'examples/headless-agent/tests/fixtures/cli-mock-llm.ts')
  const basePath = join(dshRoot, 'examples/headless-agent/cordis.yml')
  const driverPath = join(dshRoot, 'examples/headless-agent/tests/fixtures/headless-driver.ts')
  await writeFile(seedPath, `${JSON.stringify(seed(), null, 2)}\n`)
  await writeFile(configPath, `
- id: cli-mock-llm
  name: ${quoteYaml(mockPath)}

- id: base
  name: '@deepseek-ai/cordis-plugin-include'
  config:
    path: ${quoteYaml(basePath)}
    patches:
      - id: llm-deepseek
        disabled: true
      - id: agent-spine
        config:
          agents:
            - id: main
              provider: cli-mock
              model: cli-manual
              cwd: ${quoteYaml(root)}
          workspaceContext: false
          dshHome: ${quoteYaml(join(root, '.dsh-home'))}
          skills:
            enabled: false
          persona: 'DSH Auto Mode Loader fixture.'
      - id: persistence
        config:
          root: ${quoteYaml(join(root, '.sessions'))}

- id: auto-mode
  name: ${quoteYaml(pluginPath)}
  config:
    mode: ${mode}
    seedPath: ${quoteYaml(seedPath)}
`)

  const child = spawn('pnpm', ['exec', 'tsx', driverPath, configPath, task], {
    cwd: dshRoot,
    env: {
      ...process.env,
      DSH_HOME: join(root, '.dsh'),
      DSH_AGENTS_HOME: join(root, '.agents'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let stdout = ''
  let stderr = ''
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', chunk => { stdout += chunk })
  child.stderr.on('data', chunk => { stderr += chunk })
  const exitCode = await new Promise((resolveExit, reject) => {
    child.once('error', reject)
    child.once('close', resolveExit)
  })
  assert.equal(exitCode, 0, stderr || stdout)
  return stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
}

function sessionEvents(records) {
  return records.filter(record => record.type === 'session_event').map(record => record.event)
}

function assertSelectionsMatchEffectiveHeaders(events) {
  let effectiveHeader
  let currentSelection
  for (const event of events) {
    if (event.type === 'dsh-auto-mode/selection') currentSelection = event.data
    if (event.type === 'request/header') effectiveHeader = event.data.header.config
    if (event.type !== 'step/end' || currentSelection === undefined) continue
    assert.deepEqual(effectiveHeader, {
      provider: currentSelection.provider,
      model: currentSelection.model,
      reasoningEffort: currentSelection.reasoningEffort,
    })
  }
}

describe('pinned DSH Loader integration', { skip: !runIntegration }, () => {
  it('selects different exact model/effort pairs and persists what request/header sends', async () => {
    const fastEvents = sessionEvents(await run('Format this README typo.', 'auto'))
    const strongEvents = sessionEvents(await run('Review this authentication race condition.', 'auto'))
    const fastDecision = fastEvents.find(event => event.type === 'dsh-auto-mode/selection')
    const strongDecision = strongEvents.find(event => event.type === 'dsh-auto-mode/selection')
    const fastHeader = fastEvents.find(event => event.type === 'request/header')
    const strongHeader = strongEvents.find(event => event.type === 'request/header')
    const strongTurnSelections = strongEvents.filter(event => event.type === 'dsh-auto-mode/selection')

    assert.deepEqual(
      [fastDecision.data.provider, fastDecision.data.model, fastDecision.data.reasoningEffort],
      ['cli-mock', 'cli-fast', 'off'],
    )
    assert.deepEqual(
      [strongDecision.data.provider, strongDecision.data.model, strongDecision.data.reasoningEffort],
      ['cli-mock', 'cli-strong', 'high'],
    )
    assert.deepEqual(fastHeader.data.header.config, {
      provider: fastDecision.data.provider,
      model: fastDecision.data.model,
      reasoningEffort: fastDecision.data.reasoningEffort,
    })
    assert.deepEqual(strongHeader.data.header.config, {
      provider: strongDecision.data.provider,
      model: strongDecision.data.model,
      reasoningEffort: strongDecision.data.reasoningEffort,
    })
    assert.ok(
      fastEvents.findIndex(event => event.type === 'user/message')
        < fastEvents.findIndex(event => event.type === 'dsh-auto-mode/selection'),
      'the route selection must follow its user message',
    )
    assert.ok(
      fastEvents.findIndex(event => event.type === 'dsh-auto-mode/selection')
        < fastEvents.findIndex(event => event.type === 'request/header'),
      'the route selection must precede the effective request header',
    )
    assertSelectionsMatchEffectiveHeaders(fastEvents)
    assertSelectionsMatchEffectiveHeaders(strongEvents)
    assert.equal(
      strongTurnSelections.every(event => event.data.tier === 'strong'),
      true,
      'one task must not be silently reclassified from a later tool-result step',
    )
  })

  it('leaves the configured request untouched in Manual mode', async () => {
    const events = sessionEvents(await run('Format this README typo.', 'manual'))
    const decision = events.find(event => event.type === 'dsh-auto-mode/selection')
    const header = events.find(event => event.type === 'request/header')

    assert.equal(decision, undefined)
    assert.equal(header.data.header.config.provider, 'cli-mock')
    assert.equal(header.data.header.config.model, 'cli-manual')
  })
})
