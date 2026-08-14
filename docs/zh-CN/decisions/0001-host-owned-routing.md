<!--
translation-source: docs/decisions/0001-host-owned-routing.md
translation-source-blob: 79f3e9b6e497e8d9898280ec341ea6711a8583ac
translation-status: current
-->

# ADR-001：Host policy 拥有常规路由决策权

[English](../../decisions/0001-host-owned-routing.md)

## 状态

Proposed

## 日期

2026-08-14

## 背景

Auto Mode 必须决定由哪个已准入 provider/model/reasoning-effort 配置服务每次请求。候选权威包括用户、当前 Agent、父 Agent、Router Agent 和确定性 Host policy。

用户与父 Agent 缺少可靠反事实。Router Agent 会产生“Router 自己使用哪个模型”的递归问题，并增加 Session、工具、权限、延迟和失败面。

## 决策

DSH Host 中的确定性 Routing Policy 拥有常规决策权。父 Agent 提交任务意图与不可信语义提议；可选评估模型只返回任务属性；resolver 应用 Host 认可的约束，把语义保证档位映射为已准入具体配置。

用户通过 Auto/manual 选择与已授权语义 override 保留最高显式控制权。Decision Input Snapshot、策略结果、解析结果和有效 Route Snapshot 都持久化到被服务 Agent 的 Session。

策略决策必须在依赖 provider 的 prompt/tool 组装前冻结，并由对应 provider 请求复用。DSH 载体与扩展工作另见 [DSH 集成与兼容性](../dsh-integration.md)。

## 备选方案

### 当前或父 Agent 直接选择

否决。这会把 Auto 退化成一个模型猜另一个模型，并鼓励习惯性选择最强配置。

### 完整 Router Agent

否决。它需要自己的模型、Session 和工具策略，会引入递归与新的攻击面。

### 分类器直接返回模型名

否决。输出不稳定且难以测试，也把 provider deployment 与语义分类耦合。

## 后果

- Routing Policy 可以独立单元测试与 replay。
- 评估模型失败可以产生显式 abstain，不转移决策权。
- Host 所有权是权限边界，不代表所有组件必须进入 DSH core；外部插件、上游 core 或拆分载体仍待决定。
- 系统需要 pre-assembly Route Snapshot 和必需持久事件。当前 DSH 缺口是阻塞性集成契约，不能用 `agent/request` 掩盖。
