<!--
translation-source: docs/routerbench.md
translation-source-blob: 14894625af9d3c1cd31fdf39ae41f64871326c58
translation-status: current
-->

# RouterBench

[English](../routerbench.md)

## 目的

RouterBench 是 Auto Mode 的证据基础。它必须分别回答两个问题，不能用同一份数据或同一个 runner 混合回答：

1. Route Capability Bench：哪些 provider/model/reasoning-selection 配置能在某类任务上通过绝对与相对质量门槛？
2. Policy Scenario Bench：生产策略能否正确选择、升级、降级、abstain 和恢复；每层新增控制面是否改善端到端结果？

凡是运行策略的地方，Benchmark 与在线执行使用同一策略核心和 schema。Benchmark 的实验分组、oracle 元数据和 evaluator 不得进入生产策略输入。

阶段 0P 有意在这些 admission 证据就绪前启动。它的 Artificial Analysis snapshot 是带 `experimental-unadmitted` 状态的外部先验，绝不能替代 Route Capability Bench 结果。阶段 0P 可以验证集成、持久化、解释和产品闭环行为，但不能满足绝对门槛、非劣性界限或阶段 0C admission。Dogfood case 在复用于任何 calibration 或 evaluation split 前必须经过 provenance 与泄漏审查，且永远不能事后加入 held-out set。

## 证据分层与数据隔离

每个 Benchmark 版本必须区分：

- 用于选择阈值或拟合评估规则的校准集。
- Policy Pack 构建过程中使用的验证集。
- 只有 taxonomy、assessor、policy、profile 和 evaluator 版本冻结后才能打开的留出验收集。
- 用于漂移与 abstain 测试的时间外和分布外数据集。

数据切分按 fixture、仓库、来源、任务族和近重复簇分组。case 必须把执行可见输入与 evaluator 专用 oracle 元数据隔离：

```ts
interface CapabilityCase {
  id: string
  version: number
  executionInput: {
    prompt: string
    fixture: FixtureRef
  }
  oracleMetadata: {
    taskKind: TaskKind
    risk: RiskLevel
    verifiability: Verifiability
    evaluators: EvaluatorSpec[]
    expectedEvidence: EvidenceRequirement[]
    allowedSideEffects: SideEffectPolicy
  }
}
```

Task Assessment 和 Routing Policy 绝不能接收 `oracleMetadata`。

## Route Capability Bench

把同一 case 随机配对运行在候选配置和已配置基线上。使用多次独立运行估计模型与环境方差。记录：

- 精确 deployment profile、reasoning-selection encoding 和已知 model/provider 指纹。
- Fixture hash 和环境摘要。
- Evaluator、rubric、judge 和 taxonomy 版本。
- 执行顺序 seed 与重复实验标识。
- 原始结果、结构化证据、延迟、token 和成本。

基线自身必须先通过绝对门槛。候选配置不能因为“与一个失败的基线相当”而获准进入 Auto。

## Policy Scenario Bench

策略行为需要显式事件场景，不能只依赖不透明 fixture：

```ts
interface ScenarioCase {
  id: string
  version: number
  initialSession: SessionFixtureRef
  initialExecutionWorld: ExecutionWorldFixtureRef
  actors: ScenarioActor[]
  eventSchedule: ScheduledEvent[]
  faultSchedule: ScheduledFault[]
  checkpoints: CheckpointFixture[]
  routingConstraints: RoutingConstraintFixture[]
  expectedTrace: TraceInvariant[]
  sideEffectOracle: SideEffectOracle
}
```

场景覆盖可信 phase 转换、多 episode、restart 血缘、冷恢复、provider 丢失、事件持久化失败、并发修改、子 Agent 约束和 Session handoff。确定性状态机仿真与真实 DSH adapter contract test 是两个独立测试层。

## 初始任务类别

分类体系采用层级结构。任务类型、风险、可验证性、可逆性和错误可检测性是独立维度；宽泛类别上的准入不能掩盖高风险切片失败。

初始内容覆盖：

- 可机械验证编码：参数校验、重构、诊断、并发、资源生命周期和权限边界。
- 部分可验证工作：有来源的总结、代码评审、API 文档和迁移方案比较。
- 开放任务：架构权衡、研究综合、技术论证和演进建议。
- 路由场景：初始选择、abstain、provider 丢失和 `no-safe-route`。
- 恢复场景：continue、可归因修改、checkpoint 失败、salvage/restart 和未知外部副作用。
- 委派场景：父约束接受/拒绝、系统性过度升级、持久化子约束和模型多样性请求。

## 质量评价

### 机械验证工作

使用真实测试、类型检查、静态分析、构建、隐藏要求、mutation oracle 和确定性不变量。通过可见测试是必要证据，不代表需求完整性已经得到证明。

### 开放任务

组合使用以下证据：

- 绝对 rubric 和预先编写的关键遗漏项清单。
- 隐藏事实图或基于来源的证据要求。
- 引用正确性、来源忠实度和覆盖率。
- 盲化随机配对比较。
- evaluator 多样化并版本化，记录模型家族及已知训练关系元数据。
- 高风险 case、evaluator 分歧或基线失败时，必须进行人工或领域专家盲审。

只能称 evaluator 具有多样性，不能宣称它们统计独立。必须版本化 judge、测量位置偏差和同家族偏差、保留判定理由，并公开分歧而不是用平均值掩盖。

## 统计准入协议

每个 Policy Pack 需要预注册：

- `epsilon`：单侧非劣性界值。
- `delta`：不可接受结果概率上界。
- 置信水平、统计功效、最小效应和区间方法。
- 对 case、模型运行、仓库和 evaluator 方差建模所需的重复次数。
- 候选配置 × 任务类别决策的多重比较校正。
- 由罕见严重失败目标推导的最低样本量。

二元不可接受结果应使用有依据的精确或保守置信上界。零次观测失败不等于零风险；95% 置信下的粗略 `3/n` 法则说明，小样本不能支撑严格的 `delta`。

准入必须同时满足：

```text
基线通过绝对质量与不可接受结果门槛
AND 候选的非劣性区间满足 epsilon
AND 候选的不可接受结果上界满足 delta
AND 达到预注册的功效与样本量
AND 不存在未解释的严重失败簇
AND 留出验收数据覆盖该任务切片
```

## 策略消融实验

使用相同 case、预算和随机执行顺序，至少比较：

1. Always Baseline：整个任务都使用已准入的基线配置。
2. Session Static Auto：每个 Session/任务目标只选择一次已准入 route。
3. Within-turn Auto：不带完整恢复的可信 phase 路由。
4. Full Auto：turn 内路由加上被评估的恢复控制面。

报告相邻实验组的增量差异。如果某项恢复收益在 Always Baseline 下同样存在，它属于通用执行监督收益，不是路由收益。

只有 turn 内路由和完整 salvage/restart 能带来实质端到端增益，同时继续通过全部质量与安全门槛时，才进入产品范围。

## 核心指标

### 质量与覆盖

- 基线绝对通过率。
- 带区间的 `quality_gap_to_baseline`。
- `unacceptable_result_rate` 上界。
- `under_routing_loss`、严重失败簇、分位数和最差切片。
- `auto_coverage`、abstain、`no-safe-route` 和分布外比例。

### 性能与产品价值

- 首个有效结果延迟和完整任务延迟。
- 输入、输出、assessor、replay、retry 和 recovery token。
- 模型调用成本和 Benchmark 摊销成本。
- Prompt cache 损失和切换开销。
- 各策略实验组的增量价值。

### 恢复与委派

- 升级 precision/recall 和 selective risk。
- Episode 持续时间分布、未解决 survival 和 release 正确性。
- Continue/salvage/restart 的增量成功率与成本。
- 对已声明支持副作用的有害修改逃逸率。
- 父 Agent 升级请求、接受、拒绝和 override 比例。

## 准入生命周期与撤销

Route Admission 记录配置身份、支持能力、任务切片、证据版本、样本量、统计结果、数据日期、过期时间、失效条件和撤销状态。

出现以下情况时暂停或撤销准入：

- Provider/model 指纹变化或无法识别。
- 配置别名可能指向未经验证的部署。
- 周期性配对 canary 越过漂移阈值。
- Policy Pack 过期。
- 出现新的严重失败簇。
- 所需能力或 evaluator 假设发生变化。

撤销后立即从较弱的自动 route 移除该配置。如果不再存在已准入基线，Auto 返回 `no-safe-route`。

## 不使用的标签

以下事实不能证明 route 正确：

- 用户或父 Agent 选择了某个模型或 route。
- 用户接受或拒绝了切换。
- 模型声称任务简单、完成或问题已解决。
- 一次结果没有被重做。

可用证据包括刻意设计的配对评估、可复现验证、与客观证据绑定的明确纠正、确认的任务完成条件，以及可归因的恢复副作用。
