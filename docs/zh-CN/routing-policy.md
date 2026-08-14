<!--
translation-source: docs/routing-policy.md
translation-source-blob: be7119b1e3d7fa0386c60b789009eedf54958e00
translation-status: current
-->

# 路由策略

[English](../routing-policy.md)

## 目标函数

Routing Policy 不追求最便宜的模型。它解决一个带约束的优化问题：

```text
约束：候选 route 的质量不低于 strong 基线减去 epsilon，
      且不可接受结果概率不高于 delta。

目标：先最小化端到端延迟，再最小化总成本。
```

端到端指标包含评估器、历史重读、缓存失效、切换、失败、升级和恢复，不能只比较单次 API 标价。

## Route 语义

```ts
type BuiltinRoute = 'fast' | 'standard' | 'strong'

type RouteDecision =
  | {
      outcome: 'selected'
      route: BuiltinRoute
      reasonCode: ReasonCode
    }
  | {
      outcome: 'abstained'
      fallbackRoute: 'strong'
      reasonCode: ReasonCode
    }
```

- `fast`：低复杂度、低风险、范围明确、易验证或易恢复。
- `standard`：默认生产任务，质量与速度平衡。
- `strong`：复杂、高风险、不可验证、分布外或已出现停滞。
- `abstain`：策略没有足够证据安全选择较弱 route；执行 `strong` fallback，但统计上与主动选择 strong 区分。

Route ID 是策略语义，不等于模型名称。用户通过 profile 配置实际 provider/model/effort。

## 决策优先级

```text
用户显式 route lock
→ Host/安全/能力硬约束
→ Delegation Policy 计算的质量下限
→ 活动 Recovery Episode 的 route floor
→ Routing Policy
→ abstain 时的 strong fallback
→ Route Profile Resolver 与 adapter 能力验证
```

所有优先级应由一个 resolver 统一计算，避免多个插件各自声称拥有最终权力。

## 初始任务选择

第一问不是“哪个模型最便宜”，而是：

> 是否存在足够证据证明可以不使用 strong？

证据不足时选择 `abstain`。证据充足后才在 `fast` 和 `standard` 间选择。

这反映 under-routing 与 over-routing 的非对称损失：弱模型漏掉关键问题的代价通常显著高于强模型多消耗一次调用。

## 无机械验证任务的降级准入

没有运行时测试不等于没有客观证据。系统可以结合：

1. RouterBench 对同类任务的质量先验。
2. 当前任务的风险、范围、可逆性和错误可发现性。
3. 引用覆盖、来源忠实度、结构化清单等部分验证。
4. 当前任务是否属于已覆盖分布，以及分类置信度。

只有以下条件同时成立才允许弱于 strong：

```text
候选 route 在该任务类别上通过质量门槛
AND 任务属于已校准分布
AND 错误影响有限
AND 范围明确
AND 结果容易复核或恢复
AND 分类置信度达到策略阈值
```

典型判断：

| 任务 | 决策 |
|---|---|
| README 局部润色 | 可选择 fast/standard |
| 带来源的文档摘要 | Benchmark 达标且引用可检查时可降级 |
| 长期存储架构设计 | 默认 abstain/strong |
| 安全漏洞可利用性判断 | strong |
| 陌生领域或分类低置信度 | abstain |

## Turn 内重路由

一个 DSH turn 可以包含多个模型 step。禁止整个 turn 降级会浪费后期低风险工作；允许每个 step 任意升降又会造成路由抖动。

正确作用域是“同一个尚未解决的 episode”：

- 同一 episode 内有效 route floor 只能保持或提高。
- episode 被可信证据关闭后，对新 phase 重新计算基础 route，允许在同一 turn 内降级。
- phase 是当前工作类型；episode 是当前为什么存在临时 route floor。模型声称进入新 phase 不会自动关闭未解决 episode。

有效 route：

```text
max(
  当前 phase 的基础 route,
  用户质量下限,
  硬约束下限,
  Delegation Policy 下限,
  所有活动 episode 的 floor
)
```

## 升级与降级阈值

升级阈值应低，降级阈值应高：

- 重复失败、高风险歧义、能力不足或上下文超限可以立即升级。
- 降级要求触发升级的原因已解决、相关验证发生在最新修改之后、形成稳定 checkpoint，并且后续工作足以覆盖切换成本。
- step 数量、时间或 token 到期不能自动释放 route floor。

这形成 hysteresis，避免：

```text
standard → strong → standard → strong → fast
```

## 切换经济性

模型切换不是免费动作：

- 跨 provider/model 可能失去 prompt cache。
- 新模型需要重新读取历史。
- 只存在于原模型私有状态中的信息不能可靠交接。
- 一个简单尾部 step 的节省可能小于切换开销。

因此必须估计剩余工作量和切换成本。若只剩一次 commit message，不必切换主 Agent；可以保持当前模型、使用一次性轻量辅助调用，或由确定性工具完成。

动作名称不能直接决定 route：“更新文档”可能涉及公共 API 语义，“提交代码”可能包含高风险最终审查。

## 决策透明度

Auto 直接执行高置信度决策，不要求用户猜测是否接受。每次显示：

- 最终 route 与 provider/model/effort。
- 选择、保持、升级、降级或 abstain。
- 结构化 reason code 与简短说明。
- 关键证据和策略/profile 版本。
- 若发生恢复，恢复动作与 checkpoint。

用户行为不是路由标签。用户可以显式纠正和锁定 route，但纠正记录只表示用户意图。
