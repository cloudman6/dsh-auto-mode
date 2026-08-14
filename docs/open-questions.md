# 开放问题

## 必须在实施计划前关闭

1. DSH 当前有哪些可直接使用的 route、Session 事件和子 Agent 约束扩展点，哪些需要上游修改？
2. 初始 Route Profile 包含哪些 provider/model/effort，模型能力与排名数据来源是什么？
3. `epsilon`、`delta`、最低样本量和高风险类别的固定 strong 规则如何设定？
4. RouterBench 初始任务集如何避免只覆盖容易机械验证的编码任务？
5. Task Assessor 是否需要模型；若需要，固定配置、最大延迟和低置信度阈值是什么？
6. 决策日志公开哪些任务属性和证据，如何避免记录敏感 prompt 或代码？

## Recovery

1. 哪些工具能够提供结构化 validation、mutation 和 diff 信号？
2. 如何定义 failure fingerprint，避免把不同失败错误地合并成同一 episode？
3. 哪些 release policy 可以完全机械验证，哪些需要 Recovery Assessor？
4. Continue 的注入内容如何避免扩大上下文和强化错误假设？
5. Checkpoint Provider 使用隔离 worktree、写时复制文件系统还是 DSH sandbox backend？
6. 非文件副作用——数据库、远程 API、消息和部署——如何声明可恢复性？
7. Session fork 与 workspace checkpoint 的原子关联如何持久化？

## Turn 内切换

1. 如何识别可信 phase 边界，而不依赖模型自报？
2. 如何估计剩余工作量与 provider/model 切换成本？
3. prompt cache、provider 私有状态和 reasoning passback 对跨模型接管有什么约束？
4. 最小保持期和 hysteresis 阈值如何由 RouterBench 校准？

## 子 Agent

1. RoutingConstraints 应属于通用 Agent 创建选项、Subagent 请求还是独立持久 capability？
2. 父 Agent 提供的 risk/latency 信息如何与 Host 独立评估冲突解决？
3. 哪些语义 route 可以由用户授权父 Agent override？
4. “不同模型家族”如何定义和验证，避免虚假的独立评审承诺？
5. 外部 Codex/Claude Code provider 能在何时、以何种粒度切换模型和 effort？

## 产品与生态

1. 用户默认看到多少决策细节，如何避免透明度变成噪音？
2. Auto 是每 Session 开关、profile 默认还是全局设置？
3. 什么算真实活跃用户：周活跃、完成 Auto 任务数还是持续留存？
4. 社区 Route Profile 如何签名、版本化、审查和失效？
5. 哪些核心 seam 值得贡献给 DSH 官方，哪些应保留为独立插件差异化？
