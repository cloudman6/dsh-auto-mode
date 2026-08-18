# Phase 0P fast prototype

[简体中文](zh-CN/phase-0p-fast-prototype.md)

## Status

Implemented, verified, and accepted as the Phase 0P MVP by the maintainer on 2026-08-18 against the maintainer DSH fork at `2a2db7a6ec3ce9969857cc41de839f911ef5902e`. Subsequent work proceeds incrementally through the roadmap.

This document records the completed MVP as implemented. Its `fast`/`standard`/`strong` names, keyword policy, and exact-deployment research are historical; ADR-010 defines the post-MVP `light`/`standard`/`deep`, semantic-assessor, version-family matching, and AA price-first direction.

This is a maintainer-only `experimental-unadmitted` prototype. It proves the Auto interaction and request-routing loop. It does not claim safety, quality improvement, RouterBench admission, immutable deployment identity, public support, or official DSH compatibility.

## Acceptance boundary

The prototype has exactly four acceptance criteria:

1. The user can select `auto`; omitted mode and `manual` leave routing untouched.
2. Different task text selects different complete provider/model/reasoning-effort configurations.
3. The persisted `dsh-auto-mode/selection` event matches the effective `request/header` configuration.
4. Manual mode does not add selection events or change the configured request.

Work that does not directly prove or preserve one of these criteria is deferred. Production evidence contracts, data-rights automation, signatures, credential binding, revocation ledgers, Session-egress controls, certificates, complex recovery, and admission remain outside this prototype.

## Runtime shape

The plugin is a dependency-free Cordis module at `src/plugin.mjs`. It uses the pinned Host's existing seams:

- The first `agent/prepare-step` of a turn classifies the current task and selects a complete local route; later tool-result steps in that turn reuse it.
- `system-prompt/assemble` snapshots that selection and exposes the selected provider/model to prompt variables.
- `agent/request` appends the frozen `dsh-auto-mode/selection` after the current `user/message` and before the effective `request/header`, then applies that same provider/model/reasoning effort.
- A2 `registerEventNamespace()` validates the required `dsh-auto-mode/selection` Session event.

The deterministic policy is deliberately small:

- security, concurrency, architecture, migration, incident, and data-loss signals → `strong`;
- formatting, typo, README, rename, locate/find, and summarization signals → `fast`;
- everything else → `standard`.

`strong` wins when signals overlap. A missing or invalid tier mapping uses the configured fixed strong fallback. Tier names are heuristics, not quality guarantees.

## Local AA seed

Copy `examples/aa-seed.example.json` to `local/aa-seed.json` and manually enter the currently observed Artificial Analysis records plus the exact DSH selections you choose to associate with them. `local/` is gitignored. The plugin neither fetches Artificial Analysis nor redistributes its data.

Each route contains one complete selection:

```json
{
  "provider": "deepseek-official",
  "model": "deepseek-v4-flash",
  "reasoningEffort": "off"
}
```

The prototype treats this association as a maintainer assertion. It does not prove that a revisionless DSH alias is the same deployment measured by Artificial Analysis.

## Loader configuration

Add the plugin to a Loader tree that already provides the DSH Session service:

```yaml
- id: auto-mode
  name: './path/to/dsh-auto-mode/src/plugin.mjs'
  config:
    mode: auto
    seedPath: './path/to/dsh-auto-mode/local/aa-seed.json'
```

Set `mode: manual` or omit `mode` to preserve the configured DSH request without loading the seed.

## Web interaction

The pinned fork exposes the prototype through the existing model-selection menu:

- `Auto` is the first item, above manual model and reasoning-effort controls. A check mark identifies the active mode.
- The trigger updates from the Session projection, and the Auto status card explicitly labels `Effective selection` as `model · effort` for the current task, even when the advisory model catalog does not contain that exact route.
- The initial effective selection does not animate. A later decision carries its preceding route in the Session projection, and the trigger plus effective-selection card roll only a changed model and/or effort value to the current value over 1.2 seconds; when both change, both tracks roll together. Auto and each changed target use DSH business blue, breathe twice, and then return to their regular color, including when only effort changes. The chat timeline records the before/after model and effort, tier, reason code, and explanation as a route fact immediately after the triggering user message and before the resulting assistant response. The switch text uses the same facts; reduced-motion preference keeps the final values and notice without movement.
- The menu shows the selected tier, reason code, short explanation, and an explicit `Experimental / unadmitted` label.
- Selecting a manual model or reasoning effort first turns Auto off, then applies the manual selection. Manual selection remains available when the Auto capability is absent.

`/auto` and `/auto off` provide the same mode transition for headless use. The UI is an experimental fork carrier, not an official DSH extension contract.

## Verification

Run the dependency-free unit suite:

```bash
npm test
```

Run the real Loader composition suite against the pinned fork:

```bash
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" npm test
```

The 12-test plugin and Loader suite proves Auto fast/strong divergence, `user/message → selection → request/header` event order, event/header equality, Session projection, command transitions, and Manual non-interference through the real DSH composition. The fork UI additionally passed 20 focused tests, 3,760 GUI tests with one unrelated skip, and a keyless assembled-Web golden snapshot. Browser dogfood verified that a bounded task changed the visible selection to `deepseek-v4-flash / off` before completion and that selecting `deepseek-v4-pro / high` disabled Auto. Two with-credential provider calls additionally completed on 2026-08-17:

| Task signal | Selection event | Request header | Provider result source |
|---|---|---|---|
| bounded formatting | `deepseek-official / deepseek-v4-flash / off` | same | `deepseek-official / deepseek-v4-flash` |
| authentication race condition | `deepseek-official / deepseek-v4-pro / max` | same | `deepseek-official / deepseek-v4-pro` |

These calls prove dispatch, not model quality or the correctness of the local AA association.
