<!--
translation-source: docs/open-questions.md
translation-source-blob: 5b3f9eb041f3a348b2659195ed1d3891b0fa2cd4
translation-status: current
-->

# 开放问题

[English](../open-questions.md)

## 阶段 1：AA catalog

1. 哪个 AA capability score 或已发布排名定义初始三档边界；边界使用绝对分数还是与当前第一名的差值？
2. 哪个 AA price field 是同档比较的权威字段；字段缺失时采用什么显式规则？
3. 用哪个 AA latency field 打破价格平局？
4. 哪些初始已评审 binding 把当前 DSH Host route identity 映射到稳定 AA record ID，每条 binding 声明什么 match basis 与限制？
5. 哪些 DSH route 暴露未指定/default effort 或其他不透明执行选项，Host 能否可靠物化它们以形成稳定 route identity？
6. 哪些混合 provider fixture 能证明零个、一个和多个执行控制项的 route 不会发生 collision？

## 阶段 2：语义 assessor

1. 哪个固定 provider/model/effort 运行 assessor 且不进入 Auto 递归？
2. 哪些有限任务上下文是必需的，同时不暴露过多 prompt、代码或工具历史？
3. 哪个 schema、timeout 和 confidence threshold 触发 `deep` fallback？
4. 哪些 fixture prompt 覆盖编码、调试、研究、写作、架构、安全和模糊任务？
5. 哪些属性单独强制 `deep`，哪些组合区分 `light` 与 `standard`？

## 阶段 3：Auto Beta

1. 什么构成重新判断的新任务边界：每条用户消息、Session objective 还是其他 Host-owned event？
2. 配置的 Deep fallback 属于全局、项目还是 Session？
3. 哪些解释默认显示，哪些留在检查详情中？
4. 哪种用户措辞区分 AA 匹配 route 与配置 fallback？
5. 哪个 fork commit 和 plugin version 定义首个 Beta support matrix？

## 阶段 4：AA 更新

1. 维护快照适用哪种稳定获取方式、terms、attribution 和 retention boundary？
2. 能否分发最小化衍生 catalog，还是每个安装都必须获取自己的本地快照？
3. 多长 freshness period 合理且不引入实时 runtime 依赖？
4. 发布快照前，维护者如何检查模型新增、删除、版本改名和档位变化？

## 自适应执行与恢复

1. 哪些形式化 runtime signal 支持 `light → standard → deep` 升级？
2. 哪个任务或 phase 边界允许重新判断，而不对每个工具步骤重新分类？
3. 有哪些证据时才应考虑降级？
4. 哪些 effect class 支持 Continue、Salvage 或 Restart，且不会覆盖用户或其他 Agent 工作？

## 产品与生态

1. 长期载体是维护者 DSH fork、上游 extension 还是拆分 package？
2. 经同意后可以收集哪些最小化 dogfood signal，保留多久？
3. 社区 AA evidence binding 和 policy profile 如何评审、版本化和回滚？
4. 哪些 Codex 与 Claude Code API 足以控制 model 和 effort？
