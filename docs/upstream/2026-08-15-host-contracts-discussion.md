# Discussion draft: product-neutral Host contracts for routing plugins

[简体中文](../../docs/zh-CN/upstream/2026-08-15-host-contracts-discussion.md)

## Publication recommendation

Post this in the official DeepSeek Harness [**Ideas** category](https://github.com/deepseek-ai/deepseek-harness/discussions/categories/ideas) with this title:

> Proposal: pre-assembly step preparation and runtime registration for required plugin Session events

The latest 100 Discussion titles sampled on 2026-08-15 contained 26 Chinese-only, 34 English-only, and 40 mixed-language titles. The 28 Ideas in that sample were almost evenly split: 10 Chinese-only, 9 English-only, and 9 mixed. The sample was the newest 100 Discussions returned by GitHub's API in creation order; classification used the presence of Han and Latin letters in each title. There is no dominant language for technical proposals. Use the English technical body below for precise searchable contracts, with the Chinese summary first for maintainers and the Chinese-speaking community.

Status: draft only; not published.

## Copy-ready body

### 中文摘要

我们在实现一个 DSH 自适应模型路由插件时遇到了两个通用的 Host 扩展缺口：插件无法在依赖 provider 的 prompt assembly 之前读取当前 step 刚领取的消息并冻结模型选择；插件通过 `SessionEventMap` 声明的必需事件在重启后又无法被 persistence reader 可靠识别。我们在 fork 上实现了两个产品无关的候选契约，并通过组合冷加载探针。这里希望先确认这些能力是否符合 DSH 的扩展方向；当前仓库不接受外部 PR，因此先发布设计与实现证据，不请求直接合并。

### Summary

An adaptive routing plugin needs to make one decision after the current messages are claimed but before provider-dependent prompt/tool assembly. It also needs to persist required plugin-owned Session events that must not be silently skipped during cold reconstruction.

The current public extension surface does not fully support either requirement. We implemented and tested two product-neutral candidate contracts on a fork:

1. an agent-scoped pre-assembly step-preparation waterfall;
2. effect-scoped runtime registration for required plugin Session-event namespaces.

This proposal asks whether these capabilities fit the intended DSH extension model and whether the maintainers prefer different names or compatibility semantics. It does not ask DSH Core to understand route tiers, task classification, provider ranking, or any Auto-mode policy.

### Implementation reference

- Audited upstream base: [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a)
- Fork branch: [`cloudman6/deepseek-harness:codex/auto-mode-host-contracts`](https://github.com/cloudman6/deepseek-harness/tree/codex/auto-mode-host-contracts)
- Exact commit: [`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243)

The project's [current contribution policy](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/CONTRIBUTING.md) does not accept external pull requests, so this is a design discussion backed by an implementation rather than a merge request.

### Gap 1: current-step input arrives after provider-dependent assembly

At the audited revision the Agent loop claims inbox messages, assembles the system prompt, and only then invokes `agent/pre-step`. `agent/request` runs later. `installModelSelection()` can keep assembly and request consistent only when another owner has already selected the model before assembly; it cannot derive the selection from the newly claimed messages.

Selecting at `agent/request` is therefore too late: the request may use a model different from the one whose provider-dependent context and tools were assembled.

#### Candidate A1 contract

Add an agent-scoped `agent/prepare-step` waterfall immediately after inbox claim and before `system-prompt/assemble`:

```ts
type PrepareStepDecision =
  | { kind: 'enter' }
  | { kind: 'reject' }

'agent/prepare-step'(
  payload: {
    agent: Agent
    messages: readonly UserMessage[]
    turn: number
    step: number
    signal: AbortSignal
  },
  next: () => Promise<PrepareStepDecision>,
): Promise<PrepareStepDecision>
```

The claimed message array is frozen. The hook cannot rewrite messages; existing post-assembly `agent/pre-step` keeps that responsibility and remains unchanged. Rejection stops before prompt assembly, `step/start`, and the model call. A listener may update the existing model-selection owner during preparation, after which `installModelSelection()` snapshots the same selection for both assembly and `agent/request`.

This is a lifecycle/admission seam, not a routing API: Core carries messages, step identity, cancellation, and enter/reject only.

### Gap 2: compile-time plugin events are not runtime-readable after restart

`SessionEventMap` is declaration-merge extensible, so an out-of-tree plugin can compile a required event append. Cold persistence currently recognizes a generated repository-local event set. An unknown required event is rejected after restart unless it is marked `ignorable`, but normative decisions or constraints cannot safely be skipped.

#### Candidate A2 contract

Add an effect-scoped namespace registry to `SessionStore`:

```ts
sessions.registerEventNamespace({
  namespace: 'example.plugin',
  owner: 'example-plugin-package',
  version: 1,
  events: {
    'example.plugin/decision': payloadSchema,
  },
})
```

Each registration supplies one unique namespace, a stable owner id, a positive integer schema version, and the complete event-type-to-schema map for that version. Schemas expose the structural interface `parse(unknown): unknown`; Core uses the parser only for validation and persists the original lossless JSON snapshot.

An attached Session validates each required plugin event before mutating the log and persists `{ namespace, version }` in its envelope. A cold reader accepts the event only when:

- the exact namespace version is registered;
- the event type belongs to that registration;
- the stored payload passes its schema.

Missing registration, version mismatch, malformed metadata, undeclared types, and invalid payloads fail before Session reconstruction with a diagnostic that identifies the required namespace/version. Disposing the registering fiber removes support. Built-in events remain generated; explicitly ignorable unknown events keep their current behavior.

### Why these seams belong below the plugin

The plugin owns task assessment, route tiers, evidence, provider ranking, and selection policy. The Host owns lifecycle ordering, prompt/request consistency, Session event envelopes, cold reconstruction, and plugin disposal. Implementing those latter mechanisms independently in every plugin would either be impossible or create incompatible persistence and ordering rules.

Neither candidate contract mentions adaptive routing. A memory, approval, policy, audit, or workflow plugin with required durable state could use the same event registration. Any plugin that must prepare Host-owned state from the just-claimed step input before assembly could use the preparation seam.

### Verification evidence

The fork contains product-neutral fixtures and Agent Notes. Verification on macOS passed:

- 402 tests across Agent-loop interception/resume, Session, scoped-event invariants, memory persistence, and JSONL persistence;
- `pnpm typecheck`;
- `pnpm lint`;
- all 28 `pnpm doc-sync` gates;
- a combined JSONL probe that selects before assembly, proves assembly/request model identity, persists a required plugin event, rejects cold load without registration, and succeeds after the exact registration is restored.

### Questions for maintainers

1. Do `agent/prepare-step` and runtime required-event registration fit the intended DSH extension direction?
2. Is the preparation boundary correctly placed after claim and before assembly, or is there a preferred existing lifecycle abstraction to extend?
3. For required plugin events, is exact namespace-version matching the right first fail-closed rule, or should the registration expose an explicit compatibility/migration contract now?
4. Should namespace ownership identify an npm package, a Cordis plugin name, or another stable identity?
5. If the direction is accepted and external PRs reopen, would you prefer A1 and A2 as separate changes, with their combined vertical probe in a stacked integration change?

We will keep the plugin pinned to the fork and will not claim compatibility with official DSH unless equivalent contracts become available upstream.
