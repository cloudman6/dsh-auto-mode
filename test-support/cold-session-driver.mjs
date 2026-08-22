#!/usr/bin/env node

import { createRequire } from 'node:module'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const [configPath, sessionId] = process.argv.slice(2)
const dshRoot = process.env.DSH_FORK_ROOT
if (typeof configPath !== 'string' || configPath === ''
  || typeof sessionId !== 'string' || sessionId === ''
  || typeof dshRoot !== 'string' || dshRoot === '') {
  throw new Error('cold-session-driver requires <config-path>, <session-id>, and DSH_FORK_ROOT')
}

const dshRequire = createRequire(join(dshRoot, 'package.json'))
const bootModuleUrl = pathToFileURL(dshRequire.resolve('@deepseek-ai/dsh-app-boot')).href
const { boot, installFailLoud, loadEnv, resolveConfigPath } = await import(bootModuleUrl)

const uninstallFailLoud = installFailLoud('dsh-auto-mode-cold-session-driver')
let ctx
try {
  loadEnv('dsh-auto-mode-cold-session-driver')
  ctx = await boot(
    'dsh-auto-mode-cold-session-driver',
    resolveConfigPath(configPath, undefined),
  )
  const handle = await ctx.agents.resume({ resumeSessionId: sessionId })
  const projection = ctx.sessionProjections.snapshot(handle.agent.session).values.dshAutoMode
  process.stdout.write(`${JSON.stringify({
    type: 'cold_projection',
    sessionId: handle.agent.session.id,
    projection,
  })}\n`)
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
} finally {
  await ctx?.fiber.dispose()
  uninstallFailLoud()
}
