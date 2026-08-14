# 恢复、Attempt 与 Episode

## 责任边界

Recovery Supervisor 解决“选错后怎么限制损失并恢复”。它不负责初始 route，也不决定父 Agent 权限。

核心组件：

- Recovery Signal Providers：把 DSH/工具事件标准化为形式化信号。
- Episode Controller：管理 route floor 的创建和释放。
- Recovery Policy：选择 `continue`、`salvage` 或 `restart`。
- Checkpoint Provider：关联 Session 稳定边界与隔离工作区状态。
- Recovery Assessor：可选语义传感器，不拥有决策权。

## Attempt

Attempt 是一次从已知 Session 边界和工作区 checkpoint 开始的执行尝试。每次允许弱 route 修改工作区前，必须知道是否存在足够的恢复能力；没有隔离 checkpoint 时，对高风险可变更任务采取更保守路由。

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
```

Agent 自我报告是弱信号，不能单独证明完成。测试结果、退出码、文件修改等应尽量由所属能力提供结构化事实，而不是由 Recovery Supervisor 解析任意自然语言终端输出。

## Episode

Episode 没有预设长度。它是一个由明确触发器创建、由明确证据解除的临时 route floor：

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

Episode Controller 在稳定事件边界执行状态转换。模型、父 Agent 和分类器可以提出 phase 变化或完成声明，但没有 episode 所有权。

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
- 由 strong route 重新诊断。

Evidence Capsule 只携带可核实事实：

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

不能只依赖弱模型自由文本总结，因为总结可能复制错误假设。

### Restart

- 回到 attempt 前 Session 边界与工作区 checkpoint。
- 不携带旧模型假设。
- strong route 从原任务重新执行。

适用于反复修改、验证退化、上下文严重污染或 workaround 扩散。

## Session 与工作区二维恢复

```text
推理上下文：保留当前 Session / 从干净边界 fork
工作区状态：保留修改 / 恢复 checkpoint
```

这两个维度必须分别决策。自动恢复不能通过裸 `git checkout`、`git reset --hard` 等命令实现，因为它们无法证明修改所有权，可能覆盖用户或其他 Agent 的工作。

Checkpoint Provider 的候选机制包括隔离 worktree、写时复制执行世界或文件事务层；具体方案仍是开放问题。

## 模型辅助评估

Recovery Supervisor 核心不使用模型。仅在以下情况考虑 Recovery Assessor：

- 是否真的跨越语义 phase，会影响一次有价值的降级。
- 是否存在值得 salvage 的调查证据。
- `salvage` 与 `restart` 的代价差异显著且形式化证据不足。

评估器使用固定模型与 effort、无工具、一次性调用，返回结构化结果。低置信度时保持当前安全 route。它的调用成本计入 RouterBench。

## Prompt 注入

路由和 episode 内部状态默认不进入当前模型 prompt。只有恢复动作需要改变模型行为时一次性注入：

- Continue：要求复核未经验证的旧假设和当前 diff。
- Salvage：注入 Evidence Capsule 的受控渲染。
- Restart：注入原任务和干净环境说明。

这些注入必须持久记录；不建立“每个 turn 要求模型报告 supervisor 字段”的 prompt 协议。
