#!/usr/bin/env node

import { runAAEvidencePackCLI } from '../src/aa-evidence-pack-cli.mjs'

try {
  runAAEvidencePackCLI({ argv: process.argv.slice(2) })
} catch (error) {
  const code = typeof error?.code === 'string' ? error.code : 'aa-evidence-pack-failed'
  const message = typeof error?.message === 'string' ? error.message : 'Evidence Pack operation failed'
  console.error(`${code}: ${message}`)
  process.exitCode = 1
}
