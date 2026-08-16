<!--
translation-source: docs/decisions/0009-phase-0p-attributable-worktree-loss-bound.md
translation-source-blob: a82ed4817794b3ec5ce68863a89ff17286919eb3
translation-status: current
-->

# ADR-009：阶段 0P 可变工作仅限隔离 worktree 中可归属的变更

[English](../../decisions/0009-phase-0p-attributable-worktree-loss-bound.md)

## 状态

Accepted

## 日期

2026-08-16

## 背景

ADR-007 要求 Auto 在执行可变工作前具备已接受的 possible-loss bound 和已验证的 `RecoveryCapability`。ADR-008 有意把该 bound 留在阶段 0P 之外，因此即使 Experimental Auto 的路由选择闭环可以推进，它仍只能执行只读工作。

维护者接受一个狭窄的初始损失 envelope，以便开展有用的编码 dogfood，同时不宣称通用回滚能力。该决策必须区分风险接受与能力证据：批准一类可能损失，并不证明当前 DSH execution world 能约束、归属或检测这种损失。

## 决策

只有当一个带版本、Host 可识别的 execution-world provider 在每次 Experimental Auto 模型调用前证明以下全部条件时，阶段 0P 才能执行可变工作：

- 工作区是干净、隔离的任务 worktree，不存在预先已有的 tracked 或 untracked 变更。
- 每项持久文件系统 mutation 都可归属于当前 Attempt，并被限制在该 worktree 内。路径穿越、symlink 或 hard-link 逃逸、通过外部 mount 写入以及写出已声明 canonical 根目录的行为，必须在 effect 发生前被拒绝；仅靠事后检测不满足该 bound。
- 声明的能力至少是 `workspace: 'attributable-files'` 与 `externalSideEffects: 'none'`。工具名称、Git 仓库、模型意图或用户确认都不是该能力的证据。
- Git index、object database、configuration、ref、history、linked-worktree administration、通过 Git 改变的 worktree 状态和 remote 都必须保持不变。只有通过能阻止 optional lock、index refresh、output-file write、external diff 或 text-conversion helper、pager、hook 和每项 repository-state mutation 的 option-aware enforcement，显式只读 Git 检查才符合条件。Add、commit、restore、clean、checkout 或 switch、push、tag、branch mutation、rebase、reset、worktree administration、remote mutation 与发布均超出 bound。
- 数据库、消息、部署、远程 API、package 或系统安装、凭据、账户状态和操作系统配置都超出 bound。Agent 发起的联网或其他未分类工具命令被拒绝；所选模型的 provider dispatch 不归类为工具副作用。Provider 声称 capability 前，必须冻结精确 production capability 与 tool-entry inventory——包括 in-process filesystem 与 Web tool、foreground/background shell 或 terminal execution、Code Mode nested dispatch、hook、subagent 与 alternate caller——并证明每个 executor 都实施约束；未覆盖的入口必须禁用。Child process 获得不含 ambient credential 的 scrubbed environment。只有当 provider 能把每项持久 effect 限制并归属于隔离 worktree，且能约束其 process 时，测试和构建命令才符合条件。
- Attempt 持久记录带版本的稳定起始边界，以及按因果顺序追加、限定到 Attempt 的创建、修改和删除路径 journal。不可变 journal identity 与 provider version 必须能经 cold load 恢复，并且每次可变 authorization 前，live worktree reconciliation 仍必须一致。未知 attribution、orphan 或 interrupted journal、dirty-start drift、containment failure、不可逆 effect 或任何外部副作用，都会在下一次 provider dispatch 前以 `no-experimental-route` 终止 Experimental Auto。

最大可接受 possible loss 是：**当前 Attempt 在该隔离 worktree 内产生的全部未提交文件系统变更**。Base branch、其他 worktree、用户预先已有的变更、Git 历史、远端状态和外部系统均不在已接受的损失 envelope 内。

该决策不授权自动回滚，也不宣称 `salvage` 或 `restart`。失败时，阶段 0P 保留隔离 worktree 和可归属证据，供检查或手工放弃。恢复自动化仍要求为每个声称支持的 effect class 单独实现并测试 Checkpoint Provider；继续禁止原始 Git 回滚。

本 ADR 只接受风险 envelope。具体 execution-world provider、其 `RecoveryCapability` 声明、执行边界、attribution journal、负向 control 与 fault-injection 证据通过项目 review gate 前，可变阶段 0P 继续禁用。只读执行仍是 fail-closed fallback。

## 考虑过的替代方案

### 阶段 0P 始终保持只读

不作为最终 dogfood 边界。它可以验证路由和解释 plumbing，但无法验证产品要解决的 coding-agent 工作流。

### 任何 mutation 前都要求完整自动工作区回滚

不用于阶段 0P。干净、隔离且可归属的 worktree 可以约束已接受的损失，而无需假装完整恢复已经存在。自动回滚仍是后续需要独立测试的能力。

### Git 显示干净时允许普通工作区

不采用。干净的 Git status 不提供 execution isolation、mutation attribution、路径 containment，也不防护外部 effect。

### 用户确认后允许外部 effect

不采用。确认表达意图，但不能让不可逆或不可归属的 effect 变得可恢复。

## 后果

- ADR-007 与 ADR-008 要求的独立 loss-bound 决策，对于阶段 0P 初始文件 mutation scope 已经关闭。
- 可变 dogfood 仍被可执行 Recovery Capability 证据阻塞。文档或 capability 字面值不能满足该 gate。
- 初始可变表面只在 effect 保持受限且可归属时适用于代码编辑、本地验证和生成 artifact。
- 完整恢复、普通 dirty workspace、依赖安装、远端写入以及所有非文件系统 effect 继续处于阶段 0P scope 之外。
- 项目可以测试可变 Auto 闭环，同时不声称 route admission、工作区回滚或超出这一精确 envelope 的安全性。
