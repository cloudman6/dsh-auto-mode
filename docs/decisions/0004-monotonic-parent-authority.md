# ADR-004：父 Agent 默认只有单调提高质量要求的权限

## 状态

Proposed

## 日期

2026-08-14

## 背景

父 Agent 比 Host 更了解子任务意图，但它仍然是模型，未必能正确选择具体模型。如果父 Agent 的 model/effort override 无条件高于 Routing Policy，它可以习惯性使用最强模型或错误降低配置，使 Auto 失效。

## 决策

父 Agent 默认提交语义 RoutingConstraints，可以提高最低 route、要求独立评审或声明能力约束，但不能降低 Host 判定的质量下限，也不能指定任意原始 provider/model/effort。

只有用户在 profile 中显式授权时，父 Agent 才能从 allowlist 中选择语义 route。每次 override 持久记录，但不作为正确标签。

## 备选方案

### 父 Agent 完全控制具体模型

拒绝。形成静默绕过入口并与部署配置强耦合。

### 父 Agent 完全没有输入权

拒绝。会丢失子任务风险、独立评审和能力要求等重要意图。

### 父 Agent 声明的风险视为事实

拒绝。模型可能漏报或误解风险；Host 仍需独立评估和执行硬约束。

## 后果

- 需要持久、结构化的 RoutingConstraints。
- Delegation Policy 与 Routing Policy 职责分离。
- 进程内 child 使用统一 `agent/request`；不需要单独 Scheduler。
- 外部 provider 若必须创建前选模型，需要调用相同 Routing Policy 的适配器。
