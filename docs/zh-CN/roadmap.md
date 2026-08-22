<!--
translation-source: docs/roadmap.md
translation-source-blob: 2b9dd05e0169744de3e8c2d2845cc64d62806d02
translation-status: current
-->

# 产品路线图

[English](../roadmap.md)

## 原则

从已接受的阶段 0P MVP 出发，构建真正可用的 AA 驱动 Auto 产品。Artificial Analysis 提供外部能力、价格和延迟结论；DSH Auto Mode 提供任务理解、确定性路由、Host 集成、透明解释和后续恢复。自建模型 Benchmark 不是前置条件。

每个阶段都必须交付可用的纵向切片，并保持 Manual 不变。

## 阶段 0：Auto 闭环 MVP——已完成

已在固定 DSH fork 上交付：

- 一次操作的 Auto/manual 选择；
- 不同任务可以选择不同 model/effort；
- 持久化选择与实际请求一致；
- 可见的模型/effort 变化和路由解释；
- Manual 不受影响；
- 本地、被 Git 忽略的 AA seed 和明确实验标识。

验收：已于 2026-08-18 完成并由维护者接受。

## 阶段 1：AA route catalog 与处理级别策略——已完成

用第一版带版本 AA catalog 取代原型术语和硬编码 route 假设。

### 1A. 把 Host route 绑定到 AA 证据

- 定义 provider-neutral Host route identity，覆盖 provider、model 与实际 request-configuration fingerprint。
- 定义从每条 eligible Host route 到一个 snapshot 中一条稳定 AA record 的显式版本化 binding。
- 把 effort 和其他 provider 控制项视为可选执行维度，而不是通用 schema 字段。
- 以稳定原因拒绝模糊、有歧义、陈旧或跨配置 binding。

验收：混合 provider 与当前本地 seed fixture 覆盖零个、一个和多个执行控制项；有效 binding 能确定性解析，并拒绝配置 collision、歧义和静默 AA-record 替换。

### 1B. 编译能力档

- 新 catalog 使用 `light`/`standard`/`deep`，并为阶段 3 live plugin 与 UI 迁移保留 Light/Standard/Deep 和“轻量/常规/深度”标签。
- 为三档定义带版本的 AA 分数边界。
- 精确 AA 快照、档位策略和匹配 route 记录可检查。

验收：每条合格 route 恰好属于一个档位，同一快照和策略产生相同 catalog。

### 1C. 按 AA 价格解析

- 同档优先 AA 报告价格更低者。
- AA 报告延迟作为第二比较项，稳定 route identity 作为最终比较项。
- 排除或显式处理缺失比较字段，绝不依赖 discovery 顺序。

验收：排列测试对同一冻结 catalog 产生相同 winner 和解释。

阶段验收：2026-08-21 完成。Task 1–3 离线编译本地 evidence catalog，通过 `aa-route-policy/v1` 为每条 eligible route 分档，并按 AA price、AA latency、稳定 route identity 解析一个级别，同时不改变 Manual 模式。

## 阶段 2：语义 Task Assessor

用有限 LLM classifier 替换关键词路由；其版本化选择 policy 在每次调用前解析并冻结一条适合当前环境的 route。

- 返回 task kind、scope、complexity、risk、verifiability、confidence 和 reasons。
- 绝不返回具体 provider、model 或 effort。
- 在不检查任务的情况下从当前冻结 catalog 解析具体 route，再冻结它，确保 Auto 不能递归或在调用中重新路由。
- 用确定性 Host policy 把结构化属性映射到 `light`/`standard`/`deep`。
- 超时、无效输出、低置信度、高风险或范围未知时使用 `deep`。

Task 4 已于 2026-08-22 完成：route policy、有限输入、请求预算、严格 schema、置信度阈值以及 valid/invalid/timeout/low-confidence 契约 fixture 均已冻结。

Task 5 和阶段 2 已于 2026-08-22 完成。`task-handling-policy/v1` 确定性映射已校验属性与 reason code；一次直接、无工具、零重试 assessor 调用会独立于 stream 配合程度强制总 deadline。Fixture 覆盖编码、调试、研究、写作、架构、安全、模糊、route 不兼容、provider failure、截断、timeout 和 caller cancellation。在阶段 3 集成这条隔离路径前，可运行 MVP 保持不变。

## 阶段 3：AA 驱动 Auto Beta

把 catalog 与语义 assessor 组合成面向用户的产品闭环。

- 在已验证的 pre-assembly 边界为每个新用户任务刷新决策。
- 从依赖 provider 的组装到 `agent/request` 冻结同一选择。
- 显示任务处理级别、实际 model/effort、AA 快照和简短依据。
- 保留滚动／呼吸切换动画和对话提示。
- 保留配置的 Deep fallback 和明确 no-route failure。
- 所有声明明确为 AA 驱动，不宣称经过本项目 Benchmark 的质量。

验收：浏览器和真实 provider 场景证明 Light、Standard、Deep、fallback、failure 与 Manual 路径；显示、持久化和实际请求配置一致。

Task 6 已于 2026-08-22 完成。`auto-decision/v1` 现在会在 Host 拥有的 DSH 用户 turn 边界刷新，并在该 turn 的所有 step 中保持冻结。固定 fork composition 证明三档、单调升级、明确配置的 Deep fallback、dispatch 前 no-route failure、assembly/request/Session 精确一致、cold reconstruction 和 Manual 不受影响。

Task 7 已于 2026-08-22 完成。Schema v2 projection 与维护 UI 使用 Light/Standard/Deep，不再发布原型 tier；它们显示实际 model 与可选 effort，区分 AA evidence 与配置 Deep fallback，并保留 schema v1 replay。组件与浏览器 fixture 保留仅 model、仅 effort、二者同时和仅 level 变化、本地化 snapshot，以及现有动画和 conversation 位置。

Task 8 与 Checkpoint C 已于 2026-08-22 完成。无密钥跨仓库浏览器 fixture 会挂载外部插件，并通过真实 Web 与 agent loop 证明 Light、Standard、Deep、价格排序、延迟 tie-break、显示／持久化／请求精确一致、source snapshot 可见和退出 Auto 后的 Manual。Loader 与 Session fixture 继续覆盖低置信度 fallback、catalog 缺失 failure、cold reconstruction 和 Manual 不受影响。环境中没有可用于阶段 3 新 live call 的 provider credential；本次完成组合 provider-neutral 纵向证明与已接受的阶段 0P 真实 provider dispatch 证据，不新增 provider-specific 声明。

## 阶段 4：Catalog 更新与分发

让 AA 数据维护稳定可靠，同时不把 runtime 绑定到实时远程依赖。

- 定义稳定获取方式和数据权利边界。
- 在 runtime 路径外生成带版本的最小快照。
- 校验 schema、attribution、freshness、binding change 和恢复上一有效快照。
- credential 和再分发的原始数据集不进入仓库或浏览器 client。

验收：维护者可以可复现地更新快照、检查差异、拒绝畸形数据并恢复上一有效 catalog。

Task 9 与阶段 4 已于 2026-08-22 完成。ADR-013 固定官方 Pro language-model endpoint、服务端 credential boundary、默认 internal-only rights mode、written-license 分发 gate、attribution、retention、freshness 与固定 methodology。离线维护工作流推导不含凭据值的 Host identity，只最小化已评审 binding，展示 source、record、binding、band 和排序变化，要求精确 digest 批准，原子替换 active seed，并验证 rollback checksum。合成 fixture 覆盖 acquisition、拒绝、更新、binding 新增／删除／替换、rename、tamper detection 与 rollback；runtime routing 不引入 live AA 依赖。

## 阶段 4.1：可复用 Evidence Pack

在自适应执行建立在 catalog 之上前，修正已完成 catalog 对当前 Host 和完整 effective configuration 的耦合。

- 分离全量 policy-eligible 最小化 AA Snapshot、长期 Binding Registry、AA Route Policy 和一个 compatibility Manifest。
- 推导精确 provider-scoped EvidenceRouteKey，并与用于请求审计的完整 ExecutionFingerprint 分离。
- 在 runtime 从当前 Host route、精确 binding、当前 Snapshot 与 Route Policy 编译 Active Catalog。
- Route 不可用时 mapping 保持 dormant；日后出现精确 Host route 时自动激活。
- 自动应用结构有效的 GREEN refresh，隔离 AMBER exception，拒绝 RED contract 或 integrity 变化并保留 rollback。
- 在一个本地原子 activation 与 migration 边界后独立版本化 Runtime 和 Evidence Pack。

验收：常规 AA metric 更新无需人工动作；新配置 route 在存在有效 dormant binding 时自动激活；仅执行默认值不使 evidence 失效；决定 evidence 的 control 不能 collision；migration、rollback、Loader、Session、UI 与 Manual 非干扰检查通过。没有 ADR-013 written-license gate 时，公开真实数据分发保持禁用。

状态：已于 2026-08-22 完成。ADR-014 与 Tasks 10–19 交付无依赖 Evidence Pack 契约、精确 evidence identity、完整 eligible Snapshot compiler、长期 Registry、运行时 Active Catalog、exception-driven refresh、本地原子激活／rollback、旧 seed migration，以及固定 Loader/Session/UI/Manual 验证。私有迁移 Pack 保留现有三条已评审 record；填充完整真实 AA record 集仍需未来执行带 credential acquisition。ADR-013 written-license gate 继续禁止公开真实数据分发。

## 阶段 5：自适应执行

用运行时证据纠正初始处理级别不足。

- 增加形式化 failure 和 progress signal。
- 根据确定性证据执行 `light → standard → deep` 升级。
- 只在明确任务或 phase 边界重新判断。
- 在切换价值和 phase 证据清楚前禁用降级。
- 在 Session 中记录每次升级和解释。

验收：重复失败和 capability 丢失会升级或停止；模型自报不能单独触发切换或关闭未解决问题。

## 阶段 6：恢复

先增加 Continue，再只对明确支持的 effect class 增加隔离支持的 Salvage 与 Restart。

验收：fault injection 证明每项声明动作都保留用户和其他 Agent 的工作；不支持的 effect 会停止或请求介入，而不是假装回滚。

## 阶段 7：子 Agent 与跨 Agent adapter

- 父 Agent 提议语义任务约束，不能绕过具体模型选择。
- 进程内 child 使用同一 Host policy 路由。
- 只有 Codex 与 Claude Code 的创建／切换 API 暴露所需控制时才增加 adapter。

验收：父 Agent 提议不能绕过用户和 Host 约束；child 选择保持可解释、可持久化。

## 阶段 8：真实使用校准与生态

- 在明确同意下收集最小化客观信号，例如所选级别、route、延迟、失败、升级和 Manual takeover。
- 用 dogfood 调整任务映射和 AA 档位边界，不把用户选择当正确标签。
- 支持带版本和 provenance 的社区 evidence binding 与 policy profile。
- 决定兼容官方 DSH 或基于 fork 的 release 载体。

验收：更新可逆且可归属；真实活跃用户留存继续作为产品指标。

## 可选评估轨道

RouterBench 不再是 Auto admission gate。后续可以增加聚焦的评估套件以比较策略、检测回归或研究具体模型切片，但缺少自建模型 Benchmark 不阻塞阶段 1–4。

## 明确非目标

- 宣称 AA 证明具体任务最优性或安全。
- 建立通用模型排名服务。
- 组织级预算、审批、队列或配额调度。
- 训练路由基础模型。
- 自动回滚未声明 effect。
