<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: 4c43f86d2f9050d0e69179a0f10447441a7b793e
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-21

## 当前阶段

阶段 0P MVP 已接受。项目进入 MVP 后 roadmap 的阶段 1：用带版本 AA 驱动 catalog 和面向用户的 `light`、`standard`、`deep` 任务处理级别，取代原型 route 假设。

维护者 DSH fork 仍固定在 `2a2db7a6ec3ce9969857cc41de839f911ef5902e`。阶段 1A 已完成：仓库现已具备 provider-neutral 实际配置 fingerprint、稳定 Host route identity、显式版本化 AA evidence-binding resolver、稳定拒绝原因和混合 provider fixture。当前可运行插件在阶段 1 后续任务集成新 catalog 路径前仍使用原型 `fast`/`standard`/`strong` 实现。

## 已接受的 MVP 后方向

- Artificial Analysis 是模型能力、价格和延迟结论的维护外部来源。
- DSH Auto Mode 不建立也不要求自有模型质量 Benchmark。
- 面向用户的任务处理级别是 Light、Standard 和 Deep；中文标签为轻量、常规、深度。
- 固定语义 Task Assessor 返回任务属性和置信度；确定性 Host policy 选择级别并保留最终权力。
- 可执行 Host route identity 与 AA evidence identity 相互独立。版本化显式 binding 把一条实际 provider/model/request configuration 映射到一条稳定 AA 记录；effort 和 variant 是 provider 可选维度，不是通用必填字段。
- 同一级别内，resolver 依次优先 AA 报告价格更低、AA 报告延迟更低、稳定 route identity。
- 产品声明始终明确由 AA 驱动，不宣称本项目 Benchmark 质量、安全、非劣性或普遍最优。

这些决策记录在 [ADR-011](docs/zh-CN/decisions/0011-bind-host-routes-to-aa-evidence.md)，它接替 ADR-010，同时保留 AA 驱动、价格优先方向。ADR-010 保留为取代 ADR-002、ADR-006 和 ADR-008 的历史决策。

## 已完成基础

- 建立英文权威、中文维护的双语文档流程。
- 审计 DSH，并在维护者 fork 实现产品无关 A1 pre-assembly 与 A2 Session-event 契约。
- 在 DeepSeek Harness Discussion #2281 发布 A1/A2 提案与证据。
- 构建并接受阶段 0P MVP：Auto/manual 控制、任务相关 route 变化、请求／选择一致、持久解释、可见 model/effort 过渡、真实 provider 调用和 Manual 不受影响。
- 在固定 fork commit 恢复完整 GUI suite：3,760 项通过、4 项既有 skip。
- 接受 AA 驱动 MVP 后策略，并把 Benchmark admission 改为可选评估轨道。
- 接受通用 Host route identity 与显式 AA evidence-binding 架构，取代强制 family/version/variant/effort 键。
- 在不改变 live routing 的前提下实现阶段 1A：零个、一个和多个控制项的 route 只能通过精确 Host fingerprint、snapshot ID 与稳定 AA record ID 解析；歧义、陈旧、模糊、跨配置、collision 和静默 record replacement 均以稳定原因失败。

## 当前实施计划

1. 已完成：用混合 provider fixture 实现 provider-neutral Host route identity 与显式 AA evidence binding。
2. 通过已验证 binding 和稳定排除原因编译被 Git 忽略的本地 AA seed。
3. 编译带版本 AA 能力档，并按 price、latency 和稳定 identity 解析同档 route。
4. 用固定结构化语义 Task Assessor 取代关键词分类。
5. 端到端集成新决策路径和术语，同时保留已接受 UI 行为和 Manual 模式。

详细依赖和验收在 [roadmap](docs/zh-CN/roadmap.md)、[实施计划](tasks/plan.zh-CN.md)和[任务清单](tasks/todo.zh-CN.md)中。

## 当前阻塞与开放决策

开始 Task 2 没有实现层面阻塞。最终确定 catalog 和能力档 resolver 前，维护者需要评审或选择：

- Light、Standard、Deep 使用的 AA capability field 与带版本边界；
- 权威 AA price field 和 latency tie-break field；
- 本地 seed 中 DSH route 的初始已评审 AA evidence binding。

稳定 AA 获取、数据分发权利、Session 内自适应、恢复、子 Agent 路由和官方 DSH 兼容属于后续阶段，不阻塞阶段 1。

## 下一步

把 Task 2 作为一个有边界变更实施：通过阶段 1A 已验证 binding 编译被 Git 忽略的本地 seed，以稳定原因排除无效或未匹配 row；完整阶段 1 catalog 路径就绪前，保留现有 MVP 行为。

## 状态维护规则

- 完成重要结果、出现阻塞、关闭阶段 gate 或改变下一步时更新本文件。
- 产品要求放在 `docs/spec.md`，组件行为放在 `docs/architecture.md`，策略放在 `docs/routing-policy.md`，实施顺序放在 `docs/roadmap.md`。
- 保留被取代 ADR 作为历史记录。
