# 项目状态

## 最后更新

2026-08-14

## 当前阶段

规范评审。仓库已经形成产品与架构设计基线，但用户尚未确认 `docs/spec.md`，4 项 ADR 仍为 `Proposed`。根据项目 gate，当前不能进入实施计划、任务拆分、依赖选择或编码。

## 已完成

- 建立 Git 仓库与 `main` 基线。
- 建立产品规范、系统架构、路由策略、恢复/episode、委派权限、RouterBench、路线图、开放问题和术语文档。
- 将 Host-owned Routing Policy、质量约束优化、形式化恢复协议和父 Agent 单调权限记录为 Proposed ADR。
- 明确首要用户、真实活跃用户指标，以及 strong 质量基线下先延迟后成本的目标顺序。

## 当前评审入口

1. 评审 `docs/spec.md` 的假设、功能范围、成功标准和工作边界。
2. 评审 `docs/decisions/` 中的 4 项 Proposed ADR；只有用户明确确认后才转为 Accepted。
3. 选择 `docs/open-questions.md` 中下一批需要调查或实验的问题。

## 进入实施计划前的 gate

- 产品规范得到明确确认。
- Routing Policy、质量目标、恢复交互和父 Agent 权限的 ADR 状态得到处理。
- 完成 DSH 现有扩展点核对，区分插件内实现与需要上游修改的部分。
- 确定 RouterBench 初始任务类别、模型/effort profile 和质量评价协议。
- 确定无机械验证任务的 route 准入证据。
- 明确 Recovery Assessor 和工作区 checkpoint 是否进入首轮实施范围。

## 当前阻塞

没有代码或工具链故障。当前阻塞是设计 gate 未关闭，详细未决问题见 `docs/open-questions.md`。

## 下一步

先完成规范与 ADR 评审。评审通过后再使用 planning-and-task-breakdown 产出实施计划和可验证任务，不从路线图直接开始编码。

## 状态维护规则

- 完成重要成果、出现新阻塞、关闭 gate 或改变下一步时更新本文件。
- 本文件只记录当前状态，不复制长期产品规范、完整架构或开放问题清单。
- 历史决策进入 ADR；长期范围和成功标准进入 `docs/spec.md`；未决问题进入 `docs/open-questions.md`。
