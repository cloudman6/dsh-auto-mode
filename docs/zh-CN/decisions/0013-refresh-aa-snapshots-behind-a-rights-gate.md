<!--
translation-source: docs/decisions/0013-refresh-aa-snapshots-behind-a-rights-gate.md
translation-source-blob: 84236954205b162076e037587339349e1747ea7f
translation-status: current
-->

# ADR-013：在显式权利 gate 后更新 AA snapshot

[English](../../decisions/0013-refresh-aa-snapshots-behind-a-rights-gate.md)

## 状态

Proposed

## 日期

2026-08-22

## 背景

Auto Mode 需要较新的 Artificial Analysis 能力、价格和延迟事实，但不能让请求路径依赖 live remote service。人工抄录不可复现，也无法可靠展示 record rename 或 binding 变化，并且容易让格式错误的数据覆盖上一份有效本地 catalog。

Artificial Analysis 已发布版本化 Data API。官方文档把 model ID 和 creator ID 定义为稳定集成键，要求 API key 保留在服务端，并通过 Pro endpoint 提供当前 policy 所需的 language-model 数据。Free endpoint 不包含 `aa-route-policy/v1` 使用的 blended-price 字段。因此获取请求必须固定 Pro language-model endpoint 和 performance prompt type，不能依赖未文档化网页数据或截图。

数据访问不等于再分发权利。2026-08-19 修订的 Artificial Analysis Data Platform Terms v1.1 禁止再分发原始或结构化机器可读 Data；如果对外提供的产品主要用途包含 model 或 provider 选择指导，还要求事先获得书面同意。这些限制直接适用于 AA 驱动的 Auto router。维护者授权接入 API 不能代替 Artificial Analysis 的书面许可。

本决策核验的官方来源：

- https://artificialanalysis.ai/data-api/docs
- https://artificialanalysis.ai/data-api
- https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf
- https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf

## 决策

把 `aa-snapshot-refresh/v1` 实现为维护者运行的离线发布工作流。它不属于 DSH runtime request path。

受支持的获取 adapter 只通过 HTTPS 调用 `https://artificialanalysis.ai/api/v2/language/models`，固定 `prompt_type=medium`，遵循已文档化的 pagination envelope，并且只从 `AA_API_KEY` 读取 API key。它拒绝 redirect、过大响应、意外 tier、格式错误的 pagination、重复稳定 ID 和缺少 policy 字段。原始响应和 credential 留在 Git 忽略的本地 workspace，绝不进入浏览器 client。

每次 refresh 都使用显式 manifest，固定 source endpoint、API index version、完整 capability-methodology version、capture time、maximum age、terms version、attribution，以及两种 rights mode 之一：

- `internal-only`：默认值。生成的 snapshot 只留在本地，不得再分发。
- `written-license`：需要一个可审计的外部 grant reference，并明确覆盖机器可读分发和 AA 驱动 model-selection 产品。Grant 本身留在 Git 之外。

工具不声称 grant reference 可以证明法律充分性。它只记录维护者声明的依据，并在缺少必需范围时 fail closed。

候选 snapshot 只包含已评审 binding plan 引用的稳定 AA record，以及当前 policy 实际消费的字段：稳定 record identity、展示 metadata、固定 Intelligence Index score、固定 blended price 和 median time to first answer token。Name 和 slug 不得替代稳定 ID。已绑定 record 不完整会使 candidate 失效；未绑定且不完整的 source record 不会被复制。

相同 acquisition bundle、manifest、binding plan、Host route 和 previous seed 必须确定性地产生相同结果。输出包含 content digest 和 review report，覆盖 record 新增、删除、改名、指标变化，binding 新增、删除、替换，capability band 变化和每档排序变化。Prepare 阶段绝不修改 active seed。

应用 candidate 时必须提供 review report 显示的准确 digest，并验证 active seed 仍与 candidate 记录的 predecessor 一致。文件工作流再次验证 candidate，把上一份有效 seed 写入 rollback slot，然后原子替换 active seed。Rollback 会校验保存的 seed 并原子恢复。中断或拒绝的更新必须保留原 active seed 可用。

Git 中只提交合成的离线 AA-shaped fixture。真实 AA snapshot、原始 API 响应、credential 或保密 license grant 均不得提交，也不得打包进入 DSH browser client。

## 考虑过的替代方案

### 每次 Auto 决策时查询 AA

拒绝。它会把 availability、latency、credential、rate limit 和 upstream drift 引入 routing path，并使历史决策更难重建。

### 因字段较少而提交最小化真实 AA snapshot

没有书面许可时拒绝。可单独识别的 score、price 和 latency 即使经过字段最小化，按当前条款仍是结构化 Data。

### 不使用 API key 抓取公开网页

拒绝。网站条款限制自动 scraping，网页展示也不是稳定的机器契约。

### 自动跟随 name、slug 或 replacement record

拒绝。Name 和 slug 可能变化；新 record 在 binding replacement 被明确评审前不具备证据等价性。

### 获取后立即覆盖 current seed

拒绝。Acquisition、review、approval 与 publication 是独立状态转换；remote 或 malformed response 不能直接控制 active catalog。

## 后果

- Auto 继续从冻结本地 seed 运行，不产生 live AA dependency。
- 维护者可以复现并审计 refresh，而无需提交原始 source data。
- 在外部书面 grant 覆盖本产品和预期机器可读分发前，真实 AA metric 的公开分发继续被阻止。
- 当前 policy 使用 blended-price 字段，因此需要 Pro 或 Commercial API entitlement；Free endpoint 不足够。
- 每项 binding 与 band 变化都会在发布前显式展示，并且上一份有效 seed 可以恢复。
- Terms 或 API schema 变化会有意停止 refresh，直到 manifest 和 adapter 完成评审。
