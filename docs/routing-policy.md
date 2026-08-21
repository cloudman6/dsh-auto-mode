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

The versioned Task Assessor contract returns provider-independent attributes:

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

The assessor never selects its own physical route. `task-assessor-route-policy/v1` deterministically resolves one route from the current frozen AA catalog without inspecting the user task: it requests Light, escalates through Standard and Deep, excludes routes with missing AA latency or median time to first answer token above 6 seconds, and keeps the first price/latency/stable-identity winner. That concrete Host route and effective configuration are frozen before the call, so environment differences are supported without Auto recursion or mid-call switching.

A candidate must also preserve the fixed assessor request contract. A conflicting temperature or output limit, non-empty tool or stop configuration, or an unsupported materialized request control excludes that route from assessor use; resolution continues to the next price-ordered compatible route. The assessor never mutates a bound route into a different execution configuration.

`task-assessor-contract/v1` uses one tool-free, zero-retry request with temperature `0`, a 512-token output cap, an 8 KiB response cap, and a 12-second total timeout. Model-visible input contains at most 16 KiB for the current user message plus 16 KiB for at most four preceding visible user/assistant messages and metadata for at most 16 attachments. It excludes system/developer prompts, hidden reasoning, tool traffic, terminal output, credentials, environment variables, private child context, and attachment contents.

The response is untrusted. It must contain exactly the seven assessment fields, use closed enums, choose confidence from `0`, `0.5`, `0.8`, or `1`, and provide one to four allowlisted reason codes. The Host, not the model, attaches `task-assessor/v1`. Provider, model, effort, route, handling level, extra fields, malformed JSON, oversized input/output, provider failure, timeout, or confidence below `0.8` becomes an unknown assessment and selects `deep` with a stable failure code.

## Level semantics

```ts
type TaskHandlingLevel = 'light' | 'standard' | 'deep'
```

- `light`: bounded, low-risk work with few steps and a directly checkable result.
- `standard`: ordinary development, analysis, and modification work.
- `deep`: broad, uncertain, high-risk, weakly verifiable, or reasoning-intensive work.

The display label is “Task handling level”, not “task difficulty”. Risk and uncertainty can justify `deep` even when the requested edit is small.

`task-handling-policy/v1` uses the highest level required by any material attribute or assessor reason:

- `deep` when the task kind is unknown; scope is broad or unknown; complexity is high or unknown; risk is high or unknown; verifiability is none or unknown; or the assessor reports open-ended scope, missing material context, ambiguous intent, security sensitivity, destructive or external effects, or a non-checkable result;
- `light` only when scope is bounded, complexity and risk are low, the result is mechanically checkable, and the assessment does not report multiple dependent steps, a cross-file change, or partial verification;
- `standard` for every other validated assessment.

Timeout, invalid output, provider failure, unavailable assessor route, oversized input or output, and confidence below `0.8` bypass attribute mapping and produce a stable `deep` fallback code. The mapper records every contributing Host-policy reason in fixed order and builds explanations only from that versioned reason vocabulary, so repeated validated inputs produce the same level, reason codes, and explanation.

## Host route identity and AA evidence binding

Execution identity and evidence identity are separate:

```ts
interface HostRouteIdentity {
  routeId: string
  provider: string
  model: string
  effectiveConfigFingerprint: string
}

interface AAEvidenceBinding {
  bindingVersion: string
  hostRouteId: string
  effectiveConfigFingerprint: string
  aaSnapshotId: string
  aaRecordId: string
  matchBasis: readonly string[]
  limitations: readonly string[]
}
```

The Host identity covers every materialized request option that changes execution semantics. Effort is one optional provider-owned option, not a required cross-provider dimension. The binding is explicit, versioned, and reviewed; names and slugs are not matched fuzzily at runtime. A binding cannot cross an effective configuration difference, and a snapshot update cannot silently substitute a different AA record.

Family, version, variant, effort, date, and provider metadata may be declared match evidence where they exist. A revisionless alias may carry an explicit semantic-match limitation, but it is never presented as proof of the exact AA-tested deployment.

## Catalog construction

The catalog compiler:

1. reads DSH's currently available concrete routes;
2. materializes and fingerprints each route's effective Host request configuration;
3. joins the route through one validated AA evidence binding;
4. excludes unmatched, unavailable, capability-incompatible, or user-disallowed routes;
5. assigns each remaining route to one versioned AA capability band: `light`, `standard`, or `deep`;
6. freezes the resulting catalog and source-snapshot identity for one decision.

Band boundaries are maintainer-owned policy data derived from AA scores. They are heuristics and must be visible and versioned; changing them changes the policy version.

The initial `aa-route-policy/v1` uses Artificial Analysis Intelligence Index methodology `v4.1.1` and the exact field `evaluations.artificial_analysis_intelligence_index`:

| Level | Score range |
|---|---|
| `light` | `< 35` |
| `standard` | `>= 35` and `< 50` |
| `deep` | `>= 50` |

The same policy reads price from `pricing.price_1m_blended_7_to_2_to_1` and latency from `performance.median_time_to_first_answer_token_seconds`. The snapshot stores the full methodology version separately because the AA API's numeric index-version field may omit a patch version.

## Resolution inside one level

After a level is selected, the resolver orders eligible routes by:

1. lower AA-reported price;
2. lower AA-reported latency when price is equal or AA does not distinguish it;
3. stable concrete route identity.

No estimated input/output token calculation is performed. If AA lacks the required price field for a route, that route does not win a price comparison by accident; the policy either applies an explicit missing-data rule or excludes it.

`aa-route-policy/v1` excludes a route when capability or price is missing or invalid. Missing or invalid latency remains represented as `null`; among equal-price routes it sorts after measured latency and then by stable route identity. This preserves a valid price comparison without allowing unknown latency to beat measured latency.

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
- actual provider/model and applicable execution configuration;
- Host route identity, AA snapshot, and AA evidence binding;
- capability-band reason;
- price-first route-selection reason;
- fallback or escalation reason when applicable;
- policy, assessor, binding-rule, and catalog versions.

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
