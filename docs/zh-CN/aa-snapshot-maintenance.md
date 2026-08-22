<!--
translation-source: docs/aa-snapshot-maintenance.md
translation-source-blob: 8b879ad1c0627e0e4e2875b45dde93f0856b8739
translation-status: current
-->

# AA snapshot 维护

[English](../aa-snapshot-maintenance.md)

## 状态与边界

这个仅供维护者使用的工作流在 DSH runtime request path 之外实现 `aa-snapshot-refresh/v1`。Auto 继续读取一份冻结的本地 seed；路由用户任务时绝不调用 Artificial Analysis。

适配器使用官方 Pro language-model endpoint，因为 Free endpoint 缺少 `aa-route-policy/v1` 所需的 blended-price 字段。它把 endpoint 固定为 `https://artificialanalysis.ai/api/v2/language/models`，设置 `prompt_type=medium`，只从服务端环境读取 `AA_API_KEY`，并遵循文档规定的分页 envelope。稳定 AA model 与 creator ID 是 binding key；名称和 slug 仅用于显示。

官方依据：

- [Artificial Analysis Data API 文档](https://artificialanalysis.ai/data-api/docs)
- [Artificial Analysis Data API 套餐](https://artificialanalysis.ai/data-api)
- [Artificial Analysis Terms of Use](https://artificialanalysis.ai/docs/legal/Terms-of-Use.pdf)
- [Artificial Analysis Data Platform Terms v1.1](https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf)

本文记录工程控制，不构成法律意见。按已评审的 Data Platform Terms v1.1，不得再分发真实原始或结构化机器可读 AA 数据；主要目的包含 model 或 provider 选择的第三方产品需要事先书面同意。维护者授权使用 API 不等于获得这项同意。

因此默认权利模式是 `internal-only`。真实 acquisition、candidate snapshot、active seed、rollback seed、credential 和授权文件均保存在被 Git 忽略的 `local/` 目录，不进入浏览器 client。CLI stdout 绝不包含 AA record、metric 或完整 report；这些内容留在 mode `0600` 的私有文件中。`written-license` 模式还要求填写外部授权依据，并明确声明授权覆盖机器可读分发和 AA 驱动的模型选择产品。授权文件本身不得进入 Git。

原始 acquisition 只保留完成 candidate 评审和复现所需的最短时间。当前条款要求相关订阅结束后 30 天内删除 raw Data 及 raw Data file 的全部副本。除非 AA 的书面授权另有说明，应保守地把 acquisition 和任何保留可单独识别 AA metric 的本地 export 视为 raw Data；即使本地 seed 在运行上仍有用，这个期限也适用。删除由维护者明确执行，因为工具不会猜测订阅状态，也不会自动删除本地证据。

## 私有文件

首次更新前创建私有目录：

```sh
mkdir -p local
chmod 700 local
cp examples/aa-refresh-manifest.example.json local/aa-refresh-manifest.json
cp examples/aa-binding-plan.example.json local/aa-binding-plan.json
cp examples/host-routes.example.json local/host-routes.json
chmod 600 local/aa-refresh-manifest.json local/aa-binding-plan.json local/host-routes.json
```

替换所有 placeholder。`host-routes.json` 是当前 Host 实际 materialize 的完整 route inventory。不要手算 identity，使用命令生成评审 inventory：

```sh
npm run aa:snapshot -- identify \
  --private-root local \
  --host-routes local/host-routes.json \
  --output local/host-route-identities.json
```

评审 `local/host-route-identities.json`，再把每条所需 route 的 ID 和 effective-configuration fingerprint 复制到 binding plan，并指向一个稳定 AA record ID。不同 effort 或任何其他实质 request control 都属于另一条 Host route，不能静默复用 binding。Identity inventory 按 Host route ID 确定性排序，以 mode `0600` 写入；stdout 只包含 route 数量和状态。

所有 CLI 输入输出都必须位于 `--private-root` 内，目标的父目录必须已经存在。Prepare 的每个输入及其 candidate 输出必须解析为不同的真实路径；apply 的 candidate、active 和 rollback 路径也必须互不相同。Symlink target、越界路径、大于 16 MiB 的文件、过深或节点过多的 JSON、畸形 JSON、重复 option 和未知 option 都会 fail closed。私有输出以 mode `0600` 原子替换。

## 更新流程

### 1. 获取

把 API key 载入进程环境，不要放入命令参数或仓库文件，然后获取固定分页 endpoint：

```sh
npm run aa:snapshot -- fetch \
  --private-root local \
  --output local/aa-acquisition.json
```

请求会拒绝 redirect、非 JSON 或非 200 响应、超过 16 MiB 的页面、过深或节点过多的 JSON、超过 100 页、畸形分页，以及非 Pro／Commercial tier。错误不会包含 key 或响应 body。

### 2. 只准备，不修改

在 manifest 中设置新的唯一 `snapshotId`，并评审当前 Host routes 和 binding plan。然后生成 candidate：

```sh
npm run aa:snapshot -- prepare \
  --private-root local \
  --acquisition local/aa-acquisition.json \
  --manifest local/aa-refresh-manifest.json \
  --binding-plan local/aa-binding-plan.json \
  --host-routes local/host-routes.json \
  --current local/aa-catalog-seed.json \
  --candidate local/aa-candidate.json
```

Prepare 会固定已评审 terms、attribution、API Intelligence Index version、完整 `v4.1.1` capability methodology、freshness limit 和 rights mode。它只复制被绑定的 record，并且只复制稳定 identity、显示 metadata、Intelligence Index、7:2:1 blended price 和 median time to first answer token。缺少或不完整的 bound record 会拒绝整个 candidate；不完整且未绑定的 source record 会被忽略。

当 acquisition、manifest、binding plan、Host routes 和 predecessor seed 相同时，prepare 会生成相同 candidate digest。当前 wall clock 只用于 freshness 校验，不进入 digest。

### 3. 评审

Prepare 命令把结构化报告写入 `local/aa-candidate.json`，stdout 只输出 candidate snapshot ID、digest 和状态。应在本地评审私有 candidate 文件，不要把 report 复制到公开 CI log、chat 或 issue。报告覆盖：

- source-policy metadata 的 before/after，包括 terms、attribution、methodology、freshness 和 rights mode；
- record 新增、删除、改名和 metric 变化；
- binding 新增、删除和稳定 record 替换；
- Light/Standard/Deep 档位变化；
- 更新前后的价格／延迟／稳定 route 排序。

如果还不理解 Host identity、稳定 AA record、score methodology、price 字段、latency 字段、权利依据或最终排序中的任何变化，就不得批准。Prepare 绝不修改 active seed。

### 4. 应用已评审 digest

从已评审输出中复制准确的 `sha256:...` digest：

```sh
npm run aa:snapshot -- apply \
  --private-root local \
  --candidate local/aa-candidate.json \
  --current local/aa-catalog-seed.json \
  --rollback local/aa-catalog-seed.previous.json \
  --approve sha256:replace-with-reviewed-digest
```

Apply 会重新校验 candidate 和 digest，验证 active seed 仍然是已评审的准确 predecessor，把 predecessor 及其确定性 digest 原子保存到版本化 rollback envelope，再原子替换 active seed。Predecessor 已变化、candidate 被修改、digest 错误或 seed 无效，都不会修改 active seed。

### 5. 回滚

如果 apply 后校验失败，恢复已保存 seed：

```sh
npm run aa:snapshot -- rollback \
  --private-root local \
  --current local/aa-catalog-seed.json \
  --rollback local/aa-catalog-seed.previous.json
```

Rollback 会验证 envelope 和已保存 seed 的 digest，再原子恢复 seed，且不删除 rollback copy。格式错误或 checksum 不匹配的 rollback 文件不会修改 active seed。无论是应用还是恢复 seed，都必须重新运行 catalog、policy、plugin、Session 与 UI 检查后才能视为可用。

## 版本与 schema 停止条件

当 AA endpoint、tier、pagination、Intelligence Index version、必要 policy 字段、terms version、attribution 或 rights assertion 变化时，refresh 会有意停止。这类停止需要重新评审来源并形成新的版本化决策；不得通过编辑 fetched data 或弱化校验绕过。

Git 中只允许合成的 AA 形状 fixture 和 placeholder example。每次提交前检查 staged files 中是否存在真实 AA 数据、`AA_API_KEY`、`.env`、授权文件、账户数据或原始响应。
