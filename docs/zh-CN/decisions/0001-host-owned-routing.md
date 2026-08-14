<!--
translation-source: docs/decisions/0001-host-owned-routing.md
translation-source-blob: 2fde8698a44d0323fcf69b4879bb72cc8b237c41
translation-status: current
-->

# ADR-001：Host 策略拥有常规路由决策权

[English](../../decisions/0001-host-owned-routing.md)

## 状态

Proposed

## 日期

2026-08-14

## 背景

Auto Mode 必须决定每次请求使用哪个 provider、model 和 reasoning effort。候选所有者包括用户、当前 Agent、父 Agent、独立 Router Agent 和 Host 插件。

用户与父 Agent 都缺少可靠反事实；Router Agent 又产生“Router 自己使用哪个模型”的递归问题，并增加 Session、工具、权限、延迟和失败面。

## 决策

常规决策由 DSH Host 中的 Routing Policy 完成。父 Agent只提交任务意图和语义约束；可选评估模型只输出任务属性；Route Profile Resolver 才把语义 route 映射到具体 provider/model/effort。

用户保留最高显式控制权。Routing Policy 的实际决策和最终调用配置进入被服务 Agent 的 Session。

## 备选方案

### 当前或父 Agent 直接选择

拒绝。它把 Auto 退化成让一个模型猜另一个模型，并可能习惯性选择最强配置。

### 完整 Router Agent

拒绝。它需要自己的模型、Session 和工具策略，形成递归和额外攻击面。

### 分类模型直接返回模型名称

拒绝。输出不稳定、难以测试，并把 provider 配置耦合进语义分类。

## 后果

- 路由策略可以独立进行单元测试和 RouterBench 回放。
- 评估模型失败时可以明确 abstain。
- 需要设计持久的 route 决策事件和 DSH `agent/request` consumer。
- 用户、父 Agent、评估器和策略的权限必须通过一个 resolver 统一计算。
