# Open questions

[简体中文](zh-CN/open-questions.md)

## Phase 4: AA refresh

1. What stable acquisition method, terms, attribution, and retention boundary apply to maintained snapshots?
2. Can a minimized derived catalog be distributed, or must each installation acquire its own local snapshot?
3. What freshness period is useful without forcing a live runtime dependency?
4. How does a maintainer review model additions, removals, renamed versions, and band changes before publishing a snapshot?

## Adaptive execution and recovery

1. Which formal runtime signals justify `light → standard → deep` escalation?
2. What task or phase boundary permits reassessment without reclassifying every tool step?
3. Under what evidence, if any, should down-routing enter scope?
4. Which effect classes support Continue, Salvage, or Restart without overwriting user or other-agent work?

## Product and ecosystem

1. Is the configured deep fallback global, project-local, or Session-local?
2. Is the long-term carrier the maintained DSH fork, an upstream extension, or a split package?
3. Which minimized dogfood signals may be collected with consent, and for how long?
4. How are community AA evidence bindings and policy profiles reviewed, versioned, and rolled back?
5. Which Codex and Claude Code APIs expose model and effort control strongly enough for adapters?
