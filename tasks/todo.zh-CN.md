<!--
translation-source: tasks/todo.md
translation-source-blob: de2b97082f053a8dda0d14fce39bfb06cad4a3d9
translation-status: current
-->

# 任务清单：阶段 0P AA-seeded Experimental Auto

[English](todo.md)

## 任务 1：冻结精确 route 与 A3p 映射

**说明：** 盘点固定 fork 的 active provider/model/reasoning selection，把最小有用集合映射到精确 Artificial Analysis 配置记录。

**验收标准：**
- [ ] 每个纳入 route 都有精确 provider/model/reasoning-selection key 和可复现 fingerprint 证据。
- [ ] Explicit effort、adapter-default 与 provider-default identity 不合并。
- [ ] 无法匹配或验证的配置被明确排除。

**验证：**
- [ ] 从固定 fork 重新运行盘点，得到相同规范化 identity。
- [ ] 使用项目 Code Review Skill 评审证据矩阵。

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
- [ ] 实现或启用任何可变阶段 0P 路径前，维护者单独接受符合 ADR-007 的 possible-loss bound 与已验证 Recovery Capability scope。

**依赖：** 任务 1

**可能修改：** `docs/routing-policy.md`、`docs/architecture.md`、`docs/decisions/`、中文翻译

**预计范围：** Medium

## 检查点：证据基础

- [ ] 任务 1-2 完成并通过评审。
- [ ] 没有 route 依赖名称匹配或推断 effort。
- [ ] 所需外部 access 与依赖得到明确授权。
- [ ] 可变 scope 已通过独立 recovery/loss-bound 决策得到明确授权，否则被限制为只读。

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
- [ ] 符合 ADR-007 的 risk bound 通过另行决策被接受前，包括 `strong` 在内的任何实验档都不得执行可变工作；接受后仍要求 possible loss 落在 bound 内，并且每个 effect class 都有充分的已声明 attribution 与 recovery support。
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

## 任务 8：用具体 client carrier 关闭 A5p

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

- [ ] 任务 6-8 通过固定 fork、cold-load 与 client 验收测试。
- [ ] 实际 request 配置等于持久化并显示的 route snapshot。

## 任务 9：打包并证明 dogfood build

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

**依赖：** 任务 1-8

**可能修改：** `docs/runbook/`、`docs/evidence/`、`PROJECT_STATUS.md`、README navigation 与翻译

**预计范围：** Medium

## 检查点：阶段 0P 就绪

- [ ] 所有任务验收标准和 review 通过。
- [ ] 仓库和 Git 历史不包含 Artificial Analysis secret 或再分发数据集。
- [ ] 阶段 0C 继续受 RouterBench admission 与现有 release-quality gate 阻塞。
