<!--
translation-source: docs/decisions/0003-formal-recovery-protocol.md
translation-source-blob: 7d440617fb202d4f01c6491cb70d31581faedeb7
translation-status: current
-->

# ADR-003：Recovery Supervisor 使用形式化事件协议

[English](../../decisions/0003-formal-recovery-protocol.md)

## 状态

Proposed

## 日期

2026-08-14

## 背景

Recovery Supervisor 需要判断停滞、episode 是否解决以及采取何种恢复动作。一种做法是每个 turn 向当前模型注入 prompt，要求它报告阶段和进度；这会增加 token、耦合产品行为，并允许被监督模型通过自我报告解除限制。

## 决策

Recovery Supervisor 核心不依赖模型。它通过 Session、Agent、Tool 和 capability 事件接收形式化 RecoverySignal，持久化 episode 状态，并向 Routing Policy 提供 route floor。

Agent 的 phase/完成声明只是弱证据。可选 Recovery Assessor 使用固定配置、一次性、无工具调用，返回受校验结构；最终状态转换仍由确定性 Recovery Policy 完成。

仅当 continue、salvage 或 restart 需要改变模型行为时，进行一次性且可持久化的 prompt 注入。

## 备选方案

### 每 turn 注入进度协议

拒绝。它污染上下文、增加延迟，并把监控建立在模型自我报告上。

### Supervisor 解析所有自然语言输出

拒绝。脆弱、不可版本化，且不同工具输出语义属于各自能力。

### 模型评估器直接关闭 episode

拒绝。评估器没有最终授权，低置信度或错误判断必须安全失败。

## 后果

- 需要 Recovery Signal Provider seam 和持久事件。
- 测试、shell、文件系统等能力应提供结构化事实或专用适配器。
- UI 从结构化事件渲染解释，不依赖 prompt 文本。
- 语义判断仍可能使用辅助模型，但其延迟、成本和不确定性可单独测量。
