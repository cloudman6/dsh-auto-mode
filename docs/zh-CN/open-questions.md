<!--
translation-source: docs/open-questions.md
translation-source-blob: a95b9fae5a4c8ff6d3f4bf1152a104a94661310b
translation-status: current
-->

# 开放问题

[English](../open-questions.md)

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

1. 配置的 Deep fallback 属于全局、项目还是 Session？
2. 长期载体是维护者 DSH fork、上游 extension 还是拆分 package？
3. 经同意后可以收集哪些最小化 dogfood signal，保留多久？
4. 社区 AA evidence binding 和 policy profile 如何评审、版本化和回滚？
5. 哪些 Codex 与 Claude Code API 足以控制 model 和 effort？
