<!--
translation-source: tasks/plan.md
translation-source-blob: d8bd08a6a753bd0e2e9addafac40bfafc8d726b8
translation-status: current
-->

# 实施计划：AA 驱动的 MVP 后 Auto

[English](plan.md)

## 目标

把已接受的阶段 0P MVP 演进为 AA 驱动 Auto Beta。实现将每项任务分为 Light、Standard 或 Deep；按模型家族、语义版本、变体和 effort 把可用 DSH route 匹配到 AA；并在所选级别内选择 AA 价格更低者，以 AA 延迟和稳定 route identity 打破平局。

## 已接受架构决策

- ADR-010 取代 MVP 后路径的 Benchmark admission 与延迟优先优化。
- AA 是能力、价格和延迟结论的外部来源。
- 固定 Task Assessor 提供结构化任务属性；确定性 Host policy 拥有最终级别和 route。
- 日期/build/deployment revision 不属于模型相等判断。
- Manual 模式和已接受的 model/effort 变化 UX 保持不变。

## 依赖图

```text
规范化模型键与 fixture
        ↓
AA catalog schema 与最新记录解析
        ↓
能力档 compiler 与价格优先 resolver
        ↓
固定语义 Task Assessor
        ↓
端到端 Auto 集成与 UI 术语
        ↓
dogfood 与快照更新流程
```

## 阶段 1：AA catalog 基础

### Task 1：规范化模型 identity

用合成 fixture 定义模型家族／版本／变体／effort 键、显式 alias 和重复日期规则。暂不改变 live routing。

### Task 2：编译本地 AA catalog

加载被 Git 忽略的 seed，与 DSH route 清单连接，排除无效匹配，并记录 snapshot 与 normalizer version。

### Task 3：分配级别并按价格优先解析

从带版本 AA 边界编译 Light/Standard/Deep 档位。按 AA price、AA latency 和稳定 route identity 解析同一级别。

### Checkpoint A

纯 catalog pipeline 确定性、不含 secret、不依赖实时 AA access，且不改变 Manual。

## 阶段 2：语义判断

### Task 4：冻结 Task Assessor 契约

定义结构化属性、有限输入、固定模型配置、timeout、validation、confidence threshold 和 Deep fallback。

### Task 5：实现固定 assessor 与级别 mapper

在 Auto 递归之外调用固定 assessor，把已校验输出映射到 Light/Standard/Deep 和确定性 reason code。覆盖代表性 fixture 与所有 fallback。

### Checkpoint B

Assessor 不输出具体 route；重复结构化输入映射到相同级别；timeout、无效输出、不确定和高风险选择 Deep。

## 阶段 3：产品集成

### Task 6：集成单一冻结决策路径

在已验证 pre-assembly 边界组合 assessment、catalog、constraints 与 resolver。把同一选择应用到 assembly、`agent/request`、Session 事实和 UI projection。

### Task 7：迁移用户术语与解释

用 Light/Standard/Deep 和轻量/常规/深度取代原型标签。显示 AA 匹配与配置 fallback 原因，同时保留滚动／呼吸动画和对话位置。

### Task 8：端到端证明 Auto 与 Manual

在浏览器和可用真实 provider 场景覆盖三档、价格排序、延迟 tie-break、低置信度 fallback、catalog 缺失 failure、Session 重建和 Manual 不受影响。

### Checkpoint C

所有路径的显示、持久化和实际请求 route 一致。公开文字说明由 AA 驱动，不作 Benchmark 质量声明。

## 阶段 4：快照维护

### Task 9：定义更新流程

选择稳定 AA 获取方式和数据权利边界，校验并最小化快照，检查变化并支持恢复上一有效快照。增加外部依赖或远程服务前需要明确批准。

## 风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| AA field 或命名变化 | Catalog 停止匹配或静默改档 | 版本化 schema 与 normalizer；拒绝未知 field；保留上一有效快照 |
| 语义 assessor 不稳定 | 级别错误或不必要 Deep fallback | 固定配置、有限 schema、fixture 回归、确定性 fallback |
| Price field 不可比较 | 同档 winner 错误 | 选择一个权威 AA price field，拒绝缺失／模糊比较 |
| DSH default effort 不透明 | 错误 AA 匹配 | 要求显式或可靠物化 effort，否则排除 |
| AA 驱动被误解为证明 | 产品声明过度 | 持久化 snapshot 与 reason；强制 AA 驱动限定语 |

## 当前开放决策

- AA capability field 和初始档位边界。
- 权威 AA price 与 latency field。
- 固定 Task Assessor provider/model/effort 和 confidence threshold。
- 阶段 4 的稳定 AA 获取与分发机制。
