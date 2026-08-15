<!--
translation-source: README.md
translation-source-blob: d6ac21ba511d4a2e855bf497ac949a46823d6e66
translation-status: current
-->

# DSH Auto Mode

[English](README.md)

DSH Auto Mode 是面向个人重度 Agent 用户的 DeepSeek Harness 自适应路由插件。普通交互只有一个选择：使用 Auto，或者手动选择 provider/model/reasoning selection，包括受支持的默认行为。Auto 只从有证据准入的配置中选择。其优化顺序严格固定：基线先通过绝对质量门槛，候选维持非劣性，然后降低延迟，最后降低成本。

规范和当前全部 ADR 已被接受。产品无关的 A1 pre-assembly step preparation 与 A2 Session 事件运行时注册已在明确声明的 DSH fork 上实现并固定版本。其余阶段 0C 准入、deployment identity 与载体 gate 通过前，还不存在可供用户使用的 Auto Mode preview。

## 产品边界

DSH Auto Mode 从证据治理的模型选择开始。完整但由证据门控的方向包括：

- Adaptive Router：在每次模型请求前选择语义 route，并解释原因。
- Routing Policy：使用可测试的策略决定 `fast`、`standard`、`strong` 或 `abstain`。
- Recovery Supervisor：检测停滞，只在已声明恢复支持允许时执行升级、continue、salvage 或 restart。
- Delegation Policy：约束父 Agent 对子 Agent 的路由控制权。
- RouterBench：使用相互隔离的任务与场景集，分别验证具体配置资格和策略行为。

真正的任务调度——并发上限、优先级、排队、抢占和跨子 Agent 预算分配——不属于当前范围，也不应与模型路由混称为 Scheduler。

## 文档

- [项目状态](PROJECT_STATUS.zh-CN.md)
- [产品规范](docs/zh-CN/spec.md)
- [系统架构](docs/zh-CN/architecture.md)
- [路由策略](docs/zh-CN/routing-policy.md)
- [恢复与 Episode](docs/zh-CN/recovery.md)
- [子 Agent 委派权限](docs/zh-CN/delegation.md)
- [RouterBench](docs/zh-CN/routerbench.md)
- [DSH 集成与兼容性](docs/zh-CN/dsh-integration.md)
- [上游 A1/A2 Host 契约 Discussion 草案](docs/zh-CN/upstream/2026-08-15-host-contracts-discussion.md)
- [产品路线图](docs/zh-CN/roadmap.md)
- [开放问题](docs/zh-CN/open-questions.md)
- [术语表](docs/zh-CN/glossary.md)
- [架构决策记录](docs/zh-CN/decisions/README.md)
- [文档本地化策略](docs/zh-CN/localization.md)
- [2026-08-14 多视角设计评审](docs/zh-CN/reviews/2026-08-14-multi-view-design-review.md)
- [已完成的 A1/A2 实施计划与证据](tasks/plan.zh-CN.md)
- [A1/A2 任务记录](tasks/todo.zh-CN.md)
- [有边界阶段 Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md)
- [参与贡献](CONTRIBUTING.zh-CN.md)

## 当前命令

当前仓库包含已接受规范与实施计划；产品代码尚未进入本仓库。

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

先阅读 `docs/zh-CN/spec.md` 中已接受的假设、成功标准和范围，再阅读架构、ADR、路线图 gate 与当前任务计划。语言与贡献规则见 [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)。
