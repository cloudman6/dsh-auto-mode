<!--
translation-source: docs/README.md
translation-source-blob: fbb87c0b9bc2d0155db8996d9137b8c951bfd5f2
translation-status: current
-->

# 设计文档索引

[English](../README.md)

当前进展、阻塞和下一步统一维护在仓库根目录的 [`PROJECT_STATUS.zh-CN.md`](../../PROJECT_STATUS.zh-CN.md)。

已接受 MVP 见[阶段 0P 快速原型](phase-0p-fast-prototype.md)。MVP 后实施按 ADR-010 和当前 roadmap 推进。

## 评审顺序

1. [产品规范](spec.md)：确认用户、目标、成功标准、边界和假设。
2. [路由策略](routing-policy.md)：确认任务处理级别、AA 匹配、价格优先解析、fallback 和失败行为。
3. [系统架构](architecture.md)：确认 capability 边界、Route Snapshot 时序、状态所有权和持久化。
4. [DSH 集成与兼容性](dsh-integration.md)：确认 fork 已解决的 Host 契约、剩余上游缺口和兼容策略。
5. [可选评估轨道](routerbench.md)：确认有边界的回归和策略评估范围，且不把它变成 release gate。
6. [恢复与 Episode](recovery.md)：确认信号、provenance、恢复能力、episode 和动作。
7. [子 Agent 委派权限](delegation.md)：确认提议、解析和 override 边界。
8. [产品路线图](roadmap.md)：确认 AA catalog、语义 assessor、Beta、自适应执行和后续阶段顺序。
9. [开放问题](open-questions.md)：选择下一项讨论与验证重点。
10. [术语表](glossary.md)：检查术语与语义区分。

[架构决策记录](decisions/README.md)包含约束实施的已接受决策。[文档本地化策略](localization.md)定义英文权威版本与简体中文同步流程。

## 实施证据

- [阶段 0P 快速原型](phase-0p-fast-prototype.md)：可运行配置、本地 seed 边界、确定性策略、验收标准和真实 provider 证据。
- [历史阶段 0P 精确 route 清单与 A3p 证据](evidence/phase-0p-route-inventory.md)：ADR-010 采用归一化 AA 模型键之前的 deployment-exact 实验。

## 历史评审证据

- [2026-08-14 多视角设计评审](reviews/2026-08-14-multi-view-design-review.md)：产生本轮修订的评审结论、冲突裁决与元评审限制信息记录。

## 上游反馈

- [A1/A2 产品无关 Host 契约](upstream/2026-08-15-host-contracts-discussion.md)：已发布为 DeepSeek Harness Discussion #2281，包含固定 fork 证据与维护者问题。

## 文档状态

规范与 ADR-010 定义当前 AA 驱动方向。ADR-002、ADR-006 和 ADR-008 已被取代但保留为历史决策；其他已接受 ADR 在各自边界内继续有效。ADR 使用 `Proposed`、`Accepted`、`Superseded` 和 `Deprecated` 表示生命周期。
