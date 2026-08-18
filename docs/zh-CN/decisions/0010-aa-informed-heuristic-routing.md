<!--
translation-source: docs/decisions/0010-aa-informed-heuristic-routing.md
translation-source-blob: c5786255c394434c1aa0c3348df98bafbd84deed
translation-status: current
-->

# ADR-010：采用 AA 驱动启发式路由与价格优先解析

[English](../../decisions/0010-aa-informed-heuristic-routing.md)

## 状态

Accepted

取代 ADR-002 和 ADR-006 的 MVP 后产品方向，并取代 ADR-008 作为后续外部证据策略。ADR-008 保留为阶段 0P 的历史授权。

## 日期

2026-08-18

## 背景

原设计要求在可用 Auto 产品前自建 RouterBench，以建立绝对 baseline、candidate 非劣性、精确 deployment identity、admission、过期和撤销。项目没有资源以这些声明所需的广度和统计标准建立并治理模型质量 Benchmark。

Artificial Analysis 已经发布广泛的模型能力、价格和延迟比较。已接受的阶段 0P MVP 证明 DSH Auto Mode 可以使用外部数据选择并可见地应用不同 model/effort，同时保持 Manual。产品真正的差异化是任务理解、确定性路由、DSH 集成、透明解释和后续恢复，而不是运营另一套模型榜单。

MVP 还表明，当 DSH 暴露稳定语义 alias 时，要求 provider deployment fingerprint 并不现实。产品可以在模型家族、语义版本、变体和 effort 层面进行更窄且诚实的匹配，而不宣称精确 build identity。

## 决策

使用 Artificial Analysis 作为模型能力档、价格和延迟的维护外部来源。DSH Auto Mode 继续负责最终决策。

把面向用户的 `fast`/`standard`/`strong` 替换为任务处理级别：

- `light` / 轻量；
- `standard` / 常规；
- `deep` / 深度。

固定 Task Assessor 返回结构化任务属性和置信度，但绝不返回具体模型或 effort。确定性 Host policy 把这些属性映射到一个处理级别。低置信度、范围未知或高风险选择 `deep`。

AA 记录与 DSH 模型按规范化模型家族、语义版本、变体和显式 effort 匹配。相等判断忽略日期后缀和 deployment/build revision。多条带日期 AA 记录共享同一规范化键时，使用快照中的最新记录。版本、变体和 effort mismatch 仍然无效。

同一处理级别内按以下顺序解析 route：

1. AA 报告价格更低；
2. AA 报告延迟更低；
3. 稳定的具体 route identity。

不估算任务 token，也不维护私有成本模型。Host capability、availability、security 与用户约束先过滤 candidate，再比较价格。

RouterBench 是可选评估设施。它后续可以测试有边界的策略问题或回归，但不是 AA 驱动 Auto release 的前置条件。精确 deployment fingerprint、项目特定 baseline guarantee、candidate 非劣性和 Benchmark admission 不属于产品声明。

每次决策都要说明由 AA 驱动并引用当前 AA 快照。产品不得把 route 描述成经过 Benchmark 证明、最安全、普遍最佳或保证不劣于 baseline。

## 考虑过的替代方案

### 继续前先建立原 RouterBench

拒绝。所需 task corpus、evaluator governance、重复运行、统计功效和持续 drift 维护超出当前资源，并会延迟产品主要价值。

### 让 AA 直接选择具体 route

拒绝。AA 不知道当前任务、本地 availability、用户约束或 DSH Host 状态。它提供市场数据；Host policy 拥有决策权。

### 要求精确 deployment 日期或 fingerprint

拒绝作为正常匹配要求。很多 provider alias 不暴露该 identity。产品改用透明的语义版本级匹配，并避免精确 deployment 声明。

### 估算每个任务的 token 成本

拒绝。AA 已经提供可比较价格结论，再增加不确定本地模型没有必要。Resolver 直接使用 AA price。

### 保留 `fast`/`standard`/`strong`

拒绝作为用户措辞。它们混合延迟与未证明的强度。`light`/`standard`/`deep` 描述投入多少任务处理能力，而不声称认证质量保证。

## 后果

- Roadmap 从 Benchmark admission 转向 AA catalog 构建和语义任务判断。
- 现有阶段 0P 集成与 UI 成为下一次产品迭代基础。
- 模型匹配可实际实现，但刻意比 deployment-level identity 更宽松。
- 同档 price 成为第一比较项，latency 成为第二比较项。
- 产品解释和公开文档必须保留 AA 驱动的启发式限制。
- 后续聚焦评估可以提高信心，但不能静默把产品变回 admission 质量保证系统。
- ADR-001、ADR-003、ADR-004、ADR-005、ADR-007 和 ADR-009 在各自 authority、documentation、recovery、delegation 与 effect safety 边界内继续有效。
