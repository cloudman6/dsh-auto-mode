<!--
translation-source: docs/README.md
translation-source-blob: f7e433c7f52af1a23f7d17923842bbf3acf9dc00
translation-status: current
-->

# 设计文档索引

[English](../README.md)

当前进展、阻塞和下一步统一维护在仓库根目录的 [`PROJECT_STATUS.zh-CN.md`](../../PROJECT_STATUS.zh-CN.md)。

## 评审顺序

1. [产品规范](spec.md)：确认用户、目标、成功标准、边界和假设。
2. [路由策略](routing-policy.md)：确认保证档位、Policy Pack、绝对与相对质量门槛以及失败行为。
3. [系统架构](architecture.md)：确认 capability 边界、Route Snapshot 时序、状态所有权和持久化。
4. [DSH 集成与兼容性](dsh-integration.md)：确认已核实当前 seam、阻塞性上游缺口和兼容策略。
5. [RouterBench](routerbench.md)：确认证据隔离、统计准入、策略消融和撤销。
6. [恢复与 Episode](recovery.md)：确认信号、provenance、恢复能力、episode 和动作。
7. [子 Agent 委派权限](delegation.md)：确认提议、解析和 override 边界。
8. [产品路线图](roadmap.md)：确认由证据门控的实施顺序，不在此阶段把 phase 变成编码任务。
9. [开放问题](open-questions.md)：选择下一项讨论与验证重点。
10. [术语表](glossary.md)：检查术语与语义区分。

[架构决策记录](decisions/README.md)包含需要明确接受的 Proposed 决策。[文档本地化策略](localization.md)定义英文权威版本与简体中文同步流程。

## 历史评审证据

- [2026-08-14 多视角设计评审](reviews/2026-08-14-multi-view-design-review.md)：产生本轮修订的评审结论、冲突裁决与元评审限制信息记录。

## 文档状态

除非文件明确标记为 `Accepted`，否则所有内容都处于待评审设计状态。ADR 使用 `Proposed`、`Accepted`、`Superseded` 和 `Deprecated` 表示生命周期。
