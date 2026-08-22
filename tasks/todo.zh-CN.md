<!--
translation-source: tasks/todo.md
translation-source-blob: fcb46213c7511017ea8aa84c8fdbfff99d450ed7
translation-status: current
-->

# 任务清单：AA 驱动的 MVP 后 Auto

[English](todo.md)

## Task 1：把 Host route identity 绑定到 AA 证据

**验收标准：**

- [x] 稳定 Host route identity 包含 provider、model，以及每个 Host 物化执行选项的 fingerprint。
- [x] 一条版本化显式 binding 把 eligible Host route 映射到一个冻结 snapshot 中一条稳定 AA record。
- [x] Effort 和 variant 保持 provider 可选维度；模糊、陈旧、有歧义或跨配置 binding 被拒绝。

**验证：**

- [x] 混合 provider fixture 覆盖零个、一个和多个执行控制项、有效 binding、collision、歧义和 AA-record replacement。
- [x] 现有 MVP 与 Manual 测试继续通过。

**依赖：**无

## Task 2：编译本地 AA catalog

**验收标准：**

- [x] 被 Git 忽略的本地 seed 只连接到有效 DSH route。
- [x] 每条 entry 记录 snapshot、binding-rule version、AA record、Host route identity、实际配置 fingerprint 和 capability facts。
- [x] 无效或未匹配 row 带稳定原因被排除，且不提交 secret。

**验证：**

- [x] Catalog fixture 无需网络即可确定性运行。
- [x] Secret 和 tracked-dataset 检查通过。

**依赖：**Task 1

## Task 3：分配处理级别并按价格优先解析

**验收标准：**

- [x] 每条合格 route 恰好属于一个带版本 Light、Standard 或 Deep 档位。
- [x] 同档排序使用 AA price、AA latency、稳定 route ID。
- [x] 缺失字段遵循一条显式规则，discovery 顺序不会改变 winner。

**验证：**

- [x] 边界与 permutation 测试覆盖所有档位和 tie-break。
- [x] 解释指出档位与价格优先依据。

**依赖：**Task 2，以及维护者选择 AA field/边界

## Checkpoint A：Catalog 基础

- [x] Task 1–3 无需 DSH provider credential 或实时 AA access 即可通过。
- [x] Manual 行为不变。
- [x] 不要求项目 Benchmark 或精确 deployment fingerprint。

## Task 4：冻结 Task Assessor 契约

**验收标准：**

- [x] Schema 覆盖 task kind、scope、complexity、risk、verifiability、confidence 和 reasons。
- [x] 输入上下文、环境感知 route 解析及逐次调用冻结、timeout、validation 和 confidence threshold 明确。
- [x] 契约禁止输出 provider/model/effort，并把失败映射到 Deep。

**验证：**

- [x] 契约 fixture 覆盖有效、无效、timeout 和低置信度输出。

**依赖：**Task 1–3，以及维护者批准 `task-assessor-route-policy/v1` 与 `task-assessor-contract/v1`

## Task 5：实现语义判断与确定性级别映射

**验收标准：**

- [x] Assessor 在 Auto 递归之外运行且没有工具。
- [x] 确定性策略把结构化属性映射到 Light、Standard 或 Deep，并记录 reason code。
- [x] 高风险、范围未知、无效输出、timeout 和低置信度选择 Deep。

**验证：**

- [x] Fixture 覆盖编码、调试、研究、写作、架构、安全和模糊任务。
- [x] 重复有效输入产生相同级别和解释。

**依赖：**Task 3、4

## Checkpoint B：语义路由

- [x] Assessor 只提供证据；Host policy 拥有决策权。
- [x] Assessor 输出不包含具体 route。
- [x] 所有 fallback 路径确定且可见。

## Task 6：集成冻结 Auto 决策

**验收标准：**

- [x] 一项决策在 assembly 前组合 assessment、constraints、catalog 和 route resolution。
- [x] Assembly、`agent/request`、Session 事实和 UI projection 使用同一 provider/model/effort。
- [x] 无合格 route 时升级级别或带明确原因使用配置的 Deep fallback；没有有效 fallback 时明确失败。

**验证：**

- [x] 固定 fork composition 覆盖 Light、Standard、Deep、升级、fallback 和 failure。
- [x] Cold reconstruction 保留实际 route 和解释。

**依赖：**Task 3、5

## Task 7：迁移 UI 术语与解释

**验收标准：**

- [x] UI 使用 Light/Standard/Deep 和轻量/常规/深度，而不是 fast/standard/strong。
- [x] Selector 与 conversation 显示实际 model、effort、任务处理级别以及 AA 或 fallback 依据。
- [x] 现有滚动、蓝色高亮、两次呼吸和消息位置保持不变。

**验证：**

- [x] 浏览器测试覆盖仅 model、仅 effort、二者及仅 level 变化。
- [x] 中英文 snapshot 保持 current。

**依赖：**Task 6

## Task 8：证明 AA 驱动 Auto Beta

**验收标准：**

- [x] 不同 task fixture 到达三档和不同合格 route。
- [x] 同档选择遵循 AA price 和 latency 排序。
- [x] 显示、持久化和实际请求配置一致；Manual 不变。

**验证：**

- [x] 聚焦 unit、Loader、Session、GUI 和可用真实 provider 场景通过。
- [x] 公开解释不包含 Benchmark、optimality、non-inferiority 或 safety claim。

验证环境没有提供 provider credential，因此没有可运行的阶段 3 新 live-provider 场景，也不声明此类结果。已接受的阶段 0P 真实 provider dispatch 证据继续作为 live seam 证明。

**依赖：**Task 6、7

## Checkpoint C：AA 驱动 Beta

- [x] Task 1–8 完成。
- [x] 产品通过一次 Auto 操作即可使用且保持透明。
- [x] 当前 fork、plugin、catalog、assessor 和 policy version 已记录。

## Task 9：定义并实现 AA snapshot 更新

**验收标准：**

- [x] 获取方式、attribution、rights、retention、freshness 和 minimization 已记录。
- [x] 畸形或不完整更新不能取代上一有效 snapshot。
- [x] 维护者可以检查变化并恢复上一有效 snapshot。

**验证：**

- [x] Offline fixture 覆盖更新、拒绝、rollback、binding 新增、删除、替换和 AA-record rename。
- [x] Credential 和再分发原始数据集留在 Git 与浏览器 client 之外。

**依赖：**Checkpoint C，以及新增依赖或远程服务的明确授权

## Task 10：接受 Evidence Pack 架构

**验收标准：**

- [x] ADR-014 固定独立 Snapshot、Binding Registry、Route Policy、Manifest、EvidenceRouteKey、ExecutionFingerprint、Active Catalog 与 GREEN/AMBER/RED 语义。
- [x] 决策准确说明取代 ADR-011 和 ADR-013 的哪些条款，并保留其余 rights 与 runtime-offline 边界。
- [x] 在不兼容 runtime 实施开始前，维护者显式把 ADR-014 从 Proposed 改为 Accepted。

**验证：**

- [x] 中英文 ADR 与 decision index 保持 current 且链接有效。
- [x] `git diff --check` 与 conflict-marker 检查通过。

**依赖：** Task 9 与维护者显式批准

## Task 11：实现 Evidence Pack 契约

**验收标准：**

- [x] Snapshot、Binding Registry、Route Policy 和 Manifest 可独立校验，具有确定性 serialization 和组件 digest。
- [x] Manifest compatibility 与 rights mode 使用稳定 reason code fail closed。
- [x] 真实 AA metric、credential、grant 或私有 refresh material 不进入 tracked fixture 或 browser output。

**验证：**

- [x] Contract test 覆盖 valid、malformed、duplicate、oversized、incompatible、tampered 与 nondeterministic input。
- [x] 现有 catalog 与 Manual test 保持绿色。

**依赖：** Task 10

## Task 12：分离 EvidenceRouteKey 与 ExecutionFingerprint

**验收标准：**

- [x] Provider-scoped normalization 从声明的 evidence-defining control 推导精确 canonical EvidenceRouteKey。
- [x] 完整 Host-materialized configuration 继续生成持久化 ExecutionFingerprint，用于 assembly/request equality。
- [x] 仅执行默认值变化保留 evidence match；model、reasoning、variant 或已声明 evidence-control 变化不能 collision。

**验证：**

- [x] Mixed-provider test 覆盖零个、一个和多个 evidence control，以及 temperature、token、stop、credential-reference、variant 与 effort 变化。
- [x] Fuzzy name/slug matching 和 ambiguous normalization 以稳定 reason 失败。

**依赖：** Task 11

## Task 13：构建完整 policy-eligible AA Snapshot

**验收标准：**

- [x] 扫描固定 acquisition 的每一页；独立于 binding 或当前 Host route，保留每条 capability 与 price 有效的唯一 record。
- [x] 只保留 policy 使用的稳定 identity、display、capability、price、latency 与 source field；nullable latency 遵循现有排序规则。
- [x] Bound、stable-ID integrity、methodology、rights、freshness 与 credential 保护继续 fail closed。

**验证：**

- [x] 离线 fixture 覆盖多页 acquisition、eligible unbound addition、incomplete exclusion、duplicate、page reorder、oversized data 与不变的确定性输出。
- [x] Runtime test 证明不发生 AA network call。

**依赖：** Task 11

## Task 14：实现长期 Binding Registry

**验收标准：**

- [x] 精确 EvidenceRouteKey-to-AA-record mapping 独立于当前 Host inventory 与单个 Snapshot ID。
- [x] Binding 从 Host availability 派生 active 或 dormant 状态，并支持 quarantine，且不修改无关 mapping。
- [x] 结构化唯一匹配 provider rule 可以自动生成 candidate；name、slug、similarity 和 latest-record guess 不能绑定或替换 record。

**验证：**

- [x] Fixture 覆盖 active、dormant、reactivated、unbound、quarantined、duplicate-key、duplicate-record、ambiguous、missing-record 与 stable-ID replacement。
- [x] Registry permutation test 产生相同 serialization 与 lookup result。

**依赖：** Tasks 12 和 13

## Checkpoint D1：Evidence 契约

- [x] Tasks 10–14 在 Accepted ADR-014 下完成。
- [x] Identity、Snapshot 与 Registry fixture provider-neutral 且确定性。
- [x] 现有 Runtime 行为通过显式 compatibility path 保持可用。

## Task 15：派生运行时 Active Catalog

**验收标准：**

- [x] 当前 Host route 在 Route Policy 分档和排序前，与精确 Registry key 和当前 Snapshot record 连接。
- [x] Active entry 保留 EvidenceRouteKey、AA record identity、Snapshot identity、Binding Registry version 与完整 ExecutionFingerprint。
- [x] Dormant、unbound、quarantined、malformed、incompatible 与 Host-invalid item 以稳定 exclusion 隔离。

**验证：**

- [x] 添加一条已有 dormant binding 的 Host route，无需修改 Snapshot 或 Registry 即可激活。
- [x] Discovery order、仅执行默认值和无关 invalid record 不能改变有效 winner。

**依赖：** Task 14

## Task 16：自动化例外驱动 refresh

**验收标准：**

- [x] GREEN update 无需人工批准即可原子应用；AMBER update 隔离受影响 evidence，同时保留有效推进；RED update 保留上一份有效 pack。
- [x] 分类覆盖 metric、stable-ID 不变的 rename、unbound record、dormant transition、missing bound record、normalization ambiguity、methodology、schema、terms、rights、compatibility 与 digest integrity。
- [x] 每次应用 update 都保留确定性报告和经过验证的 rollback。

**验证：**

- [x] 离线文件测试覆盖每个 GREEN/AMBER/RED reason、interruption、tampering、stale predecessor、atomic replacement 与 rollback。
- [x] Report 或 CLI stdout 不暴露 credential、raw response body 或真实 tracked AA data。

**依赖：** Tasks 13–15

## Checkpoint D2：自动化 evidence maintenance

- [x] Tasks 15–16 完成。
- [x] 常规 AA metric update 不需要人工动作。
- [x] Semantic 或 contract exception 不能静默改变 active evidence。

## Task 17：建立 Runtime 与 Evidence Pack 更新边界

**验收标准：**

- [x] Runtime 与 Evidence Pack 独立版本化，并由一个已验证 compatibility manifest 连接。
- [x] 本地 installer/update operation 在原子激活前验证完整 pair，并保留上一份有效 pair 用于 rollback。
- [x] 默认实现不增加外部 dependency、release workflow、public service 或真实数据分发路径。

**验证：**

- [x] Packaging test 证明 compatible install、incompatible rejection、metric-only pack update、Runtime-only compatible update、interruption safety 与 rollback。
- [x] Package inspection 证明私有 maintenance file 和真实 AA data 不在其中。

**依赖：** Tasks 11 和 16

## Task 18：迁移旧 catalog seed

**验收标准：**

- [x] 一个显式 migration 把有效组合 schema-v1 seed 转成 Snapshot、Binding Registry、Route Policy reference 与 Manifest artifact。
- [x] Conversion 拒绝 ambiguous 或 lossy evidence mapping，不进行推断。
- [x] 现有 schema-v1 Session 保持可读，并保留原始冻结 evidence 与 execution facts。

**验证：**

- [x] Fixture 覆盖当前 seed conversion、确定性 rerun、invalid legacy input、ambiguous control extraction 与回退到 predecessor artifact pair。
- [x] 相同 Host inventory 和 policy 在迁移前后产生相同 eligible winner。

**依赖：** Tasks 15 和 17

## Task 19：端到端证明 Evidence Pack 路径

**验收标准：**

- [x] 从完整 acquisition 到本地 activation、runtime Active Catalog、Task Assessor、resolver、request、Session 与 UI 的路径工作，且 runtime 不访问 AA。
- [x] Dormant activation、全部三个 handling level、price/latency ordering、GREEN/AMBER/RED behavior、rollback 与 cold reconstruction 可见且确定性。
- [x] Manual 保持不变，公开产品文本不包含不受支持的 AA、Benchmark、safety 或 optimality claim。

**验证：**

- [x] 聚焦 unit、完整 `npm test`、固定 Loader/Session、keyless browser、migration、packaging、secret、translation 与 link check 全部通过。
- [x] 任何无法执行的 credential-dependent scenario 被报告为未声明，而不是被静默跳过并当成 evidence。

**依赖：** Tasks 12–18

## Checkpoint D3：阶段 4.1 完成

- [x] Tasks 10–19 完成，本地 Runtime/Evidence Pack pair 可安全 rollback。
- [x] `PROJECT_STATUS.md`、specification、architecture、routing policy、roadmap、maintenance guide、example 和 translation 描述已实现状态。
- [x] 除非独立满足 ADR-013 written-license gate，否则公开真实 Evidence Pack 分发保持禁用。

## Task 20：接受 Free Evidence Pack 决策

**验收标准：**

- [x] ADR-015 固定 Free endpoint、normalized-price derivation、eligibility、missing-data、migration 和 rights 边界。
- [x] ADR-015 明确只取代 Pro endpoint 和 blended-field 要求，并保留精确 binding 与离线 runtime。

**验证：**

- [x] 英文、中文 ADR 与索引保持 current 且链接有效。

**依赖：** Task 19 与维护者显式批准

## Task 21：实现私有 Free acquisition

**验收标准：**

- [x] Evidence Pack CLI 使用一个 server-side key 获取 `/api/v2/language/models/free` 的全部 page。
- [x] 只有符合 Free response shape 的 Free、Pro、Commercial caller tier 被接受；redirect、畸形 pagination、过量数据和失败不会泄露 secret。

**验证：**

- [x] 聚焦测试覆盖 pagination、tier、bound、malformed content、error redaction 与 credential absence。

**依赖：** Task 20

## Task 22：实现 Snapshot v3 与 Route Policy v2

**验收标准：**

- [x] Policy eligibility 要求 Intelligence 与 input/output price，并独立于 binding 保留每条符合条件的稳定 record。
- [x] Snapshot record 保留原始 input/output/cache-hit price、derivation basis、normalized 7:2:1 price 与 nullable latency。
- [x] Runtime 继续按既有 Light/Standard/Deep 边界分档，并按 normalized price、latency、稳定 route identity 排序。

**验证：**

- [x] RED/GREEN 测试覆盖 field 缺失、invalid value、cache fallback、精确公式、边界、tie、permutation 与 tampering。

**依赖：** Task 21

## Task 23：实现 Runtime v2 compatibility

**验收标准：**

- [x] 新 pack 要求 Runtime compatibility version 2；旧 v1 pack 通过显式确定性 adapter 迁移。
- [x] 旧 Pro blended evidence 有可见标记，且不编造组成 price。
- [x] Active Catalog、assessor、Auto decision、plugin persistence、Session reconstruction 与 Manual mode 保持兼容。

**验证：**

- [x] Migration、Loader、plugin、assessor、route、rollback 和 runtime 无网络测试通过。

**依赖：** Task 22

## Task 24：证明并记录 Free 路径

**验收标准：**

- [x] Maintenance docs 给出精确 private fetch/prepare/apply/rollback 命令，并说明 attribution 与 non-redistribution 边界。
- [x] 一次真实 Free acquisition 创建完整私有 candidate，不跟踪 key、raw response、Snapshot 或 refresh report。
- [x] 权威文档与翻译用 normalized AA-derived pricing 描述，不再称 AA-native blended pricing。

**验证：**

- [x] 聚焦测试、完整 `npm test`、runtime smoke、secret scan、translation、link 与 Git check 通过。

**依赖：** Tasks 21–23

## Checkpoint D4：阶段 4.2 完成

- [x] Tasks 20–24 完成。
- [x] 用户自有 Free key 可以填充并激活私有全市场 Evidence Pack。
- [x] Runtime 继续离线，公开真实 Evidence Pack 分发继续禁用。
