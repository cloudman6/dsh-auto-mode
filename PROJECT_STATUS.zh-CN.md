<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: b810d15e7b46a08b62524aae1671ff05b145659f
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-21

## 当前阶段

阶段 0P MVP 和阶段 1 均已完成。项目已准备进入 MVP 后 roadmap 的阶段 2：冻结并实现固定语义 Task Assessor，为确定性 Host policy 提供结构化任务属性。

维护者 DSH fork 仍固定在 `2a2db7a6ec3ce9969857cc41de839f911ef5902e`。阶段 1 Task 1–3 现已提供 provider-neutral 实际配置 fingerprint、稳定 Host route identity、显式版本化 AA evidence-binding resolver、确定性本地 evidence-catalog compiler，以及 `aa-route-policy/v1` 能力档和价格优先 route resolution。当前可运行插件在阶段 3 集成新 catalog 与 assessor 路径前仍使用原型 `fast`/`standard`/`strong` 实现。

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
- 在不改变 live routing 的前提下实现 Task 2：维护者指定且被 Git 忽略的 JSON seed 针对当前 Host route inventory 编译为冻结、排序后的 evidence entry 和稳定 exclusion；格式错误、未匹配、有歧义、陈旧、跨配置及 capability 无效的 row 不会进入 catalog。
- 在不改变 live routing 的前提下完成阶段 1 Task 3 和 Checkpoint A：`aa-route-policy/v1` 固定 AA Intelligence Index `v4.1.1`、Light `<35`、Standard `35–<50`、Deep `>=50`、AA 7:2:1 混合价格和首次实际答案 token 中位时间。Capability 或 price 缺失时排除 route；同价时，缺失 latency 排在有测量值之后。
- 最终确定被 Git 忽略的本地 seed 和三条已批准当前 binding：DeepSeek Pro/off 属于 Light、Pro/high 属于 Standard、Flash/max 属于 Deep。Flash/off、Flash/high 和 Pro/max 保持排除，不给它们附加缺乏依据或有歧义的证据。

## 当前实施计划

1. 已完成：用混合 provider fixture 实现 provider-neutral Host route identity 与显式 AA evidence binding。
2. 已完成：通过已验证 binding 和稳定排除原因编译被 Git 忽略的本地 AA seed。
3. 已完成：编译带版本 AA 能力档，并按 price、latency 和稳定 identity 解析同档 route。
4. 下一步：用固定结构化语义 Task Assessor 取代关键词分类。
5. 后续：端到端集成新决策路径和术语，同时保留已接受 UI 行为和 Manual 模式。

详细依赖和验收在 [roadmap](docs/zh-CN/roadmap.md)、[实施计划](tasks/plan.zh-CN.md)和[任务清单](tasks/todo.zh-CN.md)中。

## 当前阻塞与开放决策

阶段 1 已无剩余阻塞；field 选择、边界、缺失数据规则和初始 binding 均已冻结并离线验证。

阶段 2 需要维护者选择固定 Task Assessor 的 provider/model/effort、有限输入契约、timeout 和 confidence threshold，之后才能接受 Task 4。

稳定 AA 获取、数据分发权利、Session 内自适应、恢复、子 Agent 路由和官方 DSH 兼容属于后续阶段，不阻塞阶段 1。

## 下一步

评审并冻结 Task 4 的 Task Assessor 配置与结构化契约，然后在 Auto 递归之外实现固定 assessor。

## 状态维护规则

- 完成重要结果、出现阻塞、关闭阶段 gate 或改变下一步时更新本文件。
- 产品要求放在 `docs/spec.md`，组件行为放在 `docs/architecture.md`，策略放在 `docs/routing-policy.md`，实施顺序放在 `docs/roadmap.md`。
- 保留被取代 ADR 作为历史记录。
