# 术语表

## Route

策略层的语义质量/能力档位，如 `fast`、`standard`、`strong`。它不是具体模型名称。

## Route Profile

把语义 route 映射为 provider/model/reasoning effort，并携带能力、Benchmark 和版本信息的配置。

## Abstain

策略没有足够证据安全选择较弱 route。实际执行安全 fallback，默认是 `strong`，但统计上与主动选择 strong 分开。

## Task Assessment

任务类型、风险、范围、可验证性、可逆性和置信度等 provider 无关属性。评估器不直接选择模型。

## Routing Policy

根据任务属性、约束、活动 episode 和 Benchmark 校准数据选择语义 route 的 Host 策略。

## Adaptive Router Consumer

把 Routing Policy 接入 DSH 每次 `agent/request` 的插件消费者。

## Phase

当前工作的语义阶段，如研究、实现、调试、验证或文档。

## Episode

由一个未解决问题触发的临时 route floor。没有固定长度，只能由相应 release policy 的证据关闭。

## Attempt

从一个 Session 稳定边界和可选工作区 checkpoint 开始的一次执行尝试。

## Continue

保留当前 Session 和工作区，升级 route 后继续。

## Salvage

恢复工作区，创建干净执行上下文，并携带经过约束的 Evidence Capsule。

## Restart

回到 attempt 前的 Session 与工作区状态，不携带旧模型假设，由强 route 重新执行。

## Recovery Supervisor

消费形式化运行信号、管理 episode 和选择恢复动作的 Host 能力。核心路径不依赖模型。

## Delegation Policy

验证父 Agent 子任务约束和权限，并计算子 Agent 路由质量下限的 Host 能力。

## RouterBench

为路由策略提供质量、延迟、成本、覆盖和恢复证据的版本化任务集与 runner。

## Shadow Mode

只给出建议并要求用户决定是否切换的模式。本项目不把它作为产品阶段；用户缺少反事实，选择不能证明路由正确。相关解释能力保留为 Auto 的决策透明度。
