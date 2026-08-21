<!--
translation-source: tasks/todo.md
translation-source-blob: b3c7072026016de4c550bf5907bc14136bfea213
translation-status: current
-->

# 任务清单：AA 驱动的 MVP 后 Auto

[English](todo.md)

## Task 1：把 Host route identity 绑定到 AA 证据

**验收标准：**

- [x] 稳定 Host route identity 包含 provider、model，以及每个 Host 物化执行选项的 fingerprint。
- [x] 一条版本化显式 binding 把 eligible Host route 映射到一个冻结 snapshot 中一条稳定 AA record。
- [x] Effort 和 variant 保持 provider 可选维度；模糊、陈旧、有歧义或跨配置 binding 被拒绝。

**验证：**

- [x] 混合 provider fixture 覆盖零个、一个和多个执行控制项、有效 binding、collision、歧义和 AA-record replacement。
- [x] 现有 MVP 与 Manual 测试继续通过。

**依赖：**无

## Task 2：编译本地 AA catalog

**验收标准：**

- [ ] 被 Git 忽略的本地 seed 只连接到有效 DSH route。
- [ ] 每条 entry 记录 snapshot、binding-rule version、AA record、Host route identity、实际配置 fingerprint 和 capability facts。
- [ ] 无效或未匹配 row 带稳定原因被排除，且不提交 secret。

**验证：**

- [ ] Catalog fixture 无需网络即可确定性运行。
- [ ] Secret 和 tracked-dataset 检查通过。

**依赖：**Task 1

## Task 3：分配处理级别并按价格优先解析

**验收标准：**

- [ ] 每条合格 route 恰好属于一个带版本 Light、Standard 或 Deep 档位。
- [ ] 同档排序使用 AA price、AA latency、稳定 route ID。
- [ ] 缺失字段遵循一条显式规则，discovery 顺序不会改变 winner。

**验证：**

- [ ] 边界与 permutation 测试覆盖所有档位和 tie-break。
- [ ] 解释指出档位与价格优先依据。

**依赖：**Task 2，以及维护者选择 AA field/边界

## Checkpoint A：Catalog 基础

- [ ] Task 1–3 无需 DSH provider credential 或实时 AA access 即可通过。
- [ ] Manual 行为不变。
- [ ] 不要求项目 Benchmark 或精确 deployment fingerprint。

## Task 4：冻结 Task Assessor 契约

**验收标准：**

- [ ] Schema 覆盖 task kind、scope、complexity、risk、verifiability、confidence 和 reasons。
- [ ] 输入上下文、固定 route、timeout、validation 和 confidence threshold 明确。
- [ ] 契约禁止输出 provider/model/effort，并把失败映射到 Deep。

**验证：**

- [ ] 契约 fixture 覆盖有效、无效、timeout 和低置信度输出。

**依赖：**维护者选择固定 assessor 配置

## Task 5：实现语义判断与确定性级别映射

**验收标准：**

- [ ] Assessor 在 Auto 递归之外运行且没有工具。
- [ ] 确定性策略把结构化属性映射到 Light、Standard 或 Deep，并记录 reason code。
- [ ] 高风险、范围未知、无效输出、timeout 和低置信度选择 Deep。

**验证：**

- [ ] Fixture 覆盖编码、调试、研究、写作、架构、安全和模糊任务。
- [ ] 重复有效输入产生相同级别和解释。

**依赖：**Task 3、4

## Checkpoint B：语义路由

- [ ] Assessor 只提供证据；Host policy 拥有决策权。
- [ ] Assessor 输出不包含具体 route。
- [ ] 所有 fallback 路径确定且可见。

## Task 6：集成冻结 Auto 决策

**验收标准：**

- [ ] 一项决策在 assembly 前组合 assessment、constraints、catalog 和 route resolution。
- [ ] Assembly、`agent/request`、Session 事实和 UI projection 使用同一 provider/model/effort。
- [ ] 无合格 route 时升级级别或带明确原因使用配置的 Deep fallback；没有有效 fallback 时明确失败。

**验证：**

- [ ] 固定 fork composition 覆盖 Light、Standard、Deep、升级、fallback 和 failure。
- [ ] Cold reconstruction 保留实际 route 和解释。

**依赖：**Task 3、5

## Task 7：迁移 UI 术语与解释

**验收标准：**

- [ ] UI 使用 Light/Standard/Deep 和轻量/常规/深度，而不是 fast/standard/strong。
- [ ] Selector 与 conversation 显示实际 model、effort、任务处理级别以及 AA 或 fallback 依据。
- [ ] 现有滚动、蓝色高亮、两次呼吸和消息位置保持不变。

**验证：**

- [ ] 浏览器测试覆盖仅 model、仅 effort、二者及仅 level 变化。
- [ ] 中英文 snapshot 保持 current。

**依赖：**Task 6

## Task 8：证明 AA 驱动 Auto Beta

**验收标准：**

- [ ] 不同 task fixture 到达三档和不同合格 route。
- [ ] 同档选择遵循 AA price 和 latency 排序。
- [ ] 显示、持久化和实际请求配置一致；Manual 不变。

**验证：**

- [ ] 聚焦 unit、Loader、Session、GUI 和可用真实 provider 场景通过。
- [ ] 公开解释不包含 Benchmark、optimality、non-inferiority 或 safety claim。

**依赖：**Task 6、7

## Checkpoint C：AA 驱动 Beta

- [ ] Task 1–8 完成。
- [ ] 产品通过一次 Auto 操作即可使用且保持透明。
- [ ] 当前 fork、plugin、catalog、assessor 和 policy version 已记录。

## Task 9：定义并实现 AA snapshot 更新

**验收标准：**

- [ ] 获取方式、attribution、rights、retention、freshness 和 minimization 已记录。
- [ ] 畸形或不完整更新不能取代上一有效 snapshot。
- [ ] 维护者可以检查变化并恢复上一有效 snapshot。

**验证：**

- [ ] Offline fixture 覆盖更新、拒绝、rollback、binding 新增、删除、替换和 AA-record rename。
- [ ] Credential 和再分发原始数据集留在 Git 与浏览器 client 之外。

**依赖：**Checkpoint C，以及新增依赖或远程服务的明确授权
