<!--
translation-source: CONTRIBUTING.md
translation-source-blob: 00feadec25ada7996ff2255fe45247722c3536d7
translation-status: current
-->

# 参与 DSH Auto Mode

[English](CONTRIBUTING.md)

DSH Auto Mode 已在受 Accepted 规范与 ADR 约束的阶段 0 关键路径执行中。当前证据 gate 与下一步以 `PROJECT_STATUS.zh-CN.md` 为准。只有对应路线图 gate 与实施决策已经明确开放时，才能增加产品代码、依赖、构建配置、CI 或发布自动化。

## 语言

- 默认路径下的仓库内容以英文为权威语言。
- 简体中文作为一等阅读体验维护，位于 `docs/zh-CN/` 和根目录的 `*.zh-CN.md` 文件。
- Commit message、分支名、Issue 和 Pull Request 标题以及 PR 的规范性描述使用英文。
- PR 可以附加中文说明，但英文内容具有最终解释权。
- 维护者可以使用中文讨论开发；确认后的结论必须进入英文权威文档。

当英文权威文档与翻译冲突时，以英文为准，并报告或修复翻译差异。

## Commit message

使用 Conventional Commits，标题和正文均为英文：

```text
<type>[optional scope]: <description>

<optional body explaining why the change is needed>
```

常用 type 包括 `docs`、`feat`、`fix`、`refactor`、`test` 和 `chore`。每个 commit 只包含一个逻辑关注点，不要在标题或正文中重复中英文。

示例：

```text
docs(routing): clarify episode-level route transitions

Allows down-routing only after the active route floor has been
released by evidence defined in the episode release policy.
```

## Code Review gate

把实施拆成有边界的阶段；每个阶段只有一项可独立测试、可独立回退的验收结果。聚焦验证通过后、commit 前，调用 [`$dsh-auto-mode-code-review`](.agents/skills/dsh-auto-mode-code-review/SKILL.md)。解决全部 P0-P2 finding，并重新评审直至返回 `PASS`；机械 gate 全绿不能替代语义评审。

## 文档修改

1. 修改默认路径下的英文权威文档。
2. 在可行时同步修改对应的简体中文文档。
3. 完成翻译复核后，将 `translation-source-blob` 更新为完全对应的英文权威源 Git blob ID，并标记为 `current`。
4. 如果同一次变更无法同步翻译，保留它最后完成复核时对应的源 blob ID，并标记为 `outdated`。新文档尚未翻译时，由维护者创建 locale 占位文件，使用 `translation-source-blob: none` 和 `translation-status: outdated`。
5. 权威事实变化时，同步更新导航、项目状态、开放问题或 ADR。

不要求外部贡献者编写中文。只修改英文的贡献可以被接受，但对应 locale 文件必须正确标记为过期；新 locale 占位文件和后续翻译由维护者负责。

完整的权威源和同步策略见 [`docs/zh-CN/localization.md`](docs/zh-CN/localization.md)。

## 设计评审顺序

1. 评审 [`docs/zh-CN/spec.md`](docs/zh-CN/spec.md)。
2. 评审 [`docs/zh-CN/architecture.md`](docs/zh-CN/architecture.md) 和相关专题文档。
3. 评审 [`docs/zh-CN/decisions/README.md`](docs/zh-CN/decisions/README.md) 中的 ADR 索引。
4. 将假设转成决策前检查 [`docs/zh-CN/open-questions.md`](docs/zh-CN/open-questions.md)。

没有维护者明确批准，不得把 ADR 从 `Proposed` 改为 `Accepted`。
