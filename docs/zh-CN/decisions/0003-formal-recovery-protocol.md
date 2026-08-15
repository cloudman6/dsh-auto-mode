<!--
translation-source: docs/decisions/0003-formal-recovery-protocol.md
translation-source-blob: 0e721a7d4f1354344e68ba8f2b0ee9ec98587f3e
translation-status: current
-->

# ADR-003：Recovery Supervisor 使用带来源可信度的形式化事件协议

[English](../../decisions/0003-formal-recovery-protocol.md)

## 状态

Accepted

## 日期

2026-08-14

## 背景

Recovery Supervisor 必须检测停滞、维护 episode 并选择恢复动作。每 turn 注入 prompt，要求当前模型报告 phase 与进度，会增加 token、把行为耦合到自然语言，并允许被监督模型解除自身限制。

没有 provenance 时，信号也会误导：模型声明、工具原生事实、派生 observation 和可信 validator 结果不具备相同权威。

## 决策

Recovery Supervisor 核心不依赖模型。它通过 Session、Agent、Tool、validation 和 capability 事件消费有类型、有版本的 Recovery Signal。每条 observation 记录 source、provenance、trust class 和 evidence reference。Supervisor 持久化 objective、phase、attempt、episode 与恢复状态，并向 Routing Policy 暴露 route floor 和恢复可用性。

Agent 的 phase 与完成声明属于弱证据。可选 Recovery Assessor 使用固定配置，只调用一次且不使用工具，返回经过 schema 验证的结构；确定性 Recovery Policy 仍拥有状态转换权。

只有持久化的 continue、salvage、restart 或用户介入动作需要改变模型行为时，才注入 prompt。规范恢复状态绝不能只存在于 prompt 文本。

路由安全监督与完整执行恢复是两个独立产品主张。前者可以升级或停止而不恢复副作用；后者只对已声明且测试通过的 Recovery Capability 可用。

## 备选方案

### 每 turn 注入进度协议

否决。它污染上下文、增加延迟，并把监督建立在模型自报之上。

### Supervisor 解析全部自然语言输出

否决。做法脆弱、没有版本，而且工具输出语义应由相应 capability 提供。

### 模型 assessor 直接关闭 episode

否决。Assessor 没有最终权威；低置信或错误判断必须 fail safely。

## 后果

- DSH 需要必需插件 Session 事件的运行时注册；ignorable 事件不能承载规范恢复状态。
- Tool 与 validation adapter 必须暴露带 provenance 和 trust classification 的结构化事实。
- UI 解释从结构化事件渲染，不依赖隐藏 prompt 文本。
- 恢复失败与修改未知成为显式状态，需要停止、升级或用户介入。
