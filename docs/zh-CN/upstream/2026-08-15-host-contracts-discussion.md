<!--
translation-source: docs/upstream/2026-08-15-host-contracts-discussion.md
translation-source-blob: ae718182608e2002955f3be1cd9b9f97fcbfb457
translation-status: current
-->

# Discussion 草稿：面向路由插件的产品无关 Host 契约

[English](../../upstream/2026-08-15-host-contracts-discussion.md)

## 发布建议

发布到 DeepSeek Harness 官方 Discussions 的 [**Ideas** 分类](https://github.com/deepseek-ai/deepseek-harness/discussions/categories/ideas)，标题使用：

> Proposal: pre-assembly step preparation and runtime registration for required plugin Session events

2026-08-15 抽样的最新 100 个 Discussion 标题中，26 个仅中文、34 个仅英文、40 个中英混合。样本内 28 个 Ideas 几乎均分：10 个仅中文、9 个仅英文、9 个中英混合。样本来自 GitHub API 按创建时间返回的最新 100 个 Discussion；分类依据是标题中是否包含汉字与拉丁字母。技术提案没有占绝对优势的单一语言。建议使用下面的英文技术正文，以便精确表达并支持全球检索，同时把中文摘要放在最前面，方便维护者与中文社区阅读。

状态：仅为草稿，尚未发布。

## 可直接发布的正文

### 中文摘要

我们在实现一个 DSH 自适应模型路由插件时遇到了两个通用的 Host 扩展缺口：插件无法在依赖 provider 的 prompt assembly 之前读取当前 step 刚领取的消息并冻结模型选择；插件通过 `SessionEventMap` 声明的必需事件在重启后又无法被 persistence reader 可靠识别。我们在 fork 上实现了两个产品无关的候选契约，并通过组合冷加载探针。这里希望先确认这些能力是否符合 DSH 的扩展方向；当前仓库不接受外部 PR，因此先发布设计与实现证据，不请求直接合并。

### 概要

自适应路由插件需要在当前消息被领取后、依赖 provider 的 prompt/tool assembly 前做出一次决定。它还需要持久化不能在冷重建时被静默跳过的必需插件 Session 事件。

当前公共扩展接口无法完整支持其中任何一项。我们已在 fork 上实现并测试两个产品无关的候选契约：

1. agent-scoped pre-assembly step-preparation waterfall；
2. 必需插件 Session 事件 namespace 的 effect-scoped 运行时注册。

本提案希望确认这些能力是否符合 DSH 预期的扩展模型，以及维护者是否更倾向其他命名或兼容语义。它不会让 DSH Core 理解 route 档位、任务分类、provider 排名或任何 Auto-mode 策略。

### 实现引用

- 被审计的上游基线：[`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a)
- Fork 分支：[`cloudman6/deepseek-harness:codex/auto-mode-host-contracts`](https://github.com/cloudman6/deepseek-harness/tree/codex/auto-mode-host-contracts)
- 精确 commit：[`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243)

项目[当前贡献策略](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/CONTRIBUTING.md)不接受外部 Pull Request，因此这是由实现支撑的设计讨论，而不是 merge request。

### 缺口 1：当前 step 输入晚于依赖 provider 的 assembly

在被审计版本中，Agent loop 先领取 inbox 消息、组装 system prompt，然后才调用 `agent/pre-step`；`agent/request` 更晚。只有当另一个 owner 已经在 assembly 前完成模型选择时，`installModelSelection()` 才能保持 assembly 与 request 一致；它无法根据刚领取的消息推导选择。

因此在 `agent/request` 选择已经太晚：request 可能使用一个模型，而依赖 provider 的上下文与工具却是为另一个模型组装的。

#### 候选 A1 契约

在 inbox claim 后、`system-prompt/assemble` 前立即增加 agent-scoped `agent/prepare-step` waterfall：

```ts
type PrepareStepDecision =
  | { kind: 'enter' }
  | { kind: 'reject' }

'agent/prepare-step'(
  payload: {
    agent: Agent
    messages: readonly UserMessage[]
    turn: number
    step: number
    signal: AbortSignal
  },
  next: () => Promise<PrepareStepDecision>,
): Promise<PrepareStepDecision>
```

已领取消息数组会被冻结。该 hook 不能重写消息；现有 assembly 后的 `agent/pre-step` 继续承担该责任且保持不变。拒绝会在 prompt assembly、`step/start` 和模型调用前停止。Listener 可以在 preparation 期间更新现有 model-selection owner，随后 `installModelSelection()` 为 assembly 与 `agent/request` 捕获同一选择。

这是 lifecycle/admission seam，不是 routing API：Core 只携带消息、step identity、取消以及 enter/reject。

### 缺口 2：编译期插件事件无法在重启后由运行时读取

`SessionEventMap` 支持 declaration merge，因此仓库外插件可以通过编译并追加必需事件。冷持久化目前只识别仓库本地生成的事件集合。未知必需事件在重启后会被拒绝，除非标记为 `ignorable`；但规范性决策或约束不能安全跳过。

#### 候选 A2 契约

为 `SessionStore` 增加 effect-scoped namespace registry：

```ts
sessions.registerEventNamespace({
  namespace: 'example.plugin',
  owner: 'example-plugin-package',
  version: 1,
  events: {
    'example.plugin/decision': payloadSchema,
  },
})
```

每次注册提供一个唯一 namespace、稳定 owner id、正整数 schema version，以及该版本完整的 event-type-to-schema map。Schema 暴露结构化接口 `parse(unknown): unknown`；Core 只使用 parser 做校验，并持久化原始 lossless JSON snapshot。

Attached Session 在修改日志前校验每个必需插件事件，并在 envelope 中持久化 `{ namespace, version }`。冷读取只有在以下条件全部满足时才接受该事件：

- 精确 namespace version 已注册；
- event type 属于该 registration；
- 已存 payload 通过 schema 校验。

缺少 registration、版本不符、metadata 畸形、类型未声明和 payload 无效都会在 Session 重建前失败，并给出标明所需 namespace/version 的诊断。释放注册 fiber 会移除支持。内置事件仍由生成机制管理；明确为 ignorable 的未知事件保持现有行为。

### 为什么这些 seam 应位于插件之下

插件拥有任务评估、route 档位、证据、provider 排名与选择策略。Host 拥有 lifecycle ordering、prompt/request 一致性、Session event envelope、冷重建与插件 disposal。让每个插件各自实现后一组机制，要么不可行，要么会产生互不兼容的持久化与时序规则。

两个候选契约都没有提到自适应路由。Memory、approval、policy、audit 或 workflow 插件只要拥有必需持久状态，就可以使用相同的事件注册。任何必须根据刚领取的 step 输入、在 assembly 前准备 Host-owned state 的插件都可以使用 preparation seam。

### 验证证据

Fork 包含产品无关 fixture 与 Agent Note。在 macOS 上通过：

- Agent-loop interception/resume、Session、scoped-event invariant、memory persistence 与 JSONL persistence 共 402 项测试；
- `pnpm typecheck`；
- `pnpm lint`；
- `pnpm doc-sync` 全部 28 项 gate；
- 组合 JSONL 探针：在 assembly 前完成选择，证明 assembly/request 模型一致，持久化必需插件事件；缺少 registration 时拒绝冷加载，恢复精确 registration 后成功加载。

### 给维护者的问题

1. `agent/prepare-step` 与必需事件运行时注册是否符合 DSH 预期的扩展方向？
2. Preparation 是否应位于 claim 后、assembly 前，还是应该扩展某个现有 lifecycle abstraction？
3. 对必需插件事件，精确 namespace-version 匹配是否适合作为首个 fail-closed 规则，还是 registration 现在就应暴露显式兼容/迁移契约？
4. Namespace owner 应标识 npm package、Cordis plugin name，还是其他稳定 identity？
5. 如果方向被接受且外部 PR 重新开放，维护者是否希望 A1/A2 分成两项改动，并把组合纵向探针放入一个 stacked integration change？

我们会继续把插件固定到 fork；在上游出现等价契约前，不会宣称兼容官方 DSH。
