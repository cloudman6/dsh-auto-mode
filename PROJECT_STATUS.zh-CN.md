<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: 0f1b0ffccf00a3652bee7ad3bf80206d2362c142
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-15

## 当前阶段

阶段 0 关键路径执行。维护者已于 2026-08-15 接受 `docs/spec.md` 与 ADR-001 至 ADR-007。产品无关的 A1 pre-assembly step preparation 与 A2 Session 事件运行时注册已在明确声明的 DSH fork commit `801ded7f60a0dfab07b9690cb9d98fce6234d243` 上实现并通过测试。阶段 0C 本身仍受阶段 A 最小准入切片、A3p deployment identity 与 A5p 载体核验约束。

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
- 根据维护者明确授权，接受修订后的规范及 ADR-001 至 ADR-007。
- 在维护者 DSH fork 上实现 A1/A2，通过组合 JSONL 冷加载探针、402 项相关测试、typecheck、lint 与全部 28 项 DSH 文档 gate，并推送精确 fork commit。
- 准备尚未发布的双语 GitHub Discussions Ideas 提案，反馈产品无关的 A1/A2 Host 契约，并附可复现 fork 证据与明确的维护者问题。

## 当前实施入口

1. 为初始 baseline 与 candidate route identity 关闭 A3p。
2. 产出阶段 A 最小准入切片，并针对一个具体 preview 载体关闭 A5p。
3. 把 fork 固定在 `801ded7f60a0dfab07b9690cb9d98fce6234d243`；上游接受前不得宣称兼容官方 DSH。

## 进入阶段 0C preview planning 前的 gate

- 保持已实现的产品无关 A1 pre-assembly 与 A2 required-event 契约固定在明确 fork 上并持续通过测试。
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

规范 gate 已关闭。A1/A2 已不再阻塞 fork preview：它们已经在维护者 fork 上实现并通过测试，但尚未进入官方 DSH，因此仍是上游兼容依赖。A3p identity 证据、阶段 A 最小准入切片和 A5p 载体核验是剩余的阶段 0C 阻塞。完整恢复和外部 child model/reasoning-selection 控制继续推迟到后续路线图阶段。

## 下一步

关闭初始 route identity 的 A3p，产出阶段 A 最小准入证据，并为具体 preview 载体关闭 A5p。在准备拆分上游评审期间，持续针对固定 fork commit 验证 A1/A2。生产 release 载体仍是阶段 B/release 的独立决策。

## 状态维护规则

- 完成重要成果、出现新阻塞、关闭 gate 或改变下一步时更新本文件。
- 本文件只记录当前状态，不复制长期产品规范、完整架构或开放问题清单。
- 历史决策进入 ADR；长期范围和成功标准进入 `docs/spec.md`；未决问题进入 `docs/open-questions.md`。
