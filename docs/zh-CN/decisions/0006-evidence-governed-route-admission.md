<!--
translation-source: docs/decisions/0006-evidence-governed-route-admission.md
translation-source-blob: f733ab6fd821d727457ec6f76c23c27ffc05d1fc
translation-status: current
-->

# ADR-006：Route 准入由证据治理，并与策略场景分离

[English](../../decisions/0006-evidence-governed-route-admission.md)

## 状态

MVP 后产品方向已被 [ADR-010](0010-aa-informed-heuristic-routing.md) 取代。RouterBench 现在是可选评估轨道，不再是唯一 route admission 路径。

## 日期

2026-08-14

## 背景

Benchmark 可能把 oracle 标签泄漏给路由输入、让阈值过拟合到被反复查看的 case，或者混淆模型能力与控制面行为。单一汇总分数无法支持跨任务风险、可验证性、可逆性和错误可检测性切片的安全主张。

## 决策

RouterBench 包含两个受治理系统：

- Route Capability Bench：根据基线绝对门槛与候选非劣性门槛评价具体 provider/model/reasoning-selection 配置。显式 effort、adapter-default 实体化和 provider-default omission 是不同的证据 identity。
- Policy Scenario Bench：以事件驱动行为评价路由、phase 转换、abstain、恢复、持久化和委派。

校准、验证、留出验收、时间外和分布外数据相互隔离。Case 的执行可见输入与 evaluator 专用 oracle 元数据分离。每个 Policy Pack 预注册 taxonomy、evaluator、统计方法、样本量、版本、过期和撤销规则。

只有随机策略消融实验证明 turn 内路由与完整恢复相对相邻简化控制面具有实质端到端增量价值，而且继续通过全部质量与安全门槛时，它们才进入产品范围。

## 备选方案

### 一个 Benchmark 和一个汇总分数

否决。它掩盖失败切片，无法区分配置质量与策略行为。

### 把公共模型榜单当作路由真值

否决。榜单可作为 prior，但不能确定 deployment、任务分布、evaluator 关系或严重失败风险。

### 调整策略时重复使用全部 case

否决。反复查看会破坏留出证据，并导致 Benchmark 过拟合。

## 后果

- Benchmark 数据与 evaluator 治理是 release-critical 资产。
- Route admission 有版本、会过期且可撤销。
- 策略实验组增量可以避免把通用恢复收益误报成路由收益。
- 完整架构继续保留，但并非每层控制面都无条件成为产品承诺。
