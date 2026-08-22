<!--
translation-source: docs/decisions/0015-derive-route-price-from-aa-free-data.md
translation-source-blob: 4ae000eaa8066d2cb562e827ecbf84743daf9078
translation-status: current
-->

# ADR-015：从 AA Free 数据派生 route 价格

[English](../../decisions/0015-derive-route-price-from-aa-free-data.md)

## 状态

Accepted

本决策取代 ADR-013 对 Pro acquisition endpoint 和 AA blended-price 字段的强制要求，以及 ADR-011、ADR-014 中对应的 price-field 条款。它保留外部证据 identity、精确 binding、离线 acquisition、credential 隔离、权利、校验、原子激活、rollback 和 runtime 不调用 AA 的边界。

## 日期

2026-08-22

## 背景

已实现的 route policy 要求 `pricing.price_1m_blended_7_to_2_to_1`，该字段只存在于 AA Pro language-model endpoint。有效 Free key 可以调用 `/api/v2/language/models/free`。该 endpoint 保留稳定 record/creator ID、主要 Intelligence score、input/output price、可选 cache price 和 median performance，但不提供 Pro blended-price 字段。

2026-08-22 实际验证的 Free acquisition 包含 610 条稳定 record。其中 597 条有 Intelligence score，405 条同时有 Intelligence score 和有效 input/output price，这 405 条中有 308 条还有 median time to first answer token。强制 Pro 会阻断一个明显更大的本地可维护 catalog，而 Free 已包含保持能力分档和确定性价格优先解析所需的 source facts。

不同 model 和 reasoning configuration 继续对应独立 AA record。决定其 Light、Standard 或 Deep 档位的是 AA score，而不是 provider effort label。Free 数据不能解决 Host-to-AA identity：display name 与 slug 仍不足以创建 binding，因此仍必须使用精确 provider normalization rule 和稳定 AA record ID。

## 决策

引入 `aa-route-policy/v2`、`aa-snapshot/v3`、`aa-api-acquisition/v2` 和 Runtime compatibility version 2。

维护者 acquisition adapter 只调用：

```text
https://artificialanalysis.ai/api/v2/language/models/free?page=N
```

它接受有效 Free、Pro 或 Commercial key 返回的 Free-shaped response，遍历全部已记录分页，把 key 留在 server-side，拒绝 redirect、畸形或超限 response，并只在现有本地私有边界内保存 acquisition。Runtime 绝不调用 AA。

### 能力分档

每个稳定 AA record 都根据 `evaluations.artificial_analysis_intelligence_index` 和 methodology `v4.1.1` 独立分档：

| Handling level | Score |
|---|---:|
| Light | `< 35` |
| Standard | `>= 35` 且 `< 50` |
| Deep | `>= 50` |

Effort、reasoning mode、model family 和 provider 都不能直接推出 handling level。

### 标准化价格

Policy eligibility 要求有效 Intelligence score，以及非负有限的 AA input/output price。Cache-hit price 可选。Snapshot 为每条 eligible record 派生：

```text
effectiveCachePrice = cacheHitPrice ?? inputPrice

price_1m_normalized_7_to_2_to_1 =
  (7 * effectiveCachePrice + 2 * inputPrice + outputPrice) / 10
```

7:2:1 权重分别代表 cache-hit/input/output token price。缺少 cache-hit price 表示没有已知 cache 折扣，因此用 AA input price 替代。Cache-write price 不属于本比较公式。Snapshot 保留 AA input、output、可空 cache-hit price、派生 normalized price，以及 cache leg 来自 cache-hit 还是 input substitution。

这是对 AA-reported unit price 的确定性标准化，不是对任务 token 数量的预测，也不是私有 task-cost estimator。用户任务 token volume 继续留在 Routing Policy 之外。

同一 handling level 内，Runtime 按更低 normalized price、更低 AA median time to first answer token、稳定 route identity 排序。缺失 latency 继续表示为 null，并在同价时排到有测量 latency 的记录之后。Task Assessor eligibility 继续要求 latency 已测量且不超过六秒。

### 兼容性

新的 Free acquisition 只生成 v2/v3 artifact。Runtime version 2 为有效 v1 Evidence Pack 提供一个显式 migration adapter：将其 AA-reported Pro blended value 作为 v2 normalized value，并标记 basis 为 `legacy-aa-blended`。Adapter 不编造缺失的组成单价，并记录 compatibility basis。后续 Free refresh 会用 `derived-free-prices` record 替换这种过渡表示。

历史 Session facts 保持不变。旧 ADR 和 legacy refresh code 继续作为历史兼容来源，不被改写为 v2 描述。

### 权利与分发

Free acquisition path 默认 `internal-only`，要求 Artificial Analysis attribution，且不授予 redistribution。真实 acquisition、Snapshot、credential、rollback material 和 refresh report 保持 Git ignored，并留在 browser client 与公开 plugin 之外。公开真实 Evidence Pack 仍需 ADR-013 定义的可外部审计 written grant。

## 考虑过的替代方案

### 强制 Pro

拒绝作为默认方案。Free 已提供确定性 policy 所需的 capability、token-price 和 median-latency facts，不应让安装后的产品依赖付费 entitlement。

### 使用 Intelligence Index cost per task

拒绝作为主要 price field。它由 AA 直接报告，但在实际验证的 610 条 Free records 中仅有 145 条提供，会排除大多数本可比较的 model/effort records。

### 按 input 再 output price 做字典序比较

拒绝。它任意优先一个 token class，可能偏好 input 略便宜但 output 显著更贵的 route。

### 从 AA name 推断 effort binding

拒绝。Effort 往往只是展示文本而非稳定结构化字段，多个 evaluated configuration 也可能共享 slug。Name 和 slug 不能证明可执行 Host route identity。

### 把 Free Snapshot 打包进公开 plugin

拒绝，除非获得书面 grant。Free access 允许本地 acquisition，但不构成在 machine-readable model-selection product 中公开再分发的权利。

## 后果

- 用户自有 Free key 可以填充完整的本地 policy-eligible AA Snapshot，不需要 Pro subscription。
- 当前已验证数据产生 405 条 capability-and-price-eligible record；缺失 latency 不妨碍普通用户任务路由。
- Price explanation 必须写成“normalized from AA-reported prices”，不能继续写“AA blended price”。
- Snapshot record 进入 Active Catalog 前，仍需要 provider normalization rule 和精确 Binding Registry entry。
- Runtime 与 Pack compatibility 一起升级；legacy pack 通过显式、可审计 migration basis 保持可用。
- AA schema、methodology、terms 或 rights 变化继续判为 RED，并保留上一份有效本地 Pack。

## 已评审官方来源

- [Artificial Analysis Data API 文档](https://artificialanalysis.ai/data-api/docs)：Free endpoint、response field、pagination、key handling、tier 与 rate limit。
- [Artificial Analysis Data API access 页面](https://artificialanalysis.ai/data-api)：Free internal-workflow scope、attribution 与 non-redistribution 边界。
- [Artificial Analysis Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf)：已评审一般条款 version 1.0，修订日期 2024-04-28。
