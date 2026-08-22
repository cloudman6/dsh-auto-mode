import assert from 'node:assert/strict'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import { spawn } from 'node:child_process'

import { createHostRouteIdentity } from '../src/aa-evidence-binding.mjs'
import {
  AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
  buildAAEvidencePack,
} from '../src/aa-evidence-pack.mjs'
import { AA_ROUTE_POLICY_V1 } from '../src/aa-route-policy.mjs'
import { createEvidenceRouteKey } from '../src/evidence-route-key.mjs'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dshRoot = process.env.DSH_FORK_ROOT
const runIntegration = typeof dshRoot === 'string' && dshRoot !== ''

function quoteYaml(value) {
  return `'${value.replaceAll("'", "''")}'`
}

const LIGHT_ROUTE = { provider: 'cli-mock', model: 'cli-light', reasoningEffort: 'off' }
const STANDARD_ROUTE = { provider: 'cli-mock', model: 'cli-standard', reasoningEffort: 'high' }
const DEEP_ROUTE = { provider: 'cli-mock', model: 'cli-deep', reasoningEffort: 'high' }
const FALLBACK_ROUTE = { provider: 'cli-mock', model: 'cli-fallback', reasoningEffort: 'high' }

function catalogRoute(effectiveConfig, score) {
  const identity = createHostRouteIdentity(effectiveConfig)
  return {
    identity,
    record: {
      recordId: `aa-${effectiveConfig.model}`,
      label: effectiveConfig.model,
      capabilityFacts: ['pinned Loader fixture'],
      evaluations: { artificial_analysis_intelligence_index: score },
      pricing: { price_1m_blended_7_to_2_to_1: score / 100 },
      performance: { median_time_to_first_answer_token_seconds: 1 },
    },
  }
}

function seed() {
  const routes = [
    catalogRoute(LIGHT_ROUTE, 30),
    catalogRoute(STANDARD_ROUTE, 40),
    catalogRoute(DEEP_ROUTE, 55),
  ]
  return {
    schemaVersion: 1,
    catalogVersion: 'aa-evidence-catalog/v1',
    bindingVersion: 'aa-evidence-binding/v1',
    snapshot: {
      snapshotId: 'aa-pinned-loader-fixture',
      records: routes.map(route => route.record),
    },
    bindings: routes.map(route => ({
      bindingVersion: 'aa-evidence-binding/v1',
      hostRouteId: route.identity.routeId,
      effectiveConfigFingerprint: route.identity.effectiveConfigFingerprint,
      aaSnapshotId: 'aa-pinned-loader-fixture',
      aaRecordId: route.record.recordId,
      matchBasis: ['pinned Loader fixture'],
      limitations: [],
    })),
  }
}

function evidencePack() {
  const routes = [
    catalogRoute(LIGHT_ROUTE, 30),
    catalogRoute(STANDARD_ROUTE, 40),
    catalogRoute(DEEP_ROUTE, 55),
  ]
  const rule = {
    schemaVersion: 1,
    ruleVersion: 'cli-mock/v1',
    providerNamespace: 'cli-mock',
    providerIds: ['cli-mock'],
    modelAliases: Object.fromEntries(routes.map(route => [route.identity.model, route.identity.model])),
    evidenceControls: [{ key: 'effort', source: 'reasoningEffort', required: false }],
  }
  const rights = { mode: 'internal-only' }
  return buildAAEvidencePack({
    packId: 'pinned-loader-pack',
    snapshot: {
      schemaVersion: 1,
      snapshotVersion: 'aa-snapshot/v2',
      snapshotId: 'aa-pinned-loader-pack-fixture',
      capturedAt: '2026-08-22T10:00:00.000Z',
      source: {
        methodologyVersion: 'v4.1.1',
        terms: { version: '1.1', revisedAt: '2026-08-19', url: 'https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf' },
        attribution: 'Source: Artificial Analysis (artificialanalysis.ai)',
      },
      rights,
      records: routes.map(route => route.record).sort((left, right) => left.recordId.localeCompare(right.recordId)),
    },
    bindingRegistry: {
      schemaVersion: 1,
      registryVersion: 'aa-binding-registry/v1',
      normalizationRules: [rule],
      bindings: routes.map(route => ({
        evidenceRouteKey: createEvidenceRouteKey({
          provider: route.identity.provider,
          model: route.identity.model,
          reasoningEffort: route.identity.model === LIGHT_ROUTE.model
            ? LIGHT_ROUTE.reasoningEffort
            : route.identity.model === STANDARD_ROUTE.model
              ? STANDARD_ROUTE.reasoningEffort
              : DEEP_ROUTE.reasoningEffort,
        }, rule),
        aaRecordId: route.record.recordId,
        ruleVersion: rule.ruleVersion,
        matchBasis: ['pinned Loader fixture'],
        limitations: [],
        quarantine: null,
      })),
    },
    routePolicy: AA_ROUTE_POLICY_V1,
    runtimeCompatibility: {
      contract: AA_EVIDENCE_PACK_RUNTIME_CONTRACT,
      minimumVersion: 1,
      maximumVersion: 1,
    },
    rights,
  })
}

async function runScenario(task, mode, {
  hostRoutes = [LIGHT_ROUTE, STANDARD_ROUTE, DEEP_ROUTE],
  deepFallback = DEEP_ROUTE,
  root: existingRoot,
  resumeSessionId,
  coldProjectionOnly = false,
  useEvidencePack = false,
} = {}) {
  if (typeof process.env.TMPDIR !== 'string' || process.env.TMPDIR === '') {
    throw new Error('pinned Loader integration requires TMPDIR')
  }
  const root = existingRoot ?? await mkdtemp(join(process.env.TMPDIR, 'codex-dsh-auto-loader.'))
  const seedPath = join(root, useEvidencePack ? 'evidence-pack.json' : 'seed.json')
  const configPath = join(root, 'cordis.yml')
  const pluginPath = join(projectRoot, 'src/plugin.mjs')
  const assessorFixturePath = join(projectRoot, 'test-support/task-assessor-llm.mjs')
  const mockPath = join(dshRoot, 'examples/headless-agent/tests/fixtures/cli-mock-llm.ts')
  const basePath = join(dshRoot, 'examples/headless-agent/cordis.yml')
  const driverPath = coldProjectionOnly
    ? join(projectRoot, 'test-support/cold-session-driver.mjs')
    : join(dshRoot, 'examples/headless-agent/tests/fixtures/headless-driver.ts')
  const autoConfig = indent => `${indent}mode: ${mode}
${indent}${useEvidencePack ? 'evidencePackPath' : 'seedPath'}: ${quoteYaml(seedPath)}
${indent}hostRoutes: ${JSON.stringify(hostRoutes)}
${deepFallback === undefined ? '' : `${indent}deepFallback: ${JSON.stringify(deepFallback)}\n`}`
  const agentConfig = indent => `${indent}- id: main
${indent}  provider: cli-mock
${indent}  model: cli-manual
${resumeSessionId === undefined
    ? `${indent}  cwd: ${quoteYaml(root)}\n`
    : `${indent}  resumeSessionId: ${quoteYaml(resumeSessionId)}\n`}`
  await writeFile(seedPath, `${JSON.stringify(useEvidencePack ? evidencePack() : seed(), null, 2)}\n`)
  await writeFile(configPath, `
- id: cli-mock-llm
  name: ${quoteYaml(mockPath)}

- id: task-assessor-fixture
  name: ${quoteYaml(assessorFixturePath)}

- id: base
  name: '@deepseek-ai/cordis-plugin-include'
  config:
    path: ${quoteYaml(basePath)}
    patches:
      - id: llm-deepseek
        disabled: true
${resumeSessionId === undefined ? `
      - id: agent-spine
        config:
          agents:
${agentConfig('            ')}
          workspaceContext: false
          dshHome: ${quoteYaml(join(root, '.dsh-home'))}
          skills:
            enabled: false
          persona: 'DSH Auto Mode Loader fixture.'
` : `
      - id: agent-spine
        config:
          agents: []
          workspaceContext: false
          dshHome: ${quoteYaml(join(root, '.dsh-home'))}
          skills:
            enabled: false
          persona: 'DSH Auto Mode Loader fixture.'
`}
      - id: persistence
        config:
          root: ${quoteYaml(join(root, '.sessions'))}
${resumeSessionId === undefined ? '' : `
      - insert:
          - id: auto-mode
            name: ${quoteYaml(pluginPath)}
            config:
${autoConfig('              ')}
${coldProjectionOnly ? '' : `
          - id: resumed-agent-spine
            name: '@deepseek-ai/dsh-agent-spine-demo'
            config:
              agents:
${agentConfig('                ')}
              workspaceContext: false
              dshHome: ${quoteYaml(join(root, '.dsh-home'))}
              skills:
                enabled: false
              persona: 'DSH Auto Mode Loader fixture.'
`}`}

${resumeSessionId === undefined ? `
- id: auto-mode
  name: ${quoteYaml(pluginPath)}
  config:
${autoConfig('    ')}
` : ''}
`)

  const child = spawn('pnpm', [
    'exec',
    'tsx',
    driverPath,
    configPath,
    coldProjectionOnly ? resumeSessionId : task,
  ], {
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
  assert.equal(exitCode, 0, [stderr, stdout].filter(Boolean).join('\n'))
  return {
    root,
    records: stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line)),
  }
}

async function run(task, mode, options) {
  return (await runScenario(task, mode, options)).records
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
  it('loads the reusable Evidence Pack through Loader and persists both identities', async () => {
    const events = sessionEvents(await run('[standard] Change two files.', 'auto', {
      useEvidencePack: true,
    }))
    const decision = events.find(event => event.type === 'dsh-auto-mode/selection')

    assert.equal(decision.data.handlingLevel, 'standard')
    assert.equal(decision.data.evidencePackId, 'pinned-loader-pack')
    assert.match(decision.data.evidenceRouteKeyId, /^evidence-route-key:v1:/)
    assert.match(decision.data.effectiveConfigFingerprint, /^sha256:/)
    assertSelectionsMatchEffectiveHeaders(events)
  })

  it('covers Light, Standard, and Deep with persisted request/header equality', async () => {
    const fixtures = [
      ['[light] Format one line.', 'light', LIGHT_ROUTE],
      ['[standard] Change two files.', 'standard', STANDARD_ROUTE],
      ['[deep] Design an architecture.', 'deep', DEEP_ROUTE],
    ]

    for (const [task, level, expectedRoute] of fixtures) {
      const events = sessionEvents(await run(task, 'auto'))
      const decision = events.find(event => event.type === 'dsh-auto-mode/selection')
      const header = events.find(event => event.type === 'request/header')
      const turnSelections = events.filter(event => event.type === 'dsh-auto-mode/selection')

      assert.equal(decision.data.handlingLevel, level)
      assert.deepEqual(
        [decision.data.provider, decision.data.model, decision.data.reasoningEffort],
        [expectedRoute.provider, expectedRoute.model, expectedRoute.reasoningEffort],
      )
      assert.deepEqual(header.data.header.config, expectedRoute)
      assert.ok(
        events.findIndex(event => event.type === 'user/message')
          < events.findIndex(event => event.type === 'dsh-auto-mode/selection'),
        'the route selection must follow its user message',
      )
      assert.ok(
        events.findIndex(event => event.type === 'dsh-auto-mode/selection')
          < events.findIndex(event => event.type === 'request/header'),
        'the route selection must precede the effective request header',
      )
      assertSelectionsMatchEffectiveHeaders(events)
      assert.equal(
        turnSelections.every(event => event.data.decisionId === decision.data.decisionId),
        true,
        'one task must reuse one frozen decision across later tool-result steps',
      )
    }
  })

  it('escalates from Light to the first Host-valid higher level', async () => {
    const events = sessionEvents(await run('[light] Format one line.', 'auto', {
      hostRoutes: [STANDARD_ROUTE, DEEP_ROUTE],
      deepFallback: DEEP_ROUTE,
    }))
    const decision = events.find(event => event.type === 'dsh-auto-mode/selection')

    assert.equal(decision.data.requestedHandlingLevel, 'light')
    assert.equal(decision.data.handlingLevel, 'standard')
    assert.equal(decision.data.model, STANDARD_ROUTE.model)
    assert.ok(decision.data.reasonCodes.includes('auto-route-level-escalated'))
    assertSelectionsMatchEffectiveHeaders(events)
  })

  it('uses an unmatched configured Deep fallback without attaching AA evidence', async () => {
    const events = sessionEvents(await run('[deep] Design an architecture.', 'auto', {
      hostRoutes: [LIGHT_ROUTE, FALLBACK_ROUTE],
      deepFallback: FALLBACK_ROUTE,
    }))
    const decision = events.find(event => event.type === 'dsh-auto-mode/selection')

    assert.equal(decision.data.routeBasis, 'configured-deep-fallback')
    assert.equal(decision.data.model, FALLBACK_ROUTE.model)
    assert.equal(decision.data.aaSnapshotId, undefined)
    assert.equal(decision.data.aaRecordId, undefined)
    assertSelectionsMatchEffectiveHeaders(events)
  })

  it('cold-loads the required event and reconstructs the same effective route and explanation', async () => {
    const first = await runScenario('[standard] Change two files.', 'auto')
    const firstEvents = sessionEvents(first.records)
    const firstDecision = firstEvents.find(event => event.type === 'dsh-auto-mode/selection')
    const sessionId = first.records.find(record => record.type === 'result').sessionId

    const resumed = await runScenario('[deep] Continue with architecture.', 'auto', {
      root: first.root,
      resumeSessionId: sessionId,
      coldProjectionOnly: true,
    })
    const cold = resumed.records.find(record => record.type === 'cold_projection')

    assert.equal(cold.sessionId, sessionId)
    assert.equal(cold.projection.decision.provider, firstDecision.data.provider)
    assert.equal(cold.projection.decision.model, firstDecision.data.model)
    assert.equal(cold.projection.decision.reasoningEffort, firstDecision.data.reasoningEffort)
    assert.equal(cold.projection.decision.routeId, firstDecision.data.routeId)
    assert.equal(cold.projection.decision.reason, firstDecision.data.reason)
  })

  it('persists an explicit resolution failure and sends no request when no fallback is valid', async () => {
    const events = sessionEvents(await run('[deep] Design an architecture.', 'auto', {
      hostRoutes: [LIGHT_ROUTE],
      deepFallback: undefined,
    }))
    const failure = events.find(event => event.type === 'dsh-auto-mode/resolution-failure')

    assert.equal(failure.data.reasonCode, 'auto-route-unavailable')
    assert.equal(events.some(event => event.type === 'dsh-auto-mode/selection'), false)
    assert.equal(events.some(event => event.type === 'request/header'), false)
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
