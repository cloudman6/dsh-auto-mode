<!--
translation-source: docs/evidence/phase-0p-route-inventory.md
translation-source-blob: b5b76a1783b45e7b87db3fac076004ccfde96568
translation-status: current
-->

# 阶段 0P 精确 route 清单与 A3p 证据

[English](../../evidence/phase-0p-route-inventory.md)

## 证据状态

本证据于 2026-08-16 为 DSH Auto Mode 阶段 0P 冻结。它只适用于维护者 fork commit [`801ded7f60a0dfab07b9690cb9d98fce6234d243`](https://github.com/cloudman6/deepseek-harness/commit/801ded7f60a0dfab07b9690cb9d98fce6234d243) 与 DeepSeek 公共 endpoint `https://api.deepseek.com`。

初始精确匹配集合为空。DSH 清单包含六条显式 DeepSeek V4 Flash/Pro selection，但其无 revision 的 pass-through alias 不能绑定 Artificial Analysis 测量的带版本 deployment。在带版本 selector 与 provider 专用 deployment identity 产生非空精确交集前，阶段 0P 必须返回 `no-experimental-route`。

## DSH 证据 envelope

已审计的官方 DSH commit 是 `47f943859bef60e4160492346772ded9b24f765a`；上述固定 fork commit 携带 A1/A2。这两个 commit 中的 provider 实现与 composition 文件逐字节相同：

| 文件 | Git blob |
|---|---|
| `packages/llm/llm-deepseek/src/adapter.ts` | `5fa62d30ff8cde0f170798fdbc982905291f383c` |
| `packages/llm/llm-deepseek/src/index.ts` | `8d01d9d6bc58aec19be1580c0d8d030e264056ee` |
| `packages/llm/llm-deepseek/src/serialize.ts` | `34fa214bb981865a016378e87bc635b907505e26` |
| `packages/llm/llm/src/index.ts` | `e87c428d060305e416747adac386058d24d8e37d` |
| `packages/bundle/base/cordis.patch.yml` | `e9567d9206e5b8c64b40cf76b88619f383f2269e` |
| `examples/headless-agent/cordis.yml` | `bb75f55b98cbdd3417bdc8df8185fbba61e3577c` |

原生 adapter 注册 `deepseek-official`，公布 `deepseek-v4-flash` 与 `deepseek-v4-pro`，把 model identifier 原样发送到协议，并为精确模型发现公开 `off`、`high` 与 `max`。DSH 在 dispatch 前把省略的 caller effort 解析为 adapter default。Serializer 把显式 `off` 发送为 `thinking.type: disabled` 并省略 `reasoning_effort`；`high` 与 `max` 发送 `thinking.type: enabled` 以及同名顶层 `reasoning_effort`。

发布的 base composition 挂载 pi-ai adapter，但在维护者 settings 添加 profile 前保持零 route。因此已安装 pi-ai catalog 条目不能证明 active route，不在本清单内。

## 规范 identity 与 fingerprint

Selection fingerprint 是对下列 key 顺序的 compact UTF-8 JSON 计算 `sha256`。`wire.reasoningEffort: "omitted"` 是 identity 标记；实际 provider request 中不存在该属性。

```json
{
  "schema": 1,
  "adapter": "@deepseek-ai/dsh-llm-deepseek",
  "adapterVersion": "0.1.0-rc.5",
  "endpoint": "https://api.deepseek.com",
  "provider": "deepseek-official",
  "model": "deepseek-v4-flash",
  "reasoningSelection": { "kind": "explicit-effort", "effort": "off" },
  "wire": { "thinkingType": "disabled", "reasoningEffort": "omitted" }
}
```

该 fingerprint 证明证据 envelope 下规范化 DSH selection 与 request encoding。它不证明模型质量、不可变 server weights、opaque provider alias 背后的 identity 或 RouterBench admission。任务 6、7 与 11 必须持久化并比较有效 request 与 provider 专用 deployment identity 或 attestation，让 alias 或 endpoint 漂移 fail closed。如果 provider 不能提供比 alias 更强的 binding，该 route 保持排除并返回 `no-experimental-route`。

## 外部 record 对比

2026-08-16 检查的 Artificial Analysis 公共页面，对 model revision 与 reasoning configuration 的区分比 DSH alias 更精确。Non-reasoning Flash record 标识 0420 deployment，max record 标识 0731 deployment，而 high-effort URL 在 fresh-context review 中没有提供稳定可读取的精确 record。公共 V4 Pro surface 同样混用无 suffix 与 0813 identity。这些页面都不能绑定无 revision DSH selector。

| DSH selection | Selection fingerprint | Artificial Analysis 观察 | 状态 |
|---|---|---|---|
| `deepseek-official/deepseek-v4-flash`，显式 `off` | `sha256:ed4d399c52eebf6b9ead80dc7510388b70eccf4e38b270a69fd8b24215553bfa` | [`deepseek-v4-flash-non-reasoning`](https://artificialanalysis.ai/models/deepseek-v4-flash-non-reasoning) 标识带版本 non-reasoning deployment | 排除：alias 没有 revision binding |
| `deepseek-official/deepseek-v4-flash`，显式 `high` | `sha256:6b12e7ad07de1da5487b761d677b52052515619b1911dadfcd31a56b70196cef` | [`deepseek-v4-flash-high`](https://artificialanalysis.ai/models/deepseek-v4-flash-high) 在 fresh review 中不是稳定可读取的精确 record | 排除：record 与 deployment identity 未验证 |
| `deepseek-official/deepseek-v4-flash`，显式 `max` | `sha256:6298daab213bc1aca67868531a8d999f4863472c7ac99d5effc641b961c392bc` | [`deepseek-v4-flash`](https://artificialanalysis.ai/models/deepseek-v4-flash) 标识带版本 max-effort deployment | 排除：alias 没有 revision binding |

仓库没有复制任何榜单数值。这些链接记录对比证据与排除结论，不建立 route 映射。Source access、稳定 record identifier、字段语义、freshness、attribution、权利与规范 snapshot digest 仍由任务 2 负责。

## 明确排除项

| DSH selection | 排除原因 |
|---|---|
| `deepseek-official/deepseek-v4-pro`，显式 `off`、`high` 或 `max` | 当前 Artificial Analysis surface 的 revision identity 不一致：model page 使用无 suffix 的 V4 Pro 名称，leaderboard 则写作 `DeepSeek V4 Pro 0813`。DSH selector 是 opaque pass-through alias，不提供 revision binding。名称近似不够。 |
| 任何解析为 adapter default 的省略 effort | DSH 把它标记为 adapter-materialized default。Artificial Analysis record 描述显式 non-reasoning/high/max 配置，不描述这种 request-selection 形式。即使有效 wire value 相同，也不能转移分数。 |
| `deepseek-official` 上的 provider-default omission | Direct adapter 会公开并实体化 default effort；解析后的 DSH call 无法到达 provider-default omission identity。 |
| 任何 pi-ai provider/model catalog 条目 | 发布的 adapter 处于 dormant 状态，没有维护者 settings 就不公开 active route。Installed catalog availability 不是 deployment identity。 |
| 任何非公共 endpoint 或发生变化的 adapter version/implementation | 它超出冻结 evidence envelope，需要新的 identity 与映射审计。 |

V4 Pro 的规范 DSH fingerprint 可复现且被排除：`off` 为 `sha256:0ddd5a8d304d7e6563343777eb1461636e50dab28632b7da7365f84f43bb709b`，`high` 为 `sha256:a6479f6160755a14d7216fd93bd3ba333e79e969d91c9f3840c35cda2e1f9123`，`max` 为 `sha256:beb19b48048eb21aec0a3ba04e2dced07a78fcdd388777a1d086ca5a1ff3202e`。

## 复现与检查

从包含固定 fork commit 的 checkout 执行：

1. 用 `git ls-tree <commit> <path>` 核验六个 source/composition blob ID，并确认 official-to-fork path diff 为空。
2. 使用公共 endpoint 且不解析 credential，加载 `LlmRuntime` 与 `@deepseek-ai/dsh-llm-deepseek`。依次枚举 `listProviders()`、`listModels(provider)` 与 `resolveModelInfo(provider, model)`。
3. 对每个发现的显式 effort 构建上述规范 identity，用 `JSON.stringify` 序列化并计算 SHA-256 digest。
4. 运行 probe 两次，逐字节比较完整规范化 JSON。
5. 运行 `pnpm exec vitest run packages/llm/llm-deepseek/tests/adapter.spec.ts packages/llm/llm-deepseek/tests/serialize.spec.ts`。

2026-08-16 的两次 probe 结果逐字节相同；聚焦 DSH suite 在两个文件中通过 103 项测试。Probe 不需要 API key，也未发起 provider request。

## 任务 1 处置

任务 1 已作为 route-selection 清单与排除矩阵完成。六条 DSH 侧显式 identity 可复现，但初始 `ExperimentalRouteCatalog` 为空，A3p 仍开放。只有带版本 selector 加 provider 专用证据把 runtime deployment 绑定到一项被测配置后，route 才能进入 catalog；否则 resolution 返回 `no-experimental-route`。增加带版本 DeepSeek selector、pi-ai route、default encoding、其他 endpoint 或变化后的 adapter，必须建立新证据 revision，不能通过推断扩展本矩阵。
