<!--
translation-source: docs/recovery.md
translation-source-blob: 155bf6a4c8b9da2ef8cb84b07c8500a94bb3f0dd
translation-status: current
-->

# 恢复、Attempt 与 Episode

[English](../recovery.md)

## 责任边界

Recovery Supervisor 解决“选错后怎么限制损失并恢复”。它不负责初始 route，也不决定父 Agent 权限。

恢复包含两个不能混为一谈的范围：

- 路由安全：声明当前执行世界是只读、可归属、已隔离、可恢复还是未知。Routing Policy 在为可变任务准入弱 route 前必须消费该输入。
- 完整恢复产品：选择并执行 `continue`、`salvage` 或 `restart`。其价值相对静态或 turn 内路由独立评估。

核心组件：

- Recovery Signal Providers：把 DSH/工具事件标准化为形式化信号。
- Episode Controller：管理 route floor 的创建和释放。
- Recovery Policy：选择 `continue`、`salvage` 或 `restart`。
- Checkpoint Provider：关联 Session 稳定边界与隔离工作区状态。
- Recovery Assessor：可选语义传感器，不拥有决策权。

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

该记录描述执行世界能够证明什么，不描述 Recovery Supervisor 希望恢复什么。未知、不可逆或不可归属的高影响 mutation 会抬高 route floor 或阻止 Auto 执行。工作区 checkpoint 绝不表示数据库、消息、部署或远程 API 副作用可恢复。

### 阶段 0P 已接受的损失 envelope

[ADR-009](decisions/0009-phase-0p-attributable-worktree-loss-bound.md) 接受一个狭窄可变 envelope：当前 Attempt 在干净隔离任务 worktree 内产生的全部未提交文件系统变更。Base branch、其他 worktree、用户预先已有的变更、Git 历史、远端状态、依赖或系统安装以及全部外部系统均不在该 bound 内。

该决策不是 capability declaration。可变 Experimental Auto 运行前，带版本 Host provider 必须至少证明 `workspace: 'attributable-files'` 与 `externalSideEffects: 'none'`，在每项 effect 发生前强制 canonical worktree containment，冻结并覆盖精确 production capability/tool-entry inventory，清除 child process 的 ambient credential，并通过可经 cold load 恢复、按因果顺序追加的持久 journal，把每个创建、修改或删除的路径归属到 Attempt。负向 control 覆盖 dirty-start drift、路径、symlink、hard-link 或 mount 逃逸、Git repository-state mutation 与 helper execution、每个具有网络能力或 alternate caller 的入口、未分类命令与 process leakage。仅靠事后逃逸检测或只存在内存中的 journal 都不充分。该证据存在前，阶段 0P 继续只读。该 envelope 允许保留并检查失败的 mutation；不宣称自动回滚、`salvage` 或 `restart`。

## Attempt

Attempt 是一次从已知 Session 边界和已声明 Recovery Capability 开始的执行尝试。只有执行只读，或准入风险 envelope 允许无需回滚的可归属修改时，工作区 checkpoint 才可以省略。允许弱 route 修改状态前，Policy 必须知道恢复能力是否充分。

```ts
interface Attempt {
  id: AttemptId
  sessionId: SessionId
  startBoundary: EventSeq
  workspaceCheckpoint?: WorkspaceCheckpointRef
  status: 'active' | 'completed' | 'abandoned' | 'restarted'
}
```

Session checkpoint 与 workspace checkpoint 是不同事实。Session fork 不能恢复文件；工作区回滚也不能清除被错误假设污染的对话历史。

## Recovery Signal

Recovery Supervisor 不要求当前模型每个 turn 返回专用格式。它观察：

- Session：turn/step、tool call/result、request header、assistant message、todo/plan。
- Agent：request、request error、turn stopping、状态变化。
- 能力：文件修改、shell 命令、验证结果、上下文容量、checkpoint。

Signal Provider 输出判别联合：

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

Agent 自我报告是弱信号，不能单独证明完成。测试结果、退出码、文件修改等应尽量由所属能力提供结构化事实，而不是由 Recovery Supervisor 解析任意自然语言终端输出。未知副作用保持未知，不能转换成通过信号。

## Episode

Episode 没有预设长度。它是一个由明确触发器创建、由明确证据解除的临时 route floor：

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

Episode Controller 在稳定事件边界执行状态转换。模型、父 Agent 和分类器可以提出 phase 变化或完成声明，但没有 episode 所有权。Execution Context Projector 拥有已确认 phase 和 objective 状态；phase 变化不会自动释放 episode。

### 示例释放条件

| 触发器 | 释放条件 |
|---|---|
| 相同验证失败重复出现 | 原失败指纹消失，相关验证在最新修改后通过 |
| 同一区域反复修改 | diff 稳定，无未解释 workaround，相关验证通过 |
| 上下文容量不足 | 压缩后满足候选 route 容量并留有配置余量 |
| 高风险信息不足 | 预先声明的证据要求全部满足 |
| 无验证关键决策 | 通常保持到该 phase 完成，不自动提前释放 |

时间、token 和 step 上限只能触发重新评估、进一步升级或 restart，不能证明问题已经解决。

Episode 结束结果：

```ts
type EpisodeEnd =
  | { outcome: 'resolved'; evidence: EvidenceRef[] }
  | { outcome: 'superseded'; objectiveId: ObjectiveId }
  | { outcome: 'abandoned'; reasonCode: string }
  | { outcome: 'restarted'; attemptId: AttemptId }
  | { outcome: 'user-cleared' }
```

只有 `resolved` 证明同一任务内可以安全降级。新任务可以将旧 episode 标记为 superseded，避免旧 route floor 污染无关工作。

## Phase 与 Episode

- Phase 描述当前在做什么：研究、设计、实现、调试、验证、文档。
- Episode 描述为什么存在一个临时最低 route。

模型提出“调试已经结束，进入文档”时，Episode Controller 仍需检查原失败是否解决。未解决 episode 可以跨 phase 提议、step 甚至 turn 持续。

## 恢复动作

### Continue

- 保留当前 Session。
- 保留当前工作区。
- 升级 route 并继续。

适用于复杂度增加但尚未产生明显错误修改的情况。

### Salvage

- 从 attempt 前稳定 Session 边界创建新执行上下文。
- 恢复隔离工作区 checkpoint。
- 注入结构化 Evidence Capsule。
- 在 Deep 处理级别重新诊断。

Evidence Capsule 只携带可核实事实：

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

不能只依赖弱模型自由文本总结，因为总结可能复制错误假设。Hypothesis 永不表示为事实；每个 Capsule 条目都携带 provenance 和 trust class。

### Restart

- 回到 attempt 前 Session 边界与工作区 checkpoint。
- 不携带旧模型假设。
- 在 Deep 处理级别从原任务重新执行。

适用于反复修改、验证退化、上下文严重污染或 workaround 扩散。

## Session 与工作区二维恢复

```text
推理上下文：保留当前 Session / 从干净边界 fork
工作区状态：保留修改 / 恢复 checkpoint
```

这两个维度必须分别决策。自动恢复不能通过裸 `git checkout`、`git reset --hard` 等命令实现，因为它们无法证明修改所有权，可能覆盖用户或其他 Agent 的工作。

Checkpoint Provider 的候选机制包括隔离 worktree、写时复制执行世界或文件事务层；具体方案仍是开放问题。自动恢复声明只覆盖所选 provider 明确声明且通过 conformance test 的副作用。

## 用户干预与恢复失败

机器恢复不能消除有界人工逃生路径。UI 必须显示 active episode、触发证据、已声明执行世界能力、当前工作区影响和可用动作：

- 保持当前安全档并继续。
- 提供明确验证证据供策略评估。
- 保留现有证据和工作区并放弃本次 attempt。
- 导出证据记录。
- 退出 Auto 并手动接管。

`user-cleared` 记录显式用户决策，不证明问题已解决，也不是训练标签。checkpoint 恢复或 Session handoff 失败时，保留失败证据，停止进一步自动 mutation，并要求显式恢复或接管。

## 模型辅助评估

Recovery Supervisor 核心不使用模型。仅在以下情况考虑 Recovery Assessor：

- 是否真的跨越语义 phase，会影响一次有价值的降级。
- 是否存在值得 salvage 的调查证据。
- `salvage` 与 `restart` 的代价差异显著且形式化证据不足。

评估器使用固定模型与 effort、无工具、一次性调用，返回结构化结果。低置信度时保持当前级别或升级到 Deep；它不能据此宣称 route 安全。未来可选的策略场景评估应计入评估器调用成本。

## Prompt 注入

路由和 episode 内部状态默认不进入当前模型 prompt。只有恢复动作需要改变模型行为时一次性注入：

- Continue：要求复核未经验证的旧假设和当前 diff。
- Salvage：注入 Evidence Capsule 的受控渲染。
- Restart：注入原任务和干净环境说明。

这些注入必须持久记录；不建立“每个 turn 要求模型报告 supervisor 字段”的 prompt 协议。
