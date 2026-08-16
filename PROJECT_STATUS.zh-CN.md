<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: 0fec2d01c5d1b69a2831aa5f4873dcb4dfad480d
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-16

## 当前阶段

阶段 0P 规划与关键路径执行。维护者已于 2026-08-16 接受 ADR-008 与 ADR-009，允许运行仅限维护者、明确未准入且由 Artificial Analysis 提供先验的 dogfood 路径，并接受当前 Attempt 在干净隔离 worktree 内产生且可归属的变更这一狭窄 possible-loss envelope。产品无关的 A1 pre-assembly step preparation 与 A2 Session 事件运行时注册继续固定在 DSH fork commit `801ded7f60a0dfab07b9690cb9d98fce6234d243` 并通过测试。阶段 0C 仍独立受阶段 A 最小准入切片、A3p deployment identity 与 A5p 载体核验约束。

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
- 增加仓库内 Code Review Skill，在每个有边界的实施阶段按已接受的 Auto Mode 不变量与固定版本的 DSH 官方工程契约执行 gate。
- 将双语的产品无关 A1/A2 Host 契约提案发布为 DeepSeek Harness [Discussion #2281](https://github.com/deepseek-ai/deepseek-harness/discussions/2281)，并附可复现 fork 证据与明确的维护者问题。
- 接受 ADR-008 并增加阶段 0P，允许由外部先验驱动、明显标为未准入的维护者 dogfood，同时不削弱阶段 0C 的 admission 要求。
- 接受 ADR-009 的初始可变工作 loss bound：当前 Attempt 在干净隔离 worktree 内产生且可归属的全部未提交变更；不允许外部 effect，也不宣称自动恢复。

## 当前实施入口

1. 盘点精确 DSH 与 Artificial Analysis 配置，为首组 Experimental Auto route 关闭 A3p。
2. 冻结外部证据 snapshot schema、精确匹配规则、启发式策略与数据权利边界。
3. 实现每 Session 一次决策的阶段 0P 路径，并针对一个具体载体关闭 A5p。
4. 把 fork 固定在 `801ded7f60a0dfab07b9690cb9d98fce6234d243`；不得宣称 route admission 或官方 DSH 兼容。

## 进入阶段 0P dogfood 前的 gate

- A1/A2 在固定 fork 上持续通过。
- 每个可选配置都有精确 A3p provider/model/reasoning-selection identity 和一项精确外部证据匹配。
- Artificial Analysis 数据通过本地提供、带版本且有 attribution，不进入仓库；任何 API credential 都必须留在浏览器 client 与仓库之外，并通过进程环境或 secret store 提供。
- 实验策略、持久状态和解释保留 `experimental-unadmitted` 状态，且不能编译为普通 admission。
- 持久化证明一个 Session decision 加每次 attempted Experimental Auto model call 的全新 fail-closed authorization，包括 cold load 后和 live identity/capability drift；手动模式绕过 Auto listener。
- ADR-009 已提供 accepted possible-loss bound，但带版本 Host provider 仍必须在每个可变 Auto 调用前证明干净 worktree isolation、Attempt attribution、containment、process control 与 `externalSideEffects: 'none'`；该证据存在前，阶段 0P dogfood 仅限只读。
- A5p 证明一次操作的 Auto/manual 控制与解释读取。
- Keyless 真实 composition 通过；所需 secret 可用时，自跳过的 with-key real-provider smoke 通过。缺少 key 记录为 evidence skipped，不算 pass。

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

阶段 0P 决策 gate 与初始可变工作 loss-bound 决策已经关闭。剩余实施阻塞是精确初始 route set 与 A3p 映射、外部证据 snapshot 和启发式策略契约、已接受的具体 execution-world provider 设计及其冻结 production tool inventory 所需的可执行 ADR-009 Recovery Capability 证据，以及一个已验证 A5p 载体。Provider 设计与 capability evidence gate 关闭前，阶段 0P dogfood 仅限只读。A1/A2 已在维护者 fork 上实现，但仍是上游兼容依赖。阶段 A 最小准入切片有意从阶段 0P 推迟，继续作为阶段 0C 阻塞。完整恢复和外部 child model/reasoning-selection 控制继续推迟。

## 下一步

执行已接受的阶段 0P 实施计划：先冻结精确 DSH/Artificial Analysis route 清单与 A3p 证据矩阵，再建立外部先验 schema、不可变实验 resolution contract 与确定性 policy。先审计并明确接受具体 ADR-009 provider 设计，再针对冻结 production tool inventory 实现和证明它；Host/A5p 集成期间可以先使用只读 fixture。持续针对固定 fork 验证 A1/A2，并异步跟进 Discussion #2281。RouterBench admission 仍是阶段 0C 的下一道 gate，而不是阶段 0P 前置条件。

## 状态维护规则

- 完成重要成果、出现新阻塞、关闭 gate 或改变下一步时更新本文件。
- 本文件只记录当前状态，不复制长期产品规范、完整架构或开放问题清单。
- 历史决策进入 ADR；长期范围和成功标准进入 `docs/spec.md`；未决问题进入 `docs/open-questions.md`。
