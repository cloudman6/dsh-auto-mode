<!--
translation-source: docs/decisions/0011-bind-host-routes-to-aa-evidence.md
translation-source-blob: 01ad970c749101faf4e8ceeb664602b3994075d3
translation-status: current
-->

# ADR-011：把 Host route identity 绑定到 AA 证据

[English](../../decisions/0011-bind-host-routes-to-aa-evidence.md)

## 状态

Accepted

取代 ADR-010，成为 MVP 后产品方向。本文保留 ADR-010 的 AA 驱动路由、Light/Standard/Deep 处理级别、确定性 Host 决策权、价格优先解析、可选 RouterBench 和产品声明限制；仅替换 route-to-AA identity 契约以及由旧契约派生的阶段 1A 工作。

## 日期

2026-08-21

## 背景

ADR-010 要求每次 AA 匹配都使用模型家族、语义版本、变体和显式 effort。这个结构能描述当前 DeepSeek fixture，但不是稳定的行业模型。不同 provider 暴露不同模型变体、零个或多个推理控制，以及其他会影响能力、价格或延迟的请求选项。把 `variant` 和 `effort` 设为全行业必填字段，会把一个 provider 的产品结构固化成 Auto Mode 架构契约。

Artificial Analysis 已经把被评测的模型／配置组合当作独立记录，并为它们提供独立能力、价格和性能事实。DSH 不需要复制 AA 的模型 taxonomy，但必须保留可执行 Host route 的 identity，并证明哪条 AA 记录为该 route 提供证据。

AA record ID 不能取代 Host route identity。AA 记录是证据对象，不是可执行 provider request。DSH route 可能包含 provider 特定的实际配置，可能使用滚动 provider alias，也可能没有有效 AA 记录。把两种 identity 合并为 AA ID，会隐藏执行差异，并把 alias drift 伪装成证据连续性。

## 决策

把执行 identity 与外部证据 identity 分开。

**Host route identity** 是一个模型调用实际使用的完整 DSH selection。它包含 provider、model，以及所有可能改变执行语义且已由 Host 物化的请求选项的稳定 fingerprint。Reasoning effort 只是某些 provider 拥有的可选维度，不是全行业必填字段。Host route identity 继续作为 availability、capability check、request assembly、persistence、UI projection 和 Manual equality 的权威身份。

**AA evidence binding** 是从一条 Host route identity 到一个冻结 AA snapshot 中一条稳定 AA 模型／配置记录的显式版本化映射。它至少记录：

- Host route identity 与实际配置 fingerprint；
- AA snapshot 与稳定 AA record ID；
- binding rule version 与声明的 match basis；
- 相关 AA release metadata 与已知证据限制。

Binding 是维护数据，不是模糊名称推断。Model name、slug、family label、version、variant、effort 和 release date 在存在时都可以成为 match evidence，但不存在跨所有 provider 的固定必填子集。Binding 不得跨越 Host 已物化的执行差异。不匹配或有歧义的 route 以稳定原因排除，不能从相似名称继承证据。

Snapshot 更新不得把 binding 静默移动到另一条 AA 记录。增加、替换或删除 AA 记录必须形成显式、经过评审的 binding 变更。无 revision 或滚动 provider alias 只有在明确展示“这是语义匹配而非精确部署权重证明”的限制时才能绑定。

AA route catalog 把 DSH 发现的 Host route 与已验证 binding 连接起来，附加 AA capability、price 和 latency 事实，并把每条 eligible route 分配到恰好一个带版本的 Light、Standard 或 Deep capability band。处理级别仍属于 Host Policy，不是 effort alias，也不是 AA 固有分类。Resolver 继续在请求档位内依次按更低 AA price、更低 AA latency 和稳定 Host route identity 选择。

因此，阶段 1A 要用混合 provider fixture 建立 Host route identity 与 AA evidence-binding 契约。当前六个 DeepSeek model/effort 组合只是一组 fixture，不是 catalog schema，也不是行业支持数量。

## 考虑过的替代方案

### 保留强制 family/version/variant/effort 键

拒绝。它把 provider 可选概念变成通用必填项，无法自然表达没有 effort 或还有其他控制项的 provider，并会诱导把 effort 与 capability band 耦合。

### 只用稳定 AA record ID 作为 route identity

拒绝。AA identity 无法编码可执行 provider request、Host 物化默认值、provider capability 或滚动 alias drift。它是证据 identity，不是执行 identity。

### 在 runtime 根据名称或 slug 推断 binding

拒绝。展示 identifier 可能变化，相似名称也不能证明配置等价。Runtime 模糊匹配会使路由不确定且不可审计。

### 恢复精确 deployment fingerprint 作为常规要求

拒绝。很多 provider alias 不暴露精确部署权重。显式 binding 可以保留该限制，而不宣称 deployment equality，也不把精确 fingerprint 重新变成常规发布 gate。

## 后果

- 增加拥有零个、一个或多个 reasoning configuration 的 provider 时，不需要修改 catalog schema。
- Host route 与 AA record 独立可见、可审计。
- AA record 或 provider route 变化时，维护者必须评审显式 binding 变更；取消自动 latest-row 替换。
- 混合 provider fixture 必须证明可选和额外执行维度不会发生 identity collision。
- 当前 DeepSeek route 仍可把 family、version、variant、effort 和 release metadata 作为声明的 match evidence，但这些字段不是行业通用键。
- ADR-010 保留为取消 Benchmark admission 的历史依据；ADR-011 是当前 MVP 后 routing-identity 决策。
- ADR-001、ADR-003、ADR-004、ADR-005、ADR-007 和 ADR-009 在各自 authority、documentation、recovery、delegation 和 effect-safety 边界内继续有效。
