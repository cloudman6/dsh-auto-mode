# Glossary

[简体中文](zh-CN/glossary.md)

## Route

A semantic quality/capability tier at the policy layer, such as `fast`, `standard`, or `strong`. It is not a concrete model name.

## Route Profile

Configuration that maps a semantic route to provider/model/reasoning effort and carries capability, Benchmark, and version information.

## Abstain

Policy lacks sufficient evidence to select a weaker route safely. Execution uses the safe fallback, `strong` by default, while metrics distinguish abstention from an intentional strong selection.

## Task Assessment

Provider-independent attributes such as task category, risk, scope, verifiability, reversibility, and confidence. An assessor does not select a model directly.

## Routing Policy

Host policy that selects a semantic route from task attributes, constraints, active episodes, and Benchmark calibration data.

## Adaptive Router Consumer

Plugin consumer that connects Routing Policy to every DSH `agent/request`.

## Phase

The semantic stage of current work, such as research, implementation, debugging, validation, or documentation.

## Episode

A temporary route floor triggered by an unresolved problem. It has no fixed length and closes only with evidence required by its release policy.

## Attempt

One execution try starting from a stable Session boundary and optional workspace checkpoint.

## Continue

Keep the current Session and workspace, escalate the route, and continue.

## Salvage

Restore the workspace, create a clean execution context, and carry a constrained Evidence Capsule.

## Restart

Return to the pre-attempt Session and workspace state without old model hypotheses, then re-execute with a strong route.

## Recovery Supervisor

Host capability that consumes formal runtime signals, manages episodes, and selects recovery actions. Its core path does not depend on a model.

## Delegation Policy

Host capability that validates parent-agent child-task constraints and authority, then computes the child-agent routing quality floor.

## RouterBench

A versioned task suite and runner providing quality, latency, cost, coverage, and recovery evidence to routing policy.

## Shadow Mode

A mode that only recommends a switch and asks the user to decide. This project does not treat it as a product phase: the user lacks a counterfactual, so the decision cannot prove routing correctness. Its explanation capability remains part of Auto's decision transparency.
