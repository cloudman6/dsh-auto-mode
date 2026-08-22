<!--
translation-source: docs/dsh-integration.md
translation-source-blob: fe3e2e677b105cfcc28829f282ffa521f2ebf17f
translation-status: current
-->

# DSH 集成与兼容性

[English](../dsh-integration.md)

## 审计范围

本文记录 2026-08-14 对 DeepSeek Harness commit [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a) 的源码审计。它是关于该版本的证据，不是对后续 DSH 版本的兼容承诺。

插件必须固定到精确测试过的 DSH 版本或 commit，并通过扩展契约测试后才能声明兼容。

## 当前 fork preview 运行时载体

当前 preview 运行时载体是维护者的 fork [`cloudman6/deepseek-harness`](https://github.com/cloudman6/deepseek-harness)；2026-08-14 核验时，其 `master` 位于本次审计的基线 commit。随后从该基线实现了产品无关的 A1/A2 契约，再在不改变这些契约的前提下增加实验性 Auto UI。分支 `codex/auto-mode-host-contracts` 固定在精确 commit [`9c163d4086d6f12e9a2c8f4151358a9e66955ac1`](https://github.com/cloudman6/deepseek-harness/commit/9c163d4086d6f12e9a2c8f4151358a9e66955ac1)。

产品无关 seam 与 fork 证据已于 2026-08-16 发布到 DeepSeek Harness [Discussion #2281](https://github.com/deepseek-ai/deepseek-harness/discussions/2281)，用于获取上游设计反馈。发布不代表维护者接受，也不代表兼容官方 DSH。

每个 preview build 必须记录精确 fork remote 和包含 seam 实现的 commit。它只能标识 Host build，不能标识远程模型 deployment。依据 ADR-011，实际 Host route 显式绑定到一条 AA evidence record，同时保留 semantic-match 限制；该 binding 不是 provider deployment fingerprint。公共兼容契约绝不包含本地 checkout 路径；fork 验证成功也不能表述成官方 DSH 支持。

具体 preview 载体现在是 fork 模型选择 UI 加插件的可选 Session projection 与 `/auto` 命令。它提供一次操作的 Auto/manual 选择、Auto 对勾状态、实际模型与可选 effort、本地化 Light/Standard/Deep 任务处理级别、AA 或配置 Deep fallback 依据、适用时的准确 AA snapshot，以及持久化解释。决定变化时会携带前一条 route，使界面只把发生变化的 model、effort 或 level 值在 1.2 秒内滚动到实际选择；Auto 和变化目标使用 DSH 业务蓝，呼吸两次后恢复默认颜色。聊天时间线会把前后 route 与任务处理级别，以及依据、source snapshot、原因代码和解释记录为路由事实，紧跟在触发它的用户消息之后、产生结果的助手回复之前。UI 明确 AA 是启发式证据，而不是本项目 Benchmark 验证；生产载体仍未决定。

阶段 3 插件契约中，`mode: auto` 要求提供 inline `seed` 或 `seedPath`。`aa-evidence-catalog/v1` seed 会启用阶段 3 pipeline。可选 `hostRoutes` 是提议 request configuration 的明确 allowlist；省略时，插件从当前 DSH discovery 派生 candidate。每个 candidate 仍必须经过 `resolveCallConfig()` 物化。可选 `deepFallback` 提议一条精确配置 fallback，只有其物化 identity 仍属于合格 Host 集合时才能使用。插件不定义这些配置值属于全局、项目还是 Session；该 carrier scope 仍是开放产品决策。历史阶段 0P seed shape 作为 schema v1 兼容路径保留；维护 client 只在回放这些旧事件时映射其原型 tier。

### Fork 契约证据

固定 fork commit 在 inbox claim 后、prompt assembly 前增加 agent-scoped `agent/prepare-step` waterfall，同时保留现有 assembly 后的 `agent/pre-step`。它还在 `SessionStore` 中增加 effect-scoped required-event namespace 注册、不可变 namespace/version envelope identity、append-time 校验，以及 Session 冷重建前的精确 registration 校验。

组合 JSONL 探针在 `agent/prepare-step` 中修改所选模型，验证 prompt assembly 与 `agent/request` 使用同一模型，持久化必需插件决策事件，在 registration 缺失时拒绝冷加载，并在恢复精确 registration 后成功加载。2026-08-15 的验证通过 402 项相关测试、`pnpm typecheck`、`pnpm lint` 与 `pnpm doc-sync` 全部 28 项 gate。

阶段 3 Task 6 在不改变 A1 或 A2 的情况下增加插件侧 composition 证据。针对同一固定 commit，78 项项目测试覆盖动态 route discovery 与精确物化、三档、同一决策跨 tool step 复用、单调升级、配置 fallback、dispatch 前明确 failure、Manual 不受影响，以及使用相同 route 与解释的真实持久 Session cold reconstruction。`resume()` 读取 Session 前必须已经存在必需 namespace registration；已验证 cold 路径会先激活插件，再以编程方式 resume。在更早 composition layer 内、Auto 插件注册前就 resume 的 declarative root 不属于已测试 ordering，不能声明支持。

阶段 3 Task 7 只更新外部插件 projection 与 fork UI 载体。Schema v2 append validation 拒绝原型 tier，同时 schema v1 replay 仍可读取。完整 fork GUI suite 通过 3,767 项测试、1 项 skip；针对本机 Chrome 的聚焦已构建浏览器 replay 通过中英文 snapshot，以及仅 model、仅 effort、二者同时和仅 level 变化的动画场景。完整仓库 Web suite 仍需要其配置的 Playwright 浏览器 artifact，而验证环境中缺少该 artifact。

阶段 3 Task 8 固定 fork commit `9c163d4086d6f12e9a2c8f4151358a9e66955ac1`。一个可选跨仓库无密钥 fixture 会把外部插件挂载到已构建 Web scaffold，并通过真实浏览器、agent loop、Session event 与 request header 驱动 Light、Standard、Deep 和 Manual。它证明 Standard 内先比较价格、再比较延迟，并证明界面显示的 route 与 AA snapshot、持久化 selection 和实际请求配置完全一致。完整 fork GUI suite 再次通过 3,767 项测试、1 项 skip；4 个聚焦浏览器场景、build、lint、Host 与 Client type check 及全部 28 个文档 gate 均通过。环境中没有 provider credential，因此不声明阶段 3 新 live-provider 结果。

该证据只关闭固定 fork 的 A1/A2 与限定范围的 MVP 载体。它不代表兼容官方 DSH，也不决定生产载体。

## 已核实可用的 seam

### 每 step 请求配置

作用域内 `agent/request` waterfall 可以替换每个 step 的完整 `LlmCallConfig`，包括 provider、model 和 adapter 定义的 reasoning effort。loop 解析提议配置，把生效值记录到 `request/header`，再发送冻结请求。参见[事件契约](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent/src/runtime-types.ts#L232-L245)和[请求构建](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent-loop/src/agent.ts#L407-L482)。

该 seam 足以应用已经冻结的 route，但自身不足以决定当前 step 的 route，因为 prompt/tool 组装已经完成。

### 组装与请求之间的模型选择一致性

DSH 导出 `installModelSelection()`：在 `system-prompt/assemble` 期间捕获一份可变选择，并在 `agent/request` 应用同一选择。这样并发切换不会让依赖 provider 的 prompt 组装与实际请求使用不同模型。参见 [`model-selection.ts`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent/src/model-selection.ts#L1-L78)。

Auto Mode 应复用或泛化该 snapshot 机制，不应建立第二条相互竞争的所有权路径。

### Provider、model 与 effort discovery

DSH 已经提供 provider-neutral runtime discovery：`listProviders()` 枚举 active adapter route，`listModels(provider)` 返回各 adapter 的建议性模型目录，`resolveModelInfo(provider, model)` 返回精确 route 元数据，并可能暴露 adapter 拥有的 reasoning effort；`llm/adapters-updated` 则通知 consumer 在 topology 变化后刷新。参见 [`LlmRuntime`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/index.ts#L415-L421)、[catalog 与精确模型解析](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/index.ts#L575-L624)、[topology event](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/types.ts#L12-L24)，以及[可选 reasoning 元数据](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/llm/llm/src/types.ts#L252-L280)。

Auto Mode 应通过这些 seam 填充具体 route 清单，并在 topology 变化时刷新。DSH 明确定义 catalog membership 只具有建议性，因此 discovery 只能证明当前可用性元数据，不能证明质量或完整性。ADR-011 为每条已发现 route 的实际配置生成 fingerprint，通过一条经过评审的 AA evidence binding 连接，再应用 Host capability 与用户约束。

Reasoning 元数据是可选的。显式 effort 只有在精确 route 元数据列出该 effort 时才有资格。若 adapter 暴露 `defaultEffort`，调用方省略 effort 会产生 adapter 实体化的默认值，并记录其精确 effort。若没有 adapter default 被实体化，省略 effort 会保留 provider-default 行为。这些 request 语义仍是不同 Host route identity；Auto 不能因为元数据缺失就虚构 effort。除非 Host 能可靠物化实际值，否则 provider-default route 不能绑定到 effort-specific AA record。手动模式仍可在正常 DSH 校验下暴露显式输入的配置。

### 进程内 child 执行

进程内 child 以普通 DSH Agent 创建，因此进入同一个 Agent loop。`SubagentStartRequest.agentOptions` 可以携带具体 Agent options，但请求中没有语义路由约束契约。参见 [`SubagentStartRequest`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent/src/types.ts#L100-L154)和[进程内 driver](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-in-process-driver/src/index.ts#L99-L143)。

现有委派 helper 会持久化 sandbox 与 approval policy，证明 child 本地持久策略是受支持模式。它们不会持久化 Auto Mode 的风险、最低任务处理级别、多样性或延迟约束。

## 已在固定 fork 上解决的基线缺口

### 当前 step 的决策输入晚于组装

loop 先领取待处理消息并组装 system prompt，然后才调用 `agent/pre-step`；`agent/request` 更晚。参见 [`preStep()`](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/agent-loop/src/agent.ts#L225-L245)。

只有在组装前已经决定 `selection.current` 时，`installModelSelection()` 才能保证 snapshot 一致。Auto 策略如果需要新领取的用户消息，无法从当前 `system-prompt/assemble` 契约获得该消息。在 `agent/pre-step` 更新选择，对同一 step 来说已经太晚。

Fork 解决方案：`agent/prepare-step` 现在会在 assembly 前接收冻结的已领取消息、稳定 turn/step identity 与取消信号。拒绝会阻止 assembly 与模型 dispatch；`installModelSelection()` 会把 preparation 阶段的选择同时 snapshot 给 assembly 与 `agent/request`。官方 DSH 仍缺少该契约。

### 必需插件 Session 事件无法在运行时可靠注册

持久化读取器检查由仓库生成的本地已知事件集合。生成器明确说明，下游插件事件不在集合中，而且注册接口尚未提供。未知必需事件在冷加载时会被拒绝，除非标为 ignorable。参见[生成事件表](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/core/session/src/known-event-types.ts#L1-L19)和[持久化契约测试](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/session/session-persistence/tests/coordinator-contract.ts#L1360-L1384)。

Fork 解决方案：`SessionStore.registerEventNamespace()` 现在会绑定 namespace、owner、精确正整数 schema version 与完整 payload-schema map。必需插件事件会在 append 前校验并带上 identity；冷读取要求精确 live registration，遇到缺失、畸形、不兼容、未声明或无效事件时会在重建前失败。官方 DSH 仍缺少该契约。

## 已核实的阻塞或不完整 seam

### Child 路由约束不是一级持久契约

`agentOptions` 允许调用方传具体 options，但不能表达或验证风险、最低任务处理级别、独立评审、截止时间或模型家族多样性等语义意图。Auto Mode 需要由 Host 解析的持久约束契约；raw `agentOptions` 不能替代它。

外部 Codex 和 Claude Code provider 也没有通过该 subagent seam 暴露请求级 model/effort 选择。其文档行为是把模型选择交给原生产品配置：[Codex provider](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-codex/README.md#L28-L30)和 [Claude Code provider](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/packages/subagent/subagent-claude-code/README.md#L63-L65)。

### 通用恢复能力尚未建立

本次审计涉及的 seam 没有建立工作区 checkpoint/restore、修改归因、外部副作用回滚或同 Session 模型 handoff 的通用契约。这些是必须明确提供的能力，Auto Mode 不能从文件系统访问或工具访问中推断它们存在。

实施计划必须为每项已声明 `RecoveryCapability` 找到明确的上游或组合 provider；否则 salvage/restart 和有修改工作的降级不可用。

## 上游依赖 Track 与优先级

A1 与 A2 已在维护者 fork 解决。其他需求只在消费它们的 roadmap 阶段引入。

| Track | Capability | 所需阶段 | 审计状态 | 预期所有者 |
|---|---|---|---|---|
| A1 | 与 `agent/request` 共享的 pre-assembly step context | Session Static Auto | 已在固定 fork 实现并通过测试；上游缺失 | DSH 上游 |
| A2 | 必需插件 Session 事件注册与兼容处理 | Session Static Auto | 已在固定 fork 实现并通过测试；上游缺失 | DSH 上游 |
| A3p | 带版本的 Host-route-to-AA evidence binding | 阶段 1 AA catalog | DSH selection 清单存在；ADR-011 把实际 Host route identity 与 AA evidence identity 分开 | 插件 |
| A3 | 可选 resolved deployment fingerprint | 未来要求精确 deployment identity 的声明 | 需要专项审计；不在当前关键路径 | Provider adapter 或 DSH 上游 |
| A4 | 固定辅助调用的可扩展 purpose 与审计分类 | Task Assessor 运行 | 需要专项审计 | 接口开放时由插件实现，否则 DSH 上游 |
| A5p | Auto/manual 与持久解释所需的一个已验证载体 | 阶段 1–3 可用性 | 任务处理级别、精确 route 事实、AA/fallback 依据、动画与旧版 replay 已在固定 fork 验证 | Fork UI 加插件 Session projection 与命令 |
| A5 | 通用 Auto/manual 与解释 UI 扩展契约 | 兼容官方版本且面向用户的发布 | 需要专项审计 | 客户端插件或 DSH 上游 |
| B1 | 语义约束所需的持久类型化 child-creation metadata | 进程内 child 路由 | 已核实不完整 | 通用 DSH seam 加插件 schema |
| B2 | 外部 subagent 创建时 model/effort capability | 外部 child 路由 | 被审计 provider 已核实缺失 | Provider adapter；需要时增加共享 capability 声明 |
| C1 | 结构化 validation、mutation、provenance 和 trust signal | 路由安全与恢复 | 跨工具不完整 | Capability adapter，必要时 DSH 上游 |
| C2 | Provider 无关的 `RecoveryCapability` 声明 | 有修改降级与恢复 | 已核实缺少通用契约 | Execution-world/sandbox seam |
| C3 | 原子 workspace checkpoint 与 Session/attempt lineage | Salvage/restart | 已核实缺少通用契约 | DSH 上游与 checkpoint provider |
| C4 | 携带受约束证据的受控 Session handoff | Salvage/restart | 有部分 Session primitive，充分性未核验 | DSH 上游或稳定扩展 capability |

### Track A 贡献顺序

1. **已完成：**在范围窄的 DSH 设计说明中冻结 A1、A2 的产品无关契约。
2. **已完成：**为基线缺失行为增加 core contract test。
3. **已完成：**实现并验证 seam，当前由 fork commit `9c163d4086d6f12e9a2c8f4151358a9e66955ac1` 承载。
4. **已完成：**在 Discussion #2281 发布产品无关契约与 fork 证据，获取上游反馈。
5. **历史清单已完成：**[阶段 0P route 清单](evidence/phase-0p-route-inventory.md)记录旧 deployment-level 规则为何产生空精确交集。ADR-010 取消该 release gate；ADR-011 定义当前显式 evidence-binding 契约。
6. **MVP 已完成：**fork UI 与插件 projection/命令覆盖显式 opt-in、Auto/manual 选择、持久化选择、实际配置与解释读取。
7. 增加阶段 1–3 纵向探针，证明语义判断、AA evidence binding、价格优先解析、assembly/request selection identity、持久化和 Manual 不受影响。
8. 若维护者邀请外部改动，将 A1、A2 拆成两项上游贡献。
9. 合并后把插件固定到首个兼容官方 DSH revision。上游不可用期间明确记录精确 fork，不宣称兼容官方版本。

A1 必须与产品无关：它携带已领取消息、稳定 step identity、取消和不可变 step context，但不理解 route。A2 必须给出精确的插件缺失或事件不兼容诊断，不能静默跳过规范状态。

仅使用 `agent/request` 的原型、ignorable 插件事件，或者只有配置而没有解释路径的 UI，仍不满足 AA 驱动产品路径。

### 后续 Track 的所有权边界

DSH 应提供生命周期、持久化、capability 和 execution-world 契约。Auto Mode 保留 Task Assessment schema 与模型、Host-route-to-AA binding data、任务处理级别、Routing Policy、episode 策略和可选评估。这个边界使上游扩展可复用，也避免 DSH Core 内置某个路由产品的 taxonomy。

## 兼容策略

Auto Mode release 必须声明：

- 精确测试过的 DSH 版本/commit 范围。
- 必需事件注册与 pre-assembly 契约。
- Contract test 版本与结果。
- Host route identity、AA evidence-binding 语义和具体 route capability 要求。
- 声明 release surface 所使用且已验证的 Auto/manual 与解释载体。
- 支持的进程内与外部 child provider。
- 支持恢复的副作用类别。
- 每项 seam 缺失或不兼容时的 fail-closed 行为。

出现以下任一情况时，插件必须在提供 Auto 前停止激活：必需规范事件无法完成冷持久化 round-trip；route 组装与请求无法共享同一 snapshot；配置的 catalog 需要不可用能力。

## 上游贡献候选

1. 必需 Session 事件类型的运行时注册与兼容元数据。
2. 携带已领取消息和稳定 turn/step identity 的作用域 pre-assembly step-decision seam。
3. 具备 Host 冲突解决的持久语义 child-routing constraint capability。
4. Provider 无关的恢复能力与 execution-world checkpoint 接口。
5. 证明 snapshot、持久化、冷恢复和 child 约束行为的 contract fixture。

这些能力最终进入 DSH core 还是稳定扩展包仍是开放问题。Host 拥有策略权威是权限决策，不代表全部实现都必须放进 core。
