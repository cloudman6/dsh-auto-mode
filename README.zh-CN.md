<!--
translation-source: README.md
translation-source-blob: 1977c85f25e195baae31054774790a5af0f410ac
translation-status: current
-->

# DSH Auto Mode

[English](README.md)

DSH Auto Mode 是面向个人重度 Agent 用户的 DeepSeek Harness 自适应路由插件。普通交互只有一个选择：使用 Auto，或者手动选择 provider/model/reasoning selection。Auto 根据任务上下文选择 `light`、`standard` 或 `deep` 处理级别，再在该级别的合格 route 中优先 Artificial Analysis 价格更低者，并用 AA 延迟打破平局。

已接受的阶段 0P MVP 与阶段 1–3 pipeline 现在已在固定维护者 fork 上形成一条可运行决策路径。对于每个 DSH 用户 turn，插件会解析有限语义 assessment，应用确定性 Host policy 与当前 route constraint，按级别和价格从本地 AA evidence catalog 选择，并把一项实际配置冻结到 assembly、request、persistence 与 cold reconstruction。Live UI 显示 Light/Standard/Deep、实际 model 与适用 effort、证据依据，以及适用时的准确 AA snapshot。AA 是主流模型能力、价格和延迟结论的外部来源；插件不宣称经过本项目 Benchmark 的质量、普遍最优性、安全或官方 DSH 兼容。

## 产品边界

DSH Auto Mode 从 AA 驱动的模型选择开始。完整方向包括：

- Adaptive Router：在模型请求前选择任务处理级别和具体 route，并解释原因。
- Routing Policy：把结构化任务属性映射到 `light`、`standard` 或 `deep`。
- AA Route Catalog：把通用 Host route identity 绑定到稳定 AA evidence record，再用 AA 价格和延迟解析同档 candidate。
- Recovery Supervisor：检测停滞，只在已声明恢复支持允许时执行升级、continue、salvage 或 restart。
- Delegation Policy：约束父 Agent 对子 Agent 的路由控制权。
- 可选评估：聚焦 fixture 与 scenario 可以研究策略行为，但不成为模型质量 admission gate。

真正的任务调度——并发上限、优先级、排队、抢占和跨子 Agent 预算分配——不属于当前范围，也不应与模型路由混称为 Scheduler。

## 文档

- [项目状态](PROJECT_STATUS.zh-CN.md)
- [可运行的阶段 0P 快速原型](docs/zh-CN/phase-0p-fast-prototype.md)
- [产品规范](docs/zh-CN/spec.md)
- [系统架构](docs/zh-CN/architecture.md)
- [路由策略](docs/zh-CN/routing-policy.md)
- [恢复与 Episode](docs/zh-CN/recovery.md)
- [子 Agent 委派权限](docs/zh-CN/delegation.md)
- [可选评估轨道](docs/zh-CN/routerbench.md)
- [DSH 集成与兼容性](docs/zh-CN/dsh-integration.md)
- [已发布的上游 A1/A2 Host 契约 Discussion](docs/zh-CN/upstream/2026-08-15-host-contracts-discussion.md)
- [产品路线图](docs/zh-CN/roadmap.md)
- [开放问题](docs/zh-CN/open-questions.md)
- [术语表](docs/zh-CN/glossary.md)
- [架构决策记录](docs/zh-CN/decisions/README.md)
- [文档本地化策略](docs/zh-CN/localization.md)
- [2026-08-14 多视角设计评审](docs/zh-CN/reviews/2026-08-14-multi-view-design-review.md)
- [当前实施计划](tasks/plan.zh-CN.md)
- [当前任务清单](tasks/todo.zh-CN.md)
- [有边界阶段 Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md)
- [参与贡献](CONTRIBUTING.zh-CN.md)

## 当前命令

当前仓库包含零依赖实现和已接受的设计文档。

```bash
# 运行零依赖单元测试
npm test

# 增加真实 DSH Loader 组合覆盖
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" npm test

# 检查空白错误和冲突标记
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .

# 检查工作区
git status --short --branch
```

## 参与方式

先阅读 [`PROJECT_STATUS.zh-CN.md`](PROJECT_STATUS.zh-CN.md)、[`docs/zh-CN/spec.md`](docs/zh-CN/spec.md) 和 [`docs/zh-CN/roadmap.md`](docs/zh-CN/roadmap.md) 的当前阶段。已完成 MVP 继续记录在 [`docs/zh-CN/phase-0p-fast-prototype.md`](docs/zh-CN/phase-0p-fast-prototype.md)。语言与贡献规则见 [`CONTRIBUTING.zh-CN.md`](CONTRIBUTING.zh-CN.md)。
