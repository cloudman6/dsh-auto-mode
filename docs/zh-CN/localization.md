<!--
translation-source: docs/localization.md
translation-source-blob: 24818e2ff5bffffd3163dca6f696cfd0ca406b3d
translation-status: current
-->

# 文档本地化策略

[English](../localization.md)

## 状态

已由 [ADR-005](decisions/0005-english-canonical-documentation.md) 接受。

## 权威源

仓库默认路径下的英文文档是权威源，简体中文是持续维护的一等翻译：

| 英文权威源 | 简体中文 |
|---|---|
| `README.md` | `README.zh-CN.md` |
| `CONTRIBUTING.md` | `CONTRIBUTING.zh-CN.md` |
| `PROJECT_STATUS.md` | `PROJECT_STATUS.zh-CN.md` |
| `AGENTS.md` | `AGENTS.zh-CN.md` |
| `docs/<path>.md` | `docs/zh-CN/<path>.md` |

默认路径使用英文，使仓库入口、外部链接、代码评审和工具集成不经过 locale 路径就能指向规范性文本。

英文作为权威源不限制创作和讨论语言。维护者可以使用中文思考、起草和协作；一项决策完成前，其规范性结论必须进入英文权威文档。

## 翻译元数据

每个受维护的中文翻译以以下元数据开头：

```markdown
<!--
translation-source: docs/example.md
translation-source-blob: <最后完成复核的英文权威源 Git blob ID，或 none>
translation-status: current
-->
```

源路径相对于仓库根目录。通过最终源文件内容获得 blob ID：

```bash
git hash-object docs/example.md
```

元数据跟踪源文件内容而不是 commit，因此源文件和翻译可以在同一个 commit 原子更新，不会产生循环 commit hash 依赖。Blob ID 表示“该翻译最后完成复核时精确对应的英文权威源”，不只是自动化看到的最新源文件。

允许的状态值：

- `current`：翻译已针对完全相同的源 blob 完成复核，而且记录的 blob 等于当前英文权威源。
- `outdated`：英文权威源已经改变，翻译尚未同步。保留最后完成复核的源 blob ID；只有从未存在经过复核的翻译时才使用 `none`。

缺少元数据表示翻译未经验证，不能视为最新。

## 同步规则

- 维护者编写的变更默认在同一次变更中更新英文和中文。
- 只修改英文的外部贡献可以被接受，但对应 locale 文件必须标记为 `outdated`。新文档尚未翻译时，由维护者添加 locale 占位文件。
- 核心用户文档——README、安装、配置、安全、公共 API、迁移和发布说明——在发布前必须是最新状态。
- 翻译不能独立改变产品语义。语义修正先进入英文，再传播到中文。
- 中英文冲突时以英文为准，差异本身是文档缺陷。
- 如果目标文档存在翻译，翻译文档中的内部链接应留在相同 locale。

## 仓库语言

- 公共 Git 元数据使用英文：commit message、分支名、Issue 和 Pull Request 标题以及 PR 的规范性描述。
- 代码标识符、schema、配置键、API 名称和代码注释使用英文。
- 允许使用中文讨论开发。公共讨论可以包含中文上下文，但决策必须有英文版本。
- Commit message 不使用中英双语。本地化属于文档，不属于重复的 Git 历史。

## 验证

在规范评审完成并引入文档工具前，每项文档任务必须验证：

1. 每个英文权威 Markdown 文档都有对应的中文 locale 文件，并且指向存在的英文权威源。
2. 每个标记为 `current` 的翻译都记录源文件实际的 `git hash-object` 值；每个 `outdated` 文件记录最后完成复核的源 blob 或 `none`。
3. 英文权威文档和翻译的本地链接都能解析。
4. 新英文权威文档已经翻译，或有明确标记为 `outdated` 的 locale 占位文件。
5. Markdown 文件以恰好一个换行结束，并且没有冲突标记。
