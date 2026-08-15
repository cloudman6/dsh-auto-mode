<!--
translation-source: docs/decisions/README.md
translation-source-blob: cac1b409907beca60b45d6d902794638a3f7ef79
translation-status: current
-->

# 架构决策记录

[English](../../decisions/README.md)

| ADR | 状态 | 决策 |
|---|---|---|
| [ADR-001](0001-host-owned-routing.md) | Accepted | Host policy 拥有常规路由决策权 |
| [ADR-002](0002-quality-constrained-optimization.md) | Accepted | 先应用基线绝对门槛与候选非劣性门槛，再优化延迟和成本 |
| [ADR-003](0003-formal-recovery-protocol.md) | Accepted | Recovery Supervisor 使用带来源可信度的形式化事件协议 |
| [ADR-004](0004-monotonic-parent-authority.md) | Accepted | 父 Agent 权限有界并由 Host 解析 |
| [ADR-005](0005-english-canonical-documentation.md) | Accepted | 英文是权威版本，简体中文是持续维护的完整翻译 |
| [ADR-006](0006-evidence-governed-route-admission.md) | Accepted | 将证据治理的 route 准入与策略场景分离 |
| [ADR-007](0007-recovery-capability-gates-recovery-claims.md) | Accepted | Recovery Capability 约束可修改路由与恢复主张 |

ADR 被取代时保留原文件，并把状态指向替代 ADR。
