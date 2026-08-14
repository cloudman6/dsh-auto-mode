<!--
translation-source: docs/routerbench.md
translation-source-blob: a014975851f16667f73f1adb11b4521b5b0cd3dd
translation-status: current
-->

# RouterBench

[English](../routerbench.md)

## 目的

RouterBench 是 Auto Mode 的质量证据基础，不是附属演示。它回答：

- 某个模型与 effort 在哪类任务上能维持 strong 质量基线？
- 路由器在哪些任务上有足够证据自动选择较弱 route？
- 升级、降级和恢复是否真的改善端到端结果？
- 分类器、切换和重试的开销是否抵消模型节省？

在线路由和 Benchmark 必须使用同一 Task Assessment、Routing Policy、Route Profile 和版本化配置。

## 实验单位

一个 Benchmark case 至少包括：

```ts
interface RouterBenchCase {
  id: string
  version: number
  taskKind: TaskKind
  prompt: string
  fixture: FixtureRef
  risk: RiskLevel
  verifiability: Verifiability
  evaluators: EvaluatorSpec[]
  expectedEvidence?: EvidenceRequirement[]
  allowedSideEffects: SideEffectPolicy
}
```

同一 case 对候选 route 和 strong 基线进行配对运行。需要随机化执行顺序、记录模型快照和 profile 版本，并使用多次重复处理模型方差。

## 初始任务类别

### 可机械验证编码

- 局部 API 参数校验。
- 多文件重构与类型更新。
- 测试失败诊断。
- 并发、生命周期和资源释放问题。
- 安全边界与权限检查。

### 部分可验证工作

- 有来源的文档总结。
- 代码评审和风险清单。
- 公共 API 文档同步。
- 迁移方案比较。

### 无单一客观答案

- 架构方案与权衡。
- 研究综合。
- 技术写作与论证。
- 长期演进建议。

### 路由与恢复场景

- 首次 route 选择。
- 弱模型停滞后 continue。
- 错误修改后的 salvage/restart。
- 同一 turn 从复杂实现进入低风险尾部工作。
- 子 Agent 高风险约束和模型多样性。

## 质量评价

### 机械验证

优先使用真实测试、类型检查、静态分析、构建和确定性不变量。测试通过是必要证据，但不能自动证明需求完整；case 需要覆盖遗漏和投机性 workaround。

### 开放任务

没有标准答案时，不伪造单一正确文本。组合使用：

- 预先编写的关键遗漏项和错误模式清单。
- 引用正确性、来源忠实度和覆盖率。
- 候选与 strong 输出的盲化成对比较。
- 多个独立 evaluator，报告分歧而不是只取平均。
- 对高风险任务保留人工或领域专家抽检。

LLM judge 不是真理。必须版本化 judge、测量位置偏差和同源模型偏差，并保留原始判定依据。

## 核心指标

### 质量

- `quality_gap_to_strong`：候选 route 相对 strong 的质量差。
- `unacceptable_result_rate`：不可接受结果比例。
- `under_routing_loss`：因选择过弱造成的严重损失。
- 分位数和最坏类别表现，而不只报告平均值。

### 覆盖

- `auto_coverage`：无需 abstain 即自动优化的任务比例。
- `abstention_rate`：证据不足而使用 fallback 的比例。
- `out_of_distribution_rate`：无法映射到已校准任务类别的比例。

### 性能

- 端到端首个有效结果延迟。
- 完成任务总延迟。
- 输入/输出/辅助模型 token。
- 模型调用成本。
- 切换导致的缓存和历史重读开销。

### 恢复

- escalation precision/recall。
- episode 平均持续 step 与未解决率。
- continue、salvage、restart 的成功率和额外成本。
- 错误修改逃逸率，即恢复后仍残留的弱模型副作用。

## 准入规则

每个任务类别单独决定 route 准入。建议形式：

```text
候选 route 的质量差置信区间满足 epsilon
AND 不可接受结果率上界满足 delta
AND 样本量达到最低要求
AND 没有未解释的高严重度失败簇
```

平均通过不能覆盖某个高风险子类的系统性失败。安全、并发、不可逆外部操作等类别应使用更严格阈值或固定 strong。

## 模型档案

公开模型能力榜单可以作为 cold-start prior，但不能直接成为产品路由真值。Route Profile 需要记录：

- provider、model、effort 和能力。
- 上下文窗口、视觉/工具支持等硬约束。
- RouterBench 版本和样本量。
- 质量、延迟、成本及置信区间。
- 数据日期和失效条件。

模型更新、provider 别名和服务端行为变化都可能使历史档案失效。运行 canary 与版本指纹是后续设计问题。

## 不使用的标签

以下信号不表示 route 正确：

- 用户手工选择了某个模型。
- 用户接受或拒绝了一次切换建议。
- 父 Agent 指定了某个 route。
- 模型自称任务简单或已经解决。
- 单次输出没有被用户重做。

可用事实包括可复现验证结果、明确用户纠正、任务最终是否完成、恢复动作与副作用，以及经过设计的成对评估。
