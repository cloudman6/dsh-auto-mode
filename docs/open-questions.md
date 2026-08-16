# Open questions

[简体中文](zh-CN/open-questions.md)

## Must close before Phase 0P dogfood

1. Which exact DSH provider/model/reasoning selections match which Artificial Analysis configuration records, and what A3p fingerprint proves each mapping?
2. Which Artificial Analysis index families and fields drive the initial task taxonomy, and what versioned heuristic thresholds define experimental `fast`, `standard`, and `strong`?
3. What exact endpoint, prompt/index semantics, pagination coverage, local snapshot schema, canonical content digest, freshness rule, attribution, API access path, and data-rights boundary apply without redistributing ranking data?
4. Which high-risk and low-confidence assessments force the strongest exact match from a valid catalog, and which mapping, identity, evidence, contract, or Recovery Capability failures produce `no-experimental-route` before a call?
5. Which concrete A5p carrier exposes explicit Experimental Auto opt-in, Manual mode, and the persisted `experimental-unadmitted` explanation?
6. What ADR-007-compliant possible-loss bound, if any, is accepted in a separate decision for mutable Phase 0P routing? Until it exists, Experimental Auto does not execute mutable work; an irreversible external effect terminates the Auto attempt, and intervention may only switch to Manual or wait for a new execution world.

## Must close before Phase 0C preview planning

1. Which verified DSH gaps in [DSH integration and compatibility](dsh-integration.md) will be contributed upstream, and what exact minimum DSH version or commit will the plugin require?
2. Which provider/model/reasoning-selection deployments form the first admitted baseline and candidates, what stable identity evidence binds them, and who maintains their Policy Pack evidence?
3. What absolute baseline thresholds, `epsilon`, `delta`, confidence level, power, and high-risk fixed-tier rules are preregistered for each initial task slice?
4. Which repositories, fixtures, and sources can provide genuinely isolated calibration, validation, held-out, and time-shifted data?
5. Does Task Assessor need a model? If so, what fixed configuration, latency budget, schema, confidence threshold, and drift test apply?
6. Which fields may persisted decision and evidence events expose without storing sensitive prompts, code, or provider-private state?
7. Can the Phase 0P A5p carrier be promoted to the Phase 0C preview carrier, and what additional admission-aware probe is required?

## Must close before Phase B and production-release planning

1. Is the production carrier an external plugin, an upstream DSH core capability, or a split architecture? Host decision authority does not by itself answer the deployment-carrier question.
2. What general A3 deployment-identity contract replaces the provider-specific A3p preview evidence?
3. What general A5 client-extension contract replaces the concrete A5p preview carrier?
4. Which real-use evidence requires consent, minimization, retention, deletion, and cross-provider data-boundary controls?
5. Which Recovery Capability providers and side-effect classes, if any, enter the first production implementation plan?

## DSH upstream critical path

1. What is the smallest product-neutral pre-assembly step contract that exposes claimed messages and stable turn/step identity, supports cancellation and pre-call rejection, and carries one immutable context through assembly and `agent/request`?
2. How does required plugin Session-event registration establish namespace ownership, schema/version compatibility, cold-load registration order, missing-plugin diagnostics, and migration behavior?
3. Which executable core and plugin contract tests must pass before Session Static Auto may claim compatibility?
4. Can current provider adapters expose a stable resolved deployment identity or fingerprint, or is a common DSH model-identity contract required?
5. Is auxiliary-call `purpose` extensible enough to classify and audit fixed Task Assessor calls without changing DSH Core?
6. Which current client extension points can implement the Auto/manual control and decision explanations without a core UI change?
7. What upstream issue and PR boundaries keep A1 and A2 independently reviewable while proving their combined vertical contract?

## Routing and Policy Packs

1. How are deployment identity and provider/model fingerprints established when aliases or server-side revisions are opaque?
2. What makes a capability/risk constraint Host-recognized and user-authorized instead of an untrusted parent proposal?
3. How are Policy Packs signed, reviewed, expired, revoked, and rolled back after a severe failure cluster?
4. Phase 0C fixes one decision per Session. Before objective-scoped Static Auto is admitted later, what objective boundary and Host-owned events confirm that the objective changed?
5. Which explicit UI and automation behavior applies to `constraints-unsatisfiable`, `profile-invalid`, `provider-unavailable`, and `no-safe-route`?

## Within-turn routing

1. Does Within-turn Auto materially outperform Session Static Auto after prompt-cache loss, takeover context, classification latency, and phase uncertainty?
2. Which non-model signals confirm phase boundaries, and how does Execution Context Projector resolve conflicting or missing evidence?
3. How are remaining work and switching overhead estimated without turning the current model's self-report into authority?
4. What minimum hold time and hysteresis thresholds are supported by held-out Policy Scenario Bench results?
5. If the incremental evidence gate fails, should phase routing remain experimental or be removed from the product surface while the architecture stays documented?

## Recovery

1. Which tools can expose structured validation, mutation, provenance, and trust signals?
2. Which side-effect classes can declare `checkpoint`, `attribution`, `restore`, and `isolation` support, and how are those claims contract-tested?
3. How should failure fingerprints avoid merging distinct failures into one episode?
4. Which release policies are fully mechanical, and when is a fixed Recovery Assessor justified?
5. How does Continue injection avoid expanding context and reinforcing incorrect hypotheses?
6. What is the required user-intervention flow when mutation is unknown, recovery fails, or an external effect is irreversible?
7. How is the atomic relationship among Session lineage, Route Snapshot, attempt, checkpoint, and execution-world state persisted?

## Child agents

1. Should RoutingConstraints belong to general Agent creation options, Subagent requests, or an independent persistent capability?
2. Which parent-provided fields are hints, which are Host-recognized proposals, and which can become binding after validation?
3. Which semantic overrides may a user authorize without permitting raw provider/model bypass?
4. How is “different model family” defined and verified without claiming false evaluator independence?
5. When and at what granularity can external Codex or Claude Code providers actually select or switch model and effort?

## Product, privacy, and ecosystem

1. What compact explanation is shown by default while the full decision trace remains inspectable?
2. Where is the single Auto/manual control stored: global default, project preference, or Session override?
3. What exact consented telemetry cohort and retention calculation define a real active user?
4. How are task text, code, tool output, evaluator rationales, and failure evidence minimized, redacted, retained, and deleted?
5. Which Policy Pack and contract-test infrastructure belongs upstream in DSH, and which remains this plugin's differentiated product?
