<!--
translation-source: docs/glossary.md
translation-source-blob: 85ec0d7e96c272c6a23176751cae003670bb4882
translation-status: current
-->

# 术语表

[English](../glossary.md)

## Auto / Manual

正常用户选择。Auto 让 Host policy 选择 route；Manual 让用户直接选择 provider/model/reasoning，并在其作用域退出 Auto。

## 任务处理级别

Auto 为当前任务分配的推理能力。内置级别为 `light`、`standard` 和 `deep`。它们是启发式资源投入级别，不是经过认证的质量保证。

## Light

范围明确、风险低、步骤少、结果可直接检查的工作。中文 UI 标签：轻量。

## Standard

一般开发、分析和修改工作。中文 UI 标签：常规。

## Deep

范围广、不确定性或风险高、难验证或需要深入推理的工作。中文 UI 标签：深度。也作为低置信度判断的保守 fallback。

## 具体 route

通过 DSH 执行的 provider/model/reasoning selection。一个处理级别可以包含多条具体 route。

## Host route identity

一个 provider、model 与实际 request configuration 的可执行 DSH identity。它包含每个会改变执行语义且已由 Host 物化选项的稳定 fingerprint；effort 是可选字段。

## AA evidence binding

从一条 Host route identity 到一个冻结 snapshot 中一条稳定 AA 模型／配置记录的经过评审、带版本映射。它记录 match basis 与限制，但不宣称精确部署权重。

## AA 快照

用于编译 route catalog 的带版本本地 Artificial Analysis 能力、价格和延迟记录。运行时路由不要求实时 AA 请求。

## AA route catalog

已绑定 AA 证据的 Host route、route capability 与用户/Host 约束的冻结交集，每条 route 被分配到一个任务处理级别。

## Task Assessment

与 provider 无关的结构化属性，例如 task kind、scope、complexity、risk、verifiability、confidence 和 reasons。Assessor 不选择模型。

## Routing Policy

把 Task Assessment 和约束映射到任务处理级别的确定性 Host policy。

## Route Resolver

过滤合格具体 route，并在同一处理级别内依次优先 AA price、AA latency 和稳定 route identity 的确定性组件。

## Deep fallback

判断不确定或没有 AA 匹配 route 时使用的、配置且通过 Host 验证的具体 route。它是保守选择但不代表安全认证，也不继承 AA 声明。

## 冻结 route selection

由依赖 provider 的组装和对应 `agent/request` 共同消费的不可变处理级别、具体 route、来源快照、版本与解释。

## AA 驱动

必需限定词，表示 route capability、price 或 latency 来自当前 AA snapshot，不表示经过项目 Benchmark、最优或安全。

## Episode

后续自适应执行与恢复使用的持久未解决问题状态，可以施加升级下限。

## Recovery Supervisor

消费形式化 runtime signal，并只选择当前 execution world 支持的恢复动作的 Host capability。

## Continue / Salvage / Restart

后续恢复动作：在当前上下文继续；保留可归属证据并从干净上下文开始；或回到已声明可恢复状态重新执行。

## RouterBench

用于聚焦策略问题与回归的可选评估设施。AA 驱动 route 不要求它作为 admission 或 release gate。
