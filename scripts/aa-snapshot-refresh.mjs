#!/usr/bin/env node

import { runAASnapshotCLI } from '../src/aa-snapshot-cli.mjs'

try {
  await runAASnapshotCLI({ argv: process.argv.slice(2) })
} catch (error) {
  const code = typeof error?.code === 'string' ? error.code : 'aa-refresh-failed'
  const message = typeof error?.message === 'string' ? error.message : 'AA snapshot refresh failed'
  console.error(`${code}: ${message}`)
  process.exitCode = 1
}
