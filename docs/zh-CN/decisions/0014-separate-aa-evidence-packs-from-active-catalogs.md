<!--
translation-source: docs/decisions/0014-separate-aa-evidence-packs-from-active-catalogs.md
translation-source-blob: 42c781d88567cfc89c1de16c840e4a3e8c8b11c0
translation-status: current
-->

# ADR-014：将 AA Evidence Pack 与运行时 Active Catalog 分离

[English](../../decisions/0014-separate-aa-evidence-packs-from-active-catalogs.md)

## 状态

Accepted

本决策只取代 ADR-011 的完整 effective configuration binding key 和 snapshot-scoped binding 契约，以及 ADR-013 的仅保留当前 Host 记录和每次有效 metric refresh 都必须人工批准的规则。ADR-011 对执行 identity 与证据 identity 的分离，以及 ADR-013 的获取、权利、凭据、校验、原子性和 rollback 边界继续有效。

## 日期

2026-08-22

## 背景

已完成的 catalog 把一个完整 Host effective-configuration fingerprint 绑定到一个 snapshot 中的一条 AA record。已完成的 refresh workflow 随后只保留当前 Host inventory 的 binding 所引用的记录。这种方案可审计，但它把普通的仅执行默认值变成 evidence identity 的组成部分，也使已评审 mapping 无法在用户日后添加对应 provider/model/reasoning route 前保持 dormant。

AA metric refresh 与 Host execution-config 变化是两种不同事件。Score、price、latency 或 display name 更新不应要求重建稳定 route mapping。同样，修改 `maxTokens`、`temperature` 或其他仅执行默认值，应继续出现在请求审计中，但不应使相同被评测模型配置的证据失效。反过来，不同 model、reasoning mode、带日期 variant 或其他决定 AA record 的控制项，绝不能只因显示名称相似就继承证据。

Runtime 也不应在每次正常 AA 更新后要求人工介入。语义例外、权利变化、方法论变化和有歧义的新 mapping 仍然需要人工评审；但确定性的仅 metric refresh 应自动更新有效证据，同时保留 rollback 能力。

## 决策

将维护的 AA 证据打包为一个带版本的 **Evidence Pack**，包含四个独立版本化的部分：

1. **AA Snapshot**：包含固定 acquisition 中全部 policy-eligible records，并最小化为产品消费的稳定 identity、展示 metadata、capability、price、latency 和 source-policy 字段。
2. 长期 **Binding Registry**：把精确 `EvidenceRouteKey` 映射到一个稳定 AA record ID。Binding 不引用某个 snapshot ID，并且在当前没有 Host route 使用它时可以保持 dormant。
3. 带版本的 **AA Route Policy**：定义 eligibility 字段、方法论、Light/Standard/Deep 边界、缺失数据行为和 price/latency 排序。
4. **Evidence Pack Manifest**：把各组件版本和 digest 绑定到一个兼容 Runtime 契约及适用的 rights mode。

### 证据 identity 与执行 identity

`EvidenceRouteKey` 是带 provider scope 的规范 identity，只包含决定哪条 AA evaluated record 适用的请求维度：

```ts
interface EvidenceRouteKey {
  schemaVersion: 1
  providerNamespace: string
  modelKey: string
  evidenceControls: Readonly<Record<string, string | number | boolean>>
}
```

`providerNamespace` 和 `modelKey` 来自带版本的 provider normalization rule。`evidenceControls` 只包含能区分该 provider 不同 AA evaluation record 的控制项，例如 reasoning mode、带日期 model variant 或其他已显式声明的被评测配置。不存在跨 provider 的通用必填 control。Key 使用规范字段顺序和精确相等；继续禁止 runtime fuzzy matching。

现有完整 `ExecutionFingerprint` 继续覆盖每一个 Host-materialized request option，并继续作为 assembly/request equality、Session audit、cold reconstruction、capability validation 和 Manual equality 的权威依据。Temperature、token limit、stop sequence、credential reference 和 transport default 等仅执行控制项不进入 `EvidenceRouteKey`，除非带版本的 provider rule 能明确证明该 control 会选择不同的 AA evaluated record。

### Binding Registry

每条 binding 记录 key、稳定 AA record ID、rule version、match basis 和 limitations。Availability 是派生状态而非存储状态：当前 materialized Host route 产生相同 key 时 binding 为 active；没有时为 dormant；refresh validation 发现语义完整性异常时为 quarantined。当一条新的 Host route 已有完全一致的有效 binding，且当前兼容 snapshot 中存在对应 AA record 时，它自动成为 eligible。

Provider normalization rule 只能根据结构化、带版本且唯一匹配的 identity 字段自动创建或确认 binding。Name、slug、similarity score、discovery order 或猜测的 latest record 都不能创建或替换 binding。没有确定性 binding 的 AA eligible record 仍保留在 snapshot 中，作为 unbound evidence，但不能进入 Active Catalog。

### 运行时 Active Catalog

**Active Catalog** 绝不是需要维护的发布制品。Runtime 按以下关系确定性派生：

```text
当前 Host-materialized routes
  与 Binding Registry 精确 key 的交集
  与当前兼容 AA Snapshot records 的交集
  再由当前 AA Route Policy 过滤和排序
```

每条 active entry 同时保留 evidence key 和完整 execution fingerprint。缺失、格式错误、unbound、quarantined、不兼容或 Host-invalid route 获得稳定 exclusion，不使无关 route 失效。Runtime 绝不调用 AA。

### 例外驱动 refresh

Refresh 在发布前把 prepared update 分类：

- **GREEN**：metric 变化、stable ID 不变的 display 变化、unbound record 增减、dormant/active 状态变化，以及仅执行 Host 变化。完全有效的 GREEN update 可以自动、原子应用。
- **AMBER**：已绑定 record 消失、新 route 缺少 binding，或一条 record 无法唯一 normalization。有效 snapshot 和 registry 内容可以前进，但受影响 record 或 binding 被隔离并报告为 unbound 或 quarantined。
- **RED**：source schema、固定 methodology、terms/rights contract、stable-ID integrity、manifest compatibility 或 digest validation 发生非预期变化。拒绝更新，继续使用上一份有效 Evidence Pack。

Updater 为每个类别生成确定性的组件报告和 Active Catalog 影响报告。自动应用绝不能授予分发权利、静默改变 binding 的稳定 AA record，或弱化 RED 条件。

### 打包与分发

Runtime 和 Evidence Pack 独立版本化，但共享一个兼容性契约。Installer 可以向用户提供一个更新动作，但必须先验证完整兼容组合，再原子激活，并保留上一份有效组合用于 rollback。因此，仅 AA metric 变化时可以只更新 Evidence Pack，不需要发布 Runtime。

真实 AA records 保持 `internal-only`，除非满足 ADR-013 的 written-license gate。公开 Runtime 制品不得内嵌、绕过获取或以其他方式规避该 gate。Credential、raw acquisition、review material、rollback envelope 和 grant document 继续留在 browser client 与公开 package 之外。

## 考虑过的替代方案

### 保持 binding 以一份完整 effective configuration 为 scope

拒绝。它会让无关执行默认值使可复用证据失效，也阻止 dormant mapping 为未来 Host configuration 激活。

### 把所有 AA records 和 bindings 放进一个生成 catalog

拒绝。它把稳定 mapping 与易变 metric 和当前 Host availability 耦合，使每次 refresh 都重写实际上没有变化的概念。

### 按 model name 或 slug 自动绑定所有 AA record

拒绝。展示 metadata 不是稳定的跨 namespace identity，无法证明 AA 评测的是哪个 provider request configuration。

### 要求人工批准每一个 refresh digest

对于结构有效的 GREEN 变化，拒绝该方案。强制常规批准不会增加语义证据；确定性分类、原子替换、保留报告和 rollback 才是相关控制。AMBER mapping decision 与 RED contract change 继续要求人工评审。

### 在 runtime 查询 AA

拒绝。它会保留 ADR-013 已经拒绝的 availability、credential、latency、drift 和历史重建问题。

## 后果

- 用户可以在安装后添加一条 Host route；只要已经存在精确 dormant binding，它就自动获得 Auto eligibility。
- 常规 AA score、price、latency 和 stable-ID 不变的 rename 更新，不再要求重写 binding，也不再要求例行人工批准。
- 项目必须维护 provider-specific normalization rules；当 provider 或 AA 没有提供可靠共同 identity 时，不能承诺自动支持。
- 现有 schema-v1 catalog seed 需要显式迁移路径；旧 Session 保留其冻结 evidence 与 execution facts。
- Snapshot 大小由 policy eligibility 和维护文件上限约束，而不是由当前 Host inventory 约束。
- 即使 package 技术上已经就绪，没有 ADR-013 要求的书面 grant，仍然不能公开分发真实 Evidence Pack。
- Phase 5 adaptive execution 应在本 catalog foundation 被接受并实现后再启动，以免 escalation 继续依赖已过时的 binding identity。
