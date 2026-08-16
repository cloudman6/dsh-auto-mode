<!--
translation-source: docs/roadmap.md
translation-source-blob: 612e3dbf147e75c6c97004c14f8bd118769ebfa1
translation-status: current
-->

# 产品路线图

[English](../roadmap.md)

## 原则

路线图保留完整架构，但每层控制面都必须通过因果证据 gate。AI 实现能力不是约束；缺乏依据的质量承诺、不安全的 DSH seam 和控制面复杂度才是约束。只有本阶段的证据契约通过后才能继续推进。

## 阶段 0：关键路径 DSH enablement 与证据契约

这是最高优先级阶段。被审计的官方 DSH 版本缺少两个阻塞性 Host 契约；在它们出现前，Session Static Auto 无法被正确实现：

1. 作用域明确的 pre-assembly step-preparation seam：携带已领取消息和稳定 turn/step identity；能为依赖 provider 的组装与 `agent/request` 冻结同一 context；也能在模型调用前停止。
2. 必需插件 Session 事件的运行时注册与兼容处理：包括 schema/version 校验、namespace 冲突检测、冷加载注册顺序、插件缺失诊断和不兼容时 fail closed。

把普通产品交互冻结为两个选择：Auto，或者手动 provider/model/reasoning selection。定义 Policy Pack 所有权、基线绝对门槛、候选非劣性协议、`no-safe-route` 和 RouterBench 四个策略实验组。

### 阶段 0A：冻结上游契约

- 为两个阻塞契约编写范围窄且产品无关的 DSH 设计说明或 issue。DSH Core 不能理解 Auto Mode route 档位或 Task Assessment 语义。
- 实现前定义生命周期时序、取消、作用域、不可变性、持久化、冷恢复和失败行为。
- 增加 DSH contract test：在被审计版本上失败，在 fork 实现上证明目标行为。
- 建立一个纵向插件探针，证明当前消息在组装前驱动决策、同一 snapshot 到达 `agent/request`、`no-safe-route` 能阻止调用、必需事件能通过冷加载恢复。

### 阶段 0B：提交上游，或明确固定 fork

- Contract probe 通过后，把 pre-assembly 与事件注册拆成两个最小 PR。
- 若上游仍在评审或拒绝当前 API 形状，只在精确固定的 DSH fork 上继续验证，并明确声明不支持官方 DSH。
- 不把仅使用 `agent/request` 的原型或 ignorable Session 事件当成产品兼容 fallback。

### 阶段 0P：AA-seeded Experimental Auto

这是最早主动执行路由的 dogfood build，用来在 RouterBench admission 就绪前验证产品闭环。它仅限维护者、必须显式启用、固定在 fork 上，并明显标记 `experimental-unadmitted`；它不是阶段 0C preview，也不作质量、非劣性、官方兼容或公开支持主张。

只有满足 [ADR-008](decisions/0008-external-prior-experimental-auto.md)，阶段 0P 才能在没有阶段 A 最小准入切片的情况下推进：

1. A1 与 A2 在明确 fork 上持续通过。
2. A3p 把每个可选 DSH provider/model/reasoning selection 绑定到一项精确外部证据配置；分数不得在显式 effort、adapter-default 实体化与 provider-default omission 之间转移。
3. 通过本地方式提供带版本且有 attribution 的 Artificial Analysis snapshot；仓库不得内置数据、抓取网页或把 API key 暴露给客户端。
4. 确定性 Task Assessment 选择 index family，确定性 Host policy 选择语义实验档位；外部数据源不得选择最终 route。
5. 高风险、未知或低置信度 task assessment 只能从有效冻结 catalog 中选择最强精确匹配实验配置。无法匹配、identity 漂移、证据无效或缺失必需 Host contract 时，必须以 `no-experimental-route` 退出 Auto 且不调用模型。
6. A5p 验证一个具体载体，提供一次操作的 Auto/manual 控制和持久化实验解释。
7. 路由保持为每 Session 一次冻结决策。
8. Host 声明的 `RecoveryCapability` 是必需 policy input。[ADR-009](decisions/0009-phase-0p-attributable-worktree-loss-bound.md) 只接受当前 Attempt 在干净隔离任务 worktree 内产生且可归属的未提交变更。带版本 Host provider 证明该边界与 `externalSideEffects: 'none'` 前，包括 `strong` 在内的任何实验档都不得执行可变工作。任何外部 effect、未知 attribution、Git repository-state mutation、containment failure 或超出 bound 的 mutation 都会终止当前 Auto attempt。超出 bound 的 effect 必须在发生前被阻止；逃逸后的检测不构成 capability evidence。用户介入可以切换到 Manual 或等待新的 execution-world 声明；单纯确认不能授权被阻止的 Experimental Auto dispatch。

验收：

- 维护者可以显式启用 Experimental Auto，在固定 fork 上端到端完成任务，查看实际 provider/model/reasoning selection，并切回 Manual 模式。
- 冷加载能够重建同一决策、外部证据 snapshot identity、生效 request encoding 与 `experimental-unadmitted` 解释。
- 精确 identity 不匹配、不支持的 effort、过期或畸形证据以及 A1/A2 缺失，始终在请求前失败。只有 task-assessment fallback 可以选择最强精确匹配，且此时冻结 catalog、精确 identity 与必需 Host contract 必须仍然有效。
- 另行接受的 provider 设计冻结具体 runner/platform、支持的操作系统、dependency ownership、持久 journal 与精确 production capability/tool-entry inventory。Executor-level 真实 composition 测试覆盖每个 filesystem、Web、shell/terminal、background、Code Mode、hook、subagent、direct 与 alternate caller；未覆盖入口必须禁用。负向测试证明：外部 effect、ambient-credential 暴露、dirty-start drift、Git repository-state 或 helper mutation、未分类命令、路径、symlink、hard-link 或 mount 逃逸、process leakage、超出 ADR-009 bound 的每项 mutation，以及 attribution support 不充分或不可重建的情况，都会在 effect 发生前被阻止，并在下一次模型调用前终止 Experimental Auto。具体 execution-world provider 通过这些测试前，包括 `strong` 在内的任何实验档都不得执行可变工作；确认动作不能到达 provider dispatch。
- Repeated-step 与 cold-load 测试证明一个 Session decision 被复用，而每次 attempted Experimental Auto call 都产生新的 authorization；identity、Host contract、evidence freshness、provider 或 Recovery Capability 漂移会拒绝调用且不重新路由。切换手动会绕过 Auto listener，并保留现有 manual request path，不消费 claimed turn。
- 测试证明 Artificial Analysis 记录本身不会成为普通 admission，也不能进入阶段 0C Effective Route Catalog。
- 仓库不包含 Artificial Analysis credential 或再分发的榜单数据集。
- 自跳过、带 credential 的 real-entry smoke 通过 DSH 加载生产插件，在 key 存在时调用选定 provider，并验证外部 response 与持久化 `request/header` 的 provider/model/reasoning selection 一致。缺少 key 是明确 skip，不算 pass。

Dogfood 结果可以帮助设计 RouterBench taxonomy 与 fixture，但不能被当作 held-out 证据，也不能直接提升为 Policy Pack admission。

### 阶段 0C：基于 fork 的 Static Auto Preview

这是最早可供用户实际使用的 Auto 模式。它是在明确声明的 DSH fork 上运行的 dogfood preview，不是兼容官方 DSH 的 release。只有满足以下条件才能启动：

1. 规范与适用的 Proposed ADR 已被接受。
2. A1/A2 在 fork 上通过 DSH contract test，组合纵向探针通过。
3. 阶段 A 的最小证据切片准入一个 baseline 与一个 candidate，且 A3p 把两项 admission 绑定到可复现的 provider/model/reasoning-selection deployment identity。Identity 未知或发生漂移时，Auto 服务请求前必须撤销该 route。
4. A5p 验证一个具体 preview 载体，能够以一次操作完成 Auto/manual 选择，并读取持久化的生效配置与解释。
5. Preview 路由作用域固定为每 Session 一次决策。Objective 级重新计算必须等到 Host 拥有的 objective 边界形成另一项 accepted 契约。

每个 preview build 都必须固定 fork remote、包含 seam 实现的精确 commit、初始 route identity 证据和 preview 载体版本。

Preview 交付：

- 用户只需一次操作选择 Auto，同时保留现有的手动 provider/model/reasoning-selection 路径。
- 对范围收敛且已经准入的任务切片提供 Session Static Auto；Session 进入 Auto 时决策一次，并在该 Session 内复用。阶段 0C 中，开始需要新自动决策的另一项任务必须新建 Session。
- 从 DSH advisory active provider/model catalog 保守发现自动候选。显式 effort 必须匹配精确 route 元数据；adapter-default 与 provider-default omission 是具有各自 admission identity 的不同 reasoning selection。候选数量不硬编码；preview 只在“已发现配置、稳定 identity 证据、用户与 capability 约束、当前 preview 准入”的交集中选择。
- 至少为一个初始任务切片准备一个已准入 baseline 和一个已准入 candidate。这是证明系统确实进行选择所需的最低证据，不是产品只能支持两项配置。
- 提供确定性 Task Assessment；只有 A4 审计证明 preview 存在有界且可审计的调用路径时，才增加固定且不受递归路由的 assessor。
- 持久化具有因果顺序的决策输入、实际 provider/model/reasoning selection、request encoding 和 reason code，提供紧凑解释与显式 `no-safe-route` 行为。

Preview 不宣称支持 turn 内切换、恢复、child-agent 路由、社区 Policy Pack、在线学习或官方 DSH 兼容。只有新增已发现配置与任务切片各自取得当前 preview 准入证据后，才可扩展覆盖面。

验收：

- 用户可以只选择一次 Auto，并在固定 fork 上端到端完成受支持任务。
- 已验证的 preview 载体保留手动 provider/model/reasoning selection，并能读取实际请求对应的持久解释。
- DSH catalog 变化会刷新部署 Profile，无需手工维护重复模型列表。
- 测试证明：DSH 中可用但未准入的配置绝不会被 Auto 选择。
- 测试证明：deployment identity 未知或变化时会撤销 preview route；若不再存在已准入 baseline，则以 `no-safe-route` 停止调用。
- 测试覆盖显式 effort、adapter-default 实体化和 provider-default omission，不得合并三者的 identity。
- 同一 Auto Session 的重复 step 复用同一 Session Static 决策；不允许未记录的 objective 边界启发式触发重新计算。
- 持久 Route Snapshot 与解释可以重建实际发出的配置。
- A1/A2 缺失或不兼容时，Auto 在服务请求前失败。

### 并行基础核验

进入阶段 B 前，把 preview 专用的 A3p identity 证据泛化为 A3 声明的官方兼容 identity 契约，并把 A5p 泛化为 A5 支持的 client extension 契约。同时关闭固定 Task Assessor 调用所需的可扩展 purpose/审计分类。每项必须归类为已有支持、插件内实现、provider 专用实现或需要另一项上游 seam。固定 fork 的 preview 路径通过，不能独自证明已存在官方兼容契约。

验收：

- DSH 兼容文档固定到源码，并明确支持的官方版本或 fork。
- 两个阻塞契约都有可执行 DSH 与插件 contract test。
- 纵向探针证明 assembly/request snapshot identity，以及必需插件状态的冷恢复。
- 不支持或不兼容的 seam 在 Auto 服务请求前失败。
- 其他 Static Auto 依赖都已核实所有者，不把未验证假设表述成现有 DSH 功能。

不依赖运行时 seam 的阶段 A 证据工作可以并行。阶段 0C 可以在自身较窄的进入 gate 通过后启动，但不会因此关闭阶段 0。完整阶段 0 exit gate 通过前，阶段 B 不能作为兼容官方版本的产品实现启动。

## 阶段 A：Route Capability Bench 与 Policy Pack

建立能力分类、相互隔离的校准/验证/留出数据集、evaluator 协议、deployment profile 和准入生命周期。任何较弱配置获准前，至少要有一个已准入基线。

验收：配对报告能识别通过绝对与非劣性门槛的任务切片；alias、指纹缺失、证据过期或基线失败会撤销准入。

## 阶段 B：兼容官方版本的 Session Static Auto

把阶段 0C 实现迁移并泛化到已声明支持的 DSH 契约。在阶段 A 已准入范围内，补全 Task Assessment、Constraint Resolver、Routing Policy、Effective Route Catalog、Route Snapshot Coordinator、显式解析失败、决策持久化和透明解释。除非另一项 Host-owned objective-boundary 契约已经 accepted 并通过 contract test，否则继续保持每 Session 一次决策；不宣称具备 turn 内自适应。

验收：在线执行与 RouterBench 使用同一策略；依赖 route 的 prompt/tool 组装和 provider 调用消费同一冻结 snapshot；Auto 不会静默回退到未经准入的 route。

## 阶段 C：Policy Scenario Bench 与 turn 内路由证据 gate

建立确定性场景仿真和真实 DSH adapter contract test。比较 Session Static Auto 与可信 phase 的 Within-turn Auto，并计入 cache 损失、切换成本、phase 不确定性和大 turn 尾部工作。

验收：只有 turn 内路由带来实质端到端增量收益且继续通过质量门槛时，才进入产品范围。否则产品保持 Session Static Auto，同时保留完整架构设计。

## 阶段 D：路由安全与 Continue

加入形式化 Recovery Signal、持久 episode、route floor、恢复能力声明、恢复失败处理和同 Session Continue。本阶段限制路由选错的损失，不宣称具备通用工作区回滚。

验收：重复失败会升级；不可信的模型自报不能关闭 episode；未知修改或外部副作用会阻止不安全降级与恢复承诺。

## 阶段 E：隔离执行与完整恢复

只对已经声明并测试恢复支持的副作用类别加入 Checkpoint Provider、隔离 attempt、Evidence Capsule、salvage 和 restart。

验收：故障注入证明已支持的有害副作用不会逃逸；不支持的副作用进入显式停止或用户介入状态，不提供虚假的回滚承诺。

## 阶段 F：子 Agent 约束

为进程内 child 实现持久语义 RoutingConstraints 和 Host 冲突解决。只有外部 provider 的创建与切换契约暴露所需 route 控制时才支持它。

验收：父 Agent 提议不能绕过 Host 约束；接受与拒绝可审计；冷恢复后仍保留有效 child 约束。

## 阶段 G：真实使用校准

在明确同意、数据最小化、保留期控制和可撤销的前提下收集客观运行证据，更新任务分布、准入阈值和 Policy Pack。真实活跃用户和成功 Auto 任务的留存是产品结果；遥测量不是。

## 暂不启动的方向

- 通用 Subagent Scheduler。
- 组织级预算、审批和配额平台。
- 自动训练 Router 模型。
- 插件市场和通用模型榜单服务。
- 对未声明或不支持副作用的自动回滚。
