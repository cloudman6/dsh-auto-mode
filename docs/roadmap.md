# 产品路线图

## 原则

路线图表达依赖顺序，不代表可以省略完整架构。每一阶段都必须产生可验证证据，后续阶段不能以“先做出来”为理由修改质量基线。

## 阶段 A：RouterBench 与 Route Profiles

建立最小但覆盖不同验证性的任务集，定义 strong 基线、质量容差、不可接受结果、延迟和成本统计。产出版本化 Route Profile，而不是凭模型榜单手写路由规则。

验收：至少能对多个 model/effort 组合生成配对报告，并识别不能安全降级的任务类别。

## 阶段 B：静态 Adaptive Router

实现 Host Routing Policy、Task Assessment、Route Profile Resolver、`agent/request` consumer、abstain 和决策日志。先解决一次请求“该选什么”，不依赖用户选择标签。

验收：在线决策与 RouterBench 使用同一策略；用户可以看到 route、实际配置和原因。

## 阶段 C：Turn 内自适应与 Continue

加入形式化 Recovery Signals、Episode Controller、route floor、升级和可信 phase 边界后的降级。实现同 Session 的 continue，不宣称具备代码回滚。

验收：重复失败能升级；未解决 episode 不会因模型自报完成而降级；复杂 phase 结束后可以在同 turn 降级。

## 阶段 D：隔离 Attempt 与完整恢复

设计 Checkpoint Provider，关联 Session 边界和工作区状态，实现 salvage/restart 与 Evidence Capsule。

验收：恢复不会覆盖 attempt 前用户修改或其他 Agent 修改；故障注入证明错误副作用不会逃逸。

## 阶段 E：子 Agent 约束

实现 Delegation Policy、持久 RoutingConstraints、进程内 child 路由和外部 provider adapter。父 Agent 默认只能提高 route floor。

验收：父 Agent 不能绕过硬约束；冷恢复后约束仍可审计；独立评审多样性要求可验证。

## 阶段 F：真实使用校准

在明确同意、隐私保护和可撤销的前提下收集客观运行事实，更新 RouterBench 任务分布和策略阈值。真实活跃用户是产品指标，不把遥测量本身当成功。

## 暂不启动的方向

- 通用 Subagent Scheduler。
- 组织级预算、审批和配额平台。
- 自动训练 Router 模型。
- 插件市场和通用模型榜单服务。
- 没有归因与恢复能力的自动工作区回滚。
