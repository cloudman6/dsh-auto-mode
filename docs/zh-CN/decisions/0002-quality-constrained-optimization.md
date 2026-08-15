<!--
translation-source: docs/decisions/0002-quality-constrained-optimization.md
translation-source-blob: 05879e492670c9d07ea5d41055d3ce02905bc276
translation-status: current
-->

# ADR-002：在绝对与相对质量门槛下先优化延迟，再优化成本

[English](../../decisions/0002-quality-constrained-optimization.md)

## 状态

Accepted

## 日期

2026-08-14

## 背景

用户很难判断任务需要哪个模型与 effort，因此常为保险保持高配置。只优化成本会增加路由过弱风险。只做相对比较同样不安全：候选配置可能只是与一个本身失败的基线相当。

## 决策

每个任务切片使用一个已配置基线保证档位，惯例命名为 `strong`。它是 Policy Pack 保证，不是某个模型在所有场景都最强的通用主张。

基线必须先通过预注册的绝对质量与不可接受结果门槛。只有候选 route 的单侧非劣性区间满足 `epsilon`、不可接受结果置信上界满足 `delta`、达到统计功效与样本量要求，而且不存在未解释的严重失败簇时，才能进入 Auto。

在 policy 有资格使用的已准入集合内，先优化端到端延迟，再优化总成本。Routing Policy 与具体解析在同一冻结 Effective Route Catalog 上运行：Policy 应用带版本的档位级证据，Resolver 则在选定档位内按预测端到端延迟、总成本和稳定 admission identity 依次排序具体候选。缺少必需比较或 identity 证据时判定 profile 无效；live discovery 顺序绝不能充当 tie-break。如果策略无法在已准入合法 route 间判断，`abstain` 选择已准入基线。如果不存在安全已准入配置，返回 `no-safe-route` 并停止或请求用户介入；绝不能静默回退到未准入配置。

维护者发布版本化 Policy Pack。普通用户只选择 Auto 或手动具体配置，不负责校准质量 profile。

## 备选方案

### 始终选择最便宜 route

否决。遗漏关键问题的损失不能与模型价格直接比较。

### 只按相对质量准入

否决。与失败基线非劣不能提供绝对质量保证。

### 使用历史用户选择作为标签

否决。用户没有 A/B 反事实；选择通常表达风险偏好或猜测。

### 始终使用基线

否决。它不解决延迟或成本，也无法形成有用的 Auto 产品。

## 后果

- Route Capability Bench 与 Policy Pack 治理是产品基础设施。
- 指标必须报告基线绝对失败、区间、严重切片、覆盖、abstain 和 `no-safe-route`。
- 分类器、切换、重试和恢复开销都进入延迟与成本。
- Alias、模型漂移、证据过期或基线失败会撤销准入。
- 显式 effort、adapter-default 实体化和 provider-default omission 在证据与漂移语义上是不同的具体选择。
