<!--
translation-source: docs/phase-0p-fast-prototype.md
translation-source-blob: 9d2788351dfc9b55997dad5c2e05b4542eefb2e1
translation-status: current
-->

# 阶段 0P 快速原型

[English](../phase-0p-fast-prototype.md)

## 状态

已于 2026-08-17 基于维护者 DSH fork `801ded7f60a0dfab07b9690cb9d98fce6234d243` 完成实施与验证。

这是仅限维护者的 `experimental-unadmitted` 原型，只证明 Auto 交互和请求路由闭环。它不宣称安全、质量提升、RouterBench 准入、不可变 deployment identity、公开支持或官方 DSH 兼容。

## 验收边界

原型只有四项验收标准：

1. 用户可以选择 `auto`；省略 mode 或选择 `manual` 时不改变路由。
2. 不同任务文本选择不同的完整 provider/model/reasoning-effort 配置。
3. 持久化的 `dsh-auto-mode/selection` 事件与实际 `request/header` 配置一致。
4. Manual 模式不增加 selection 事件，也不修改已配置请求。

不能直接证明或维持其中一项标准的工作一律推迟。生产级证据合同、数据权利自动化、签名、credential binding、revocation ledger、Session egress 控制、certificate、复杂恢复和准入均不属于本原型。

## 运行时结构

插件是位于 `src/plugin.mjs` 的零依赖 Cordis 模块，使用固定 Host 已有的 seam：

- 一个 turn 的首个 `agent/prepare-step` 对当前任务分类并选择完整本地 route；该 turn 后续的 tool-result step 复用同一选择。
- `system-prompt/assemble` 冻结该选择，并把所选 provider/model 暴露给 prompt variables。
- `agent/request` 应用同一个已冻结 provider/model/reasoning effort。
- A2 `registerEventNamespace()` 校验必需的 `dsh-auto-mode/selection` Session 事件。

确定性策略刻意保持简单：

- 安全、并发、架构、迁移、事故和数据丢失信号 → `strong`；
- 格式、错别字、README、重命名、定位/查找和总结信号 → `fast`；
- 其他任务 → `standard`。

信号重叠时 `strong` 优先。档位映射缺失或无效时，使用已配置的固定强模型 fallback。档位名称只是启发式，不是质量保证。

## 本地 AA seed

把 `examples/aa-seed.example.json` 复制到 `local/aa-seed.json`，手工录入当前看到的 Artificial Analysis record，以及你选择与之关联的精确 DSH selection。`local/` 已被 Git 忽略。插件不获取 Artificial Analysis 数据，也不再分发这些数据。

每个 route 包含一项完整选择：

```json
{
  "provider": "deepseek-official",
  "model": "deepseek-v4-flash",
  "reasoningEffort": "off"
}
```

原型把这项关联视为维护者断言。它不证明无 revision 的 DSH alias 就是 Artificial Analysis 测量的同一 deployment。

## Loader 配置

把插件加入已经提供 DSH Session 服务的 Loader tree：

```yaml
- id: auto-mode
  name: './path/to/dsh-auto-mode/src/plugin.mjs'
  config:
    mode: auto
    seedPath: './path/to/dsh-auto-mode/local/aa-seed.json'
```

设置 `mode: manual` 或省略 `mode`，即可在不加载 seed 的情况下保留 DSH 已配置请求。

## 验证

运行零依赖单元测试：

```bash
npm test
```

针对固定 fork 运行真实 Loader 组合测试：

```bash
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" npm test
```

Loader 测试通过真实 DSH composition 证明 Auto fast/strong 分流、事件/header 一致和 Manual 不受影响。2026-08-17 还完成了两次带 credential 的实际 provider 调用：

| 任务信号 | Selection 事件 | Request header | Provider 结果来源 |
|---|---|---|---|
| 有界格式任务 | `deepseek-official / deepseek-v4-flash / off` | 相同 | `deepseek-official / deepseek-v4-flash` |
| 认证竞态条件 | `deepseek-official / deepseek-v4-pro / max` | 相同 | `deepseek-official / deepseek-v4-pro` |

这些调用只证明 dispatch，不证明模型质量或本地 AA 关联正确。
