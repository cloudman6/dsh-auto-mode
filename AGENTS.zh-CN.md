<!--
translation-source: AGENTS.md
translation-source-blob: d7d559d1c71a0568b8daf21cbcb5e65605698a7e
translation-status: current
-->

# DSH Auto Mode - Agent 上下文

[English](AGENTS.md)

> AI Agent 新会话从这里开始。先读本文件，再按“新会话必读”加载当前任务所需文档。

## 一句话项目定位

为个人重度 Agent 用户提供 AA 驱动的 DeepSeek Harness Auto 模式：固定语义 assessor 描述任务，确定性 Host policy 选择轻量、常规或深度，resolver 在该级别的合格 route 中依次优先 AA 价格更低和 AA 延迟更低者。

## 项目快照

| 项目 | 当前状态 |
|---|---|
| 项目阶段 | 阶段 1 AA route catalog 已完成，当前进入阶段 2 语义 Task Assessor |
| 已有成果 | 可运行 MVP，以及已完成的阶段 1 离线 Host identity、AA evidence binding、catalog、能力档和价格优先 resolver pipeline |
| 首要用户 | 个人重度 Agent 用户 |
| 首要成功指标 | 持续使用 Auto 的真实活跃用户 |
| 优化顺序 | 所需任务处理级别 → AA 报告价格 → AA 报告延迟 → 稳定 route identity |
| 核心规范 | `docs/spec.md` |
| 当前进度 | `PROJECT_STATUS.md` |
| 下一阶段入口 | 冻结阶段 2 Task 4 的固定 Task Assessor 配置和结构化契约 |

本表只保存会话定向所需摘要。进度、阻塞和下一步的权威位置是 `PROJECT_STATUS.md`，不要在两处维护完整状态。

## 新会话必读

当 `PROJECT_STATUS.md` 把阶段 1–3 列为当前阶段时，在实施或评审前只读取：

1. `PROJECT_STATUS.md`。
2. `docs/zh-CN/spec.md`。
3. `docs/zh-CN/routing-policy.md`。
4. `docs/zh-CN/roadmap.md` 和 `tasks/todo.zh-CN.md` 中当前任务。
5. 只有需要保留或比较 MVP 行为时才读取 `docs/zh-CN/phase-0p-fast-prototype.md`。
6. 与当前变更直接相关的代码和测试。

不得用后续自适应、恢复或生态文档扩大当前 roadmap phase 的边界。

在该有效范围锁之外，按顺序读取：

1. `PROJECT_STATUS.md`：当前进度、阻塞、下一步和最近状态变化。
2. `docs/spec.md`：产品范围、假设、成功标准和工作边界。
3. `docs/architecture.md`：能力拆分、所有权、数据流和 DSH 接入点。
4. `docs/roadmap.md`：依赖顺序、阶段验收和明确不做事项。
5. `docs/open-questions.md`：尚未关闭的问题。
6. `docs/decisions/README.md`：ADR 状态和决策索引。

按任务深入，不要无差别加载全部文档：

- 路由选择、降级、abstain、turn 内切换：`docs/routing-policy.md`。
- attempt、episode、continue/salvage/restart：`docs/recovery.md`。
- 父 Agent 与子 Agent 权限：`docs/delegation.md`。
- 任务集、质量门槛和评估：`docs/routerbench.md`。
- 已验证的 DSH 扩展点和上游缺口：`docs/dsh-integration.md`。
- 已冻结的阶段 0P 精确 route identity 与排除项：`docs/evidence/phase-0p-route-inventory.md`。
- 历史多视角评审证据：`docs/reviews/2026-08-14-multi-view-design-review.md`。
- 术语定义：`docs/glossary.md`。
- 文档语言和翻译同步：`docs/localization.md`。
- 某项高代价决策的依据：对应 `docs/decisions/*.md`。

## 当前阶段约束

维护者已于 2026-08-21 接受 ADR-011。MVP 后实施遵循以下约束：

- 已接受的规范和 ADR-011 是约束。ADR-010 是已被取代、用于记录 AA 驱动和价格优先方向的历史来源；ADR-002、ADR-006 和 ADR-008 继续属于历史。
- 已实现的 A1/A2 契约必须保持产品无关并固定到已验证 fork commit；DSH Core 不得理解 Auto Mode route 档位、Task Assessment 或 Policy Pack 语义。
- AA 是 capability、price 和 latency 结论的外部来源；不得宣称本项目 Benchmark 质量或普遍最优。
- 可执行 Host route identity 与 AA evidence identity 必须分离。一条实际 provider/model/request configuration 显式绑定到一条稳定 AA record；不得要求所有 provider 都有 variant 或 effort，不得模糊推断 binding、跨越已物化执行差异或静默替换更新 AA record。
- 内部使用 `light`、`standard`、`deep`，用户界面使用 Light/Standard/Deep 与轻量/常规/深度。已完成 MVP 的旧标签在迁移前只属于历史实现。
- 同一处理级别内，依次优先 AA 报告价格更低、AA 报告延迟更低和稳定 route identity。不得增加本地 token-cost estimator。
- 固定 Task Assessor 只能返回结构化任务属性；确定性 Host policy 拥有级别和具体 route 决策权。
- 把 ADR-009 视为风险授权，而非能力证据。只有另行接受的具体 provider 设计冻结每个 production tool entry，并且带版本 Host provider 证明干净隔离 worktree、持久 Attempt scope 文件归属与 containment、process/credential isolation，以及 `externalSideEffects: 'none'` 后，才能启用可变 Experimental Auto；未覆盖或不支持的入口都 fail closed。
- 实施继续固定 fork；对应 roadmap gate 通过前不得宣称兼容官方 DSH。

## 阶段 0P 快速原型范围锁

当 `PROJECT_STATUS.md` 把快速原型列为当前阶段时，验收标准只有四项：选择 Auto；不同任务路由到不同 model/effort；持久化选择与实际请求一致；Manual 不变。执行以下规则：

- 只有直接实施、证明或修复四项标准之一时，才增加工作。
- 边界外的生产级问题记录为推迟事项，不得升级为原型阻塞或新规范合同。
- 除非维护者明确改变当前范围，否则不得引入 rights approval、签名、credential binding、revocation ledger、Session egress isolation、certificate/sidecar、dispatch-contract ADR 或复杂恢复状态机。
- 维护者明确要求评审本仓库时，按本范围、固定 A1/A2 行为、普通正确性以及 secret/破坏性操作安全评估原型。评审可以记录推迟的生产风险，但不得要求用范围外的生产基础设施换取原型 `PASS`。
- 任何范围扩展都必须指出它直接服务哪项验收标准。无法建立直接联系时，立即停止扩展并继续当前原型。

## 仅显式触发的 Code Review

无论修改 `dsh-auto-mode` 还是维护者 DeepSeek Harness fork，都不得自动调用 [DSH Code Review Skill](.agents/skills/dsh-auto-mode-code-review/SKILL.md)。只有维护者对当前任务明确要求代码评审时才调用。明确要求评审后，出现 `BLOCKED` verdict、任何 P0-P2 finding、缺失强制证据或范围含糊时不得提交被评审变更；修复后重新执行 fresh review。未要求评审时，聚焦验证和任务完成检查仍照常执行。

## 语言规范

| 场景 | 语言 |
|---|---|
| 与当前维护者讨论 | 中文 |
| 默认路径下的公共权威文档 | 英文 |
| 简体中文翻译 | 根目录 `*.zh-CN.md` 和 `docs/zh-CN/` |
| 公共 Git 元数据 | 英文 commit message、分支名、Issue/PR 标题和 PR 规范性描述 |
| 代码标识符、事件、schema、配置键和注释 | 英文 |

英文权威文档与中文翻译由 `docs/localization.md` 和 ADR-005 管理。不要创建双语 commit message 或两套权威源。中英文冲突时，修正中文翻译以匹配英文。

## 产品关键不变量

1. Auto 是 AA 驱动的启发式路由：先选择所需任务处理级别，再在该级别的 Host-valid route 中优先 AA price 和 AA latency。不得宣称经过 Benchmark 的质量、安全、非劣性或普遍最优。
2. 不把用户选择、父 Agent override 或模型自我报告当作正确路由标签。
3. Host Routing Policy 拥有常规路由决策权；模型只提供任务意图或可选语义评估。
4. 高风险、未知、低置信度或无效 Task Assessment 选择 `deep`。缺少 AA match 时只能使用配置且通过 Host 验证的 Deep fallback，并明确说明 fallback；否则返回明确 no-route failure。
5. 自动决策必须可解释、可审计；实际 provider/model/reasoning selection、request encoding 和原因必须可持久重建。只有明确声明且测试过的副作用类别才能宣称可恢复。
6. 同一未解决 episode 内 route floor 只能保持或升级；阶段变化后的降级是需要证据准入的能力，不是无条件产品承诺。
7. 父 Agent 约束只是提议。只有 Host 认可的要求或用户明确授权的 override 才成为硬约束；父 Agent 不得静默提高、降低或绕过 Routing Policy 指定任意 provider/model。
8. Recovery Supervisor 核心通过形式化事件工作，不建立每 turn 注入 prompt 的自我报告协议。
9. 不用裸 Git 回滚实现工作区恢复；Session checkpoint 与工作区 checkpoint 分别拥有明确语义和所有权。
10. RouterBench 是可选评估设施，不是 route admission 或 release gate。必需正确性测试仍覆盖 Host route identity、evidence binding、catalog 编译、价格排序、assessor fallback、持久化、UI 一致和 Manual 不受影响。
11. 普通用户只在 `Auto` 与手动 provider/model/reasoning selection 之间选择。默认值由维护者负责的带版本 AA snapshot、evidence binding、band policy 和 fallback 承担；高级限制只是可选项。
12. 一个模型 step 的 route 必须在依赖 provider 的 prompt/tool 组装之前冻结，并在 `agent/request` 原样应用。
13. AA 数据只支持启发式路由。不得把它表述成项目 Benchmark 证据、精确 deployment 证明或具体任务质量保证。
14. ADR-009 把阶段 0P 可变工作限制为当前 Attempt 在干净隔离 worktree 内产生且可归属的未提交变更。具体 provider 设计和完整 production tool-entry inventory 必须另行接受；用户批准不能证明 Recovery Capability，也绝不授权外部 effect 或自动回滚。

## 文档权威位置

| 信息类型 | 权威文件 |
|---|---|
| 当前进度、阻塞、下一步、最近完成 | `PROJECT_STATUS.md` |
| 产品目标、范围、假设、成功标准、边界 | `docs/spec.md` |
| 系统组件、所有权、数据流、公共能力边界 | `docs/architecture.md` |
| 路由语义、优先级、降级与切换策略 | `docs/routing-policy.md` |
| attempt、episode、恢复动作和 checkpoint | `docs/recovery.md` |
| 子 Agent 委派约束和权限 | `docs/delegation.md` |
| Benchmark 任务、指标、评价和 route 准入 | `docs/routerbench.md` |
| 已验证的 DSH 扩展点、阻塞和上游 seam | `docs/dsh-integration.md` |
| 阶段依赖、阶段验收、明确不做 | `docs/roadmap.md` |
| 未决问题 | `docs/open-questions.md` |
| 文档语言和翻译同步 | `docs/localization.md` |
| 高代价、需要保留替代方案和后果的决策 | `docs/decisions/*.md` |
| 导航和项目入口 | `README.md`、`docs/README.md` |
| Agent 常驻规则、起手和完成纪律 | `AGENTS.md` |
| 明确要求时使用的 Code Review 流程与 verdict | `.agents/skills/dsh-auto-mode-code-review/SKILL.md` |

## 文档维护纪律

做任何方案调整时，先分类再落文件：

1. 已确认的产品目标、范围或验收标准：更新 `docs/spec.md`。
2. 尚待评审的高代价决策：新建或修改 `Proposed` ADR。
3. 用户接受的 ADR：只在用户明确确认后改为 `Accepted`。
4. 架构、所有权、数据流或公共能力变化：更新 `docs/architecture.md`，必要时同步 ADR。
5. 路由、恢复、委派或 Benchmark 的领域行为变化：更新对应专题文档。
6. 实施阶段、阶段验收或不做事项变化：更新 `docs/roadmap.md`。
7. 未决问题新增、关闭或改变：更新 `docs/open-questions.md`。
8. 当前进度、阻塞或下一步变化：更新 `PROJECT_STATUS.md`。
9. 导航发生变化：同步 `README.md` 或 `docs/README.md`。
10. 语言或翻译工作流变化：更新 `docs/localization.md` 和 ADR-005 或其后继 ADR。

不要把聊天过程、探索顺序或推理记录直接塞进主文档。主文档只保留当前可执行结论、完整约束、依据、状态和未决问题。

一个设计事实只保留一个权威位置。其他文档通过链接引用，不复制整段定义。旧 ADR 不删除；决策变化时新建 ADR 并标记 supersede 关系。

每个英文权威文档都有对应的中文 locale 文件。遵循 `docs/localization.md`：维护者编写的变更在同一次变更中更新两种语言，或明确把 locale 文件标记为 `outdated`。每个 Markdown 文件以恰好一个换行结束。

## 任务起手 checklist

开始任何实质工作前，按顺序完成：

1. 读取本文件和“新会话必读”，再按当前任务加载相关专题文档。
2. 先初始化可移植本地路径，再把 `$main_worktree` 视为主工作区。非默认安装可以通过 `DSH_AUTO_MODE_ROOT` 和 `CODEX_TOOLS_DIR` 覆盖：
   ```bash
   main_worktree="${DSH_AUTO_MODE_ROOT:-$HOME/dsh-auto-mode}"
   codex_tools_dir="${CODEX_TOOLS_DIR:-$HOME/.codex/bin}"
   cd "$main_worktree"
   git status --short --branch
   sh "$codex_tools_dir/codex-git-read" branch-current
   ```
3. 修改文件前，主工作区必须是 clean `main`。若不是，停止并报告；不得把已有改动带入新任务。
4. 只读核对远端 `main` 与本地 `main`。远端不可达、SHA 不一致或默认分支异常时停止并请求同步授权，不从未知基线继续：
   ```bash
   git rev-parse main
   git ls-remote --symref origin HEAD
   git ls-remote origin refs/heads/main
   ```
5. 每个修改文件的任务都从 clean、已核对的 `main` 创建独立 `codex/<task-slug>` 分支和 worktree。维护者已长期授权通过受限 `codex-worktree add` 包装命令创建，今后直接执行，不再询问。若运行环境已经为本任务提供独立 worktree，不创建嵌套 worktree。
6. 明确任务类型：规范/文档、AA catalog、语义判断、插件实现、DSH 扩展点调研、可选评估、自适应执行、恢复机制、委派适配或发布。
7. 先查仓库和 DSH 现状，再问用户。能从代码、文档和已记录决策得到的事实不重复询问。
8. 将新结论归为已确认规范、Proposed 决策、证据、开放问题或当前进度，并写入权威文件。
9. 开工前检查是否触碰产品关键不变量或“何时必须停下来问用户”。

## Worktree 使用方法

`.worktrees/` 是仓库内已忽略的临时 worktree 容器。所有路径都使用相对路径和受限包装器，不直接运行裸 `git worktree add/remove` 或宽泛 `git switch`。

从主工作区创建任务 worktree。如果当前 shell 尚未执行任务开始清单中的可移植变量初始化，先执行初始化：

```bash
main_worktree="${DSH_AUTO_MODE_ROOT:-$HOME/dsh-auto-mode}"
codex_tools_dir="${CODEX_TOOLS_DIR:-$HOME/.codex/bin}"
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" add \
  -b codex/<task-slug> \
  .worktrees/<task-slug>/workspace \
  main
```

后续命令和文件修改都在：

```text
$main_worktree/.worktrees/<task-slug>/workspace
```

规则：

- 使用受限包装命令创建所需 `codex/<task-slug>` 分支和 worktree 已获长期授权，不要逐任务请求确认。
- 一个 worktree 只承载一个任务；分支名与 task slug 对应。
- 不在主工作区 `main` 直接开发。
- 不在任务 worktree 中混入其他任务或用户已有改动。
- 不创建嵌套 worktree。
- 不用 worktree 目录存放未纳入 Git 的长期交付物。
- worktree dirty 时不得移除；不得使用强制删除绕过检查。

需要切换受控分支时使用：

```bash
sh "$codex_tools_dir/codex-worktree" switch <branch>
```

任务 worktree clean、其提交已合入 `main` 且第 9 步已经核验远端 `main` 后，直接自动移除：

```bash
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" remove \
  .worktrees/<task-slug>/workspace
rmdir "$main_worktree/.worktrees/<task-slug>"
```

`codex-worktree remove` 会删除 Git worktree 目录，但会刻意保留任务容器目录。紧接着必须用只会在目录为空时成功的 `rmdir` 删除该容器。若 `rmdir` 失败，保留容器并报告其内容；不得改用递归删除。自动移除只适用于当前任务已干净且已合入的 worktree。不得移除 dirty 或未合入的 worktree，也不得使用 force。删除本地任务分支、prune 或任何强制操作仍需要单独授权。绝不 force-push `main`。

## 任务完成 checklist

完成任何改动后，按顺序检查：

1. 按“文档维护纪律”判断需要同步的权威文件；即使无需同步，也明确判断。
2. 运行与改动表面匹配的验证。纯文档改动至少执行：
   ```bash
   git diff --check
   git diff --cached --check
   rg -n '^(<<<<<<<|=======|>>>>>>>)' .
   ```
3. 修改文档导航时检查所有本地相对链接；修改术语或公共类型提案时检查引用位置是否同步。
4. 使用受限只读包装器审查 working diff；暂存后再审查 staged diff：
   ```bash
   sh "$codex_tools_dir/codex-git-read" diff
   sh "$codex_tools_dir/codex-git-read" diff --staged
   ```
5. 只 stage 本任务文件，检查无关改动、临时文件、密钥、token、`.env`、private key 和敏感 prompt 内容。
6. 校验通过后直接创建原子 commit，不再逐任务请求确认。Commit message 使用英文 Conventional Commits。校验失败、暂存范围不明确，或 staged diff 含无关/敏感内容时不得提交。提交后确认任务 worktree clean，并记录分支和 commit SHA：
   ```bash
   git status --short --branch
   git rev-parse HEAD
   ```
7. Commit 完成后直接把当前任务分支 push 到 `origin`，不再逐任务请求确认。只能执行普通 fast-forward push，禁止 force-push。远端任务分支已分叉或 push 被拒绝时停止并报告，不得改写历史：
   ```bash
   task_branch="$(git branch --show-current)"
   git ls-remote origin "refs/heads/$task_branch"
   git push -u origin HEAD
   git ls-remote origin "refs/heads/$task_branch"
   ```
8. 任务分支 push 且任务 worktree clean 后，直接合入并 push `main`，不再逐任务请求确认。在 clean 主工作区中，必须确认本地 `main` 与远端 `main` 完全一致，并且只允许 fast-forward。远端不可达、合入期间任一 SHA 变化或 `--ff-only` 失败时停止；不得改用 merge commit、rebase、reset、force-push 或任何历史改写绕过：
   ```bash
   task_branch="$(git branch --show-current)"
   task_commit="$(git rev-parse HEAD)"
   test "$(git ls-remote origin "refs/heads/$task_branch" | awk '{print $1}')" = "$task_commit"
   cd "$main_worktree"
   test "$(git branch --show-current)" = main
   local_main="$(git rev-parse main)"
   remote_main="$(git ls-remote origin refs/heads/main | awk '{print $1}')"
   test -n "$remote_main" && test "$local_main" = "$remote_main"
   test "$(git rev-parse main)" = "$local_main"
   git merge --ff-only "$task_branch"
   test "$(git rev-parse main)" = "$task_commit"
   test "$(git ls-remote origin refs/heads/main | awk '{print $1}')" = "$remote_main"
   git push origin main
   ```
9. Push `main` 后核对本地 `main` 与远端 `main` SHA 完全一致，并确认任务 commit 是远端 ancestor；未完成远端核验不得声称已发布：
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor "$task_commit" main
   ```
10. 第 9 步成功后，通过 `codex-worktree remove` 自动移除当前任务干净且已合入的 worktree，随后用 `rmdir` 删除其空的 `.worktrees/<task-slug>` 容器。若 worktree dirty、尚未合入、不存在，或任一步移除失败，则保留余下路径并报告准确原因；不得使用 force 或递归删除。未经单独授权不得删除本地任务分支。

## 何时必须停下来问用户

以下事项不能自行决定：

- 改变质量基线、优化目标顺序、首要用户或首要成功指标。
- 将 `Proposed` ADR 改为 `Accepted`，或推翻已接受 ADR。
- 引入新的外部依赖、远程服务、遥测上传、账户体系或发布流程。
- 修改 DSH 核心扩展点、Session 持久格式或上游公共 API。
- 放宽父 Agent 权限、abstain 条件、episode 释放条件或恢复安全边界。
- 自动创建、恢复或删除工作区 checkpoint，或处理非文件外部副作用。
- 删除/重命名公共文档、事件、配置或用户可见接口。
- 未经本次明确授权就删除分支、删除 dirty 或未合入的 worktree、修改 remote、amend/改写 commit、rebase、reset、force-push、创建非 fast-forward merge，或以其他方式改写已发布历史。校验通过后的原子 commit、普通任务分支 push、带保护的 fast-forward 合入并 push `main`，以及移除当前任务干净且已合入的 worktree，已获得维护者长期授权。

## 当前硬阻塞

阶段 1 已无剩余阻塞。Task 4 所需的当前阶段 2 决策及后续阶段问题维护在 `PROJECT_STATUS.md` 和 `docs/open-questions.md`；不要在这里复制完整清单。

## 安全边界

- 不提交密钥、token、`.env`、private key、账号信息或敏感 prompt 内容。
- 不用裸 Git 回滚实现产品工作区恢复。
- 不允许父 Agent 默认绕过 Routing Policy 指定任意 provider/model。
- 任何进入模型上下文的恢复指令都必须通过可持久化通道记录。
- 不把临时生成物写入项目根目录；使用任务独立的 `$TMPDIR` 子目录。
