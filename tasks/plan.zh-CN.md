<!--
translation-source: tasks/plan.md
translation-source-blob: daef1e012f13641191bfd12d70eb2411fbf6a2ee
translation-status: current
-->

# 实施计划：阶段 0 A1/A2 Host 契约

[English](plan.md)

## 目标

在明确声明的 DeepSeek Harness fork 上实现并证明两项产品无关契约：

- A1：Agent-scoped pre-assembly step-preparation waterfall，接收刚领取的消息和稳定 turn/step 坐标；可在组装或模型调用前停止 step；并允许现有 model-selection snapshot 同时供依赖 provider 的组装与 `agent/request` 使用。
- A2：必需插件 Session 事件 namespace 的 effect-scoped 运行时注册，包括持久 schema-version identity、namespace 冲突检测、payload 校验、冷加载诊断以及不兼容时 fail closed。

Fork 实现不得包含 Auto Mode route 档位、Task Assessment、Policy Pack、provider 排名或模型选择策略。

## 契约决策

### A1

在 `system-prompt/assemble` 前新增 additive `agent/prepare-step` waterfall。Payload 包含 scoped Agent、原样冻结的已领取 `UserMessage[]`、`turn`、`step` 和 `AbortSignal`。结果只能是 `enter` 或 `reject`，不重写消息。现有 `agent/pre-step` 继续位于组装之后，并保留消息重写语义。

这样可以在依赖 provider 的组装前执行生命周期策略，同时不破坏现有 pre-step consumer。Route owner 可以在 preparation 中更新现有 `installModelSelection()` 状态；该选择随后由 assembly 捕获，并在 `agent/request` 原样复用。

### A2

为 `SessionStore` 增加 effect-scoped namespace registry。一次注册声明：

- 全局唯一 namespace；
- 非空 owner 标识；
- 正整数 schema version；
- 该 namespace 完整的 event-type-to-payload-schema 映射。

Schema 使用结构化 `parse(unknown): unknown` 接口，因此插件可提供 Zod 或其他 validator，而无需为 Session Core 增加依赖。运行时忽略转换后的返回值，持久化原始 lossless JSON snapshot。

每个通过 attached Session 写入的必需仓库外事件都会获得不可变 envelope metadata，标识 namespace 与 schema version。冷读取只有在匹配的 live registration 存在、版本一致、类型属于该 registration 且 payload 通过校验时才接受。缺少 registration、版本漂移、已注册 namespace 中的未知类型、metadata 畸形和 schema 拒绝，都会在 Session 重建前 fail。内置事件继续使用生成 catalog；明确标为 ignorable 的未知事件保留现有前向兼容行为。

插件必须在任何冷 `load` 或 `prepare` 前完成 activation 注册。注册前加载会 fail closed，并在诊断中指出缺失 namespace 与版本；注册后允许重试。

## 依赖图

```text
已接受的 DSH Auto Mode 规范与 ADR
                    |
        +-----------+-----------+
        |                       |
 A1 公共契约             A2 公共契约
        |                       |
 A1 contract test       A2 registry/load test
        |                       |
 A1 实现                 A2 实现
        +-----------+-----------+
                    |
              组合纵向探针
                    |
          Fork commit 固定与证据更新
```

## 增量

### 增量 1：A1 失败契约测试

增加聚焦 Agent-loop 测试，证明事件顺序、已领取输入不可变、坐标稳定、scoped delivery、取消，以及 prompt assembly/model dispatch 前的拒绝。针对被审计版本运行，记录预期 RED 结果。

### 增量 2：A1 实现

在 `@deepseek-ai/dsh-agent` 增加公共 decision type 和事件声明；在 inbox claim 后、`system-prompt/assemble` 前立即 dispatch waterfall；保持现有 `agent/pre-step` 契约。使聚焦测试 GREEN，并运行 Agent 与 Agent-loop 测试集。

### 增量 3：A2 失败契约测试

增加 Session 单元测试，覆盖注册校验、重复 namespace/type 拒绝、append-time payload 校验、effect disposal 和 envelope metadata。扩展共享 persistence coordinator contract，覆盖冷加载时缺注册、版本不符、schema 失败和注册后重试。记录预期 RED 结果。

### 增量 4：A2 实现

在 `SessionStore` 实现 namespace registry，增加可选 registered-event envelope metadata，在写入日志前校验 attached live append，并把 persistence coordinator 的单一生成集合检查替换为“生成内置事件 + live registration 解析”。使聚焦 Session 与 persistence 测试 GREEN。

### 增量 5：组合纵向探针

挂载 Agent loop、system prompt、model selection、JSONL persistence 和一个合成插件 registration。在 `agent/prepare-step` 中选择不同模型并追加必需插件决策事件。证明：

- 当前已领取消息在 assembly 前驱动决策；
- assembly 与 `agent/request` 观察到同一选择 route；
- `reject` 不发生 assembly 与模型调用；
- 必需插件事件在已注册时能 flush 并冷加载；
- 插件 registration 缺失或不兼容时，冷加载以精确诊断 fail closed。

### 增量 6：验证与证据

每次行为修改后运行聚焦测试，然后运行 DSH typecheck、lint、文档同步检查和相关完整测试集。把精确 fork commit 与测试证据记录到 `docs/dsh-integration.md` 和 `PROJECT_STATUS.md`。不得把阶段 0C 标为可用：A3p、阶段 A 最小证据切片和 A5p 仍未关闭。

## 验证命令

使用从 DSH 根目录确认的仓库本地命令：

```bash
pnpm exec vitest run \
  packages/core/agent-loop/tests/interception.spec.ts \
  packages/core/agent-loop/tests/resume.spec.ts \
  packages/core/session/tests/session.spec.ts \
  packages/core/scope/tests/invariant.spec.ts \
  packages/session/session-persistence/tests/persistence.spec.ts \
  packages/session/session-persistence-jsonl/tests/jsonl.spec.ts
pnpm typecheck
pnpm lint
pnpm doc-sync
```

修改公共事件或 package 契约时，还必须通过实施期间发现的生成文档/catalog 命令。

## 执行结果

已于 2026-08-15 在维护者 fork 分支 `codex/auto-mode-host-contracts` 的 commit [`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243) 完成。

- A1 在 inbox claim 后、prompt assembly 前 dispatch `agent/prepare-step`；契约测试覆盖顺序、冻结的已领取消息、拒绝、取消以及 assembly/request route identity。
- A2 注册 effect-scoped required-event namespace，在 append 与冷读取时校验 payload，持久化精确 namespace/version identity，并在 registration 缺失、畸形、不兼容或未声明时 fail closed。
- 组合 JSONL 探针在 assembly 前选择 route，持久化必需插件事件；未注册时拒绝冷读取，恢复精确 registration 后成功读取。
- 验证通过：受影响的 Agent-loop、Session、scope、memory persistence 与 JSONL persistence suite 共 402 项测试；`pnpm typecheck`；`pnpm lint`；以及 `pnpm doc-sync` 的全部 28 项 gate。

本次以一项集成 Host 契约改动提交，因为公共 catalog、共享 persistence contract 与纵向探针共同描述同一兼容边界。A1/A2 仍应作为两项独立上游改动提交评审。该结果只关闭 fork 实施任务；不关闭 A3p、阶段 A 准入、A5p 或官方 DSH 兼容。

## 风险与控制

| 风险 | 控制 |
|---|---|
| 移动现有 `agent/pre-step` 破坏 consumer | 新增 preparation 事件，不重排或削弱现有 pre-step 消息重写 |
| Route 变化使 prompt assembly 与 request 分裂 | 复用 `installModelSelection()` snapshot；纵向测试比较 assembly 与 request |
| 插件 schema 变化静默重解释旧日志 | 持久化 namespace/version identity，并在每次冷读取时校验 |
| 插件卸载导致已有日志不可读 | 用 missing-plugin 诊断 fail closed；绝不把规范性事件标为 ignorable |
| 注册冲突变成加载顺序依赖 | 确定性拒绝重复 namespace 与内置 event type |
| Validator 转换持久状态 | 忽略 parser 输出，保留原始已校验 JSON snapshot |
| 范围扩张到 Auto Mode policy | Contract test 与代码只使用合成的产品无关 fixture |

## 明确不做

- 实现 Routing Policy、Task Assessment、Policy Pack、A3p、A5p、RouterBench 准入或 Auto/manual UI。
- 上游接受前宣称兼容官方 DSH。
- 增加 turn 内切换、恢复或 child-agent routing。
