<!--
translation-source: docs/decisions/0005-english-canonical-documentation.md
translation-source-blob: f9052307dbd747f27df34b1cd732f565aff5b099
translation-status: current
-->

# ADR-005：使用英文作为文档权威语言

[English](../../decisions/0005-english-canonical-documentation.md)

## 状态

Accepted

## 日期

2026-08-14

## 背景

DSH Auto Mode 的开发讨论使用中文，但项目目标是成为面向全球开发者的公共开源插件。仓库既需要完整中文文档，也不能让国际贡献者依赖中文，更不能形成两套相互冲突的规范性文档。

Git 历史、默认仓库入口、公共 API 和贡献流程同样需要一种共同语言。每条 commit 和每个文档章节都中英双写会增加评审噪音，而且翻译发生分歧时仍然没有定义哪一种表述有效。

## 决策

默认仓库路径下的英文文档是权威源。简体中文作为一等翻译维护在 `docs/zh-CN/` 和根目录的 `*.zh-CN.md` 文件中。

开发讨论和起草可以使用中文，确认后的结论必须进入英文权威文档。公共 Git 元数据、代码标识符、代码注释、schema 和配置键使用英文。Commit message 遵循 Conventional Commits，不重复中文。

中文翻译记录相对于仓库根目录的源路径、源文件 Git blob ID 和翻译状态。中英文冲突时以英文为准，并修正翻译。

## 备选方案

### 中文作为权威源，英文作为翻译

拒绝。它优化了当前维护者的工作流，却给目标中的全球贡献者设置语言障碍，并使 GitHub 默认入口变成非规范性翻译。

### 英文和中文同等权威

拒绝。两套规范性来源可能冲突，却没有确定的解决规则，迫使每次语义修改都变成跨语言共识问题。

### 每个文件和 commit message 都中英双写

拒绝。它使文档和历史噪音翻倍，降低评审与导航效率，也不能消除语义漂移。

### 只发布英文

拒绝。中文是维护者的主要开发语言，也是有价值的阅读体验。删除中文会损失可访问性，却没有解决技术约束。

## 后果

- 现有中文文档移动到 locale 专用路径，并获得英文权威版本。
- 维护者通常在同一次变更中更新两种语言；外部贡献者可以只提交英文，但必须把翻译标记为过期。
- 翻译新鲜度可以通过源文件 blob 元数据验证，不需要绑定未来 commit hash。
- 仓库规则和贡献指南必须定义英文 Git 元数据和翻译工作流。
- 翻译质量仍然需要评审；AI 翻译降低工作量，但不能证明语义等价。

## 参考资料

- [GitHub Docs 的贡献与翻译模型](https://docs.github.com/en/contributing/collaborating-on-github-docs/about-contributing-to-github-docs)
- [Kubernetes 文档本地化](https://kubernetes.io/docs/contribute/localization/)
- [Vue 文档翻译](https://vuejs.org/translations/)
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)
