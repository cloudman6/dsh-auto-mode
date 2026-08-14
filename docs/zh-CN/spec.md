<!--
translation-source: docs/spec.md
translation-source-blob: 545716051ed6b918e938148ca91001a2eb215349
translation-status: current
-->

# 规范：DSH Auto Mode

[English](../spec.md)

## 状态

Proposed，等待用户评审。

## 假设

当前规范基于以下假设；任何一项被否定都需要先修改规范，再进入实施：

1. 首要用户是个人重度 Agent 用户，而不是企业统一治理团队。
2. 首要成功指标是真实活跃用户，而不是插件下载量、GitHub stars 或模型调用量。
3. 产品面向 DeepSeek Harness，并应保持可通过其插件生态安装；但已审计的 DSH 缺口可能需要范围收敛的上游 core 或 extension-package 修改，最终产品载体尚未接受。
4. 实现语言预计为 TypeScript/ESM，并遵循 DSH/Cordis 的插件与能力 seam，但技术栈尚未最终接受。
5. 用户愿意为更可靠的 Auto 模式投入模型调用和由项目维护的 Benchmark 资源；用户不负责维护校准阈值或 route 证据。
6. 当前阶段只交付设计基线，不交付运行代码、依赖或 CI。

## 目标

让用户不再手工猜测当前任务应该使用哪个模型和 reasoning effort。系统根据任务属性、可用模型能力、RouterBench 先验、当前 Session 证据、运行时失败和用户约束，自动选择合适的 route。误判后限制损失，只执行已声明能力支持的恢复；否则停止或请求介入。

产品承诺的优化顺序是：

1. 配置 baseline 必须先通过绝对质量门槛；candidate 只有满足预声明的非劣效界限和不可接受结果上限后才可准入。
2. 在这些质量约束内优先降低端到端延迟。
3. 延迟目标满足后再降低模型成本和 token 消耗。

`strong` 表示配置的 baseline 保证档，不表示某个模型在所有任务上都最强。若不存在当前已准入的安全配置，Auto 返回 `no-safe-route` 并停止，不调用未经验证的 fallback。

## 用户问题

个人重度 Agent 用户面对的核心问题不是缺少模型选择器，而是缺少可信选择依据：

- 用户难以判断任务复杂度与正确 effort，手工选择经常接近随机。
- 为保险起见长期使用高配置，造成不必要延迟和成本。
- 用户没有 A/B 对照，无法判断一次选择是否正确，因此手工选择不应成为监督标签。
- 普通 Auto 模式只选择第一次调用，无法解释为什么切换，也无法在选择错误后恢复。
- 父 Agent 若可随意指定子 Agent 模型，会绕过统一策略并形成新的错误来源。

## 用户体验

普通交互只有两种选择：`Auto`，或手动选择 provider/model/reasoning selection。Reasoning selection 可以是显式 effort，也可以是该精确 route 支持并显示的默认行为。选择 Auto 只有一次操作。策略阈值、准入矩阵、校准、过期和撤销属于项目维护的版本化 Policy Pack，不属于普通用户配置；高级 provider 限制和自定义 pack 只是可选项。

用户可以查看但不需要确认每次决策：

```text
已选择 standard
原因：局部代码修改，有明确测试；standard 对该任务切片的准入仍有效，
且已配置 baseline 通过绝对门槛。

已升级至 strong
原因：同一验证失败重复出现，进入故障诊断 episode。

已降至 standard
原因：原失败已解决并验证，进入文档同步阶段；预计剩余工作足以覆盖切换成本。
```

不提供要求用户猜测“是否应该切换”的 Shadow Mode。透明度用于解释与审计，不把用户接受或拒绝一次建议当作正确标签。手动选择在该作用域退出 Auto 策略，但仍受 Host 安全与 provider 能力校验。

## 功能范围

### 必须具备

- 语义 route：`fast`、`standard`、`strong` 和 `abstain`。
- 维护者负责的版本化 Policy Pack，加上从 DSH active provider/model catalog 与精确 route 元数据填充的部署 Profile；显式 effort、adapter-default 实体化和 provider-default omission 是不同的 admission identity，任意用户映射在准入前不享有质量保证。
- Host 中运行的 Routing Policy；父 Agent 和分类模型不拥有常规最终决策权。
- 在依赖 provider 的 prompt/tool 组装前冻结 route snapshot，并在对应模型请求中原样应用。
- 对无效 Profile、不可用 provider、不可满足约束和 `no-safe-route` 给出明确解析结果。
- 按因果顺序持久化原始决策 context、constraints、assessment、decision、理由、冻结 catalog 与 Policy Pack 版本、实际模型、reasoning selection 和 request encoding。
- RouterBench：分别使用 route 能力协议和生产策略场景协议评估质量、延迟、成本、覆盖率和恢复表现。
- 运行时升级和 episode 状态，避免在未解决问题中反复降级。
- 子 Agent 约束语义与权限规则。

### 完整方向

- 只有在证明相对 Session 级路由具有增量价值后，才启用证据准入的 turn 内 phase 路由。
- `continue`、`salvage` 和 `restart` 三类恢复动作；完整恢复相对基础路由安全独立评估。
- Session checkpoint 与隔离工作区 checkpoint 的关联。
- 具有独立校准协议的可选 Task Assessor 与 Recovery Assessor。
- 进程外 Codex、Claude Code 等子 Agent provider 的创建前路由适配。
- 基于真实运行事实的匿名遥测和策略校准，前提是用户明确同意。

### 不属于当前范围

- 通用任务队列、并发调度、优先级、抢占和组织预算治理。
- 训练新的基础模型。
- 根据一次用户手工选择自动学习“正确模型”。
- 让 Router Agent 使用完整 Session、工具和自主循环决定路由。
- 无隔离机制时使用裸 Git 命令自动撤销用户工作区。

## 预期技术栈

在规范接受前只作为提案：

- TypeScript，严格类型，ESM。
- Cordis 插件与 DSH Service Definition / Provider / Consumer 结构。
- Vitest 或 DSH 当前测试基础设施。
- JSON Schema 或等价的运行时边界校验，用于模型评估和持久事件。
- RouterBench runner 与可版本化任务数据集。

不在规范评审前选择额外运行时依赖。

## 当前命令

仓库尚无实现工具链，可执行检查只有：

```bash
git status --short --branch
git diff --check
rg -n '^(<<<<<<<|=======|>>>>>>>)' .
find docs -type f -name '*.md' -print | sort
```

实施计划接受后，必须在此处补全安装、构建、测试、lint、typecheck 和 Benchmark 命令，不能依赖未记录的隐式流程。

## 项目结构

当前结构：

```text
docs/                 英文权威设计规范和评审材料
docs/decisions/       英文权威架构决策记录
docs/zh-CN/           简体中文翻译
README.md             英文权威项目入口
README.zh-CN.md       简体中文项目入口
CONTRIBUTING.md       英文权威贡献规则
AGENTS.md             英文权威 Agent 工作规则
```

预期实施结构需在技术计划中评审，当前不创建空 `src/` 或 `tests/` 目录。

## 代码风格提案

公共类型使用显式判别联合，语义 route 与具体模型分离：

```ts
type RouteDecision =
  | {
      outcome: 'selected'
      route: RouteId
      reasonCode: ReasonCode
      policyVersion: string
    }
  | {
      outcome: 'abstained'
      requestedFallback: RouteId
      reasonCode: ReasonCode
      policyVersion: string
    }

type RouteResolution =
  | { outcome: 'resolved'; route: RouteId; config: EffectiveCallConfig }
  | {
      outcome: 'failed'
      failure:
        | 'constraints-unsatisfiable'
        | 'profile-invalid'
        | 'profile-unavailable'
        | 'provider-unavailable'
        | 'no-safe-route'
      reasonCode: ReasonCode
    }
```

策略输出目标 route；`keep`、`upgrade` 和 `downgrade` 由前后决策比较得到，不混入决策类型。对外 API 必须记录输入、输出、失败、时序与持久性要求。

## 测试策略

- 单元测试：route 约束解析、策略优先级、episode 状态机、恢复动作选择。
- 属性/状态机测试：确保硬约束不能被模型建议或父 Agent override 绕过。
- 集成测试：通过真实 DSH `agent/request`、Session 事件、子 Agent 生命周期、显式/default reasoning encoding，以及冻结 catalog 上的确定性具体候选解析验证装配。
- 快照测试：验证用户可见决策解释和恢复转录。
- RouterBench：隔离 calibration/validation/held-out 数据、重复配对运行、绝对门槛，以及从 Always Baseline 到路由加恢复的四个策略组。
- 故障注入：模型超时、低置信度评估器、错误 route、重复测试失败、checkpoint 不可用。
- 安全测试：工作区已有未提交修改、并发 Agent 修改、恶意/错误父 Agent 约束。

任何用户可见路由行为都需要关键路径的无密钥测试；需要真实模型的评测必须单独标记并可复现。

## 工作边界

### 始终执行

- 先更新规范或 ADR，再实现改变公共行为的代码。
- 记录每次 route 决策、实际生效配置和理由。
- 对低置信度、分布外和高风险不可验证任务执行 `abstain`；没有已准入安全 route 时停止。
- 将模型评估视为证据，不视为最终授权。
- 涉及策略时，在线路由与 Policy Scenario Bench 使用同一策略实现；Route Capability Bench 的实验分组与 oracle 元数据保持在策略之外。

### 需要先确认

- 改动 DSH 核心扩展点或 Session 格式。
- 新增第三方依赖、遥测上传、远程服务或账户体系。
- 修改质量基线、优化目标顺序或父 Agent 权限模型。
- 自动创建、恢复或删除工作区 checkpoint。
- 发布 npm 包、GitHub Release 或默认开启 Auto。

### 永不执行

- 提交密钥或记录 prompt 中的敏感值。
- 把用户模型选择、父 Agent override 或一次自我报告当作正确标签。
- 让 episode 因时间、token 或 step 数量到期而自动降级。
- 在没有所有权证明的情况下回滚文件或外部副作用。
- 静默切换模型而不记录最终配置和原因。

## 成功标准

### 产品成功

- 首要指标：持续使用 Auto 的真实活跃用户。
- 操作定义：在同意产品遥测的用户中，报告 28 天内完成配置数量 Auto 任务且在之后 28 天窗口再次使用的 cohort。未同意用户保持不可观测，不估算进总体。
- 辅助指标：Auto 启用率、完成的 Auto 任务、手动接管、失败后留存和退出率。
- 用户可以理解任意一次路由或恢复动作为什么发生。
- 普通用户只进行一次模式选择——Auto 或手动——无需维护校准数据，也不需要为路由器提供伪监督标签。

### 路由质量

- 每个任务类别的 baseline 必须通过绝对质量门槛后，才能定义保证档。
- 只有 RouterBench 证明 candidate 满足预声明的 `epsilon` 非劣效界限、`delta` 不可接受结果概率上界、充分统计功效且不存在未解释严重失败簇时，才允许自动覆盖该任务类别。
- 分布外、证据不足或高影响不可验证任务执行 `abstain`。
- 过期、撤销、漂移或无法识别的准入不能降级；没有已准入安全 baseline 时返回 `no-safe-route`。
- 报告 auto coverage、abstention rate 和 under-routing loss，不用平均分掩盖严重失败。

### 性能

- 指标包含完整端到端延迟，包括分类器、切换、缓存失效、恢复和重试成本。
- 在质量约束成立后，先比较延迟，再比较成本。
- 单步节省不足以覆盖模型切换成本时不降级。
- 在准入后续控制面前，比较 Always Baseline、Session 级静态 Auto、turn 内 Auto，以及 turn 内 Auto 加恢复。

### 恢复

- 同一未解决 episode 内 route 下限只能保持或升级。
- turn 内降级只有在存在持久化的已确认 phase 边界，并有独立证据证明它相对 Session 级路由带来净收益后才启用。
- 可变任务降级需要声明且充分的恢复能力；`salvage` 和 `restart` 只适用于可归属、适配器支持的副作用，并且不得覆盖用户或其他 Agent 的既有修改。

## 开放问题

权威清单见[开放问题](open-questions.md)。在以下问题关闭前不进入完整实现：

- 初始 taxonomy、绝对质量门槛、非劣效 margin 和评价统计功效。
- 默认 Policy Pack 的来源、签名、过期、撤销和更新责任。
- [DSH 接入证据](dsh-integration.md)中识别的上游 seam。
- 可安全恢复的执行世界与 checkpoint provider。
- Task/Recovery Assessor 的固定配置、调用门槛和隐私边界。
