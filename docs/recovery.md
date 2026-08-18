# Recovery, attempts, and episodes

[简体中文](zh-CN/recovery.md)

## Responsibility boundary

Recovery Supervisor answers “How does the system limit damage and recover after a wrong selection?” It does not choose the initial route or define parent-agent authority.

Recovery has two scopes that must not be conflated:

- Routing safety: declare whether the current execution world is read-only, attributable, isolated, recoverable, or unknown. Routing Policy requires this input before admitting weaker routes for mutable work.
- Full recovery product: choose and execute `continue`, `salvage`, or `restart`. Its value is evaluated independently from static or within-turn routing.

Core components:

- Recovery Signal Providers: normalize DSH and tool events into formal signals.
- Episode Controller: creates and releases route floors.
- Recovery Policy: selects `continue`, `salvage`, or `restart`.
- Checkpoint Provider: associates stable Session boundaries with isolated workspace state.
- Recovery Assessor: optional semantic sensor without decision authority.

## Recovery Capability

```ts
interface RecoveryCapability {
  workspace:
    | 'read-only'
    | 'attributable-files'
    | 'isolated-checkpoint'
    | 'unknown'
  externalSideEffects:
    | 'none'
    | 'transactional'
    | 'idempotent'
    | 'irreversible'
    | 'unknown'
  checkpointRef?: WorkspaceCheckpointRef
  providerVersion: string
}
```

This record describes what the execution world can prove, not what Recovery Supervisor hopes to restore. Unknown, irreversible, or unattributable high-impact mutations raise the route floor or prevent Auto execution. A workspace checkpoint never implies that database, message, deployment, or remote API side effects are recoverable.

### Phase 0P accepted loss envelope

[ADR-009](decisions/0009-phase-0p-attributable-worktree-loss-bound.md) accepts one narrow mutable envelope: all uncommitted filesystem changes produced by the current Attempt inside a clean isolated task worktree. The base branch, other worktrees, pre-existing user changes, Git history, remote state, dependency or system installation, and all external systems remain outside the bound.

The decision is not a capability declaration. Before mutable Experimental Auto runs, a versioned Host provider must prove at least `workspace: 'attributable-files'` and `externalSideEffects: 'none'`, enforce canonical worktree containment before each effect, freeze and cover the exact production capability/tool-entry inventory, scrub ambient credentials from child processes, and durably attribute every created, modified, or deleted path to the Attempt through a causally ordered journal that survives cold load. Negative controls cover dirty-start drift, path, symlink, hard-link, or mount escape, Git repository-state mutation and helper execution, every network-capable or alternate caller, unclassified commands, and process leakage. After-the-fact escape detection and an in-memory-only journal are insufficient. Until that evidence exists, Phase 0P remains read-only. The envelope permits preservation and inspection of failed mutations; it does not claim automatic rollback, `salvage`, or `restart`.

## Attempt

An Attempt is one execution try starting from a known Session boundary and a declared Recovery Capability. A workspace checkpoint is optional only when the execution is read-only or the admitted risk envelope permits attributable mutations without rollback. Before allowing a weak route to mutate state, Policy must know whether recovery is sufficient.

```ts
interface Attempt {
  id: AttemptId
  sessionId: SessionId
  startBoundary: EventSeq
  workspaceCheckpoint?: WorkspaceCheckpointRef
  status: 'active' | 'completed' | 'abandoned' | 'restarted'
}
```

A Session checkpoint and workspace checkpoint are different facts. A Session fork cannot restore files; workspace rollback cannot remove a conversation history polluted by a wrong hypothesis.

## Recovery Signal

Recovery Supervisor does not require the current model to return a dedicated format on every turn. It observes:

- Session: turn/step, tool call/result, request header, assistant message, todo, and plan.
- Agent: request, request error, turn stopping, and state changes.
- Capabilities: file mutation, shell command, validation result, context capacity, and checkpoint.

A Signal Provider emits a discriminated union:

```ts
type RecoverySignal =
  | {
      kind: 'validation-failed'
      failureFingerprint: string
      mutationSeq: number
    }
  | {
      kind: 'validation-passed'
      validatorId: string
      validatedMutationSeq: number
    }
  | {
      kind: 'workspace-changed'
      diffFingerprint: string
      paths: string[]
    }
  | {
      kind: 'request-failed'
      code: string
      route: RouteId
    }
  | {
      kind: 'phase-proposed'
      phase: TaskPhase
      source: 'agent' | 'classifier' | 'tool'
    }
  | {
      kind: 'mutation-unknown'
      source: 'shell' | 'external' | 'concurrent-agent'
      evidenceRef: EventRef
    }
```

Agent self-report is weak evidence and cannot prove completion alone. Tests, exit codes, and file mutations should be emitted as structured facts by the owning capability when possible, rather than inferred by Recovery Supervisor from arbitrary terminal text. Unknown effects remain unknown and cannot be converted into a passing signal.

## Episode

An Episode has no predetermined length. It is a temporary route floor created by an explicit trigger and released by explicit evidence:

```ts
interface RoutingEpisode {
  id: EpisodeId
  attemptId: AttemptId
  openedAt: { turn: number; step: number }
  trigger: EpisodeTrigger
  minimumHandlingLevel: TaskHandlingLevel
  releasePolicy: ReleasePolicy
  status: 'open' | 'resolved' | 'superseded' | 'abandoned'
}
```

Episode Controller performs state transitions at stable event boundaries. Models, parent agents, and classifiers may propose phase changes or completion, but none owns the episode. Execution Context Projector owns confirmed phase and objective state; a phase transition does not release an episode automatically.

### Example release conditions

| Trigger | Release condition |
|---|---|
| Same validation failure repeats | Original failure fingerprint disappears and the relevant validator passes after the latest mutation |
| Repeated edits in one area | Diff stabilizes, no unexplained workaround remains, and relevant validation passes |
| Insufficient context capacity | After compaction, the candidate route fits with configured headroom |
| Missing high-risk evidence | Every predeclared evidence requirement is satisfied |
| Critical decision without validation | Normally hold until the phase completes; do not release early automatically |

Time, token, and step limits may trigger reassessment, further escalation, or restart. They cannot prove resolution.

Episode outcomes:

```ts
type EpisodeEnd =
  | { outcome: 'resolved'; evidence: EvidenceRef[] }
  | { outcome: 'superseded'; objectiveId: ObjectiveId }
  | { outcome: 'abandoned'; reasonCode: string }
  | { outcome: 'restarted'; attemptId: AttemptId }
  | { outcome: 'user-cleared' }
```

Only `resolved` proves that the same task may safely down-route. A new objective may mark an old episode `superseded`, preventing an obsolete route floor from contaminating unrelated work.

## Phase and Episode

- Phase describes what execution is doing now: research, design, implementation, debugging, validation, or documentation.
- Episode explains why a temporary minimum route exists.

When a model says “debugging is complete; entering documentation,” Episode Controller still checks whether the original failure is resolved. An unresolved episode may survive phase proposals, steps, and turns.

## Recovery actions

### Continue

- Keep the current Session.
- Keep the current workspace.
- Escalate the route and continue.

Use when complexity increased but execution has not produced clearly harmful mutations.

### Salvage

- Create a new execution context from the stable Session boundary before the attempt.
- Restore the isolated workspace checkpoint.
- Inject a structured Evidence Capsule.
- Re-diagnose at the Deep handling level.

The Evidence Capsule carries only verifiable facts:

```ts
interface EvidenceCapsule {
  filesInspected: string[]
  commandsRun: CommandRecord[]
  validationResults: ValidationResult[]
  diffSummary: DiffSummary
  observations: Array<{
    value: Observation
    sourceEvent: EventRef
    producer: string
    trust: 'mechanical-fact' | 'structured-observation'
  }>
  hypotheses: Array<{
    statement: string
    status: 'unverified' | 'rejected' | 'supported'
  }>
}
```

Do not rely solely on a weak model's free-form summary; it may replicate incorrect assumptions. Hypotheses are never represented as facts, and every capsule entry carries provenance and a trust class.

### Restart

- Return to the pre-attempt Session boundary and workspace checkpoint.
- Carry no hypotheses from the previous model.
- Re-execute the original task at the Deep handling level.

Use after repeated mutation, validation regression, severe context pollution, or expanding workarounds.

## Two-dimensional Session and workspace recovery

```text
Reasoning context: keep current Session / fork from a clean boundary
Workspace state:  keep mutations / restore checkpoint
```

These dimensions require separate decisions. Automatic recovery cannot use raw `git checkout`, `git reset --hard`, or similar commands: they cannot prove mutation ownership and may overwrite user or other-agent work.

Candidate Checkpoint Provider mechanisms include isolated worktrees, copy-on-write execution worlds, or a file-transaction layer. The concrete mechanism remains an open question. Automatic claims cover only side effects declared by the selected provider and verified by conformance tests.

## User intervention and failed recovery

Machine recovery does not remove the need for a bounded user escape path. The UI must expose the active episode, trigger evidence, declared execution-world capability, current workspace impact, and available actions:

- Keep the current safe tier and continue.
- Provide explicit validation evidence for policy evaluation.
- Abandon the attempt while preserving the current evidence and workspace.
- Export the evidence record.
- Exit Auto and take over manually.

`user-cleared` records an explicit user decision; it does not prove resolution and is not a training label. A failed checkpoint restore or Session handoff preserves the failure evidence, stops further automatic mutation, and requires explicit recovery or takeover.

## Model-assisted assessment

Recovery Supervisor core does not use a model. Consider Recovery Assessor only when:

- A semantic phase transition would enable a valuable down-route.
- An investigation produced evidence worth salvaging.
- The cost difference between `salvage` and `restart` is material and formal evidence is insufficient.

The assessor uses a fixed model and effort, has no tools, makes one call, and returns a structured result. Low confidence retains the current level or escalates to Deep; it never claims a route is safe. Any future policy-scenario evaluation includes assessor cost.

## Prompt injection

Routing and episode internal state do not enter the current model prompt by default. Inject once only when a recovery action must alter model behavior:

- Continue: require review of unverified inherited hypotheses and the current diff.
- Salvage: inject a controlled rendering of the Evidence Capsule.
- Restart: inject the original task and clean-environment description.

Persist these injections. Do not establish a prompt protocol that requires the model to report supervisor fields every turn.
