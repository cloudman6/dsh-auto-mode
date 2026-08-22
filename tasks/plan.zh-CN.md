<!--
translation-source: tasks/plan.md
translation-source-blob: 367c76032b00026910ad302bea03f08671350722
translation-status: current
-->

# 实施计划：AA 驱动的 MVP 后 Auto

[English](plan.md)

## 目标

把已接受的阶段 0P MVP 演进为 AA 驱动 Auto Beta。实现将每项任务分为 Light、Standard 或 Deep；把每条 eligible 实际 DSH route 显式绑定到一条稳定 AA evidence record；并在所选级别内选择 AA 价格更低者，以 AA 延迟和稳定 Host route identity 打破平局。

## 已接受架构决策

- ADR-011 接替 ADR-010，保留其对 Benchmark admission 与延迟优先优化的取消，同时替换强制四字段匹配键。
- AA 是能力、价格和延迟结论的外部来源。
- 版本化 assessor policy 解析并冻结一条适合当前环境的 classifier route；Task Assessor 提供结构化任务属性，确定性 Host policy 拥有最终级别和用户任务 route。
- Host route identity 独立于 AA record identity；variant 和 effort 是 provider 可选维度。
- Manual 模式和已接受的 model/effort 变化 UX 保持不变。

## 依赖图

```text
Host route identity、AA evidence binding 与 fixture
        ↓
AA catalog schema 与 binding validation
        ↓
能力档 compiler 与价格优先 resolver
        ↓
已解析并冻结的语义 Task Assessor
        ↓
端到端 Auto 集成与 UI 术语
        ↓
dogfood 与快照更新流程
```

## 阶段 1：AA catalog 基础

状态：已于 2026-08-21 完成。

### Task 1：把 Host route identity 绑定到 AA 证据

定义实际 Host route identity、稳定 configuration fingerprint，以及到一条 AA record 的显式版本化 binding。覆盖拥有零个、一个和多个执行控制项的混合 provider route。暂不改变 live routing。

### Task 2：编译本地 AA catalog

加载被 Git 忽略的 seed，通过已验证 binding 与 DSH route 清单连接，排除无效匹配，并记录 snapshot 与 binding-rule version。

### Task 3：分配级别并按价格优先解析

从带版本 AA 边界编译 Light/Standard/Deep 档位。按 AA price、AA latency 和稳定 route identity 解析同一级别。

### Checkpoint A

纯 catalog pipeline 确定性、不含 secret、不依赖实时 AA access，且不改变 Manual。

## 阶段 2：语义判断

### Task 4：冻结 Task Assessor 契约

状态：已于 2026-08-22 完成。

定义结构化属性、有限输入、版本化环境感知 route policy、逐次调用 route 冻结、timeout、validation、confidence threshold 和 Deep fallback。

### Task 5：实现已解析 assessor 与级别 mapper

状态：已于 2026-08-22 完成。

在 Auto 递归之外调用已解析并冻结的 assessor，把已校验输出映射到 Light/Standard/Deep 和确定性 reason code。覆盖代表性 fixture 与所有 fallback。

### Checkpoint B

状态：已于 2026-08-22 完成。

Assessor 不输出具体 route；重复结构化输入映射到相同级别；timeout、无效输出、不确定和高风险选择 Deep。

## 阶段 3：产品集成

### Task 6：集成单一冻结决策路径

在已验证 pre-assembly 边界组合 assessment、catalog、constraints 与 resolver。把同一选择应用到 assembly、`agent/request`、Session 事实和 UI projection。

状态：已于 2026-08-22 完成。`auto-decision/v1` 为每个 DSH 用户 turn 刷新一次，重新验证当前 Host route，单调升级，区分 AA evidence 与配置 fallback，在没有有效 route 时明确失败，并可通过必需事件 cold reconstruction 恢复。

### Task 7：迁移用户术语与解释

用 Light/Standard/Deep 和轻量/常规/深度取代原型标签。显示 AA 匹配与配置 fallback 原因，同时保留滚动／呼吸动画和对话位置。

状态：已于 2026-08-22 完成。Schema v2 projection 省略原型 tier；维护 selector 与 conversation fact 显示本地化任务处理级别、实际 model 与可选 effort，以及 AA 或配置 Deep fallback 依据。现有 schema v1 Session 保留旧版读取路径。

### Task 8：端到端证明 Auto 与 Manual

在浏览器和可用真实 provider 场景覆盖三档、价格排序、延迟 tie-break、低置信度 fallback、catalog 缺失 failure、Session 重建和 Manual 不受影响。

状态：已于 2026-08-22 完成。无密钥跨仓库浏览器 fixture 通过真实 Web 与 agent loop 到达 Light、Standard、Deep 与 Manual，证明同档价格与延迟排序，并要求界面显示的 route 与 AA snapshot、持久化 selection 和实际请求配置一致。Loader 与 Session fixture 覆盖 fallback、failure 与 cold reconstruction。环境中没有可用于阶段 3 新 live call 的 provider credential，因此不新增 provider-specific 结果声明。

### Checkpoint C

所有路径的显示、持久化和实际请求 route 一致。公开文字说明由 AA 驱动，不作 Benchmark 质量声明。

状态：已于 2026-08-22 完成。固定支持矩阵及全部 schema 和 policy version 已记录在 `PROJECT_STATUS.md`。

## 阶段 4：快照维护

### Task 9：定义更新流程

选择稳定 AA 获取方式和数据权利边界，校验并最小化快照，检查变化并支持恢复上一有效快照。增加外部依赖或远程服务前需要明确批准。

状态：已于 2026-08-22 完成。ADR-013 接受离线 `aa-snapshot-refresh/v1` 工作流，默认 rights mode 为 `internal-only`，分发真实机器可读指标前必须取得 AA 书面许可。维护 CLI 推导不含凭据的 Host identity，把固定 Pro endpoint 获取结果写入私有文件，准备确定性最小 candidate 与完整 diff，要求精确 digest 批准，原子应用已评审 seed，并验证 rollback 完整性。99 项离线测试通过；仓库只跟踪合成 AA-shaped fixture 与 placeholder 示例。

## 阶段 4.1：可复用 Evidence Pack

状态：处于 active design gate。ADR-014 仍为 Proposed；其不兼容契约取代已接受的 ADR-011/ADR-013 行为前，必须获得显式接受。

### Capability map

| Module ID | 职责 | 依赖 |
|---|---|---|
| `evidence-pack-contract` | 独立 Snapshot、Binding Registry、Route Policy、Manifest、兼容性与失败 schema | ADR-014 |
| `evidence-route-identity` | Provider-scoped EvidenceRouteKey 与独立完整 ExecutionFingerprint | `evidence-pack-contract` |
| `eligible-aa-snapshot` | 从完整固定 acquisition 中保留全部 policy-eligible 最小化 AA records | `evidence-pack-contract` |
| `binding-registry` | 长期精确 mapping、provider normalization rule、dormant 与 quarantine 行为 | `evidence-route-identity`、`eligible-aa-snapshot` |
| `active-catalog` | 从 Host inventory、Registry、Snapshot 和 Route Policy 派生当前 eligible routes | `binding-registry` |
| `exception-refresh` | GREEN 自动应用、AMBER 隔离、RED 拒绝、确定性报告与 rollback | `eligible-aa-snapshot`、`binding-registry`、`active-catalog` |
| `package-update` | Runtime/Evidence Pack 兼容性和原子本地激活边界 | `evidence-pack-contract`、`exception-refresh` |
| `seed-migration` | 显式转换旧 seed，不改变历史 Session facts | `active-catalog`、`package-update` |
| `evidence-pack-e2e` | Runtime、Loader、Session、UI、rollback 与 Manual 非干扰证明 | 所有前置模块 |

构建顺序：contract → identity 与 snapshot → registry → active catalog → refresh → package update → migration → 端到端证明。

### Task 10：接受 Evidence Pack 决策

冻结 ADR-014 的组件 owner、精确 identity rule、exception class、分发边界与迁移后果。ADR 仍为 Proposed 时不开始不兼容 runtime 工作。

### Task 11：实现 Evidence Pack 契约

增加可独立校验、确定性序列化的 Snapshot、Binding Registry、Route Policy 与 Manifest schema。定义组件 digest、Runtime compatibility、rights mode 和稳定 failure code。

### Task 12：分离 evidence identity 与 execution identity

增加带版本的 provider normalization rule，推导精确 EvidenceRouteKey，同时保留完整 ExecutionFingerprint 用于 request equality 和 audit。仅执行默认值不能使 evidence 失效；决定 evidence 的 control 不能 collision。

### Task 13：构建完整 eligible AA Snapshot

处理固定 acquisition 的每一页，保留每条拥有 policy 所需 capability 与 price 字段的 record。继续执行 nullable latency、stable-ID uniqueness、source bound 和 `internal-only` 控制。

### Task 14：实现长期 Binding Registry

独立于当前 Host availability 和单个 snapshot ID 校验精确 key-to-record mapping。支持 dormant activation、确定性结构化 normalization、unbound record 和 quarantined semantic exception，不使用 fuzzy matching。

### Task 15：派生运行时 Active Catalog

连接当前 materialized Host routes、精确 Registry keys、当前 Snapshot records 和 Route Policy。Active entry 保留完整 execution fingerprint，并用稳定 reason 隔离 invalid 或 unmatched route。

### Task 16：自动化例外驱动 refresh

把 diff 分类为 GREEN、AMBER 或 RED。自动且原子应用有效 GREEN update；隔离 AMBER record 或 binding，同时推进无关有效 evidence；拒绝 RED update；保留确定性报告与 rollback。

### Task 17：建立 Runtime/Evidence Pack 更新边界

定义两个独立版本化的本地 artifact，并用一个 compatibility manifest 和原子 pair activation 连接。默认实现保持本地且无依赖；公开 update service、release workflow 或真实 Evidence Pack 分发继续受现有显式授权和权利 gate 约束。

### Task 18：迁移旧 catalog seed

提供显式、确定性的转换，把当前组合 seed 转成 Snapshot、Registry 与 Manifest input。保留旧 Session replay，并拒绝任何必须依赖推断的 mapping。

### Task 19：证明完整路径

覆盖完整 acquisition、dormant activation、identity separation、全部 refresh class、rollback、migration、离线 runtime、全部 handling level、精确 request equality、cold Session reconstruction、UI evidence detail 与 Manual 非干扰。

### Checkpoint D1：契约

ADR-014 已 Accepted；Tasks 11–12 通过聚焦 contract 与 collision test；英文权威文档和中文翻译一致。

### Checkpoint D2：Evidence 自动化

Tasks 13–16 证明普通 AA 更新无需人工动作；配置一条新 route 时，只要存在精确 dormant binding 就能自动激活。

### Checkpoint D3：可安装边界

Tasks 17–19 证明一个兼容 Runtime/Evidence Pack pair 可以在本地原子激活和 rollback。公开真实数据分发仍是独立 written-license gate。

## 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| AA field 或命名变化 | Catalog 停止匹配或静默改档 | 版本化 schema 与 binding；拒绝未知 field；保留上一有效快照 |
| 语义 assessor 不稳定 | 级别错误或不必要 Deep fallback | 版本化 route policy、逐次调用冻结、有限 schema、fixture 回归、确定性 fallback |
| 比较字段不完整 | 同档 winner 错误 | Capability 或 price 缺失时排除；同价时，缺失 latency 排在有测量值之后 |
| 实际 DSH 配置不透明 | 错误 AA binding | 对 Host 物化选项生成 fingerprint；排除未解析或有歧义 route |
| AA 驱动被误解为证明 | 产品声明过度 | 持久化 snapshot 与 reason；强制 AA 驱动限定语 |
| Provider 与 AA identity 没有可靠结构化共同键 | 错误自动 binding | 保持 record unbound；要求一条已评审 provider normalization rule，不使用 fuzzy matching |
| Evidence Pack 超出维护边界 | Refresh 被拒绝或 runtime 成本增加 | 只保留 policy 字段，强制 record/file limit，并保持 runtime compilation 确定性 |
| 自动 refresh 隐藏语义破坏 | 错误 evidence continuity | Methodology、rights、stable-ID、schema、compatibility 或 digest 变化时 RED；隔离 AMBER 情况 |

## 当前开放决策

- 阶段 5 自适应执行的形式化 runtime signal 与重新判断边界。
- 允许降级进入范围前需要哪些证据。
- 公开 carrier 与 update service 尚未决定；阶段 4.1 只实现本地原子 artifact 边界，不增加 release workflow。
- 真实 Evidence Pack 的公开分发仍被 ADR-013 written grant 阻塞。
