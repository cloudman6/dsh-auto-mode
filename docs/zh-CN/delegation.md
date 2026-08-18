<!--
translation-source: docs/delegation.md
translation-source-blob: 4859cba7df97f520bd915abd789c1aa732992fdf
translation-status: current
-->

# 子 Agent 委派与路由权限

[English](../delegation.md)

## 核心原则

父 Agent 表达“子任务需要什么”，Host 决定接受哪些要求，Routing Policy 决定“使用什么 route 实现”。父 Agent 本身是模型，默认不能成为模型目录的最终控制者。要求更高档位并不会仅因保守就自动正确。

## 权限优先级

```text
Host 安全与 provider 能力约束
→ 用户显式 Auto/manual 选择或语义处理级别 lock
→ Host 接受的父 Agent 要求
→ Routing Policy
→ Route 解析：合格 AA catalog route、配置的 Deep fallback 或明确失败
```

父 Agent 默认可以：

- 描述子任务和验收要求。
- 带语义理由地提议最低任务处理级别。
- 声明高风险、只读、独立评审、延迟期限等约束。
- 要求模型家族或 provider 多样性，但不指定具体型号。
- 限制子 Agent 可用工具和执行能力。

父 Agent 默认不可以：

- 降低 Routing Policy 判定的最低质量。
- 指定任意 provider/model/reasoning-selection tuple。
- 关闭 Host 安全策略。
- 将自己的风险声明视为事实或训练标签。
- 静默绕过 Auto。

## 约束提案

```ts
interface RoutingConstraints {
  risk?: 'low' | 'medium' | 'high'
  readOnly?: boolean
  independentReview?: boolean
  diversity?: {
    differentProvider?: boolean
    differentModelFamily?: boolean
  }
  latencyDeadlineMs?: number
  minimumHandlingLevel?: TaskHandlingLevel
  requiredCapabilities?: CapabilityId[]
}

interface DelegatedTask {
  description: string
  prompt: ContentBlock[]
  constraints?: RoutingConstraints
}
```

这些字段是父 Agent 提案。Delegation Policy 验证后，由 Constraint Resolver 输出 `ResolvedRoutingConstraints`，记录接受和拒绝的要求、来源、理由、生效候选集和计算出的 floor。它可以根据独立评估提高风险、拒绝冲突要求，或拒绝不可行的延迟要求。

## 有界单调权限

被接受的父 Agent 权限相对 Host 选择的处理级别是单调的：可以缩小候选集或提高生效 floor，但不能降低 Host 要求。父 Agent 不能单方面决定自己的提议已被接受。

```text
父 Agent 以高风险评审为理由提议 minimumHandlingLevel=deep
AND Host 接受该要求
→ 策略选择 Deep

父 Agent minimumHandlingLevel=light
且策略判断任务需要 Deep
→ Deep 保持有效

父 Agent 无已接受要求地提议 minimumHandlingLevel=deep
→ 记录提议，但不能绕过策略
```

用户可以显式授予语义 route override 权限，但仍受 allowlist 和 Host 安全/能力约束限制：

```yaml
delegationPolicy:
  parentRouteOverride:
    enabled: true
    allowedHandlingLevels:
      - standard
      - deep
```

不向父 Agent 暴露原始 provider/model，避免配置耦合和无约束逃生口。每次提议、接受或拒绝、override 来源和理由都持久记录，但不把它们视为正确标签。报告父 Agent 的升级请求率与接受率，使系统性过度升级可见。

## 为什么不需要 Subagent Scheduler

进程内子 Agent 创建后仍是普通 DSH Agent。Adaptive Router 通过同一条 pre-assembly Route Snapshot 与 `agent/request` 应用路径服务主 Agent 和子 Agent。

```text
父 Agent提交子任务与约束
→ 创建 child Session
→ pre-assembly child 决策边界
→ Delegation Policy + Routing Policy + resolver
→ 冻结 child Route Snapshot
→ 组装 + child 的第一次 agent/request
```

只有外部 provider 必须在创建进程或远端 Session 前确定模型时，才增加 `SubagentRoutingAdapter`。它调用同一个 Routing Policy，不建立第二套路由器。

Scheduler 一词保留给真正的任务调度：并发上限、队列、优先级、抢占、资源预算和生命周期 admission。当前项目不实现这些能力。

## 持久性

RoutingConstraints 必须与 child Session 或其持久描述关联，以支持：

- 冷恢复后保持相同任务处理级别下限。
- 审计父 Agent 提交了什么、策略接受了什么。
- 区分用户授权与模型生成的约束。
- 可选策略场景套件重放真实委派场景。

如果 DSH 当前 Subagent 请求只支持具体 AgentOptions，而没有语义约束扩展点，需要提出最窄的上游能力 seam，不能把约束偷偷编码进 prompt。

## 独立评审

`independentReview` 不能只解释为“再调用一次同一个模型”。Delegation Policy 和 Route Catalog 需要定义可验证的多样性属性，例如 provider、model family、训练谱系或工具环境差异。

多样性约束只能降低候选 route 集合，不能证明两个模型统计独立。产品文案不得夸大为真正独立性。
