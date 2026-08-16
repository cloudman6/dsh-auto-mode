<!--
translation-source: tasks/todo.md
translation-source-blob: 5100f27905fd7eb5c53844514ff018d50a8870fb
translation-status: current
-->

# 任务清单：阶段 0P AA-seeded Experimental Auto

[English](todo.md)

## 任务 1：冻结精确 route 与 A3p 映射

**说明：** 盘点固定 fork 的 active provider/model/reasoning selection，计算它们与 Artificial Analysis 配置记录的精确交集，并排除无法绑定 deployment identity 的每项 selection。

**验收标准：**
- [x] 每项已盘点的显式 selection 都有精确 provider/model/reasoning-selection key 和可复现 fingerprint 证据。
- [x] Explicit effort、adapter-default 与 provider-default identity 不合并。
- [x] 无法匹配或验证的配置被明确排除。

**验证：**
- [x] 从固定 fork 重新运行盘点，得到相同规范化 identity。
- [x] 使用项目 Code Review Skill 评审证据矩阵。

**依赖：** 无

**可能修改：** `docs/dsh-integration.md`、`docs/evidence/phase-0p-route-inventory.md`、中文翻译

**预计范围：** Medium

## 任务 2：冻结外部先验与数据边界契约

**说明：** 定义本地 snapshot schema、Artificial Analysis endpoint 与字段映射、prompt/index 语义、pagination 覆盖、source/policy 版本、规范化内容 digest、freshness、attribution、启发式分数边界、access method 与公开数据权利停止条件。

**验收标准：**
- [ ] Snapshot 与 policy schema 有明确版本和 fail-closed 校验规则。
- [ ] 即使上游 index version 省略 patch revision 或没有单独版本化每个 index family，retrieval metadata 与规范化全量内容 digest 也能标识精确 snapshot。
- [ ] 持久 `ExternalRoutePriorSnapshotEvent` schema 记录 source/schema/query/rights-policy version、pagination completeness、attribution、retrieval time、content digest，并且只包含规范化精确匹配记录；排除原始 response、未匹配行、credential、header、prompt 与代码。
- [ ] 初始 index-family 与 `fast`/`standard`/`strong` 启发式规则确定且可评审。
- [ ] API credential、抓取数据、attribution 与再分发边界明确。

**验证：**
- [ ] 合成的 valid、stale、incomplete 与 malformed 示例得到预期结果。
- [ ] 任务 3 或 4 实施前，维护者明确批准 API access 与依赖新增。
- [x] 维护者已通过 ADR-009 接受符合 ADR-007 的 possible-loss bound。

**依赖：** 任务 1

**可能修改：** `docs/routing-policy.md`、`docs/architecture.md`、`docs/decisions/`、中文翻译

**预计范围：** Medium

## 检查点：证据基础

- [ ] 任务 1-2 完成并通过评审。
- [ ] 没有 route 依赖名称匹配或推断 effort。
- [ ] 所需外部 access 与依赖得到明确授权。

任务 3-7 保持只读，并对可变执行 fail closed。任务 8-9 分别接受具体 provider 设计并证明其可执行 ADR-009 capability，再启用可变能力，从而避免与本检查点形成依赖循环。

## 任务 3：建立实施脚手架与领域类型

**说明：** 创建已接受的 TypeScript/ESM package 与测试框架，建立可判别 experimental/admitted evidence 和 catalog 类型。

**验收标准：**
- [ ] Build、test、lint 与 typecheck 命令有文档且通过。
- [ ] 类型边界阻止 `experimental-unadmitted` evidence 满足 `RouteAdmission`。
- [ ] 测试不需要网络或生产榜单数据。

**验证：**
- [ ] 聚焦类型与单元测试通过。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 2 和明确依赖授权

**可能修改：** `package.json`、`tsconfig.json`、`src/domain/`、`tests/domain/`、`docs/spec.md`

**预计范围：** Medium

## 任务 4：实现 snapshot loading 与精确匹配

**说明：** 加载本地提供的外部先验 snapshot，校验 provenance/freshness，并把精确外部记录与 DSH route identity 取交集。

**验收标准：**
- [ ] Invalid、stale、unknown-version 或 unmatched 输入以稳定 reason code 失败。
- [ ] 精确 effort/default encoding 与确定性 tie-break 有测试覆盖。
- [ ] 仓库不持久化 credential 或抓取数据集。

**验证：**
- [ ] 使用合成 fixture 的单元、schema、属性和 secret-scan 测试通过。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 1、3

**可能修改：** `src/external-priors/`、`src/catalog/`、`tests/external-priors/`

**预计范围：** Medium

## 任务 5：实现确定性 assessment 与 policy

**说明：** 把有界任务属性映射到 Artificial Analysis index family，使用冻结 catalog、Host 声明的 `RecoveryCapability`、execution-world effect class 与带版本启发式策略选择实验档位。

**验收标准：**
- [ ] 相同 input snapshot 与 policy version 始终产生相同决策和解释。
- [ ] 高风险、未知或低置信度 task assessment 从有效 catalog 中选择最强精确匹配；route 无法匹配或漂移、证据无效时，在调用前以 `no-experimental-route` 退出。
- [ ] 只有 possible loss 保持在 ADR-009 内，并且带版本 Host provider 为每个相关 effect class 证明干净 worktree isolation、Attempt attribution、containment、process control 与 `externalSideEffects: 'none'` 时，包括 `strong` 在内的实验档才能执行可变工作。
- [ ] 任何不可逆外部副作用、超出已接受 bound 的 mutation，或 attribution/recovery support 不充分，都会以 `no-experimental-route` 终止当前 Experimental Auto attempt，与影响等级无关。用户介入可以切换到 Manual 或等待新的 execution-world facts，但不能授权已拒绝的 dispatch。
- [ ] 每个结果携带 `experimental-unadmitted` 和 source-snapshot identity。

**验证：**
- [ ] Golden-decision、边界、排列、属性与 Recovery Capability 负向测试覆盖 `fast`、`standard`、`strong` 的每个影响等级、loss-bound overflow、attribution/recovery 不充分和不可逆外部副作用。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 4

**可能修改：** `src/assessment/`、`src/policy/`、`tests/policy/`

**预计范围：** Medium

## 检查点：纯策略

- [ ] 任务 3-5 完成，所有纯测试在无 DSH、无网络环境下通过。
- [ ] Experimental evidence 不能编译或转换为 admitted evidence。

## 任务 6：持久化并重建阶段 0P 决策

**说明：** 注册并投影 routing-attempt start、preparation failure/termination、外部 snapshot、catalog、assessment、Host 声明的 Recovery Capability reference、唯一 Session decision/resolution、逐调用 authorization facts、request encoding 与 explanation 的 required Session event。阶段 0P 的 producer 必须先持久化最小化 `ExternalRoutePriorSnapshotEvent`，再持久化引用它的 Experimental Route Catalog。

**验收标准：**
- [ ] Event schema 带版本、经过校验、使用向后引用，并可在冷加载后重建。
- [ ] External-prior event 在 catalog consumer 前持久追加；prior 证据缺失或不兼容时，在 catalog 编译或 provider dispatch 前失败。
- [ ] Catalog 前输入无效时追加只含安全字段且使用 backward reference 的 `RoutingPreparationFailedEvent`；它不保存原始 prior，但足以支持冷加载重建与 UI failure rendering。
- [ ] Cancellation 追加 `RoutingPreparationTerminatedEvent`；cold projection 把 orphan start 或 partial chain 标记为 interrupted，controller 在 load 后、retry 前追加 recovery terminal event。只有不存在完整 Session decision 时才允许 retry。
- [ ] Admitted 与 experimental 成功/失败 event 始终可判别；冷加载重建绝不伪造 `AdmissionIdentity`，也不把 `no-experimental-route` 合并为 `no-safe-route`。
- [ ] 阶段 0P 冷加载重建最多产生一项完整 Session decision，并保留每个 step-specific `ModelCallAuthorizationEvent`。
- [ ] Claimed input 持久化 A1 提供的 ordered stable `MessageId`，不使用尚未 append 的 `user/message` EventRef，也不复制原始内容；成功执行随后追加相同 identity。
- [ ] Registration 缺失或不兼容时在执行前失败。
- [ ] 持久事实不包含敏感 prompt/code 内容或 API credential。

**验证：**
- [ ] 固定 fork 上的合成 persistence 与 cold-reload contract test 通过，包括 preparation chain 每个 event boundary 后的 cancellation/interruption。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 3、5

**可能修改：** `src/session/`、`tests/session/`、DSH probe fixture

**预计范围：** Medium

## 任务 7：把冻结决策接入 DSH Host

**说明：** 使用 A1 为每个 Session 最多创建一项阶段 0P decision。手动模式让 Auto listener 不做 reject/authorization 并把控制权交回现有 manual path。在包括 cold load 后在内的每次 Experimental Auto 模型调用前，捕获当前 Host contract、provider、精确 deployment/reasoning identity、evidence freshness、Recovery Capability 与 effect-class facts；持久化新的 authorization，只有授权成功才应用配置。

**验收标准：**
- [ ] 重复 step 与 cold load 只复用一项 Session decision，但每次 attempted call 都创建新的 authorization 与 RouteSnapshot。
- [ ] Identity、Host contract、evidence freshness、provider 或 Recovery Capability 的 snapshot mismatch/drift，会在 assembly/provider dispatch 前拒绝当前 Experimental Auto 调用，绝不触发隐式重新决策。
- [ ] Denied authorization 持久化 observed/required contract version、provider availability、expected/observed deployment identity、evidence check/expiry、Recovery Capability reference、effect class 与 loss-bound version，足以重建拒绝原因。
- [ ] 手动模式绕过 Auto listener 并继续现有 Host/provider validation；切换手动既不创建 denied authorization，也不 reject 或消费 turn。

**验证：**
- [ ] 固定 fork 集成测试与组合纵向 contract test 通过。
- [ ] 真实 DSH Loader + app/process composition test 通过生产 entry point 加载插件，并记录无密钥、headless Session JSONL transcript，证明 assembled request 与持久 route snapshot 一致。
- [ ] 负向 composition control 证明：plugin registration 缺失、A1/A2 缺失、证据无效或 Recovery Capability 不充分时，系统在 provider dispatch 前停止。
- [ ] 确认/介入动作不能绕过 denied authorization，也不能直接到达 provider dispatch。
- [ ] Manual-switch control 证明同一 claimed message 恰好一次到达现有 manual request path。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 1、5、6

**可能修改：** `src/plugin/`、`src/host/`、`tests/integration/`

**预计范围：** Medium

## 任务 8：冻结并接受 execution-world provider 设计

**说明：** 实施前审计实际 DSH production composition，并提出具体 provider 机制。冻结可变 Experimental Auto 能到达的每个 capability/tool entry、每项决策的 executor、runner/platform isolation 机制、支持的操作系统、dependency/service ownership、credential boundary、持久证据契约与 fail-closed 行为。把选择写入 Proposed ADR；只有维护者接受该 ADR，并明确授权每项新 dependency、external service 或 DSH Core seam 后才能实施。

**验收标准：**
- [ ] Production inventory 覆盖 in-process filesystem 与 Web tool、foreground/background shell 或 terminal execution、Code Mode nested dispatch、hook、subagent、direct capability caller，以及固定 DSH composition 中发现的每个 alternate executor。
- [ ] 每个 inventory entry 标明精确 enforcement point，并且要么由 provider 覆盖，要么对可变 Experimental Auto 禁用。Schema omission、prompt 指令或 listener order 不算 enforcement。
- [ ] 设计选择具体 platform/runner，解释 file、network、process、mount 与 environment isolation；不能把现有 DSH file-only sandbox claim 或 E2B limitation 提升为更广 capability evidence。
- [ ] 设计规定支持的操作系统，并为 unsupported、partial enforcement、missing、stale 或 misconfigured provider 规定 fail-closed 结果。
- [ ] 设计规定 option-aware 只读 Git wrapper/allowlist、固定 environment、禁用 output/external-helper path，以及前后 repository-state evidence。
- [ ] 设计规定持久、带版本、按因果顺序追加的 Attempt boundary 与 attribution journal、不可变 identity、cold-load reconstruction、live reconciliation、interruption semantics 与安全持久字段。
- [ ] Plugin code、DSH extension、platform runner、新 dependency、external service 与 credential scrubbing 的 ownership/composition 明确。项目 stop-and-ask 边界覆盖的每项变更都具有维护者明确授权。

**验证：**
- [ ] Source audit 把 inventory 映射到当前官方 DSH default branch 与固定 fork，包括 direct 与 alternate caller。
- [ ] Threat-model review 把 file escape、network/exfiltration、ambient credential、process lifetime、Git helper/option bypass、concurrent mutation 与 crash/cold-load path 追踪到 executor-level denial 或 fail-closed state。
- [ ] 项目 Code Review Skill 与必需的 fresh-context 独立评审都返回 `PASS`；随后由维护者明确接受 provider ADR。

**依赖：** 任务 6、7

**可能修改：** `docs/architecture.md`、`docs/dsh-integration.md`、`docs/recovery.md`、`docs/decisions/`、production capability inventory 与中文翻译

**预计范围：** Large

## 任务 9：实现并证明已接受的 ADR-009 execution-world provider

**说明：** 为隔离 worktree envelope 实现已接受、带版本的 Host execution-world provider。Provider 只授权一个干净任务 worktree 内可归属的文件系统 mutation，在每个已盘点 executor 上于 effect 发生前阻止排除项，约束 child process，并向每次模型调用 authorization 提供可重建的 capability 与 attribution facts。

**验收标准：**
- [ ] 启动时拒绝 dirty 或非隔离 worktree，并在任何可变工具执行前记录稳定 Attempt 边界。
- [ ] Canonical-path enforcement 在 effect 发生前阻止路径穿越、symlink、hard-link、mount 与 root 外逃逸；仅靠事后检测不合格。
- [ ] Git index、object database、configuration、ref、history、linked-worktree administration、通过 Git 改变的 worktree 状态和 remote 都不能被修改。只读 Git 检查只能通过已接受的 option-aware wrapper，使用固定 environment，禁用 optional lock/index refresh，并拒绝 output、pager、hook、external-diff 与 text-conversion execution path。
- [ ] 每个已盘点 Web、filesystem、shell/terminal、background、Code Mode、hook、subagent、direct 与 alternate entry 都在 executor 实施已接受 policy；未覆盖入口不可用。Agent 发起的联网或未分类命令、依赖或系统安装、外部 API、账户或操作系统变更及其他外部 effect 在执行前被拒绝。模型 provider dispatch 继续作为独立授权的 Host 动作。
- [ ] Child process 只获得已接受的 scrubbed environment，不能读取 ambient credential，也不能通过任何已盘点 output 或 network path 外传 canary secret。
- [ ] 允许的工具 process 及其 descendant 被约束，并在 Attempt 视为停止前进入 quiescent 状态；process 逃逸或泄漏必须 fail closed。
- [ ] Provider 在发布不可变 `RecoveryCapability` reference 前，持久追加带版本的稳定 Attempt boundary 和按因果顺序追加的 attribution journal。每个创建、修改和删除的路径都可归属；并发或未知 mutation 使可变 authorization 失效。
- [ ] Cold load 不依赖进程内存即可重建 journal 与 capability reference，把 orphan/interrupted boundary 标为 fail closed，在重新授权前 reconciliation live worktree，并按因果顺序持久化 drift 或 terminal evidence。
- [ ] 失败时保留 worktree 与证据供检查，不宣称自动 rollback、`salvage` 或 `restart`。

**验证：**
- [ ] Executor-level fault injection 覆盖每个冻结 production entry point 与 alternate caller，包括 Web request/SSRF、foreground/background shell 或 terminal work、Code Mode nested dispatch、hook、subagent、direct capability call、package 或系统安装、未分类命令、ambient-credential canary exfiltration 与 child-process escape。外部 observer 验证未发生被拒绝的 request 或 state change。
- [ ] Filesystem fault injection 覆盖 dirty start、路径穿越、symlink、hard-link、mount 与 canonical-path 逃逸、并发 mutation 和 attribution drift，并且在 effect 前阻断。
- [ ] Git fault injection 覆盖 add、restore、clean、checkout/switch、commit、reset、ref/tag/branch/worktree/config/object-database/remote mutation，以及 output-file、pager、hook、external-diff、textconv 与任意 option bypass。正向 inspection 证明固定 environment 和完整 repository/worktree state 不变。
- [ ] Journal test 在每个 durable boundary 后 interrupt 或 crash，在无旧进程内存时 cold load，对比重建 journal 与 live worktree，并证明 stale、orphan、reordered、missing 或 drifted evidence fail closed。
- [ ] 正向测试覆盖可归属的 create、modify、delete effect，以及已接受的只读 Git 检查。
- [ ] 真实 Loader/app/process composition 覆盖每个已启用 production executor，证明 policy 消费持久 capability reference 与 journal，并在 provider 或 inventory 缺失、不兼容、stale、partial enforcement 或报告 drift 时拒绝可变 dispatch。
- [ ] 提交前项目 Code Review Skill 与必需的 fresh-context 独立评审都返回 `PASS`。

**依赖：** 任务 8、其 Accepted provider ADR，以及每项选定新 dependency、external service 或 DSH Core seam 的明确授权

**可能修改：** `src/execution-world/`、`src/host/`、`tests/execution-world/`、`tests/integration/`、capability 与证据文档

**预计范围：** Large

## 任务 10：用具体 client carrier 关闭 A5p

**说明：** 在已验证 DSH client surface 增加显式 Experimental Auto/manual 控制，渲染实际持久化 selection、source snapshot 和未准入解释。

**验收标准：**
- [ ] 一次操作选择 Experimental Auto，Manual 仍可直接选择。
- [ ] 显示的配置与解释来自持久 Session 事实并能通过 reload 恢复。
- [ ] Carrier 不能把 route 表述为已准入、安全或官方支持。

**验证：**
- [ ] Client seam probe、组件测试和浏览器端到端检查通过。
- [ ] 若选择 Web，browser snapshot 覆盖 Auto、Manual、reload 后持久解释、preparation failure，以及从 Session facts 渲染的逐调用 denied `no-experimental-route` 状态。
- [ ] 提交前项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 6、7

**可能修改：** 已验证 DSH client-plugin 文件、`tests/client/`、`docs/dsh-integration.md`

**预计范围：** Medium

## 检查点：集成路径

- [ ] 任务 6-10 通过固定 fork、cold-load、fault-injection 与 client 验收测试。
- [ ] 实际 request 配置等于持久化并显示的 route snapshot。

## 任务 11：打包并证明 dogfood build

**说明：** 运行无密钥端到端 probe，创建本地维护者安装/runbook，记录精确 build 证据但不发布公开 release。

**验收标准：**
- [ ] 可运行无密钥示例通过真实 plugin composition，并在带 credential 的维护者 dogfood 前输出可审计 assembled transcript。
- [ ] 自跳过 with-key smoke 使用真实 Loader/app entry 与选定 provider；key 存在时验证外部 response 与持久化 `request/header` 的 provider/model/reasoning selection 一致，缺少 key 时明确报告 skip 而非 pass。
- [ ] 维护者完成 Experimental Auto 任务、查看解释、冷加载并切换 Manual。
- [ ] Build 固定 plugin、DSH fork、carrier、外部 snapshot 与 policy version。
- [ ] 状态和证据列明所有排除主张及剩余阶段 0C gate。

**验证：**
- [ ] 完整聚焦测试、typecheck、lint、文档、secret scan、keyless 纵向 probe 与可用 with-key smoke 通过。
- [ ] 提交前最终项目 Code Review Skill 返回 `PASS`。

**依赖：** 任务 1-10

**可能修改：** `docs/runbook/`、`docs/evidence/`、`PROJECT_STATUS.md`、README navigation 与翻译

**预计范围：** Medium

## 检查点：阶段 0P 就绪

- [ ] 所有任务验收标准和 review 通过。
- [ ] 仓库和 Git 历史不包含 Artificial Analysis secret 或再分发数据集。
- [ ] 阶段 0C 继续受 RouterBench admission 与现有 release-quality gate 阻塞。
