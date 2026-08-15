<!--
translation-source: AGENTS.md
translation-source-blob: 2869a80089d623c4ef5531e3c648eb8f43a83be3
translation-status: current
-->

# DSH Auto Mode - Agent 上下文

[English](AGENTS.md)

> AI Agent 新会话从这里开始。先读本文件，再按“新会话必读”加载当前任务所需文档。

## 一句话项目定位

为个人重度 Agent 用户提供 DeepSeek Harness 自适应 Auto 模式：baseline 通过绝对质量门槛后，才根据任务、运行证据和用户约束从已准入 route 中自动选择模型与 reasoning effort；优先降低延迟，其次降低成本，并在误路由后限制损失。

## 项目快照

| 项目 | 当前状态 |
|---|---|
| 项目阶段 | 阶段 0 关键路径执行；A1/A2 已在维护者 DSH fork 上实现并固定版本 |
| 已有成果 | 已接受的产品规范、架构、路由、恢复、委派、RouterBench、DSH 接入证据、路线图、开放问题和 7 项 Accepted ADR |
| 首要用户 | 个人重度 Agent 用户 |
| 首要成功指标 | 持续使用 Auto 的真实活跃用户 |
| 优化顺序 | baseline 绝对质量门槛 + candidate 非劣性 → 端到端延迟 → 总成本 |
| 核心规范 | `docs/spec.md` |
| 当前进度 | `PROJECT_STATUS.md` |
| 下一阶段入口 | 阶段 A 最小准入证据、preview 专用 A3p identity 证据与 A5p 载体核验 |

本表只保存会话定向所需摘要。进度、阻塞和下一步的权威位置是 `PROJECT_STATUS.md`，不要在两处维护完整状态。

## 新会话必读

按顺序读取：

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
- 历史多视角评审证据：`docs/reviews/2026-08-14-multi-view-design-review.md`。
- 术语定义：`docs/glossary.md`。
- 文档语言和翻译同步：`docs/localization.md`。
- 某项高代价决策的依据：对应 `docs/decisions/*.md`。

## 当前阶段约束

维护者已于 2026-08-15 接受规范及 ADR-001 至 ADR-007。阶段 0 关键路径可以在以下约束下实施：

- 已接受的规范和 ADR 是约束，除非后续明确接受替代决策。
- 已实现的 A1/A2 契约必须保持产品无关并固定到已验证 fork commit；DSH Core 不得理解 Auto Mode route 档位、Task Assessment 或 Policy Pack 语义。
- 阶段 0C preview 固定到明确 fork，并保持每 Session 一次路由决策。
- 对应路线图证据 gate 通过前，不得宣称兼容官方 DSH、route 已准入或 preview 已可用。

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

1. 质量优先：baseline 必须先通过绝对质量门槛，candidate 再满足预声明的非劣效界限；之后先优化端到端延迟，再优化总成本。
2. 不把用户选择、父 Agent override 或模型自我报告当作正确路由标签。
3. Host Routing Policy 拥有常规路由决策权；模型只提供任务意图或可选语义评估。
4. 高风险、分布外或证据不足的任务必须 `abstain`；若没有当前已准入的安全配置，返回 `no-safe-route`，不得调用模型。
5. 自动决策必须可解释、可审计；实际 provider/model/reasoning selection、request encoding 和原因必须可持久重建。只有明确声明且测试过的副作用类别才能宣称可恢复。
6. 同一未解决 episode 内 route floor 只能保持或升级；阶段变化后的降级是需要证据准入的能力，不是无条件产品承诺。
7. 父 Agent 约束只是提议。只有 Host 认可的要求或用户明确授权的 override 才成为硬约束；父 Agent 不得静默提高、降低或绕过 Routing Policy 指定任意 provider/model。
8. Recovery Supervisor 核心通过形式化事件工作，不建立每 turn 注入 prompt 的自我报告协议。
9. 不用裸 Git 回滚实现工作区恢复；Session checkpoint 与工作区 checkpoint 分别拥有明确语义和所有权。
10. route 能力评估与生产策略场景评估使用独立数据集和 runner；涉及策略时，RouterBench 与在线运行使用同一 policy core。辅助评估器、切换、重试和恢复成本进入端到端指标。
11. 普通用户只在 `Auto` 与手动 provider/model/reasoning selection 之间选择。默认值、校准、过期和撤销由维护者负责的版本化 Policy Pack 承担；高级 override 只是可选项。
12. 一个模型 step 的 route 必须在依赖 provider 的 prompt/tool 组装之前冻结，并在 `agent/request` 原样应用。

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
6. 明确任务类型：规范/文档、DSH 扩展点调研、RouterBench、插件实现、恢复机制、委派适配或发布。
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

任务 worktree clean 且其提交已经按授权集成后，使用：

```bash
cd "$main_worktree"
sh "$codex_tools_dir/codex-worktree" remove \
  .worktrees/<task-slug>/workspace
```

删除本地任务分支、prune 或任何强制操作都需要单独授权。绝不 force-push `main`。

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
8. 只有用户明确授权合入和发布 `main` 时，才在 clean 主工作区再次核对远端 SHA，然后执行 fast-forward 合入和 push。远端已移动或 `--ff-only` 失败时停止，不能改用普通 merge 绕过：
   ```bash
   cd "$main_worktree"
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge --ff-only codex/<task-slug>
   git push origin main
   ```
9. Push `main` 后核对本地 `main` 与远端 `main` SHA 完全一致，并确认任务 commit 是远端 ancestor；未完成远端核验不得声称已发布：
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor <task-commit-sha> main
   ```
10. 只有任务 worktree clean、提交已按授权集成且远端核验通过，才移除 worktree。尚未授权 merge 时，保留现场并报告准确路径和状态。

## 何时必须停下来问用户

以下事项不能自行决定：

- 改变质量基线、优化目标顺序、首要用户或首要成功指标。
- 将 `Proposed` ADR 改为 `Accepted`，或推翻已接受 ADR。
- 引入新的外部依赖、远程服务、遥测上传、账户体系或发布流程。
- 修改 DSH 核心扩展点、Session 持久格式或上游公共 API。
- 放宽父 Agent 权限、abstain 条件、episode 释放条件或恢复安全边界。
- 自动创建、恢复或删除工作区 checkpoint，或处理非文件外部副作用。
- 删除/重命名公共文档、事件、配置或用户可见接口。
- 未经本次明确授权就合入或 push `main`、删除分支/worktree、修改 remote、amend/改写 commit、rebase、reset、force-push 或以其他方式改写已发布历史。校验通过后的原子 commit，以及把当前任务分支普通 push 到远端，已获得维护者长期授权。

## 当前硬阻塞

当前没有实现层面的故障阻塞；剩余证据 gate 与未决问题由 `PROJECT_STATUS.md` 与 `docs/open-questions.md` 维护。不要在这里复制完整清单。

## 安全边界

- 不提交密钥、token、`.env`、private key、账号信息或敏感 prompt 内容。
- 不用裸 Git 回滚实现产品工作区恢复。
- 不允许父 Agent 默认绕过 Routing Policy 指定任意 provider/model。
- 任何进入模型上下文的恢复指令都必须通过可持久化通道记录。
- 不把临时生成物写入项目根目录；使用任务独立的 `$TMPDIR` 子目录。
