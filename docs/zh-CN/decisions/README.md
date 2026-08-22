<!--
translation-source: docs/decisions/README.md
translation-source-blob: f771b98447d2514fa3168c0eadd7b11e157d5496
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
| [ADR-010](0010-aa-informed-heuristic-routing.md) | 被 ADR-011 取代 | 确立 AA 驱动任务级别和价格优先 route 解析，不要求 Benchmark admission gate |
| [ADR-011](0011-bind-host-routes-to-aa-evidence.md) | Accepted | 把通用 Host route identity 绑定到 AA 证据，不建立通用 model/effort ontology |
| [ADR-012](0012-resolve-and-freeze-task-assessor-routes.md) | Accepted | 通过固定 policy 解析一条适合当前环境的 assessor route，并在调用前冻结 |
| [ADR-013](0013-refresh-aa-snapshots-behind-a-rights-gate.md) | Accepted | 在显式评审、rollback 与数据权利 gate 后离线更新最小化 AA snapshot |
| [ADR-014](0014-separate-aa-evidence-packs-from-active-catalogs.md) | Accepted | 将可复用 evidence binding 和全量 eligible AA snapshot 与运行时派生的 Active Catalog 分离 |

ADR 被取代时保留原文件，并把状态指向替代 ADR。
