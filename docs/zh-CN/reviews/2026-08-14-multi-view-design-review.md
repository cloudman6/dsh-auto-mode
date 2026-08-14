<!--
translation-source: docs/reviews/2026-08-14-multi-view-design-review.md
translation-source-blob: e4298026fb920054f58cc884d80d1b0a51451a5b
translation-status: current
-->

# 多视角设计评审——2026-08-14

[English](../../reviews/2026-08-14-multi-view-design-review.md)

## 状态与作用

信息性历史评审记录。它不覆盖规范文档或 ADR。已采纳变更链接到当前权威文档。

## 评审方法

本次评审使用架构（A）、产品/证据评价（B）、对抗红队（F）、用户体验（C）、实施可行性（K）和元评审（Z）等独立 AI pass。最终结论是**修订而非否决**：产品问题与 Host-owned policy 方向成立，但原设计包含缺乏依据的质量、集成、恢复和复杂度主张。

这些 pass 不是统计独立的专家投票。它们共享模型家族 prior 和同一组源文档；共识只能用于确定优先级，不能代替外部验证。

## 已采纳的共识结论

### 质量需要绝对门槛

当已配置 `strong` route 自身失败时，与它相对持平没有意义。修订设计要求基线绝对门槛、候选非劣性区间、不可接受结果上界、留出证据和可撤销准入。参见[路由策略](../routing-policy.md)、[RouterBench](../routerbench.md)和 [ADR-002](../decisions/0002-quality-constrained-optimization.md)。

### 能力证据与策略行为是不同实验

此前设计混合了 model/effort 资格与控制面行为。RouterBench 现在分为 Route Capability Bench 和 Policy Scenario Bench，并以相邻实验组比较 Always Baseline、Session Static Auto、Within-turn Auto 和 Full Auto。参见 [RouterBench](../routerbench.md)和 [ADR-006](../decisions/0006-evidence-governed-route-admission.md)。

### Route 选择必须早于依赖 provider 的组装

只在 `agent/request` 应用 route，可能导致 prompt/tool 组装与有效 provider 不一致。修订架构要求一份冻结 Route Snapshot。源码审计发现 DSH 已有耦合模型选择 helper，但缺少 Auto 所需、携带当前 step 消息的 pre-assembly 语义决策 seam。参见[架构](../architecture.md)和 [DSH 集成](../dsh-integration.md)。

### 恢复主张需要已声明副作用支持

Session 或 Git 边界不能恢复任意文件系统、进程、数据库、API、消息或部署副作用。Recovery Capability 现在约束有修改工作的降级、salvage 和 restart；修改未知或恢复失败会进入显式介入状态。参见[恢复](../recovery.md)和 [ADR-007](../decisions/0007-recovery-capability-gates-recovery-claims.md)。

### 父 Agent 权限必须双向有界

只禁止父 Agent 降低质量还不够；如果每次加强请求都自动绕过策略，同样会破坏 Auto。父输入现在是提议；Host Delegation Policy 解析认可要求、拒绝冲突，并记录接受与过度升级。参见[委派](../delegation.md)和 [ADR-004](../decisions/0004-monotonic-parent-authority.md)。

### 规范状态不能依赖 prompt 或 ignorable 事件

Objective、phase、decision、episode、constraint 和 recovery 状态需要有类型、有版本且带 provenance 的持久化。被审计 commit 的 DSH 在冷加载时拒绝未知必需插件事件，也没有运行时注册接口。这是阻塞性上游兼容契约。参见 [ADR-003](../decisions/0003-formal-recovery-protocol.md)和 [DSH 集成](../dsh-integration.md)。

## 用户体验裁决

一个评审意见认为 Auto 可能把模型选择负担变成 Profile 维护负担。这个结论不适用于设计中的普通用户流程。产品界面只有两个选择：

- Auto。
- 手动 provider/model/reasoning effort。

Policy Pack 作者和维护者负责校准、过期、撤销和 deployment-profile 证据。用户可以查看 Auto 为什么切换 route，但不会被要求调整路由 profile，也不会在缺少反事实时负责认证一次决策正确。

透明度仍然必要，但默认展示应聚合为所选档位、具体配置、主要原因、约束和安全停止。完整 trace 保留给诊断检查。

## 冲突裁决

### 完整架构与较窄首个产品行为

评审没有依据删除 turn 内自适应、恢复或委派设计，但有依据把它们变成证据门控产品能力。[路线图](../roadmap.md)保留完整设计，同时要求每层控制面相对 Session Static Auto 证明增量因果价值后，才能进入产品界面。

### Strong fallback 与 fail closed

存在已准入配置基线时，`abstain` 使用该基线。如果基线未准入、不可用、不兼容或不能满足硬约束，结果是 `no-safe-route`；禁止静默使用名义上的 `strong` alias。

### Host-owned policy 与实现位置

Host 拥有常规决策权。这并不能决定首个实现是外部插件、DSH 上游 capability 还是拆分架构。产品载体仍是实施计划前的开放问题。

## 剩余风险

- Benchmark 污染、evaluator 家族偏差和严重失败样本不足，仍可能制造错误准入置信。
- Provider alias 与静默模型更新，可能使 Policy Pack 在 canary 检测前失效。
- 没有携带已领取消息的 pre-assembly 决策输入时，首 step 语义路由仍被阻塞。
- DSH 提供事件注册与兼容处理前，必需插件状态仍无法安全持久化。
- 外部 Codex 和 Claude Code subagent 当前没有通过被审计 DSH provider seam 暴露所需请求级 model/effort 控制。
- 真实使用证据的隐私与保留策略尚未定义。

## 元评审限制

本次评审扩大了缺陷发现范围，但没有证明经验产品价值、Benchmark 有效性、安全性或 DSH 兼容性。这些主张需要固定源码版本的 contract test、留出实验、故障注入、隐私评审和真实用户证据。不能把这些 AI 评审者的共识引用为设计正确性的证明。
