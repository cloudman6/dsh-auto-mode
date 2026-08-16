<!--
translation-source: docs/routing-policy.md
translation-source-blob: e9604cb48a6bfa9778e873e525372853b0402c57
translation-status: current
-->

# 路由策略

[English](../routing-policy.md)

## 目标函数

Routing Policy 求解的是质量约束优化问题。它不追求最便宜的模型，也不因某个配置名为 `strong` 就假定它安全。

```text
准入前提：
  任务类别 baseline 通过绝对质量门槛
  AND candidate 满足预声明的非劣效界限
  AND 不可接受结果概率上界满足 delta
  AND 证据仍有效且不存在未解释的严重失败簇

准入后的目标：
  先最小化端到端延迟，再最小化总成本
```

端到端指标包括评估、prompt 组装、历史重放、缓存损失、切换、失败、升级和恢复。只比较一次 API 调用价格没有意义。

## 阶段 0P 实验目标

阶段 0P 不宣称解决已准入的质量约束目标。它使用独立且明确的 evidence state：

```ts
type RouteEvidenceState =
  | { kind: 'admitted'; admissionId: AdmissionId }
  | {
      kind: 'experimental-unadmitted'
      source: 'artificial-analysis'
      sourceSnapshotId: ExternalEvidenceSnapshotId
      externalRecordId: string
    }
```

Task Assessment 确定性地选择相关 index family：编码工作使用 Coding Index，工具密集的多步骤工作使用 Agentic Index，广义推理使用 Intelligence Index。任何混合权重、分数边界、freshness 周期或延迟/成本 tie-break 都属于带版本实验策略，不能成为隐藏运行时常量。

阶段 0P resolver 只考虑 DSH 与外部记录 identity 精确匹配的配置。`strong` 表示当前有资格精确匹配项中相关外部分数最高者；`standard` 与 `fast` 只在各自已记录的启发式分数边界内选择延迟更低的配置。这些名称是实验档位，不是质量保证。高风险、未知或低置信度 task assessment 从有效冻结 catalog 中选择最强精确匹配。Route 无法匹配或发生漂移、证据无效或缺失必需 Host contract 时，以 `no-experimental-route` 退出 Auto 且不调用模型。它绝不复用 admitted Auto 的 `no-safe-route`。解释必须始终暴露实验状态与来源 snapshot。

Host 声明的 `RecoveryCapability` 与 execution-world effect class 是必需 policy input。[ADR-009](decisions/0009-phase-0p-attributable-worktree-loss-bound.md) 只接受当前 Attempt 在干净隔离任务 worktree 内产生且可归属的未提交文件系统变更。该 routing-safety bound 不等于 route admission，也不是 capability evidence。带版本 Host provider 证明 canonical worktree containment、Attempt scope attribution、process control 与 `externalSideEffects: 'none'` 前，包括 `strong` 在内的任何实验档都不得执行可变工作。Git repository-state mutation、依赖或系统安装、外部 effect、未知 attribution、dirty-start drift、路径、symlink、hard-link 或 mount 逃逸，以及超出 bound 的任何 mutation，都会以 `no-experimental-route` 终止当前 Experimental Auto attempt。排除的 effect 必须在发生前被阻止；事后检测不能把它们纳入 bound。用户介入只能切换到 Manual 或等待新的 execution-world facts；单纯确认不能授权已拒绝的 Experimental Auto dispatch。Task Assessment 不能推断或覆盖这些 capability facts。

实验外部证据不能满足 `RouteAdmission`，不能被阶段 0C policy 消费，也不能绕过普通 RouterBench 协议直接提升。

## 用户交互边界

普通用户只面对两种模式：

- `Auto`：Host 选择已准入 route，并解释变化。
- 手动：用户直接选择 provider/model/reasoning 行为，包括受支持的默认值。

阶段 0P 保留这两种模式，但把 Auto 标记为 Experimental Auto，并要求维护者显式启用。

普通用户不配置 `epsilon`、`delta`、assessor 阈值、过期时间、canary 或 route 准入矩阵。这些事实属于维护者负责的版本化 Policy Pack。高级用户可以限制 provider、设置预算或安装自定义 pack，但自定义映射在经过同一证据协议准入前不享有质量保证。

手动模式绕过 Auto 策略，但不能绕过 Host 安全和 provider 能力校验。手动选择只表示用户意图，不是正确性标签。

Experimental Auto preparation listener 在手动模式下必须 no-op：把控制权交回 DSH 现有手动模型选择与 Host/provider validation 路径。切到手动可以追加 Auto-exit 审计事实，但绝不能表示成 denied Auto call，也不能 reject 或消费 manual turn。

## Policy Pack 与部署 Profile

版本化 Policy Pack 绑定解释 route 质量保证所需的事实：

```ts
interface PolicyPack {
  id: string
  version: string
  taxonomyVersion: string
  policyVersion: string
  evaluatorVersion: string
  admissions: RouteAdmission[]
  expiresAt: string
  revocationState: 'active' | 'expired' | 'revoked'
}
```

它包含任务 taxonomy、baseline 定义、candidate 准入、质量阈值、assessor 策略、证据引用、过期和撤销条件。部署 Profile 从 DSH 读取 active provider/model catalog 与精确 route 元数据，再与凭据引用、用户 allowlist、能力元数据和稳定 deployment identity 证据组合。Effective Route Catalog 由 Policy Pack 与部署 Profile 共同编译；任何一方都不能单独授予准入。

Reasoning selection 是具体 route identity 的一部分，包含三种不可互换的形式：

```ts
type ReasoningSelection =
  | { mode: 'explicit'; effortId: ReasoningEffortId }
  | { mode: 'adapter-default'; effortId: ReasoningEffortId }
  | { mode: 'provider-default' }

interface AdmissionIdentity {
  providerRoute: string
  modelId: string
  reasoning: ReasoningSelection
  deploymentFingerprint: string
  adapterIdentity: string
}
```

`explicit` 要求精确 route reasoning 元数据包含指定 effort。`adapter-default` 要求存在 resolved adapter default，并记录实体化 effort。`provider-default` 表示 request 有意省略 effort、保留 provider 行为；它不等于未知或空的显式 effort。只有 admission 证据实际评测了该省略行为，且 deployment identity 契约足以检测漂移或保守地使准入失效时，它才能进入 Auto。

Discovery 自动进行，候选数量不硬编码。在 DSH 中可用是进入 admitted Auto 的必要条件，但不是充分条件；只有已发现配置与当前准入的交集才进入该候选集。阶段 0P 按上述精确匹配规则构建结构独立的实验候选集。其他未准入配置仍可保留给手动选择。

provider alias、服务端模型变化、default-effort 变化和缺失 fingerprint 都可能使证据失效。过期、撤销或无法识别的配置在 canary 或完整评估重新授予准入前，不能用于自动降级。

## Route 语义

```ts
type BuiltinRoute = 'fast' | 'standard' | 'strong'

type PolicyDecision =
  | { outcome: 'selected'; route: BuiltinRoute; reasonCode: ReasonCode }
  | { outcome: 'abstained'; requestedFallback: 'strong'; reasonCode: ReasonCode }

type SharedResolutionFailure =
  | 'constraints-unsatisfiable'
  | 'profile-invalid'
  | 'profile-unavailable'
  | 'provider-unavailable'

type RouteResolution =
  | {
      outcome: 'resolved'
      route: BuiltinRoute
      config: EffectiveCallConfig
      evidence: { kind: 'admitted'; admissionIdentity: AdmissionIdentity }
    }
  | {
      outcome: 'resolved'
      route: BuiltinRoute
      config: EffectiveCallConfig
      evidence: {
        kind: 'experimental-unadmitted'
        experimentalRouteIdentity: ExperimentalRouteIdentity
        sourceSnapshotId: ExternalEvidenceSnapshotId
        externalRecordId: string
      }
    }
  | {
      outcome: 'failed'
      evidenceKind: 'admitted'
      failure: SharedResolutionFailure | 'no-safe-route'
      reasonCode: ReasonCode
    }
  | {
      outcome: 'failed'
      evidenceKind: 'experimental-unadmitted'
      failure: SharedResolutionFailure | 'no-experimental-route'
      reasonCode: ReasonCode
    }
```

- `fast`：面向范围明确、低风险工作的最低已准入保证档。
- `standard`：普通生产工作的默认已准入保证档。
- `strong`：任务类别的配置 baseline 保证档，但 baseline 自身必须先通过绝对门槛。
- `abstained`：Policy 没有足够证据选择更弱档位。Resolver 尝试已准入 baseline；若没有安全配置，则返回 `no-safe-route`，不调用模型。

在 admitted Auto 中，`fast < standard < strong` 排序的是策略保证档，不是模型原始智能。具体配置只有在 Policy Pack 对当前任务类别保存有效准入证据时，才能占据 admitted 档位。专用配置若在某类任务上优于配置 baseline，应进入证据支持的档位；模型名称不能决定档位。阶段 0P 的同名档位保持启发式并标记 `experimental-unadmitted`。

Admitted Routing Policy 与 Route Profile Resolver 在同一不可变 Effective Route Catalog snapshot 上运行。阶段 0P 则在结构独立、不可变的 Experimental Route Catalog snapshot 上运行。Admitted resolver 按 admission、identity、capability 与 security 过滤，并以稳定 `AdmissionIdentity` 作为最终 tie-break；experimental resolver 按精确外部 evidence identity 过滤，并使用稳定实验 route identity。缺少 identity 或必需比较指标时返回 `profile-invalid`。Live catalog 顺序、异步 discovery 完成顺序和对象迭代顺序绝不能作为选择信号。

## 约束解析和优先级

Auto 在选择 route 前先解析约束：

```text
Host 安全与 provider 能力约束
→ 用户 provider allow/deny 规则和用户质量下限
→ Host 接受的父 Agent 要求
→ active Recovery Episode 的 floor
→ Routing Policy
→ Route Profile Resolver
```

精确 provider/model/reasoning selection 属于手动模式，不是优先级更高的 Auto 规则。父 Agent 约束只有在映射为 Host 认可的要求，或用户明确授予父 Agent 语义 route override 权限时，才成为硬约束。不支持或冲突的约束产生明确失败，不会被静默丢弃。

Resolver 输出 `ResolvedRoutingConstraints`，记录接受和拒绝的输入、来源、生效候选集、计算出的 floor 和 reason code。Route Profile Resolver 只能在该候选集内解析。

## 初始选择

第一个问题是：

> 当前是否有证据证明某个已准入 route 能满足这项任务的质量与安全要求？

证据不足时 Policy abstain。它不会根据 baseline 的名称推断安全。Resolver 可以使用已准入 baseline candidate，也可以以 `no-safe-route` 停止。

恢复能力也是输入。为可变任务选择弱 route 前，Policy 必须知道执行世界是只读、mutation 可归属且可恢复，还是包含不可逆外部副作用。未知或不可恢复的高影响 mutation 能力会抬高 floor 或阻止 Auto 执行。

## 无机械验证时的准入

运行时没有测试不等于没有客观证据。Policy 可以组合：

1. 当前任务类别的 RouterBench 先验。
2. 任务风险、范围、可逆性和错误可发现性。
3. 引用覆盖、来源忠实度和预声明遗漏 checklist 等部分检查。
4. 分布归属和已校准的评估置信度。
5. baseline 和 candidate 各自的绝对不可接受结果门槛。

低于 baseline 的 route 只有在全部条件满足时才可使用：

```text
candidate 对当前任务类别的准入仍有效
AND baseline 与 candidate 均通过绝对门槛
AND 任务属于已校准分布
AND 影响和范围符合准入 envelope
AND 执行世界恢复能力充分
AND 评估置信度达到策略阈值
```

## Turn 内 phase 路由

turn 内 phase 路由是候选能力，不是第一个可用 Auto 模式的前提。只有 Policy Scenario Bench 证明它相对 Session 级静态路由带来显著端到端改进且不破坏质量门槛时，才可启用。

启用后：

- Execution Context Projector 拥有已确认 `PhaseState`；模型或分类器只能提议 phase。
- Routing Policy 只消费持久化的已确认 phase，不消费自由文本完成声明。
- 未解决 episode 的 floor 只能保持或提高。
- 已确认 phase 变化不会关闭 episode；episode 仍需自己的释放证据。
- 降级需要当前准入、充分恢复能力、滞回，以及大于切换成本的预期收益。

生效保证档：

```text
max(
  已确认 phase 的已准入基础档位,
  用户质量下限,
  Host 接受的委派 floor,
  所有 active episode 的 floor
)
```

## 升级与切换

重复失败、高风险歧义、能力缺失、上下文溢出或准入失效可以立即升级或停止。时间、step 或 token 到期可以触发重新评估，但不能证明问题已解决或释放 floor。

切换可能丢失 prompt cache、要求重放历史并丢失 provider 私有状态。因此 route 选择必须估计剩余工作和切换成本。简单尾部动作若预期节省小于交接成本，不必强制切换；能由确定性工具完成时，优先不再调用模型。

## 决策透明度

Auto 直接执行已准入决策，不要求用户提供伪监督。默认 UI 只显示当前 route、route 变化、abstain、解析失败和恢复动作；连续 `keep` 聚合。详细时间线显示：

- 生效保证档、provider/model/reasoning selection 和 request encoding。
- 选择、保持、升级、降级、abstain 或失败。
- 结构化 reason code 和简短解释。
- 证据引用和 Policy Pack/Profile 版本。
- 恢复动作、执行世界能力和适用时的 checkpoint。

用户接受、拒绝或手动替换 route 只表达用户意图，绝不作为正确路由标签。
