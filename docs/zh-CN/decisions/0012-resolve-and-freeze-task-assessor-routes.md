<!--
translation-source: docs/decisions/0012-resolve-and-freeze-task-assessor-routes.md
translation-source-blob: 9d6e83de68d659c9f2de63079dbd4a0deedd128b
translation-status: current
-->

# ADR-012：解析并冻结 Task Assessor route

[English](../../decisions/0012-resolve-and-freeze-task-assessor-routes.md)

## 状态

Accepted

## 日期

2026-08-22

## 背景

阶段 2 最初把 Task Assessor 描述为一个固定 provider/model/effort 配置。如果把它理解成产品范围内统一的物理 route，这个契约无法跨安装工作：每个 DSH 环境提供的 provider、model、可选 reasoning control、用户限制和 Host-valid route 都不同。硬编码当前维护者的 DeepSeek Pro/off route，会把本地证据变成全行业 runtime 依赖，而且即使存在另一条有效 classifier route 也会失败。

根据用户任务选择 assessor 会产生循环依赖：系统必须先得到 assessment，才能选择负责生成该 assessment 的模型。让模型自行选择 provider/model/effort 也会绕过 Host 权限。

Assessor 仍需要稳定行为和有限开销。一次 assessment 中途改变 route 无法重建，而 AA 报告的首次答案延迟已经超过请求预算的 route 也不是有用 fallback。

## 决策

把固定的**选择 policy**与取决于环境的**物理 assessor route**分开。

`task-assessor-route-policy/v1` 在不检查任务内容的情况下，从当前冻结 `aa-route-policy/v1` catalog 解析一条 route。分类是固定 Light 请求。Resolver 依次尝试 Light、Standard、Deep；在第一个存在合格项的级别内，保留 catalog 的 AA 价格更低、AA 延迟更低、稳定 route identity 排序。Assessor 合格条件要求 AA 报告的首次实际答案 token 中位时间不超过 6 秒，也就是 12 秒总请求 deadline 的一半。即使用户任务 resolver 可以按自己的 tie-break policy 保留 latency 缺失项，这类辅助调用仍会排除 latency 缺失或超过预算的 route。

一次 assessor 调用前冻结所选 Host route identity、实际配置 fingerprint、catalog version、AA snapshot、route-policy version 和 timeout。Route 可以因安装环境不同，或因已评审的 catalog/configuration 变化而不同，但不能在一次调用中改变，也绝不由 Auto 递归选择。没有合格 route、catalog 无效或调用失败时，产生稳定 unknown assessment 并选择 Deep。

`task-assessor-contract/v1` 固定 Task 4 的其他边界：只包含有限可见文本和附件 metadata；没有工具和重试；temperature 为 `0`；输出 512 token；output 上限 8 KiB；总 timeout 12 秒；严格 JSON 且不允许额外字段；离散 confidence 为 `0`、`0.5`、`0.8`、`1`；阈值为 `0.8`；assessor provenance 由 Host 持有。Provider、model、effort、route 和 handling level 都是被禁止的模型输出。

## 考虑过的替代方案

### 为所有安装硬编码一个 provider/model/effort

拒绝。Availability 和 reasoning control 因环境而异，本地 DeepSeek binding 不是可移植产品契约。

### 根据当前任务选择 assessor route

拒绝。这会让 assessor 选择依赖于它本应生成的 assessment，并重新引入递归 Auto routing。

### 让普通用户手工选择专用 assessor

拒绝作为默认方案。它暴露内部辅助角色，增加一个必需配置决策，也不能让未配置安装获得确定性行为。未来可以附加 maintainer-only pin，但显式 pin 不可用时必须失败关闭，不能静默替换其他 route。

### 调用任意可用 route，只依赖 runtime timeout

拒绝。调用测得首次答案延迟已经超出预算的 route，只会在得到同一个 Deep fallback 前浪费时间和成本。

## 后果

- 同一版本化 policy 解析通用 Host route identity，因此适配拥有零个、一个或多个 reasoning configuration 的 provider。
- 当前维护者 catalog 解析出 DeepSeek Pro/off，因为它是合格 Light route；这是输出，不是硬编码依赖。
- 不同安装的 assessor 行为可能不同，因此每次决策除 assessor contract version 外，还必须持久化实际冻结 route 和 catalog evidence。
- 没有合格本地 AA catalog 的安装保守失败到 Deep。通用 catalog 获取与分发仍属于阶段 4。
- Task 5 实现一次性 provider 调用和确定性级别 mapper；Task 4 不修改 live MVP routing path。
