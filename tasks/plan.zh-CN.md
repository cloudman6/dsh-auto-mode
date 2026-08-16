<!--
translation-source: tasks/plan.md
translation-source-blob: 18e09fed2219ee7cea43c6a95ddb996bb62165c1
translation-status: current
-->

# 实施计划：阶段 0P AA-seeded Experimental Auto

[English](plan.md)

## 目标

在固定 DSH fork 上交付仅限维护者、显式启用、每 Session 一次决策的 Experimental Auto 路径。Artificial Analysis 为精确 model-and-effort 配置提供带版本外部先验；确定性 Host policy 作出最终决策；所有决策保持 `experimental-unadmitted`。RouterBench admission 推迟到阶段 0C，本项工作不削弱也不伪造该门槛。

## 架构决策

- 使用可判别 `ExperimentalRouteCatalog`；绝不把外部榜单记录插入 `PolicyPack.admissions`。
- Artificial Analysis 数据获取位于交互客户端之外。插件消费通过校验的本地 snapshot；credential 与原始抓取数据绝不进入仓库。
- 只映射精确 provider/model/reasoning-selection identity。不得推断未测 effort，也不得合并 explicit、adapter-default 和 provider-default encoding。
- 阶段 0P 的 Task Assessment 与路由保持确定性。外部来源只提供证据字段，不提供 route 决策。
- 在依赖 provider 的组装前冻结每 Session 一次的 Experimental Auto 决策，并持久化外部 snapshot、assessment、decision、resolution、request encoding 和 explanation 引用。
- 优先审计 DSH Web model-selection surface 作为 A5p；只有聚焦 seam probe 证明 Auto/manual 控制和持久解释读取后才接受。

## 依赖图

```text
任务 1：精确 route 清单与 A3p 映射
       |
       +--> 任务 2：外部先验契约与数据边界
                    |
                    +--> 任务 3：仓库脚手架与领域类型
                              |
                              +--> 任务 4：snapshot loader 与精确 matcher
                              |         |
                              |         +--> 任务 5：确定性 assessment 与 policy
                              |                    |
                              +--> 任务 6：Session 持久化与 projection
                                                   |
                                                   +--> 任务 7：pre-assembly Host 集成
                                                              |
任务 1 -------------------------------------------------------+
                                                              |
                                                              +--> 任务 8：A5p client carrier
                                                                         |
                                                                         +--> 任务 9：纵向 dogfood probe
```

## 任务清单

### 基础

- [ ] 任务 1：冻结初始精确 route 清单与 A3p 证据矩阵。
- [ ] 任务 2：冻结 ExternalRoutePrior snapshot、启发式策略、freshness、attribution 与数据权利契约。

### 检查点：证据基础

- [ ] 每个拟用实验 route 都具有精确 DSH-to-external-record 映射，或者明确排除。
- [ ] 维护者评审启发式边界，并在实施前明确授权任何 Artificial Analysis API access 与新增 runtime/development dependency。
- [ ] 启用可变 Experimental Auto 前，维护者单独接受符合 ADR-007 的 possible-loss bound 与已验证 Recovery Capability scope；否则实施和 dogfood 保持只读。

### 核心

- [ ] 任务 3：建立 TypeScript/ESM package、测试框架和 admitted-versus-experimental 可判别领域类型。
- [ ] 任务 4：实现离线 external-prior snapshot loader 与精确 route matcher。
- [ ] 任务 5：实现确定性 Task Assessment 与 Session Static 实验策略。

### 检查点：纯策略

- [ ] 单元、属性、schema 和 golden-decision 测试在无 DSH、无网络环境下通过。
- [ ] Fresh project Code Review Skill 返回 `PASS`，且没有 P0-P2 finding。

### Host 与 client 纵向切片

- [ ] 任务 6：持久化并冷重建阶段 0P catalog、assessment、decision、resolution 与 explanation event。
- [ ] 任务 7：把一次冻结 Session 决策贯穿 `agent/prepare-step`、provider-dependent assembly 与 `agent/request`。
- [ ] 任务 8：实现并验证 A5p Experimental Auto/manual carrier 与持久解释 view。

### 检查点：集成路径

- [ ] 固定 fork contract test 证明 request/snapshot identity、不兼容时 fail closed 与冷重建。
- [ ] Web 或替代 carrier 测试证明一次操作的模式选择和实际持久解释读取。
- [ ] 每个有边界集成阶段都由 fresh project Code Review Skill 返回 `PASS`。

### Dogfood

- [ ] 任务 9：运行无密钥纵向 probe，打包维护者 dogfood build，并发布本地 runbook 与证据报告。

### 检查点：阶段 0P 就绪

- [ ] 维护者可以启用 Experimental Auto，端到端运行任务，查看精确模型/effort 与来源 snapshot，冷加载并切回 Manual。
- [ ] Git 不跟踪 Artificial Analysis credential 或再分发数据集；任何输出都不宣称 RouterBench admission、非劣性、官方 DSH 兼容或公开支持。
- [ ] `PROJECT_STATUS.md` 记录精确 plugin commit、DSH fork commit、carrier 版本、验证证据和剩余阶段 0C gate。

## 验证策略

- 纯领域测试不依赖网络或 DSH runtime。
- Snapshot 测试使用字段兼容 Artificial Analysis 的合成 fixture，不复制生产榜单数据，并证明 endpoint/pagination metadata 与规范化内容 digest 能标识精确输入。
- Contract test 证明精确 identity/effort 匹配、freshness 失败、畸形数据失败、确定性 tie-break 和 experimental/admitted 类型隔离。
- Policy 测试证明可变工作实验路由要求另行接受的 loss bound，并且每个 effect class 都有充分的 Host 声明 Recovery Capability；不可逆外部副作用和超出 bound 的 mutation 必须在调用前终止 Auto。用户介入可以切换到 Manual 或等待新的 execution-world facts，但不能授权已拒绝的 Experimental Auto dispatch。
- DSH 集成测试包含真实 Loader + app/process composition、无密钥 headless Session JSONL transcript、自跳过 with-key real-provider smoke 和负向 control；证明一个 Session decision 加逐调用 authorization、不使用 forward event reference 的稳定 A1 message identity、interrupted-preparation recovery、不消费 turn 的 Manual bypass、同一不可变 route snapshot 到达 assembly 与 request、required event 可冷加载恢复，并且持久 request/header 与 provider 外部 response 一致。
- A5p 测试证明显示状态来自持久 Session 事实，而不是 client-local optimistic state；Web carrier 还必须为正向、reload、Manual 与停止状态提供 browser snapshot。
- 每个有边界实施任务在聚焦验证后、提交前调用 `.agents/skills/dsh-auto-mode-code-review/SKILL.md`。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| Artificial Analysis access 或再分发权不覆盖目标公开产品 | 高 | 阶段 0P 保持本地且仅限维护者；不保存榜单数据集；权利确认前停止公开分发 |
| DSH route identity 无法证明实际服务的就是榜单配置 | 高 | 排除该 route；绝不退化为 alias 名称匹配 |
| 一个 effort 的榜单成绩被应用到另一个 effort | 高 | 把 reasoning-selection encoding 纳入精确匹配 key，并测试三种 default/explicit 形式 |
| 启发式分数边界看起来像安全保证 | 高 | 持久化并展示 `experimental-unadmitted`；使用独立 catalog 类型和明确 reason code |
| 外部榜单漂移 | 中 | 固定 source index 版本和抓取时间，执行 freshness，要求新 snapshot 而不是静默重解释旧决策 |
| A5p Web seam 无法读取必需 Session 事实 | 高 | UI 实现前运行 carrier seam probe；只有替代显式 carrier 满足同一契约时才采用 |
| 阶段 0P 代码污染阶段 0C admission policy | 高 | 禁止 experimental evidence 转换为 `RouteAdmission`；增加编译期与运行时隔离测试 |

## 开放问题

实施必须关闭[开放问题](../docs/zh-CN/open-questions.md)中的阶段 0P 部分。当前立即未决项是精确初始 route set、启发式分数边界、snapshot freshness、Artificial Analysis access/data rights 和具体 A5p carrier。

## 明确不做

- RouterBench admission 或质量/非劣性主张。
- Turn 内切换、恢复、child-agent routing、online learning 或 telemetry upload。
- 公开 package 发布、默认开启 Auto、官方 DSH 兼容或 Artificial Analysis 数据再分发。
- 推断 Artificial Analysis 没有精确测量的 effort 或 provider-default encoding 的模型能力。
