<!--
translation-source: PROJECT_STATUS.md
translation-source-blob: c99fe01a701711e70289fbd369c6eb02232193ab
translation-status: current
-->

# 项目状态

[English](PROJECT_STATUS.md)

## 最后更新

2026-08-22

## 当前阶段

阶段 0P MVP 与阶段 1–4 均已完成。阶段 5 之前现进入阶段 4.1 可复用 Evidence Pack 实施：ADR-014 已 Accepted，Task 10 已完成，Tasks 11–19 正在进行。

维护者 DSH fork 固定在 `9c163d4086d6f12e9a2c8f4151358a9e66955ac1`。可运行插件在 `agent/prepare-step` 组合阶段 1 AA catalog 与阶段 2 assessor，为每个 DSH 用户 turn 冻结一项 `auto-decision/v1`，并在该 turn 的 assembly 与每个 `agent/request` step 中复用其完整实际配置。必需 Session 事件保留 route、assessment、evidence basis、版本、reason code 与解释，供 cold reconstruction 使用。Schema v2 决策不再发布原型 tier；维护 UI 显示准确 model、可选 effort、任务处理级别、证据依据及适用时的准确 AA 快照。现有 schema v1 Session 仍通过明确的仅旧版 mapping 可读。

## 已接受的 MVP 后方向

- Artificial Analysis 是模型能力、价格和延迟结论的维护外部来源。
- DSH Auto Mode 不建立也不要求自有模型质量 Benchmark。
- 面向用户的任务处理级别是 Light、Standard 和 Deep；中文标签为轻量、常规、深度。
- 版本化 assessor route policy 在不检查任务内容的情况下解析一条适合当前环境的 classifier route，并在调用前冻结。语义 Task Assessor 返回任务属性和置信度；确定性 Host policy 选择级别并保留最终权力。
- 可执行 Host route identity 与 AA evidence identity 相互独立。版本化显式 binding 把一条实际 provider/model/request configuration 映射到一条稳定 AA 记录；effort 和 variant 是 provider 可选维度，不是通用必填字段。
- 同一级别内，resolver 依次优先 AA 报告价格更低、AA 报告延迟更低、稳定 route identity。
- AA snapshot refresh 只通过维护者拥有的离线 `aa-snapshot-refresh/v1` 工作流运行。Runtime routing 绝不调用 AA；除非 AA 书面 grant 覆盖机器可读分发和本 model-selection 产品，真实 metric 保持 `internal-only`。
- 产品声明始终明确由 AA 驱动，不宣称本项目 Benchmark 质量、安全、非劣性或普遍最优。

Route/evidence 决策记录在 [ADR-011](docs/zh-CN/decisions/0011-bind-host-routes-to-aa-evidence.md)，它接替 ADR-010，同时保留 AA 驱动、价格优先方向。环境感知 assessor-route 决策记录在 [ADR-012](docs/zh-CN/decisions/0012-resolve-and-freeze-task-assessor-routes.md)。离线获取、权利、评审、发布与 rollback 边界记录在 [ADR-013](docs/zh-CN/decisions/0013-refresh-aa-snapshots-behind-a-rights-gate.md)。ADR-010 保留为取代 ADR-002、ADR-006 和 ADR-008 的历史决策。

ADR-014 已 Accepted。它分离全量 policy-eligible AA Snapshot、长期 Binding Registry 和运行时派生 Active Catalog；分离 EvidenceRouteKey 与完整 ExecutionFingerprint；并按 GREEN/AMBER/RED exception class 自动化结构有效的 refresh。其有限取代仍保留 ADR-011 的执行/证据分离，以及 ADR-013 的权利、获取、凭据、校验、原子性和 rollback 边界。

## 已完成基础

- 建立英文权威、中文维护的双语文档流程。
- 审计 DSH，并在维护者 fork 实现产品无关 A1 pre-assembly 与 A2 Session-event 契约。
- 在 DeepSeek Harness Discussion #2281 发布 A1/A2 提案与证据。
- 构建并接受阶段 0P MVP：Auto/manual 控制、任务相关 route 变化、请求／选择一致、持久解释、可见 model/effort 过渡、真实 provider 调用和 Manual 不受影响。
- 恢复并保持完整 GUI suite；Task 7 固定 fork 运行结果为 3,767 项通过、1 项 skip。
- 接受 AA 驱动 MVP 后策略，并把 Benchmark admission 改为可选评估轨道。
- 接受通用 Host route identity 与显式 AA evidence-binding 架构，取代强制 family/version/variant/effort 键。
- 在不改变 live routing 的前提下实现阶段 1A：零个、一个和多个控制项的 route 只能通过精确 Host fingerprint、snapshot ID 与稳定 AA record ID 解析；歧义、陈旧、模糊、跨配置、collision 和静默 record replacement 均以稳定原因失败。
- 在不改变 live routing 的前提下实现 Task 2：维护者指定且被 Git 忽略的 JSON seed 针对当前 Host route inventory 编译为冻结、排序后的 evidence entry 和稳定 exclusion；格式错误、未匹配、有歧义、陈旧、跨配置及 capability 无效的 row 不会进入 catalog。
- 在不改变 live routing 的前提下完成阶段 1 Task 3 和 Checkpoint A：`aa-route-policy/v1` 固定 AA Intelligence Index `v4.1.1`、Light `<35`、Standard `35–<50`、Deep `>=50`、AA 7:2:1 混合价格和首次实际答案 token 中位时间。Capability 或 price 缺失时排除 route；同价时，缺失 latency 排在有测量值之后。
- 最终确定被 Git 忽略的本地 seed 和三条已批准当前 binding：DeepSeek Pro/off 属于 Light、Pro/high 属于 Standard、Flash/max 属于 Deep。Flash/off、Flash/high 和 Pro/max 保持排除，不给它们附加缺乏依据或有歧义的证据。
- 完成阶段 2 Task 4：`task-assessor-route-policy/v1` 请求 Light，依次升级到 Standard 和 Deep，排除 AA latency 缺失或超过预算的 route，并冻结当前 catalog 中价格优先的 winner。`task-assessor-contract/v1` 固定有限输入、单次请求预算、严格输出 schema、离散置信度阈值和确定性 Deep fallback fixture；它不调用 live provider，也不改变可运行 MVP。
- 完成阶段 2 Task 5 和 Checkpoint B，且不改变 live routing：兼容 assessor route 通过恰好一次直接、无工具 `ctx.llm.stream()` 调用执行，并带硬总 deadline；已校验属性通过 `task-handling-policy/v1` 映射；代表性语义和失败 fixture 证明 Light、Standard、Deep 与 fallback 解释均为确定结果。
- 完成阶段 3 Task 6：每个新用户 turn 前重新物化当前 Host route，在价格优先解析前筛选精确 AA match，并让一项冻结决策驱动 assembly、request、持久事实与 cold projection。固定 fork suite 覆盖三档、单调升级、无虚假 AA evidence 的配置 Host-valid Deep fallback、dispatch 前明确 no-route failure，以及 Manual 不受影响。
- 完成阶段 3 Task 7：schema v2 projection 不再发布原型 tier；selector 与 conversation fact 显示本地化任务处理级别、实际 model 与可选 effort，以及 AA 或配置 Deep fallback 依据。仅 model、仅 effort、二者同时和仅 level 变化的浏览器过渡均保留 1.2 秒滚动、业务蓝高亮、两次呼吸、持久消息位置和中英文 snapshot。
- 完成阶段 3 Task 8 与 Checkpoint C：跨仓库无密钥浏览器 fixture 驱动真实 Web UI、agent loop、Session 日志和请求头依次经过 Light、Standard、Deep 与 Manual。常规级候选证明先比较价格、再比较延迟；每个自动 turn 都证明界面显示的 route 与 AA snapshot 等于持久化 selection 和实际请求配置。聚焦 Loader 与 Session 测试继续覆盖 fallback、no-route failure、cold reconstruction 和 Manual 不受影响。支持矩阵固定 fork `9c163d4086d6f12e9a2c8f4151358a9e66955ac1`、selection schema v2、`auto-decision/v1`、`aa-evidence-catalog/v1`、`task-assessor-contract/v1`、`task-assessor-route-policy/v1`、`task-handling-policy/v1` 与 `aa-route-policy/v1`。
- 完成阶段 4 Task 9：`aa-snapshot-refresh/v1` 固定官方 Pro acquisition contract、服务端 credential boundary、source methodology、attribution、retention、freshness、minimization 与显式 rights mode。维护 CLI 推导不含凭据的 Host identity，私有保存有界 source material，准备确定性 candidate 和完整 source/record/binding/band/order diff，要求精确 digest 批准，原子保留并替换 active seed，并验证 rollback 完整性。99 项离线测试通过；仓库只跟踪合成 AA-shaped fixture 与 placeholder 示例。

## 当前实施计划

1. 已完成：用混合 provider fixture 实现 provider-neutral Host route identity 与显式 AA evidence binding。
2. 已完成：通过已验证 binding 和稳定排除原因编译被 Git 忽略的本地 AA seed。
3. 已完成：编译带版本 AA 能力档，并按 price、latency 和稳定 identity 解析同档 route。
4. 已完成：冻结有限 Task Assessor 契约和确定性环境感知 assessor route policy。
5. 已完成：在 Auto 递归之外调用已解析并冻结的 assessor，并实现确定性级别 mapping。
6. 已完成：把单一冻结决策路径集成到 assembly、request、Session persistence 与 cold projection。
7. 已完成：迁移 live UI 术语、evidence basis、可选 effort 展示和过渡解释。
8. 已完成：跨浏览器、Loader、Session 与实际请求边界端到端证明全部 Beta 路径。
9. 已完成：定义并实现版本化 AA snapshot refresh 工作流与权利边界。
10. 已完成：接受 ADR-014 并冻结阶段 4.1 Evidence Pack 契约。
11. 进行中：实施 Tasks 11–19，完成可复用 Evidence Pack 基础。
12. 阶段 4.1 之后：为阶段 5 单调自适应执行定义形式化 runtime evidence 与重新判断边界。

详细依赖和验收在 [roadmap](docs/zh-CN/roadmap.md)、[实施计划](tasks/plan.zh-CN.md)和[任务清单](tasks/todo.zh-CN.md)中。

## 当前阻塞与开放决策

阶段 1 已无剩余阻塞；field 选择、边界、缺失数据规则和初始 binding 均已冻结并离线验证。

阶段 2 已无剩余阻塞。Task 4–5 冻结动态环境感知 assessor route 解析、有限输入、硬 12 秒 timeout、离散 confidence、确定性级别映射和严格 Deep fallback。

阶段 3 已无剩余阻塞。Task 8 的验证环境中没有 provider credential，因此不新增 live-provider-call 声明；已完成的无密钥纵向证明覆盖产品特有决策路径，已接受的阶段 0P 证据继续作为历史真实 provider dispatch 证明。

阶段 4 已无剩余实施阻塞。ADR-013 已解决稳定 AA 获取、attribution、retention、freshness、minimization、评审、原子替换与 rollback。只有外部 AA 书面 grant 同时覆盖分发和本 model-selection 产品后，才能公开分发真实机器可读 AA metric；该外部限制不阻碍已完成的默认 `internal-only` 工作流。

阶段 4.1 没有已识别的技术阻碍。ADR-014 已 Accepted，因此其 internal-only identity、refresh 与 packaging 工作可以继续。真实 Evidence Pack 的公开分发仍被现有 ADR-013 written-license gate 单独阻碍；internal-only 实施与合成验证不依赖该 grant。

阶段 5 必须定义哪些形式化 runtime signal 支持升级、允许在哪些边界重新判断，以及如何强制单调性和持久解释。Recovery、子 Agent 路由和官方 DSH 兼容仍属于后续阶段。

## 下一步

按依赖顺序实施 Tasks 11–19，并在开始阶段 5 自适应执行前完成阶段 4.1。

## 状态维护规则

- 完成重要结果、出现阻塞、关闭阶段 gate 或改变下一步时更新本文件。
- 产品要求放在 `docs/spec.md`，组件行为放在 `docs/architecture.md`，策略放在 `docs/routing-policy.md`，实施顺序放在 `docs/roadmap.md`。
- 保留被取代 ADR 作为历史记录。
