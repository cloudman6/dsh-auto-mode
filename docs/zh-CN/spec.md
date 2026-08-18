<!--
translation-source: docs/spec.md
translation-source-blob: 3cca3ef1bf31f5281937fec281d13e98283d22cc
translation-status: current
-->

# 规范：DSH Auto Mode

[English](../spec.md)

## 状态

已由维护者接受。AA 驱动的 MVP 后方向已于 2026-08-18 通过 [ADR-010](decisions/0010-aa-informed-heuristic-routing.md) 接受。

## 产品前提

DSH Auto Mode 服务不想自己猜测任务需要哪个模型和 reasoning effort 的个人重度 Agent 用户。项目没有资源维护模型质量 Benchmark，因此把 Artificial Analysis（AA）作为模型能力、价格和延迟比较的外部来源，同时由确定性的 Host 策略保留最终路由权。

AA 证据是有用的市场先验，不证明某条 route 对某位用户的具体任务最优。产品措辞必须使用“AA 驱动”或“基于当前 AA 快照”，不得宣称经过自有 Benchmark 证明的质量、安全、非劣性或普遍最优性价比。

## 主要结果

- 主要用户：个人重度编码 Agent 用户。
- 首要成功指标：持续使用 Auto 的真实活跃用户。
- 正常交互：只需在 Auto 和手动 provider/model/reasoning selection 之间选择一次。
- 优化规则：先决定任务所需的处理级别；在该级别的合格 route 中优先 AA 报告价格更低者，再比较 AA 报告延迟。

## 面向用户的任务处理级别

这些级别描述 Auto 分配多少推理能力，不是对用户任务是否简单或重要的客观评价：

| 内部 ID | 中文标签 | 英文标签 | 含义 |
|---|---|---|---|
| `light` | 轻量 | Light | 范围明确、步骤少、结果可直接检查 |
| `standard` | 常规 | Standard | 一般开发、分析和修改任务 |
| `deep` | 深度 | Deep | 范围广、不确定性或风险高、难验证或需要大量推理 |

高风险、分类置信度低、任务形态未知或请求级别无可用 route 时，决策提升到 `deep`。配置的 Deep fallback 是保守的启发式 fallback，不是经过认证的安全 baseline。

## AA route catalog

具体 route 仍是 DSH 实际使用的完整 provider/model/reasoning selection。AA 能力匹配使用规范化模型键：

```text
模型家族 + 语义版本 + 变体 + 显式 reasoning effort
```

日期、发布日后缀、provider deployment revision 和隐藏 build fingerprint 不参与相等判断。同一规范化键在 AA 快照中有多条带日期记录时，catalog 使用快照中的最新记录。语义版本、变体或 effort 不同绝不匹配。未指定 effort 只有在单独声明的规范化规则能够明确物化实际 effort 时才能匹配。

即使 AA 能力证据按规范化模型键共享，provider 仍属于可执行 DSH route 和 capability 过滤条件。

## 路由所有权

- 一个固定且不受 Auto 递归路由的 Task Assessor 可以判断任务属性和置信度。
- Assessor 只返回结构化任务属性，不返回 provider、model 或 effort。
- 确定性的 Routing Policy 把属性映射到 `light`、`standard` 或 `deep`。
- Route Resolver 排除不可用或不兼容 route，并在所选级别内按 AA 价格优先排序。
- 具体配置在依赖 provider 的组装前冻结，并原样应用到 `agent/request`。
- 生效配置和解释持久化到被服务的 Session。

## 必需产品行为

- Auto 和 Manual 仍是一次操作的二选一；Manual 不受 Auto 策略修改。
- 每次自动决策显示任务处理级别、实际模型、实际 effort、来源快照和简短依据。
- 模型和 effort 变化继续在 selector 与对话中显示，并位于触发它的用户消息和对应助手回复之间。
- AA 数据缺失或畸形、没有兼容 route 或判断置信度低时，在可用且通过 Host 验证的情况下使用配置的 Deep fallback；否则明确报告解析失败。
- 用户选择、父 Agent 提议和模型自报都不是正确路由标签。
- 父 Agent 可以表达任务约束，但不直接拥有具体 route 选择权。

## 当前与未来范围

### 当前路径

- 带版本的本地 AA 快照，初期手工维护并被 Git 忽略。
- 不要求 deployment 日期 identity 的模型版本／变体／effort 规范化匹配。
- AA 驱动的 `light`/`standard`/`deep` catalog 编译。
- 固定语义 Task Assessor 加确定性的级别和 route 策略。
- 透明的 DSH Web UI、持久决策事实和 Manual 不受影响。

### 后续路径

- 稳定的 AA 数据获取和快照更新。
- Session 内重新判断和基于执行证据的升级。
- 只对明确支持的 effect class 实现恢复动作。
- 父子 Agent 路由约束，以及 Codex 和 Claude Code adapter。
- 可选的隐私保护 dogfood 校准和社区 route profile。

### 非必需路径

- 把自建模型质量 Benchmark 作为 Auto admission gate。
- 宣称 AA 排名证明具体任务质量或安全。
- 训练 Router 基础模型。
- 拥有自身工具和自治 Session 的 Router Agent。
- 组织级调度、配额或审批治理。
- 自动回滚未声明的 workspace 或外部 effect。

## 成功标准

- 用户一次选择 Auto，就能看到当前任务实际选择的模型和 effort。
- 不同任务属性产生可解释的任务处理级别和具体 route 差异。
- 同一级别内，resolver 确定性地优先 AA 报告价格更低者，再比较 AA 报告延迟。
- 持久化选择、界面显示和实际请求配置一致。
- Manual 保持不变，并在其作用域退出 Auto。
- 用户理解这是 AA 驱动的启发式路由，不是本项目 Benchmark 准入。
- 真实用户在多次任务后继续使用 Auto。

## 安全与完整性边界

- Host security、provider availability 和具体 route capability 检查先于经济排序。
- 不从模型名或 AA 分数推断缺失 capability。
- Task Assessor 不能绕过 Host 策略或直接选择具体模型。
- 每次 route 变化都要记录，禁止静默切换。
- 不提交 secret、credential、原始 AA 数据集、敏感 prompt 或私有代码。
- 实现恢复和 workspace mutation 能力时，相关声明继续受 ADR-007 与 ADR-009 约束。

## 被取代的要求

ADR-010 取代以下旧要求：RouterBench admission、精确 deployment fingerprint、绝对 baseline、candidate 非劣性和延迟优先于成本必须先于可用 Auto 产品。RouterBench 保留为可选评估设施，可以影响未来策略，但不在关键路径上。
