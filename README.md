# DSH Auto Mode

DSH Auto Mode 是面向个人重度 Agent 用户的 DeepSeek Harness 自适应路由插件。它根据任务、执行证据和用户约束自动选择模型与 reasoning effort，在维持固定高配置质量基线的前提下，优先降低延迟，其次降低成本。

项目目前处于规范评审阶段，尚未开始实现。当前文档记录已经形成的方案、仍需验证的假设和待决问题；评审通过后再进入实施计划与任务拆分。

## 产品边界

DSH Auto Mode 不只是一次性的模型选择器。完整方向包括：

- Adaptive Router：在每次模型请求前选择语义 route，并解释原因。
- Routing Policy：使用可测试的策略决定 `fast`、`standard`、`strong` 或 `abstain`。
- Recovery Supervisor：检测停滞并执行升级、继续、salvage 或 restart。
- Delegation Policy：约束父 Agent 对子 Agent 的路由控制权。
- RouterBench：用专门任务集校准路由策略和模型档案。

真正的任务调度——并发上限、优先级、排队、抢占和跨子 Agent 预算分配——不属于当前范围，也不应与模型路由混称为 Scheduler。

## 文档

- [项目状态](PROJECT_STATUS.md)
- [产品规范](docs/spec.md)
- [系统架构](docs/architecture.md)
- [路由策略](docs/routing-policy.md)
- [恢复与 Episode](docs/recovery.md)
- [子 Agent 委派权限](docs/delegation.md)
- [RouterBench](docs/routerbench.md)
- [产品路线图](docs/roadmap.md)
- [开放问题](docs/open-questions.md)
- [术语表](docs/glossary.md)
- [架构决策记录](docs/decisions/README.md)

## 当前命令

当前仓库只有规范文档，没有可构建产品。

```bash
# 检查工作区
git status --short --branch

# 检查空白错误和冲突标记
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .

# 列出设计文档
find docs -type f -name '*.md' -print | sort
```

## 参与方式

先评审 `docs/spec.md` 的假设、成功标准和范围，再评审架构与 ADR。规范未确认前不创建实现代码、依赖或 CI。
