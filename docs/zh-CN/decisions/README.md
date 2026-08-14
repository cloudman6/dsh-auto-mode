<!--
translation-source: docs/decisions/README.md
translation-source-blob: e5445d7bb37ceba891f2e1b51e45bcf6628b28a8
translation-status: current
-->

# 架构决策记录

[English](../../decisions/README.md)

| ADR | 状态 | 决策 |
|---|---|---|
| [ADR-001](0001-host-owned-routing.md) | Proposed | Host 策略拥有常规路由决策权 |
| [ADR-002](0002-quality-constrained-optimization.md) | Proposed | 以 strong 为质量基线，先优化延迟再优化成本 |
| [ADR-003](0003-formal-recovery-protocol.md) | Proposed | Recovery Supervisor 使用形式化事件，不建立逐 turn prompt 协议 |
| [ADR-004](0004-monotonic-parent-authority.md) | Proposed | 父 Agent 默认只有单调提高质量要求的权限 |
| [ADR-005](0005-english-canonical-documentation.md) | Accepted | 英文是权威源，简体中文是持续维护的翻译 |

ADR 被替代时保留原文件，并在状态中指向新的 ADR。
