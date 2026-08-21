<!--
translation-source: docs/routing-policy.md
translation-source-blob: c1bbd74eeef90a9968e6fb44e905095f66c39a1e
translation-status: current
-->

# 路由策略

[English](../routing-policy.md)

## 目标

Routing Policy 实现一条简单且确定性的规则：

```text
判断所需任务处理级别
→ 按 availability、capability 和用户约束过滤 route
→ 只保留该级别 route
→ 优先 AA 报告价格更低者
→ 用 AA 报告延迟打破价格平局
→ 用稳定 route identity 打破剩余平局
```

策略不估算 token，也不建立私有成本模型。能力分档、价格和延迟比较都直接来自当前带版本的 AA 快照。

## 任务判断

固定 Task Assessor 返回与 provider 无关的属性：

```ts
interface TaskAssessment {
  taskKind: string
  scope: 'bounded' | 'normal' | 'broad' | 'unknown'
  complexity: 'low' | 'medium' | 'high' | 'unknown'
  risk: 'low' | 'medium' | 'high' | 'unknown'
  verifiability: 'mechanical' | 'partial' | 'none' | 'unknown'
  confidence: number
  reasons: readonly string[]
  assessorVersion: string
}
```

Assessor 使用 Auto 路由之外的固定配置，没有工具，只返回通过校验的结构化数据。它绝不输出模型名或 effort。失败、超时、无效输出或低于策略阈值的置信度都变成 `unknown` 并选择 `deep`。

## 级别语义

```ts
type TaskHandlingLevel = 'light' | 'standard' | 'deep'
```

- `light`：范围明确、风险低、步骤少、结果可直接检查。
- `standard`：一般开发、分析和修改工作。
- `deep`：范围广、不确定性或风险高、难验证或需要深入推理。

界面字段叫“任务处理级别”，而不是“任务难度”。即使修改很小，风险和不确定性也可能要求 `deep`。

确定性 mapper 使用任何重要属性要求的最高级别。高风险、范围广或未知、不可验证或低置信度都会强制 `deep`，并记录所有贡献 reason code。

## Host route identity 与 AA evidence binding

执行 identity 与证据 identity 相互独立：

```ts
interface HostRouteIdentity {
  routeId: string
  provider: string
  model: string
  effectiveConfigFingerprint: string
}

interface AAEvidenceBinding {
  bindingVersion: string
  hostRouteId: string
  effectiveConfigFingerprint: string
  aaSnapshotId: string
  aaRecordId: string
  matchBasis: readonly string[]
  limitations: readonly string[]
}
```

Host identity 覆盖每个会改变执行语义且已物化的请求选项。Effort 是某些 provider 拥有的可选选项，不是跨 provider 必填维度。Binding 必须显式、带版本且经过评审；runtime 不按名称或 slug 模糊匹配。Binding 不得跨越实际配置差异，snapshot 更新也不得静默替换另一条 AA 记录。

Family、version、variant、effort、date 和 provider metadata 在存在时都可以成为声明的 match evidence。无 revision alias 可以携带显式 semantic-match 限制，但绝不能表述成命中 AA 实测精确 deployment 的证明。

## Catalog 编译

Catalog compiler：

1. 读取 DSH 当前可用的具体 route；
2. 物化每条 route 的实际 Host request configuration 并生成 fingerprint；
3. 通过一条已验证 AA evidence binding 连接 route；
4. 排除未匹配、不可用、capability 不兼容或用户禁用的 route；
5. 把每条剩余 route 分到带版本的 `light`、`standard` 或 `deep` AA 能力档；
6. 为一次决策冻结 catalog 和来源快照 identity。

档位边界是维护者管理、从 AA 分数推导的策略数据。它们是启发式规则，必须可见且带版本；改变边界就要改变 policy version。

首版 `aa-route-policy/v1` 使用 Artificial Analysis Intelligence Index 方法版本 `v4.1.1` 和精确字段 `evaluations.artificial_analysis_intelligence_index`：

| 级别 | 分数范围 |
|---|---|
| `light` | `< 35` |
| `standard` | `>= 35` 且 `< 50` |
| `deep` | `>= 50` |

同一 policy 从 `pricing.price_1m_blended_7_to_2_to_1` 读取价格，从 `performance.median_time_to_first_answer_token_seconds` 读取延迟。由于 AA API 的数字 index-version 字段可能省略 patch version，snapshot 单独保存完整方法版本。

## 同一级别内解析

选择级别后，resolver 按以下顺序排列合格 route：

1. AA 报告价格更低；
2. 价格相同或 AA 无法区分时，AA 报告延迟更低；
3. 稳定的具体 route identity。

不估算输入/输出 token。如果某条 route 缺少必需价格字段，它不能意外赢得价格比较；策略必须显式处理缺失数据或排除该 route。

`aa-route-policy/v1` 在 capability 或 price 缺失或无效时排除 route。延迟缺失或无效时保留为 `null`；在同价 route 中排在有延迟数据者之后，再按稳定 route identity 排序。这样既保留有效价格比较，也不允许未知延迟胜过已测延迟。

## Fallback 与升级

- 判断置信度低或任务形态未知时选择 `deep`。
- `light` 或 `standard` 没有合格 route 时升级到下一级别。
- 没有 AA 匹配 route 时，只能在配置的 Deep fallback 可用、通过 Host 验证且由用户或维护者明确配置时使用它。
- 没有有效 fallback 时，Auto 明确失败，不能静默复用过期 route。

Fallback 是保守选择，但不代表经过认证的安全。解释使用“Deep fallback”及其触发原因，不使用“安全 baseline”。

## 用户与父 Agent 权限

用户可以选择 Auto 或精确的 Manual 配置。Manual 在其作用域退出 Auto，且不是正确标签。

父 Agent 可以提出任务属性和约束。Host policy 校验它们并保留最终权力。父 Agent 不能静默指定任意 provider/model/effort 绕过 catalog。

## 透明度

每次决策持久化并显示：

- 任务处理级别；
- 实际 provider/model 与适用执行配置；
- Host route identity、AA 快照和 AA evidence binding；
- 能力档依据；
- 价格优先的 route 选择依据；
- 必要时的 fallback 或升级依据；
- policy、assessor、binding-rule 和 catalog 版本。

界面摘要示例：

```text
任务处理级别：常规
选择：DeepSeek V4 Flash / High
依据：属于 AA 常规能力档；在该档当前可用 route 中 AA 价格更低
```

## 后续自适应行为

Session 内重新判断、失败驱动升级、phase 变化和恢复属于后续 roadmap。它们复用同一套级别名称和 catalog resolver。模型自报不能单独证明 phase 已结束或较低级别已足够。

## 声明

允许：

- “AA 驱动的 Auto 路由。”
- “根据当前 AA 快照、任务属性和价格优先策略选择。”

没有单独证据时禁止：

- “经过 Benchmark 证明的质量。”
- “这个任务的最佳模型。”
- “最安全 route。”
- “保证不劣于 baseline。”
