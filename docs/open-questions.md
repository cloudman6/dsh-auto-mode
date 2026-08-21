# Open questions

[简体中文](zh-CN/open-questions.md)

## Phase 1: AA catalog

1. Which exact AA capability score or published rank defines the three initial band boundaries, and should boundaries use absolute score ranges or distance from the current leader?
2. Which AA price field is the canonical within-band comparator, and what explicit rule applies when that field is missing?
3. Which AA latency field breaks price ties?
4. Which initial reviewed bindings map the current DSH Host route identities to stable AA record IDs, and what match basis and limitation does each binding declare?
5. Which DSH routes expose an unspecified/default effort or another opaque execution option, and can the Host materialize it reliably enough to produce a stable route identity?
6. Which mixed-provider fixtures prove that routes with zero, one, and several execution controls cannot collide?

## Phase 2: Semantic assessor

1. Which fixed provider/model/effort runs the assessor without entering Auto recursion?
2. What bounded task context is necessary without exposing excessive prompt, code, or tool history?
3. What schema, timeout, and confidence threshold trigger `deep` fallback?
4. Which fixture prompts cover coding, debugging, research, writing, architecture, security, and ambiguous tasks?
5. Which attributes independently force `deep`, and which combinations distinguish `light` from `standard`?

## Phase 3: Auto beta

1. What constitutes a new task boundary for reassessment: every user message, a Session objective, or another Host-owned event?
2. Is the configured deep fallback global, project-local, or Session-local?
3. Which explanation details are shown by default and which remain behind inspection?
4. What user-visible wording distinguishes an AA-matched route from a configured fallback?
5. Which fork commit and plugin version define the first beta support matrix?

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

1. Is the long-term carrier the maintained DSH fork, an upstream extension, or a split package?
2. Which minimized dogfood signals may be collected with consent, and for how long?
3. How are community AA evidence bindings and policy profiles reviewed, versioned, and rolled back?
4. Which Codex and Claude Code APIs expose model and effort control strongly enough for adapters?
