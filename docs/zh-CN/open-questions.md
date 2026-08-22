<!--
translation-source: docs/open-questions.md
translation-source-blob: a94003583ded18dc48e1dea635e38b6a32ced322
translation-status: current
-->

# 开放问题

[English](../open-questions.md)

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
