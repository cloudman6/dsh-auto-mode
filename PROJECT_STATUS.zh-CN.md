<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: bf92e677ed39d5c84efe03722eaf73aae5f45f6d
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-17

## 当前阶段

阶段 0P 快速原型实施与维护者 dogfood。现在已有可运行、零依赖的 `experimental-unadmitted` 插件，在固定 DSH fork `30c1198d2aaea9ae34e6901fd518607b5275b476` 上使用产品无关 A1/A2 seam 和可见 Auto 载体。它消费手工维护、本地且被 Git 忽略的 AA seed；执行确定性的 fast/standard/strong 策略；持久化并显示选择与解释；映射异常时回退到已配置的固定强模型；Manual 保持不变。本原型不修改也不满足推迟的生产准入、deployment identity、数据权利、恢复或官方兼容 gate。

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
- 完成初始阶段 0P route-selection 清单与 A3p 证据矩阵。六条显式 DeepSeek Flash/Pro selection 具有可复现 DSH fingerprint，但精确外部交集为空：Artificial Analysis record 绑定带版本 deployment，而 DSH 公开无 revision 的 pass-through alias。Default、dormant pi-ai route 与非公共 endpoint 同样排除。
- 实现刻意限定范围的阶段 0P 快速原型：12 项单元与真实 Loader 测试通过；Auto fast/strong 决策与实际 request header 一致；Manual 不变；`deepseek-v4-flash / off` 与 `deepseek-v4-pro / max` 的真实 provider 调用完成且 Session 证据匹配。
- 关闭限定范围的阶段 0P A5p 载体：模型菜单把带对勾的 `Auto` 放在手动控件上方，并在 Auto 状态卡片中明确标注实际模型/effort；任务运行时从 Session projection 更新该选择与解释；应用手动选择前先退出 Auto。决定变化时，投影会携带前一条 route，因此界面会把每个发生变化的模型和／或 effort 值在 1.2 秒内滚动到实际 route；Auto 和每个变化目标使用 DSH 业务蓝，以呼吸灯方式平滑亮灭两次后恢复默认颜色。浏览器回归覆盖仅模型、仅 effort 与二者同时切换。插件在当前用户消息之后、实际 request header 之前持久化每个 selection，因此聊天时间线也在这个区间记录变化字段的前值、箭头和蓝色有效值，未变化字段只显示有效值；它还记录层级、原因代码和解释，并位于产生结果的助手回复之前；首次 projection 保持静态。专项组件、会话节点、Loader 组合和无密钥 assembled-Web 测试已通过 fork commit `30c1198d2aaea9ae34e6901fd518607b5275b476`。

## 当前实施入口

1. 按 `docs/zh-CN/phase-0p-fast-prototype.md` 中的 Loader 配置 dogfood 四项验收的快速原型。
2. 仅在本地记录任务文本、所选档位、实际请求、延迟和用户结果，不把用户选择视为正确标签。
3. 只修复破坏 Auto 选择、route 分流、事件/请求一致性或 Manual 不受影响的缺陷。
4. 保持 fork 固定且所有结果明显标为 `experimental-unadmitted`；不得宣称 route admission、质量提升或官方 DSH 兼容。

## 推迟的生产级阶段 0P gate

快速原型不等待以下 gate。在宣称任何生产级或公开支持的 Auto 前，它们仍是必需条件：

- A1/A2 在固定 fork 上持续通过。
- 每个可选配置都有精确 A3p provider/model/reasoning-selection identity 和一项精确外部证据匹配。
- Artificial Analysis 数据通过本地提供、带版本且有 attribution，不进入仓库；任何 API credential 都必须留在浏览器 client 与仓库之外，并通过进程环境或 secret store 提供。
- 实验策略、持久状态和解释保留 `experimental-unadmitted` 状态，且不能编译为普通 admission。
- 持久化证明一个 Session decision 加每次 attempted Experimental Auto model call 的全新 fail-closed authorization，包括 cold load 后和 live identity/capability drift；手动模式绕过 Auto listener。
- ADR-009 已提供 accepted possible-loss bound，但带版本 Host provider 仍必须在每个可变 Auto 调用前证明干净 worktree isolation、Attempt attribution、containment、process control 与 `externalSideEffects: 'none'`；该证据存在前，阶段 0P dogfood 仅限只读。
- 限定范围的阶段 0P A5p 载体已经证明；阶段 0C 仍需 admission-aware 载体探针。
- Keyless 真实 composition 通过；所需 secret 可用时，自跳过的 with-key real-provider smoke 通过。缺少 key 记录为 evidence skipped，不算 pass。

## 进入阶段 0C preview planning 前的 gate

- 保持已实现的产品无关 A1 pre-assembly 与 A2 required-event 契约固定在明确 fork 上并持续通过测试。
- 预注册初始 Policy Pack taxonomy、基线/候选 deployment、统计方法、evaluator 治理和隔离数据集。
- 为初始 baseline 与 candidate 关闭 A3p，提供可复现的 provider/model/reasoning-selection identity 证据。
- 在已验证的阶段 0P A5p 载体上增加 admission-aware 断言，再把它作为阶段 0C preview 载体。
- 把阶段 0C 路由作用域固定为每 Session 一次决策；不引入尚未解决的 objective 边界启发式。

## 进入阶段 B 与生产 release planning 前的 gate

- 决定生产 release 载体：外部插件、DSH 上游 capability 或拆分架构。阶段 0C 的 fork preview 不会替代这项 release 决策。
- 把 A3p 与 A5p 泛化为受支持且兼容官方版本的 A3 identity 与 A5 client-extension 契约。
- 定义真实使用证据的同意、最小化、保留与删除策略。
- 决定生产实施计划包含哪些 Recovery Capability provider 和副作用类别。

## 当前阻塞

限定范围的快速原型不存在实施阻塞。此前识别的生产阻塞——绑定 deployment 的 A3 identity、可分发的外部证据合同、数据权利自动化、生产载体、完整恢复证据和 RouterBench 准入——继续推迟，不得重新变成原型阻塞。A1/A2 仍依赖固定 fork。

## 下一步

使用本地 AA seed 执行维护者 dogfood，并记录四项原型标准在普通任务中是否持续成立。下一次实施修改必须由其中一项标准的可复现失败驱动。生产合同研究保留在原 worktree 中，除非维护者明确改变范围，否则不得恢复该方向。

## 状态维护规则

- 完成重要成果、出现新阻塞、关闭 gate 或改变下一步时更新本文件。
- 本文件只记录当前状态，不复制长期产品规范、完整架构或开放问题清单。
- 历史决策进入 ADR；长期范围和成功标准进入 `docs/spec.md`；未决问题进入 `docs/open-questions.md`。
