<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: c35962bebac046df987bb7b01a85f6fdfea52e01
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-14

## 当前阶段

多视角修订后的规范评审。仓库已形成修订后的产品、证据、架构、DSH 集成和恢复设计，但用户尚未接受 `docs/spec.md` 或 6 项 Proposed 产品/架构 ADR。定义文档语言的 ADR-005 仍为 Accepted。实施计划、依赖选择和编码继续受 gate 限制。

## 已完成

- 建立 Git 仓库，以及英文权威、简体中文持续维护的文档工作流。
- 完成架构、评价、对抗、用户体验、可行性和元评审，并把信息性结论记录到 `docs/zh-CN/reviews/2026-08-14-multi-view-design-review.md`。
- 把普通 UX 修订为 Auto 或手动 provider/model/reasoning selection 两种选择；校准由 Policy Pack 维护者负责。
- 用基线绝对门槛、候选非劣性、严重失败率边界、证据隔离、准入过期和撤销替代只做相对比较的质量主张。
- 把 RouterBench 分为 Route Capability Bench 和 Policy Scenario Bench，并为 Static、Within-turn 与 Full Auto 增加策略消融实验。
- 增加 Route Snapshot 时序、显式 route 解析失败、形式化持久状态、带 provenance 的恢复信号和 Recovery Capability gate。
- 审计 DeepSeek Harness commit `47f943859bef60e4160492346772ded9b24f765a`，在 `docs/zh-CN/dsh-integration.md` 中记录可用 seam 与阻塞缺口。
- 核实 DSH provider/model discovery 与可选的精确 route reasoning 元数据 seam，记录维护者 fork 作为 preview 运行时载体，并把基于 fork 的 Static Auto Preview 加入阶段 0C。
- 关闭 fresh-context 评审指出的因果顺序、reasoning default、确定性解析、preview identity、preview 载体和 planning gate 矛盾，同时不改变 ADR 状态。
- 修订 ADR-001 至 ADR-004，新增 Proposed ADR-006 和 ADR-007，没有把任何 Proposed 决策改成 Accepted。

## 当前评审入口

1. 按 `docs/zh-CN/README.md` 列出的顺序评审修订后规范文档。
2. 评审 `docs/zh-CN/decisions/` 中 6 项 Proposed ADR；只有用户明确确认后才改变状态。
3. 把历史多视角报告视为评审证据，不把它当成经验验证。

## 进入阶段 0C preview planning 前的 gate

- 明确接受修订后的产品规范。
- 处理 6 项 Proposed ADR 状态。
- 冻结产品无关的 A1 pre-assembly 与 A2 required-event 契约，包括先失败、后通过的 contract test。
- 预注册初始 Policy Pack taxonomy、基线/候选 deployment、统计方法、evaluator 治理和隔离数据集。
- 为初始 baseline 与 candidate 关闭 A3p，提供可复现的 provider/model/reasoning-selection identity 证据。
- 关闭 A5p，验证一个具体 preview 载体能够提供 Auto/manual 选择与持久解释。
- 把阶段 0C 路由作用域固定为每 Session 一次决策；不引入尚未解决的 objective 边界启发式。

## 进入阶段 B 与生产 release planning 前的 gate

- 决定生产 release 载体：外部插件、DSH 上游 capability 或拆分架构。阶段 0C 的 fork preview 不会替代这项 release 决策。
- 把 A3p 与 A5p 泛化为受支持且兼容官方版本的 A3 identity 与 A5 client-extension 契约。
- 定义真实使用证据的同意、最小化、保留与删除策略。
- 决定生产实施计划包含哪些 Recovery Capability provider 和副作用类别。

## 当前阻塞

设计 gate 仍未关闭。此外，被审计 DSH 版本缺少 proposed 外部插件需要的两个契约：规范 Session 事件的运行时注册，以及携带当前 step 已领取消息的 pre-assembly 决策输入。它们是 Session Static Auto 的阶段 0 关键路径，不是可以推迟的后期优化。完整恢复和外部 child model/reasoning-selection 控制同样缺乏通用契约，但对应 roadmap phase 可以不进入首个产品行为。

## 下一步

评审修订后的规范与 ADR，然后冻结 `docs/zh-CN/roadmap.md` 中产品无关的 A1 pre-assembly 与 A2 required-event 契约。同时，为初始 route identity 关闭 A3p，并为具体 preview 载体关闭 A5p。该组 preview 专用 gate 通过后，才能开始阶段 0C planning。生产 release 载体仍是阶段 B/release 的独立决策。

## 状态维护规则

- 完成重要成果、出现新阻塞、关闭 gate 或改变下一步时更新本文件。
- 本文件只记录当前状态，不复制长期产品规范、完整架构或开放问题清单。
- 历史决策进入 ADR；长期范围和成功标准进入 `docs/spec.md`；未决问题进入 `docs/open-questions.md`。
