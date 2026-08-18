# Routing policy

[简体中文](zh-CN/routing-policy.md)

## Objective

Routing Policy implements a simple, deterministic rule:

```text
infer the required task-handling level
→ filter routes by availability, capability, and user constraints
→ keep routes assigned to that level
→ prefer lower AA-reported price
→ break ties with lower AA-reported latency
→ break remaining ties with stable route identity
```

The policy does not estimate token counts or build a private cost model. Capability bands, prices, and latency comparisons come directly from the current versioned AA snapshot.

## Task assessment

The fixed Task Assessor returns provider-independent attributes:

```ts
interface TaskAssessment {
  taskKind: string
  scope: 'bounded' | 'normal' | 'broad' | 'unknown'
  complexity: 'low' | 'medium' | 'high' | 'unknown'
  risk: 'low' | 'medium' | 'high' | 'unknown'
  verifiability: 'mechanical' | 'partial' | 'none' | 'unknown'
  confidence: number
  reasons: readonly string[]
  assessorVersion: string
}
```

The assessor uses one fixed configuration outside Auto routing, has no tools, and returns validated structured data. It never emits a model name or effort. Failure, timeout, invalid output, or confidence below policy threshold becomes `unknown` and selects `deep`.

## Level semantics

```ts
type TaskHandlingLevel = 'light' | 'standard' | 'deep'
```

- `light`: bounded, low-risk work with few steps and a directly checkable result.
- `standard`: ordinary development, analysis, and modification work.
- `deep`: broad, uncertain, high-risk, weakly verifiable, or reasoning-intensive work.

The display label is “Task handling level”, not “task difficulty”. Risk and uncertainty can justify `deep` even when the requested edit is small.

The deterministic mapper uses the highest level required by any material attribute. High risk, broad or unknown scope, no verifiability, or low confidence forces `deep`. It records all contributing reason codes.

## AA matching key

AA records and DSH models are matched by:

```ts
interface AAModelKey {
  family: string
  semanticVersion: string
  variant: string
  effort: string
}
```

Normalization is explicit and versioned. Case, punctuation, and known presentation aliases may be normalized. Semantic version, model variant, and effort may not be inferred or crossed.

Date suffixes and deployment/build revisions are ignored for equality. If several AA rows normalize to the same key, the latest row in the snapshot is the representative record. This is a version-family match, not proof that DSH reached the exact AA-tested deployment.

## Catalog construction

The catalog compiler:

1. reads DSH's currently available concrete routes;
2. materializes the route's model family, semantic version, variant, and effort;
3. joins the route with the latest matching AA record;
4. excludes unmatched, unavailable, capability-incompatible, or user-disallowed routes;
5. assigns each remaining route to one versioned AA capability band: `light`, `standard`, or `deep`;
6. freezes the resulting catalog and source-snapshot identity for one decision.

Band boundaries are maintainer-owned policy data derived from AA scores. They are heuristics and must be visible and versioned; changing them changes the policy version.

## Resolution inside one level

After a level is selected, the resolver orders eligible routes by:

1. lower AA-reported price;
2. lower AA-reported latency when price is equal or AA does not distinguish it;
3. stable concrete route identity.

No estimated input/output token calculation is performed. If AA lacks the required price field for a route, that route does not win a price comparison by accident; the policy either applies an explicit missing-data rule or excludes it.

## Fallback and escalation

- Low assessment confidence or unknown task shape selects `deep`.
- No eligible route at `light` or `standard` escalates to the next level.
- If no AA-matched route resolves, the configured deep fallback may be used only when that concrete route is available, Host-valid, and explicitly configured by the user or maintainer.
- If no valid fallback exists, Auto returns an explicit failure and does not silently reuse a stale route.

The fallback is conservative but not certified safe. Explanations say “deep fallback” and the triggering reason, not “safe baseline”.

## User and parent authority

The user can choose Auto or an exact Manual configuration. Manual exits Auto for that scope and is never a correctness label.

A parent agent may propose task properties and constraints. Host policy validates them and retains final authority. A parent cannot silently name an arbitrary provider/model/effort and bypass the catalog.

## Transparency

Every decision persists and displays:

- task-handling level;
- actual provider/model/effort;
- AA snapshot and normalized model key;
- capability-band reason;
- price-first route-selection reason;
- fallback or escalation reason when applicable;
- policy, assessor, normalizer, and catalog versions.

The UI may summarize this as:

```text
Task handling level: Standard
Selected: DeepSeek V4 Flash / High
Reason: standard AA capability band; lower AA price among available routes in this band
```

## Later adaptive behavior

Within-session reassessment, failure-driven escalation, phase changes, and recovery are later roadmap capabilities. They reuse the same level names and catalog resolver. A model self-report alone never proves that a phase ended or that a lower level is sufficient.

## Claims

Allowed:

- “AA-informed Auto routing.”
- “Selected from the current AA snapshot using task attributes and price-first policy.”

Not allowed without separate evidence:

- “Benchmark-proven quality.”
- “The best model for this task.”
- “Safest route.”
- “Guaranteed non-inferior to a baseline.”
