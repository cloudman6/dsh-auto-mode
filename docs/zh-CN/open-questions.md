<!--
translation-source: docs/open-questions.md
translation-source-blob: bc4ab85ee2b6695d5dc7c2d2178bffa81119b02a
translation-status: current
-->

# 开放问题

[English](../open-questions.md)

## 必须在阶段 0P dogfood 前关闭

1. DSH 可以调用哪些官方带版本 provider/model selector？什么 provider-response identity 或 provider 专用 attestation 能把每个 selector 绑定到对应 Artificial Analysis 被测 deployment，而不是无 revision alias 或页面名称？
2. 初始任务 taxonomy 使用哪些 Artificial Analysis index family 与字段？哪些带版本启发式阈值定义实验 `fast`、`standard` 与 `strong`？
3. 在不再分发榜单数据的前提下，使用哪个精确 endpoint、prompt/index 语义、pagination 覆盖、本地 snapshot schema、规范化内容 digest、freshness 规则、attribution、API access path 与数据权利边界？
4. 哪些高风险与低置信度 assessment 强制从有效 catalog 使用最强精确匹配？哪些 mapping、identity、evidence、contract 或 Recovery Capability 失败会在调用前产生 `no-experimental-route`？
5. 哪个具体、带版本的 execution-world provider、platform runner、支持的操作系统、production capability/tool-entry inventory、dependency ownership、持久 attribution journal 与 executor-level 测试，能证明 ADR-009 的干净隔离 worktree、Attempt attribution、containment、process control、credential isolation 与 `externalSideEffects: 'none'` 要求？设计被接受且该证据存在前，Experimental Auto 不执行可变工作。

## 必须在阶段 0C preview planning 前关闭

1. [DSH 集成与兼容性](dsh-integration.md)中已核实的缺口，哪些提交给上游；插件精确要求哪个最低 DSH 版本或 commit？
2. 哪些 provider/model/reasoning-selection deployment 构成第一批已准入基线与候选；什么稳定 identity 证据绑定它们；谁维护对应 Policy Pack 证据？
3. 每个初始任务切片预注册哪些基线绝对阈值、`epsilon`、`delta`、置信水平、统计功效和高风险固定档位规则？
4. 哪些仓库、fixture 和来源能提供真正隔离的校准、验证、留出和时间外数据？
5. Task Assessor 是否需要模型；若需要，固定配置、延迟预算、schema、置信阈值和漂移测试是什么？
6. 持久化决策与证据事件可以暴露哪些字段，才能避免保存敏感 prompt、代码或 provider 私有状态？
7. 阶段 0P 的 A5p 载体能否提升为阶段 0C preview 载体？还需要什么 admission-aware 探针？

## 必须在阶段 B 与生产 release planning 前关闭

1. 生产载体是外部插件、DSH 上游 core capability，还是拆分架构？Host 拥有决策权不等于 deployment 载体已经确定。
2. 什么通用 A3 deployment-identity 契约替代 provider 专用的 A3p preview 证据？
3. 什么通用 A5 client-extension 契约替代具体 A5p preview 载体？
4. 哪些真实使用证据需要同意、最小化、保留、删除和跨 provider 数据边界控制？
5. 哪些 Recovery Capability provider 与副作用类别进入首个生产实施计划？

## DSH 上游关键路径

1. 最小且产品无关的 pre-assembly step 契约是什么：暴露已领取消息和稳定 turn/step identity，支持取消与调用前拒绝，并让同一不可变 context 贯穿组装和 `agent/request`？
2. 必需插件 Session 事件注册如何建立 namespace 所有权、schema/version 兼容、冷加载注册顺序、插件缺失诊断和迁移行为？
3. Session Static Auto 声明兼容前，哪些可执行 core 与插件 contract test 必须通过？
4. 当前 provider adapter 能否暴露稳定的已解析 deployment identity/fingerprint，还是需要通用 DSH model-identity 契约？
5. 辅助调用 `purpose` 是否具有足够扩展性，能在不修改 DSH Core 的前提下分类和审计固定 Task Assessor 调用？
6. 当前哪些客户端扩展点能在不修改 core UI 的情况下实现 Auto/manual 控制和决策解释？
7. 如何划分上游 issue 与 PR，使 A1、A2 可以独立评审，同时证明组合后的纵向契约？

## 路由与 Policy Pack

1. 当 alias 或服务端修订不透明时，如何确认 deployment identity 和 provider/model 指纹？
2. 什么条件使 capability/risk 约束成为 Host 认可且用户授权的约束，而不是不可信的父 Agent 提议？
3. Policy Pack 如何签名、评审、过期、撤销，以及出现严重失败簇后如何回退？
4. 阶段 0C 固定为每 Session 一次决策。后续准入 objective-scoped Static Auto 前，什么 objective 边界与 Host-owned 事件确认目标已经改变？
5. `constraints-unsatisfiable`、`profile-invalid`、`provider-unavailable` 和 `no-safe-route` 分别对应什么显式 UI 与自动化行为？

## Turn 内路由

1. 计入 prompt-cache 损失、接管上下文、分类延迟和 phase 不确定性后，Within-turn Auto 是否实质优于 Session Static Auto？
2. 哪些非模型信号确认 phase 边界；Execution Context Projector 如何解决证据冲突或缺失？
3. 如何估计剩余工作和切换开销，同时不把当前模型自报变成权威？
4. 留出 Policy Scenario Bench 结果支持怎样的最小保持期和 hysteresis 阈值？
5. 如果增量证据 gate 失败，phase 路由应保持实验功能还是从产品界面移除但保留架构设计？

## Recovery

1. 哪些工具能暴露结构化 validation、mutation、provenance 和 trust 信号？
2. 哪些副作用类别能声明 `checkpoint`、`attribution`、`restore` 和 `isolation` 支持；这些声明如何做 contract test？
3. 如何定义 failure fingerprint，避免把不同失败错误地合并成同一 episode？
4. 哪些 release policy 完全可机械验证；什么情况下固定 Recovery Assessor 才有依据？
5. Continue 的注入内容如何避免扩大上下文和强化错误假设？
6. 修改状态未知、恢复失败或外部副作用不可逆时，必须提供怎样的用户介入流程？
7. Session 血缘、Route Snapshot、attempt、checkpoint 和 execution-world 状态之间的原子关系如何持久化？

## 子 Agent

1. RoutingConstraints 应属于通用 Agent 创建选项、Subagent 请求还是独立持久 capability？
2. 父 Agent 提供的哪些字段只是 hint，哪些是 Host 可识别提议，哪些经过验证后可以变成硬约束？
3. 用户可以授权哪些语义 override，同时不允许 raw provider/model 绕过策略？
4. “不同模型家族”如何定义和验证，避免虚假的 evaluator 独立性承诺？
5. 外部 Codex 或 Claude Code provider 实际能在何时、以何种粒度选择或切换 model 和 effort？

## 产品、隐私与生态

1. 默认展示怎样的紧凑解释，同时允许检查完整决策轨迹？
2. Auto/manual 的单一控制存在哪里：全局默认、项目偏好还是 Session override？
3. 怎样的明确同意遥测 cohort 与留存计算构成真实活跃用户？
4. 任务文本、代码、工具输出、evaluator 理由和失败证据如何最小化、脱敏、保留和删除？
5. 哪些 Policy Pack 和 contract-test 基础设施应进入 DSH 上游，哪些保留为本插件的差异化产品？
