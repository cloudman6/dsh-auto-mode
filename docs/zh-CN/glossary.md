<!--
translation-source: docs/glossary.md
translation-source-blob: 908f7b7f7ccb34e24314154431e48c549c153e41
translation-status: current
-->

# 术语表

[English](../glossary.md)

## Auto / Manual

面向普通用户的选择。Auto 让策略从已准入 route 中选择；Manual 让用户选择具体 provider/model/reasoning selection。Policy Pack 校准不是普通用户任务。

## Route

策略层的语义保证档位，如 `fast`、`standard` 或 `strong`。它不是具体模型名称，也不是通用智能排名。

## Policy Pack

由维护者产出的版本化证据制品，包含 taxonomy、阈值、准入、evaluator 版本、失效规则和兼容 deployment profile。

## Deployment Profile

具体 provider/model/reasoning-selection 选项的部署本地配置和已验证身份。

## Reasoning Selection

一个精确 provider/model route 上的 reasoning request 语义：显式 effort、adapter 实体化的默认 effort，或保留 provider-default 行为的省略。这三种形式拥有不同 admission identity 和 request encoding；缺少 effort 不等于未知的显式 effort。

## Effective Route Catalog

有效 Policy Pack、本地 Deployment Profile、当前 provider 可用性、能力和 Host 安全策略的交集。

## Route Snapshot

不可变的已解析 route 与决策标识，供所有依赖 provider 的 prompt/tool 组装和对应 provider request 共同消费。

## Decision Input Snapshot

最终不可变 policy 输入，引用已经持久化的原始 routing-context snapshot、已解析约束、可选 assessment，以及适用的 policy 和 resolver 版本。它绝不包含 forward reference。

## Abstain

策略没有足够证据在其他方面合法且已准入的 route 之间选择。有已准入基线时选择该基线；不存在任何安全已准入 route 是 `no-safe-route`，不是 abstain。

## Task Assessment

任务类别、风险、范围、可验证性、可逆性和置信度等 provider 无关属性。评估器不直接选择模型。

## Routing Policy

根据任务属性、已解析约束、当前执行状态、恢复能力和 Policy Pack 证据选择语义 route 的 Host 策略。

## Execution Context Projector

确定性的 Host 投影器，把持久 Session、工具、validation、episode 和目标事件投影为策略使用的可信 phase 与执行状态。

## Phase

当前工作已经确认的语义阶段，如研究、实现、调试、验证或文档。模型自报 phase 只是证据，不是权威。

## Episode

可施加 route floor 的持久化未解决问题状态。没有固定长度，只能由 release policy 关闭。

## Attempt

具有已声明恢复能力和持久化血缘的一次执行尝试。工作区 checkpoint 是可选能力，不能默认存在。

## Recovery Capability

结构化声明哪些工作区和外部副作用可以归因、checkpoint、隔离、恢复或只能检测。策略不能根据工具名称推断恢复支持。

## Continue

保留当前 Session 与 execution world，改变 route 或行为指令后继续。

## Salvage

只恢复已经声明支持的副作用，创建干净执行上下文，并携带经过约束的 Evidence Capsule。

## Restart

回到已声明可恢复的 attempt 前状态，不携带旧模型假设重新执行。如果该状态不能恢复，restart 不可用。

## Recovery Supervisor

消费形式化运行信号、管理 episode 和选择恢复动作的 Host 能力。核心路径不依赖模型。

## Delegation Policy

验证父 Agent 提议并计算有效子 Agent 路由约束的 Host 能力。父提议要求更强档位，并不会自动使其成为硬约束。

## Route Capability Bench

通过统计治理的配对评估，判断具体配置能否通过绝对与相对质量门槛。

## Policy Scenario Bench

端到端评估策略、phase 路由、恢复、持久化和委派行为的状态机与 adapter 场景。

## No safe route

显式 fail-closed 结果，表示没有可用配置同时满足准入、能力、安全和有效约束。系统停止或请求用户介入，不静默选择不安全 fallback。

## Shadow Mode

只给出切换建议并要求用户决定的模式。本项目不把它作为产品阶段；用户缺少反事实，选择不能证明路由正确。相关解释能力保留为 Auto 的透明度。
