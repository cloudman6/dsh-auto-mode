# 设计文档索引

## 评审顺序

1. [产品规范](spec.md)：确认用户、目标、成功标准、边界和假设。
2. [系统架构](architecture.md)：确认能力拆分、所有权和 DSH 接入点。
3. [路由策略](routing-policy.md)：确认 route 语义、降级准入与切换规则。
4. [恢复与 Episode](recovery.md)：确认停滞检测、episode、checkpoint 和恢复动作。
5. [子 Agent 委派权限](delegation.md)：确认用户、父 Agent 和策略的权限优先级。
6. [RouterBench](routerbench.md)：确认质量基线、任务集与评估方法。
7. [产品路线图](roadmap.md)：确认实施顺序，不在此阶段拆成代码任务。
8. [开放问题](open-questions.md)：选择下一轮讨论和验证重点。

## 文档状态

除非文件明确写为 Accepted，所有内容都是待评审设计。ADR 使用 `Proposed`、`Accepted`、`Superseded`、`Deprecated` 表示生命周期。
