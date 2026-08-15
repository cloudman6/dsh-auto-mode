<!--
translation-source: docs/decisions/0007-recovery-capability-gates-recovery-claims.md
translation-source-blob: d52c0c65fe21be07b21011d3dc0d7fbe406ac4d8
translation-status: current
-->

# ADR-007：Recovery Capability 约束可修改路由与恢复主张

[English](../../decisions/0007-recovery-capability-gates-recovery-claims.md)

## 状态

Accepted

## 日期

2026-08-14

## 背景

会产出代码的 Agent 可以影响文件、进程、数据库、远程 API、消息和部署。Session checkpoint 不会恢复这些副作用。如果把每次 attempt 都当成可恢复，弱模型的错误动作可能逃逸，而产品却错误报告已经回滚。

## 决策

每个 execution world 暴露结构化 `RecoveryCapability`，描述每类相关副作用的归因、checkpoint、隔离、检测、恢复和验证支持。

Routing Policy 把该声明作为输入。只有潜在损失处于已准入风险边界内，而且所需恢复支持存在时，有修改的工作才能降级。Salvage 与 restart 只对明确支持的副作用提供。修改未知、恢复失败或外部副作用不可逆时，进入显式停止、升级或用户介入状态。

系统绝不能从工具名称、文件系统访问、Git 仓库或模型自报推断恢复能力。

## 备选方案

### 假设 Git 能恢复 Agent 工作

否决。Git 既不能归因并发修改，也不能恢复未提交的外部副作用。

### 允许回滚并记录 edge case

否决。把部分回滚表述成恢复是虚假安全主张。

### 禁止所有有修改工作的降级

不作为通用策略。它是安全的，但会无谓排除能够证明归因、隔离和恢复的环境。

## 后果

- 路由安全与完整恢复仍是两个不同主张。
- Checkpoint Provider 与副作用 adapter 需要 contract test 和故障注入。
- 恢复可用性会因任务、工具集、execution world 和副作用类别不同而变化。
- 不支持恢复时缩小 Auto 覆盖，不降低质量基线。
