<!--
translation-source: docs/aa-snapshot-maintenance.md
translation-source-blob: 8a96edac8522f746c80d6ad57de5a072528b8636
translation-status: current
-->

# AA Evidence Pack 维护

[English](../aa-snapshot-maintenance.md)

## 边界

`aa-evidence-pack-refresh/v1` 是仅维护者使用的离线工作流。Runtime 加载一份本地兼容 Evidence Pack，从当前 Host route 派生 Active Catalog，在路由用户任务时绝不调用 Artificial Analysis。

`aa-api-acquisition/v2` 固定官方 `https://artificialanalysis.ai/api/v2/language/models/free` response 与全部分页。Free、Pro 和 Commercial key 都可以返回该 shape；不再需要 Pro-only query 或字段。`AA_API_KEY` 只从服务端环境读取，不进入 acquisition artifact、Evidence Pack、stdout、browser 或 Git。

真实机器可读 AA metric 继续保持 `internal-only`。公开分发仍需一份可外部审计的书面 grant，同时覆盖机器可读分发与本 model-selection 产品。新的 packaging 与自动更新机制不授予或绕过这些权利。

## Artifact 模型

一份 Evidence Pack 包含：

- `aa-snapshot/v3`：完整 Free-shaped acquisition 中全部 policy-eligible record，最小化为稳定 identity、display metadata、Intelligence、原始 input/output/cache-hit 价格、cache 替代依据、归一化价格、可为 null 的 latency 与 source fact；
- `aa-binding-registry/v1`：provider normalization rule、可选 stable-ID `aaRecordMappings` 与长期精确 EvidenceRouteKey-to-record binding；
- `aa-route-policy/v2`：field choice、methodology、band、missing-data behavior、`aa-price-normalization/v1` 与 ordering；
- `aa-evidence-pack-manifest/v1`：组件 digest、`aa-evidence-pack-runtime/v2` 兼容性与 rights mode。

归一化价格为 `(7 × effective cache-hit price + 2 × input price + output price) / 10`。存在 AA 报告 cache-hit 价格时，`effective cache-hit price` 使用该值，包括零；缺失时才使用 input 价格。缺少 Intelligence、input 价格或 output 价格的 record 会被隔离。缺失 latency 保持为 null，并在归一化价格相同时排在有测量值之后。

Active Catalog 不落盘。Runtime 根据已安装 Pack 与当前 Host-materialized route 确定性重新编译。Binding 根据当前事实显示为 active、dormant 或 quarantined。

所有私有输入输出必须留在一个已存在且被 Git 忽略的 root（如 `local/`）内。文件边界拒绝 symlink 和 root 外路径，限制 JSON 大小与复杂度，以 `0600` mode 写入，校验组件与 predecessor digest，原子替换 active Pack，并保留一份已校验 rollback artifact。

## 一次性迁移

准备包含旧 seed、其精确 Host route、provider normalization rule、source fact 与 `{ "mode": "internal-only" }` rights 的私有 JSON 文件，然后执行：

```bash
npm run aa:evidence-pack -- migrate \
  --private-root local \
  --seed local/aa-catalog-seed.json \
  --host-routes local/host-routes.json \
  --rules local/provider-normalization-rules.json \
  --source local/aa-source.json \
  --rights local/aa-rights.json \
  --pack-id aa-pack-migrated-v1 \
  --output local/aa-evidence-pack.json
```

迁移要求每条旧完整配置 binding 命中一条精确提供的 Host route，并通过恰好一条 provider rule 推导更窄 key。只有引用同一 AA record 时，两条旧 route 才能 collapse；冲突 key fail closed。现有 Session 不会被改写，继续保留其原始冻结事实。

## Refresh

把用户自有 key 加载进当前 shell 且不打印，然后用 bounded Evidence Pack command 获取完整 Free response：

```bash
AA_API_KEY="$(sed -n 's/^AA_API_KEY=//p' .env.local)"
export AA_API_KEY

npm run aa:evidence-pack -- fetch \
  --private-root local \
  --output local/aa-acquisition.json
```

该命令只输出 `capturedAt`、页数和状态。`.env.local`、acquisition 数据、prepared report、active Pack 与 rollback artifact 必须保留在被忽略的私有路径，文件 mode 为 `0600`。

新 Free Pack 使用的 source 文件记录 methodology `v4.1.1`、attribution `Source: Artificial Analysis (artificialanalysis.ai)`，以及已评审的一般 Terms of Use version `1.0`、修订日期 `2024-04-28` 和 URL `https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf`。除非另行满足 ADR-013 written grant，rights 文件继续使用 `{ "mode": "internal-only" }`。

准备新 Pack：

```bash
npm run aa:evidence-pack -- prepare \
  --private-root local \
  --current local/aa-evidence-pack.json \
  --acquisition local/aa-acquisition.json \
  --source local/aa-source.json \
  --rights local/aa-rights.json \
  --host-routes local/host-routes.json \
  --snapshot-id aa-snapshot-YYYY-MM-DD \
  --pack-id aa-pack-YYYY-MM-DD \
  --output local/aa-evidence-pack.prepared.json
```

Prepare 只在 stdout 输出 classification 与 status；metric 和 impact report 留在私有 prepared file 内。

分类前，`aa-binding-candidate-compiler/v1` 会独立于当前 Host route 处理每项显式 `aaRecordMappings` 声明。如果声明的稳定 AA record 存在且精确 EvidenceRouteKey 空闲，refresh 会自动加入一条可长期 dormant 的 binding。完全相同的 binding 会被复用。缺失 record、跨 rule 歧义以及与现有 binding 的冲突会被报告和隔离，绝不替换 evidence。Name、slug、similarity、discovery order 和 latest-record guess 都不是 candidate input。因此常规 AA refresh 无需用户操作；真正新增的 provider/AA identity 关系仍必须通过已评审精确 rule 声明，而不是不安全推断。

- `GREEN`：stable-ID 不变的 metric/display 变化、unbound record 增减、精确结构化 binding 生成和普通仅执行变化。Candidate 可自动应用。
- `AMBER`：bound 或已声明 record 缺失、candidate 声明冲突/歧义、不完整 eligible row、当前 Host route unbound 或 normalization exception。有效 Pack 前进，受影响 binding/route 被 quarantine 或排除，不阻断无关 route。
- `RED`：methodology、source schema、rights、stable-ID、compatibility 或 digest contract 变化。不产生 candidate Pack，无法 apply。

无需 approval token，直接应用有效 GREEN 或已隔离 AMBER 更新：

```bash
npm run aa:evidence-pack -- apply \
  --private-root local \
  --prepared local/aa-evidence-pack.prepared.json \
  --current local/aa-evidence-pack.json \
  --rollback local/aa-evidence-pack.previous.json
```

Apply 在写 rollback 与 active file 前重新校验 prepared digest、全部组件 digest、Runtime compatibility、rights equality 与精确 predecessor。Stale 或 tampered update 保持 active Pack 不变。

恢复保留的 predecessor：

```bash
npm run aa:evidence-pack -- rollback \
  --private-root local \
  --current local/aa-evidence-pack.json \
  --rollback local/aa-evidence-pack.previous.json
```

## Runtime 配置

使用 inline `evidencePack` 或私有路径：

```yaml
mode: auto
evidencePackPath: ./local/aa-evidence-pack.json
```

旧 `seed` 与 `seedPath` 为迁移和历史兼容继续可读。有效 runtime-v1 Pack 会先被严格校验，再确定性适配到 Snapshot v3 / Route Policy v2，并标记 `legacy-aa-blended` 来源；不会编造任何组成价格。新安装应使用 Evidence Pack 路径。Runtime 在 assessment 或用户任务 dispatch 前拒绝其他不兼容或 tampered Pack。

## 验证

```bash
npm test
DSH_FORK_ROOT="$HOME/deepseek-harness/.worktrees/auto-mode-host-contracts/workspace" \
  node --test test/dsh-loader.test.mjs
```

测试覆盖 Free pagination 与 tier、受限不可信 response、credential redaction、全分页保留、不完整排除、精确价格推导与 cache fallback、stable-ID collision、确定性 serialization、组件 tamper、EvidenceRouteKey 分离、dormant activation、quarantine、归一化价格优先排序、GREEN/AMBER/RED classification、原子 apply、rollback、v1-to-v2 migration、Loader composition、cold Session reconstruction、effective-request equality、UI projection compatibility 与 Manual 非干扰。
