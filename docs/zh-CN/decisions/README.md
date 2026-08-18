<!--
translation-source: docs/decisions/README.md
translation-source-blob: b623b069cf6265bcd085d7d9178489c4e2531f40
translation-status: current
-->

# 架构决策记录

[English](../../decisions/README.md)

| ADR | 状态 | 决策 |
|---|---|---|
| [ADR-001](0001-host-owned-routing.md) | Accepted | Host policy 拥有常规路由决策权 |
| [ADR-002](0002-quality-constrained-optimization.md) | 被 ADR-010 取代 | 历史 Benchmark 治理与延迟优先设计 |
| [ADR-003](0003-formal-recovery-protocol.md) | Accepted | Recovery Supervisor 使用带来源可信度的形式化事件协议 |
| [ADR-004](0004-monotonic-parent-authority.md) | Accepted | 父 Agent 权限有界并由 Host 解析 |
| [ADR-005](0005-english-canonical-documentation.md) | Accepted | 英文是权威版本，简体中文是持续维护的完整翻译 |
| [ADR-006](0006-evidence-governed-route-admission.md) | 被 ADR-010 取代 | 历史证据治理 admission 设计 |
| [ADR-007](0007-recovery-capability-gates-recovery-claims.md) | Accepted | Recovery Capability 约束可修改路由与恢复主张 |
| [ADR-008](0008-external-prior-experimental-auto.md) | 被 ADR-010 取代 | 已完成阶段 0P MVP 的历史授权 |
| [ADR-009](0009-phase-0p-attributable-worktree-loss-bound.md) | Accepted | 阶段 0P 可变工作仅限干净隔离 worktree 中可归属的变更 |
| [ADR-010](0010-aa-informed-heuristic-routing.md) | Accepted | 使用 AA 驱动任务级别和价格优先 route 解析，不要求 Benchmark admission gate |

ADR 被取代时保留原文件，并把状态指向替代 ADR。
