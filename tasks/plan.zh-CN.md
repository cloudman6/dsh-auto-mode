<!--
translation-source: tasks/plan.md
translation-source-blob: 1cc520edc98a92d9b6be343c34db7e139df9cdf6
translation-status: current
-->

# 实施计划：AA 驱动的 MVP 后 Auto

[English](plan.md)

## 目标

把已接受的阶段 0P MVP 演进为 AA 驱动 Auto Beta。实现将每项任务分为 Light、Standard 或 Deep；把每条 eligible 实际 DSH route 显式绑定到一条稳定 AA evidence record；并在所选级别内选择 AA 价格更低者，以 AA 延迟和稳定 Host route identity 打破平局。

## 已接受架构决策

- ADR-011 接替 ADR-010，保留其对 Benchmark admission 与延迟优先优化的取消，同时替换强制四字段匹配键。
- AA 是能力、价格和延迟结论的外部来源。
- 版本化 assessor policy 解析并冻结一条适合当前环境的 classifier route；Task Assessor 提供结构化任务属性，确定性 Host policy 拥有最终级别和用户任务 route。
- Host route identity 独立于 AA record identity；variant 和 effort 是 provider 可选维度。
- Manual 模式和已接受的 model/effort 变化 UX 保持不变。

## 依赖图

```text
Host route identity、AA evidence binding 与 fixture
        ↓
AA catalog schema 与 binding validation
        ↓
能力档 compiler 与价格优先 resolver
        ↓
已解析并冻结的语义 Task Assessor
        ↓
端到端 Auto 集成与 UI 术语
        ↓
dogfood 与快照更新流程
```

## 阶段 1：AA catalog 基础

状态：已于 2026-08-21 完成。

### Task 1：把 Host route identity 绑定到 AA 证据

定义实际 Host route identity、稳定 configuration fingerprint，以及到一条 AA record 的显式版本化 binding。覆盖拥有零个、一个和多个执行控制项的混合 provider route。暂不改变 live routing。

### Task 2：编译本地 AA catalog

加载被 Git 忽略的 seed，通过已验证 binding 与 DSH route 清单连接，排除无效匹配，并记录 snapshot 与 binding-rule version。

### Task 3：分配级别并按价格优先解析

从带版本 AA 边界编译 Light/Standard/Deep 档位。按 AA price、AA latency 和稳定 route identity 解析同一级别。

### Checkpoint A

纯 catalog pipeline 确定性、不含 secret、不依赖实时 AA access，且不改变 Manual。

## 阶段 2：语义判断

### Task 4：冻结 Task Assessor 契约

状态：已于 2026-08-22 完成。

定义结构化属性、有限输入、版本化环境感知 route policy、逐次调用 route 冻结、timeout、validation、confidence threshold 和 Deep fallback。

### Task 5：实现已解析 assessor 与级别 mapper

状态：已于 2026-08-22 完成。

在 Auto 递归之外调用已解析并冻结的 assessor，把已校验输出映射到 Light/Standard/Deep 和确定性 reason code。覆盖代表性 fixture 与所有 fallback。

### Checkpoint B

状态：已于 2026-08-22 完成。

Assessor 不输出具体 route；重复结构化输入映射到相同级别；timeout、无效输出、不确定和高风险选择 Deep。

## 阶段 3：产品集成

### Task 6：集成单一冻结决策路径

在已验证 pre-assembly 边界组合 assessment、catalog、constraints 与 resolver。把同一选择应用到 assembly、`agent/request`、Session 事实和 UI projection。

状态：已于 2026-08-22 完成。`auto-decision/v1` 为每个 DSH 用户 turn 刷新一次，重新验证当前 Host route，单调升级，区分 AA evidence 与配置 fallback，在没有有效 route 时明确失败，并可通过必需事件 cold reconstruction 恢复。

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
| AA field 或命名变化 | Catalog 停止匹配或静默改档 | 版本化 schema 与 binding；拒绝未知 field；保留上一有效快照 |
| 语义 assessor 不稳定 | 级别错误或不必要 Deep fallback | 版本化 route policy、逐次调用冻结、有限 schema、fixture 回归、确定性 fallback |
| 比较字段不完整 | 同档 winner 错误 | Capability 或 price 缺失时排除；同价时，缺失 latency 排在有测量值之后 |
| 实际 DSH 配置不透明 | 错误 AA binding | 对 Host 物化选项生成 fingerprint；排除未解析或有歧义 route |
| AA 驱动被误解为证明 | 产品声明过度 | 持久化 snapshot 与 reason；强制 AA 驱动限定语 |

## 当前开放决策

- 阶段 4 的稳定 AA 获取与分发机制。
