# Recovery, attempts, and episodes

[简体中文](zh-CN/recovery.md)

## Responsibility boundary

Recovery Supervisor answers “How does the system limit damage and recover after a wrong selection?” It does not choose the initial route or define parent-agent authority.

Core components:

- Recovery Signal Providers: normalize DSH and tool events into formal signals.
- Episode Controller: creates and releases route floors.
- Recovery Policy: selects `continue`, `salvage`, or `restart`.
- Checkpoint Provider: associates stable Session boundaries with isolated workspace state.
- Recovery Assessor: optional semantic sensor without decision authority.

## Attempt

An Attempt is one execution try starting from a known Session boundary and workspace checkpoint. Before allowing a weak route to modify a workspace, the system must know whether sufficient recovery exists. Without an isolated checkpoint, routing is more conservative for high-risk mutable tasks.

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
```

Agent self-report is weak evidence and cannot prove completion alone. Tests, exit codes, and file mutations should be emitted as structured facts by the owning capability when possible, rather than inferred by Recovery Supervisor from arbitrary terminal text.

## Episode

An Episode has no predetermined length. It is a temporary route floor created by an explicit trigger and released by explicit evidence:

```ts
interface RoutingEpisode {
  id: EpisodeId
  attemptId: AttemptId
  openedAt: { turn: number; step: number }
  trigger: EpisodeTrigger
  minimumRoute: RouteId
  releasePolicy: ReleasePolicy
  status: 'open' | 'resolved' | 'superseded' | 'abandoned'
}
```

Episode Controller performs state transitions at stable event boundaries. Models, parent agents, and classifiers may propose phase changes or completion, but none owns the episode.

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
- Re-diagnose with a strong route.

The Evidence Capsule carries only verifiable facts:

```ts
interface EvidenceCapsule {
  filesInspected: string[]
  commandsRun: CommandRecord[]
  validationResults: ValidationResult[]
  diffSummary: DiffSummary
  observations: Observation[]
  hypotheses: Array<{
    statement: string
    status: 'unverified' | 'rejected' | 'supported'
  }>
}
```

Do not rely solely on a weak model's free-form summary; it may replicate incorrect assumptions.

### Restart

- Return to the pre-attempt Session boundary and workspace checkpoint.
- Carry no hypotheses from the previous model.
- Re-execute the original task with a strong route.

Use after repeated mutation, validation regression, severe context pollution, or expanding workarounds.

## Two-dimensional Session and workspace recovery

```text
Reasoning context: keep current Session / fork from a clean boundary
Workspace state:  keep mutations / restore checkpoint
```

These dimensions require separate decisions. Automatic recovery cannot use raw `git checkout`, `git reset --hard`, or similar commands: they cannot prove mutation ownership and may overwrite user or other-agent work.

Candidate Checkpoint Provider mechanisms include isolated worktrees, copy-on-write execution worlds, or a file-transaction layer. The concrete mechanism remains an open question.

## Model-assisted assessment

Recovery Supervisor core does not use a model. Consider Recovery Assessor only when:

- A semantic phase transition would enable a valuable down-route.
- An investigation produced evidence worth salvaging.
- The cost difference between `salvage` and `restart` is material and formal evidence is insufficient.

The assessor uses a fixed model and effort, has no tools, makes one call, and returns a structured result. Low confidence retains the current safe route. RouterBench includes assessor cost.

## Prompt injection

Routing and episode internal state do not enter the current model prompt by default. Inject once only when a recovery action must alter model behavior:

- Continue: require review of unverified inherited hypotheses and the current diff.
- Salvage: inject a controlled rendering of the Evidence Capsule.
- Restart: inject the original task and clean-environment description.

Persist these injections. Do not establish a prompt protocol that requires the model to report supervisor fields every turn.
