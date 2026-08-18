<!--
translation-source: docs/decisions/0008-external-prior-experimental-auto.md
translation-source-blob: ca427c84920d55d8406c02ba80a8a5b765cab8a6
translation-status: current
-->

# ADR-008：外部榜单可以为仅限维护者的实验 Auto 提供先验

[English](../../decisions/0008-external-prior-experimental-auto.md)

## 状态

MVP 后开发方向已被 [ADR-010](0010-aa-informed-heuristic-routing.md) 取代。本文件保留为授权已完成阶段 0P MVP 的历史决策。

## 日期

2026-08-16

## 背景

ADR-002 与 ADR-006 定义的证据治理准入协议，是 Auto 作出质量或非劣性主张前的必要条件。但如果在运行真实 Auto 路径前先完成初始 RouterBench 任务语料与统计准入证据，就会延后验证另一个问题：Host 集成、一次操作的 Auto/manual 交互、任务评估、确定性策略、持久解释与 route identity 映射能否形成有价值的产品闭环。

[Artificial Analysis](https://artificialanalysis.ai/models) 发布独立的模型配置指数、价格与性能测量。这些榜单适合作为外部先验，但不能证明 DSH Auto Mode 特定任务分布上的质量、deployment identity、非劣性或严重失败率边界。

## 决策

在阶段 0C 之前增加 **阶段 0P：AA-seeded Experimental Auto**。

阶段 0P 是在明确 DSH fork 上运行、仅限维护者且必须显式启用的 dogfood 阶段。只有同时满足以下约束，才可以在没有 RouterBench admission 的情况下主动路由模型调用：

- 每个选中配置必须同时属于：DSH 发现的精确 provider/model/reasoning selection、可复现的 A3p identity 证据、用户与 Host 约束，以及一条完全匹配的 Artificial Analysis 配置记录。
- 显式 effort、adapter 实体化默认值与 provider-default omission 始终是不同 identity。不得把一种形式测得的分数插值或转移给另一种形式。
- 带版本的本地 evidence snapshot 记录 Artificial Analysis endpoint 与 query 语义、pagination 覆盖、上游提供的 index 版本、记录标识、抓取时间、来源 attribution、相关 capability index、延迟/成本字段，以及规范化全量内容 digest。当上游版本省略 patch revision 或没有单独版本化某个 index family 时，该 digest 充当 snapshot identity。仓库不得抓取网页、内置榜单数据或保存 API key。
- Task Assessment 把有界任务属性映射到 index family。确定性策略再把 assessment 与冻结 evidence snapshot 映射到 `fast`、`standard` 或 `strong`；外部数据源不能直接输出最终 route 决策。
- 高风险、未知或低置信度 task assessment 从有效冻结 catalog 中使用最强精确匹配实验配置。无法匹配、identity 漂移、证据无效或缺失必需 Host contract 时，以 `no-experimental-route` 退出 Auto 且不调用模型。该路径绝不复用 admitted Auto 的 `no-safe-route`。
- 根据 ADR-007，Host 声明的 `RecoveryCapability` 仍是必需 policy input。只有 possible loss 落在另行决策接受且符合 ADR-007 的 risk bound 内，并且每个相关 effect class 都具备充分的已声明 attribution 与 recovery support 时，包括 `strong` 在内的实验档才可以执行可变工作。阶段 0P 本身不创建该 risk bound。任何不可逆外部副作用，或任何无法证明落在 bound 内的 mutation，都会终止当前 Experimental Auto attempt。用户介入只能切换到 Manual 或等待新的 execution world 声明；单纯确认不能授权被阻止的 Experimental Auto provider dispatch。
- 每项决策和解释都必须标记 `experimental-unadmitted`，并说明不存在本项目特定的质量或非劣性证据。
- 阶段 0P 不宣称安全准入、候选非劣性、生产就绪、兼容官方 DSH 或公开支持。它的证据不得直接提升为普通 Policy Pack admission。

Artificial Analysis 是第一个 `ExternalRoutePrior` 来源，而不是永久硬编码依赖。维护者私人 dogfood 可以在遵守数据源条款和 attribution 的前提下使用本地提供的 API credential。公开使用或数据再分发必须等到相关数据权利得到确认。

ADR-002 与 ADR-006 继续约束阶段 0C 和所有公开质量主张。RouterBench 仍是本项目唯一的 admission 路径。阶段 0P 是独立标注的实验执行路径，不是生产策略可以静默继承的已准入 route 例外。

## 考虑过的替代方案

### 运行 Auto 前先完成 RouterBench

对阶段 0P 否决。RouterBench 回答 route 质量问题，但会延后收集产品闭环与集成证据；后者无需质量主张也能获得。

### 把公开榜单视为 route admission

否决。榜单不能证明结果能够迁移到本项目任务分布、精确 provider deployment、request encoding 或严重失败包络。

### 抓取或再分发榜单数据

否决。文档化 API 已提供稳定标识和版本化字段，而公开再分发需要另行确认数据权利路径。

### 让 assessor 模型选择具体模型与 effort

否决。这会把最终权力移出确定性 Host policy，并引入递归路由问题。

## 后果

- 项目可以在 RouterBench 就绪前测试真实 Auto/manual 用户路径。
- A3p identity 与 A5p carrier 核验仍在立即关键路径上。
- 阶段 0P 的策略阈值必须明确标为启发式并带版本；它们不是质量保证。
- 实验决策需要独立 evidence state 与面向用户的解释，防止被意外提升为 admitted policy。
- 真实 dogfood 案例可以帮助设计后续 RouterBench taxonomy 与 fixture，但未经 provenance 和防泄漏控制不得进入 held-out acceptance set。
- 阶段 0C 仍要求已接受 roadmap 定义的阶段 A 最小准入切片。
