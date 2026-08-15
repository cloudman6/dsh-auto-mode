<!--
translation-source: docs/decisions/0004-monotonic-parent-authority.md
translation-source-blob: 7f73dfe12173d859f60be6fd44499c297b29f180
translation-status: current
-->

# ADR-004：父 Agent 权限有界并由 Host 解析

[English](../../decisions/0004-monotonic-parent-authority.md)

## 状态

Accepted

## 日期

2026-08-14

## 背景

父 Agent 了解 child task 意图，但仍是不可信模型。如果具体 model/effort override 高于策略，父 Agent 可能习惯性选择最强配置或错误降低配置。“父 Agent 要求看起来更强就自动成为硬约束”还有另一种失败模式：系统性过度升级会绕过 Auto 并消耗无界资源。

## 决策

父 Agent 提交结构化任务意图和路由约束提议。Host Delegation Policy 验证 provenance、用户授权、能力事实、安全策略和冲突后，产出 `ResolvedRoutingConstraints`。

提高最低保证档位的提议比较保守，但不会自动成为硬约束。有 Host 认可要求支持时接受；证据不足时可以保持现有 floor；不可能或未授权约束必须显式拒绝。父 Agent 默认绝不能降低 Host floor，也不能选择任意 raw provider/model/reasoning selection。

只有用户明确授权时，父 Agent 才可从 allowlist 做语义 override。Raw provider/model 绕过仍禁止。持久化提议、解析结果和理由；这些都不是正确性标签。

## 备选方案

### 父 Agent 完全控制具体模型

否决。这会建立静默策略绕过，并把 Agent 与 deployment 配置耦合。

### 父 Agent 的每次加强请求都成为硬约束

否决。它防止路由过弱，但会导致系统性过度升级并绕过策略证据。

### 父 Agent 不提供任何输入

否决。这会丢失风险、独立评审要求和必需能力等任务意图。

## 后果

- 系统需要持久化 proposed 与 resolved RoutingConstraints。
- Delegation Policy 与 Routing Policy 仍是独立职责。
- 指标区分升级提议、接受要求、拒绝提议和用户授权 override。
- 只有外部 provider 创建契约能执行 resolved constraints 时才支持该 provider。
