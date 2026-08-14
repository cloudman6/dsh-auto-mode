<!--
translation-source: docs/delegation.md
translation-source-blob: 9c981a31ef6ab904f858834bc9fb3d6820245000
translation-status: current
-->

# 子 Agent 委派与路由权限

[English](../delegation.md)

## 核心原则

父 Agent 表达“子任务需要什么”，Routing Policy 决定“使用什么 route 实现”。父 Agent 本身是模型，默认不能成为模型目录的最终控制者。

## 权限优先级

```text
用户显式 route lock
→ Host/安全硬约束
→ 父 Agent 提出的质量下限和语义要求
→ Routing Policy
→ abstain fallback
```

父 Agent 默认可以：

- 描述子任务和验收要求。
- 提高最低 route。
- 声明高风险、只读、独立评审、延迟期限等约束。
- 要求模型家族或 provider 多样性，但不指定具体型号。
- 限制子 Agent 可用工具和执行能力。

父 Agent 默认不可以：

- 降低 Routing Policy 判定的最低质量。
- 指定任意 provider/model/effort 字符串。
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
  minimumRoute?: RouteId
  requiredCapabilities?: CapabilityId[]
}

interface DelegatedTask {
  description: string
  prompt: ContentBlock[]
  constraints?: RoutingConstraints
}
```

这些字段是父 Agent 提案。Delegation Policy 可以提高风险、拒绝冲突要求或因用户预算覆盖延迟要求。

## 单调权限

父 Agent 的正常控制应是单调的：可以要求更强，不能单方面要求更弱。

```text
父 Agent minimumRoute=strong
→ 策略至少选择 strong

父 Agent minimumRoute=fast
且策略判断任务需要 strong
→ strong 保持有效
```

用户可以显式授予精确 override 权限，但仍应限制在语义 route allowlist：

```yaml
delegationPolicy:
  parentRouteOverride:
    enabled: true
    allowedRoutes:
      - standard
      - strong
```

不向父 Agent 暴露原始 provider/model，避免配置耦合和无约束逃生口。每次 override 记录来源和原因，但不视为正确标签。

## 为什么不需要 Subagent Scheduler

进程内子 Agent 创建后仍是普通 DSH Agent，其每次模型请求都会经过统一 `agent/request`。Adaptive Router 因此天然同时服务主 Agent 与子 Agent。

```text
父 Agent提交子任务与约束
→ 创建 child Session
→ child 的第一次 agent/request
→ Delegation Policy + Routing Policy
→ child route
```

只有外部 provider 必须在创建进程或远端 Session 前确定模型时，才增加 `SubagentRoutingAdapter`。它调用同一个 Routing Policy，不建立第二套路由器。

Scheduler 一词保留给真正的任务调度：并发上限、队列、优先级、抢占、资源预算和生命周期 admission。当前项目不实现这些能力。

## 持久性

RoutingConstraints 必须与 child Session 或其持久描述关联，以支持：

- 冷恢复后保持相同质量下限。
- 审计父 Agent 提交了什么、策略接受了什么。
- 区分用户授权与模型生成的约束。
- RouterBench 重放真实委派场景。

如果 DSH 当前 Subagent 请求只支持具体 AgentOptions，而没有语义约束扩展点，需要提出最窄的上游能力 seam，不能把约束偷偷编码进 prompt。

## 独立评审

`independentReview` 不能只解释为“再调用一次同一个模型”。Delegation Policy 和 Route Catalog 需要定义可验证的多样性属性，例如 provider、model family、训练谱系或工具环境差异。

多样性约束只能降低候选 route 集合，不能证明两个模型统计独立。产品文案不得夸大为真正独立性。
