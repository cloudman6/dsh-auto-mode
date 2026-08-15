# Official DeepSeek Harness review sources

Use this file as a routing map. Read the source documents themselves at review time; this file does not duplicate their rules.

## Resolve source identity

1. Read `docs/dsh-integration.md` in DSH Auto Mode and record the audited official revision, the tested fork revision, and the claimed compatibility scope.
2. Prefer a local DeepSeek Harness checkout only after verifying its remote and commit. Otherwise read the exact files from `https://github.com/deepseek-ai/deepseek-harness/blob/<revision>/`.
3. Review runtime compatibility against the declared tested revision. Check the current official default branch separately for changed contribution or engineering rules. Never substitute moving `master` for the pinned compatibility target without an accepted project decision.

## Required for every DSH-facing code boundary

- `AGENTS.md`: repository conventions, commands, evidence selection, public types, plugin/event rules, and prose requirements.
- `packages/AGENTS.md`: package exports, capability ownership, lifecycle, invariant, README, and real-composition requirements.
- `.agents/skills/dsh-code-review/SKILL.md`: official semantic review workflow and finding format.
- `docs/testing.md`: unit, coverage, real-API, snapshot, browser, real-entry, and negative-control requirements.
- `docs/AGENTS.md`: documentation placement, one-home-per-fact, current-state prose, and bilingual maintenance.

## Load when the surface requires it

| Changed surface | Additional official source |
|---|---|
| Async lifecycle, callbacks, subprocesses, teardown, temporary files | `docs/defensive-patterns.md` |
| Non-trivial architectural or process decision | `.agents/notes/README.md` and the relevant active Agent Note |
| Public Core type, event, Service, or capability seam | Relevant `docs/subsystems/*.md`, package README, JSDoc, and `scripts/type-equiv.manifest.json` |
| Model-, protocol-, or user-visible output | Owning snapshot example and `docs/testing.md#when-a-snapshot-test-is-required` |
| Documentation or visible prose | `.agents/skills/dsh-prose-standard/SKILL.md` |
| Bilingual DSH documentation | `docs/i18n/translation-rules.md` and `docs/i18n/terminology.md` |
| Session events or persistence | Session and persistence subsystem docs plus the active Session-format Agent Notes |
| Cordis waterfall, scope, Loader, or service behavior | `docs/cordis-primer.md` and the owning package contract |

## DSH Auto Mode authority layered above DSH

Official DSH rules establish valid Host/plugin mechanics. They do not decide Auto Mode product policy. Also read the accepted Auto Mode specification and ADRs for:

- Host routing authority and parent-agent limits;
- absolute baseline and non-inferiority admission;
- route snapshot timing and fail-closed resolution;
- Recovery Capability limits;
- RouterBench evidence isolation;
- public Auto/manual interaction and explanation requirements.

When official DSH mechanics and accepted Auto Mode policy appear incompatible, return `BLOCKED` and identify the exact conflict. Do not weaken either contract locally.
