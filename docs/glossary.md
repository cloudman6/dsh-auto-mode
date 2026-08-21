# Glossary

[简体中文](zh-CN/glossary.md)

## Auto / Manual

The normal user-facing choice. Auto lets Host policy select a route; Manual lets the user select provider/model/reasoning directly and exits Auto for that scope.

## Task handling level

The amount of reasoning capacity Auto allocates to the current task. The built-in levels are `light`, `standard`, and `deep`. They are heuristic allocation levels, not certified quality guarantees.

## Light

Bounded, low-risk work with few steps and a directly checkable result. Chinese UI label: 轻量.

## Standard

Ordinary development, analysis, and modification work. Chinese UI label: 常规.

## Deep

Broad, uncertain, high-risk, weakly verifiable, or reasoning-intensive work. Chinese UI label: 深度. Also used as the conservative fallback for low-confidence assessment.

## Concrete route

The executable provider/model/reasoning selection sent through DSH. A handling level may contain multiple concrete routes.

## Host route identity

The executable DSH identity for one provider, model, and effective request configuration. It includes a stable fingerprint of every Host-materialized option that can change execution semantics; effort is optional.

## AA evidence binding

A reviewed, versioned mapping from one Host route identity to one stable AA model/configuration record in one frozen snapshot. It records the match basis and limitations but does not claim exact deployed weights.

## AA snapshot

A versioned local set of Artificial Analysis capability, price, and latency records used to compile a route catalog. Runtime routing does not require a live AA request.

## AA route catalog

The frozen intersection of AA evidence-bound Host routes, route capabilities, and user/Host constraints, with each route assigned to one handling level.

## Task Assessment

Provider-independent structured attributes such as task kind, scope, complexity, risk, verifiability, confidence, and reasons. The assessor does not select a model.

## Routing Policy

Deterministic Host policy that maps a Task Assessment and constraints to a task-handling level.

## Route Resolver

The deterministic component that filters eligible concrete routes and, within one handling level, prefers lower AA price, then lower AA latency, then stable route identity.

## Deep fallback

A configured Host-valid concrete route used when assessment is uncertain or no AA-matched route resolves. It is conservative but not certified safe and does not inherit an AA claim.

## Frozen route selection

The immutable handling level, concrete route, source snapshot, versions, and explanation consumed by both provider-dependent assembly and the matching `agent/request`.

## AA-informed

A required qualifier meaning that route capability, price, or latency came from the current AA snapshot. It does not mean project-benchmarked, optimal, or safe.

## Episode

A persisted unresolved-problem state used by later adaptive execution and recovery to impose an escalation floor.

## Recovery Supervisor

A Host capability that consumes formal runtime signals and selects only recovery actions supported by the current execution world.

## Continue / Salvage / Restart

Later recovery actions: continue in the current context; preserve attributable evidence while starting clean; or return to a declared recoverable state and re-execute.

## RouterBench

Optional focused evaluation infrastructure for policy questions and regressions. It is not required for AA-informed route admission or release.
