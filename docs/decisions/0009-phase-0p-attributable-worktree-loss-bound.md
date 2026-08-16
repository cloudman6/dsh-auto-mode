# ADR-009: Phase 0P mutable work is bounded to attributable isolated-worktree changes

[简体中文](../zh-CN/decisions/0009-phase-0p-attributable-worktree-loss-bound.md)

## Status

Accepted

## Date

2026-08-16

## Context

ADR-007 requires an accepted possible-loss bound and verified `RecoveryCapability` before Auto may execute mutable work. ADR-008 intentionally left that bound outside Phase 0P, so Experimental Auto remained read-only even though its route-selection loop could proceed.

The maintainer accepts a narrow initial loss envelope for useful coding dogfood without claiming generic rollback. The decision must distinguish risk acceptance from capability evidence: approving a class of possible loss does not prove that the current DSH execution world confines, attributes, or detects that loss.

## Decision

Phase 0P may execute mutable work only when a versioned Host-recognized execution-world provider proves all of the following before each Experimental Auto model call:

- The workspace is a clean, isolated task worktree with no pre-existing tracked or untracked changes.
- Every durable filesystem mutation is attributable to the current Attempt and confined to that worktree. Path traversal, symlink or hard-link escape, writes through an external mount, and writes outside the canonical declared root are denied before the effect occurs. After-the-fact detection alone does not satisfy this bound.
- The declared capability is at least `workspace: 'attributable-files'` and `externalSideEffects: 'none'`. A tool name, a Git repository, model intent, or user confirmation is not evidence of this capability.
- Git index, object database, configuration, references, history, linked-worktree administration, worktree state changed through Git, and remotes remain unchanged. Explicitly read-only Git inspection is eligible only through option-aware enforcement that prevents optional locks, index refresh, output-file writes, external diff or text-conversion helpers, pagers, hooks, and every repository-state mutation. Add, commit, restore, clean, checkout or switch, push, tag, branch mutation, rebase, reset, worktree administration, remote mutation, and publication are outside the bound.
- Databases, messages, deployments, remote APIs, package or system installation, credentials, account state, and operating-system configuration are outside the bound. Agent-issued networked or otherwise unclassified tool commands are denied; the selected model-provider dispatch is not classified as a tool side effect. Before capability is claimed, the provider freezes the exact production capability and tool-entry inventory—including in-process filesystem and Web tools, foreground and background shell or terminal execution, Code Mode nested dispatch, hooks, subagents, and alternate callers—and proves enforcement at every executor. An entry that is not covered is disabled. Child processes receive a scrubbed environment without ambient credentials. Tests and build commands are eligible only when the provider confines and attributes every durable effect to the isolated worktree and contains their processes.
- The Attempt durably records a versioned stable start boundary and a causally ordered, Attempt-scoped journal of created, modified, and deleted paths. The immutable journal identity and provider version survive cold load, and live worktree reconciliation must still agree before each mutable authorization. Unknown attribution, an orphan or interrupted journal, dirty-start drift, containment failure, an irreversible effect, or any external side effect terminates Experimental Auto with `no-experimental-route` before the next provider dispatch.

The maximum accepted possible loss is **all uncommitted filesystem changes produced by the current Attempt inside that isolated worktree**. The base branch, other worktrees, user pre-existing changes, Git history, remote state, and external systems are outside the accepted loss envelope.

This decision does not authorize automatic rollback and does not claim `salvage` or `restart`. On failure, Phase 0P preserves the isolated worktree and attributable evidence for inspection or manual abandonment. Recovery automation still requires a separately implemented and tested Checkpoint Provider for every claimed effect class; raw Git rollback remains prohibited.

This ADR accepts the risk envelope only. Mutable Phase 0P remains disabled until the concrete execution-world provider, its `RecoveryCapability` declaration, enforcement boundaries, attribution journal, negative controls, and fault-injection evidence pass the project review gate. Read-only execution remains the fail-closed fallback.

## Alternatives considered

### Keep all Phase 0P execution read-only

Rejected as the final dogfood boundary. It can validate routing and explanation plumbing but cannot validate the coding-agent workflow that motivates the product.

### Require full automatic workspace rollback before any mutation

Rejected for Phase 0P. An isolated, clean, attributable worktree bounds the accepted loss without pretending that full recovery exists. Automatic rollback remains a later, independently tested capability.

### Permit ordinary workspaces when Git reports a clean tree

Rejected. A clean Git status does not provide execution isolation, mutation attribution, path containment, or protection for external effects.

### Allow external effects after user confirmation

Rejected. Confirmation expresses intent; it does not make an irreversible or unattributable effect recoverable.

## Consequences

- The separate loss-bound decision required by ADR-007 and ADR-008 is closed for the initial Phase 0P file-mutation scope.
- Mutable dogfood is still blocked on executable Recovery Capability evidence. Documentation or a literal capability value cannot satisfy that gate.
- The initial mutable surface is useful for code editing, local validation, and generated artifacts only when their effects remain confined and attributable.
- Full recovery, ordinary dirty workspaces, dependency installation, remote writes, and every non-filesystem effect remain outside Phase 0P.
- The project can test the mutable Auto loop without claiming route admission, workspace rollback, or safety beyond this exact envelope.
