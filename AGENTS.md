# DSH Auto Mode - Agent 上下文

> AI Agent 新会话从这里开始。先读本文件，再按“新会话必读”加载当前任务所需文档。

## 一句话项目定位

为个人重度 Agent 用户提供 DeepSeek Harness 自适应 Auto 模式：在维持固定 `strong` route 质量基线的前提下，根据任务、运行证据和用户约束自动选择模型与 reasoning effort，优先降低延迟，其次降低成本，并在误路由后限制损失和恢复。

## 项目快照

| 项目 | 当前状态 |
|---|---|
| 项目阶段 | 规范评审；尚未进入实施计划、任务拆分或编码 |
| 已有成果 | 产品规范、架构、路由、恢复、委派、RouterBench、路线图、开放问题和 4 项 Proposed ADR |
| 首要用户 | 个人重度 Agent 用户 |
| 首要成功指标 | 持续使用 Auto 的真实活跃用户 |
| 优化顺序 | 固定 strong 质量基线 → 端到端延迟 → 总成本 |
| 核心规范 | `docs/spec.md` |
| 当前进度 | `PROJECT_STATUS.md` |
| 下一阶段入口 | 用户评审规范与 Proposed ADR；通过后才进入实施计划 |

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
- 术语定义：`docs/glossary.md`。
- 某项高代价决策的依据：对应 `docs/decisions/*.md`。

## 当前阶段约束

本项目处于规范评审阶段。在用户确认规范之前：

- 可以修订、审查和补充设计文档。
- 不创建产品代码、依赖、构建配置、CI 或发布流程。
- 不把 `Proposed` ADR 当成已经接受的实现约束。
- 不把路线图阶段直接拆成实施任务；规范评审是进入 planning 的 gate。

## 语言规范

| 场景 | 语言 |
|---|---|
| 与用户讨论 | 中文 |
| 项目设计文档 | 中文 |
| TypeScript 标识符、事件名、配置键 | 英文 |
| commit message | 英文标题；正文可用中英文 |
| 公共英文文档 | 另行设计同步策略后再创建 |

## 产品关键不变量

1. 质量基线优先：每个任务类别以配置的 `strong` route 为基线，先优化端到端延迟，再优化总成本。
2. 不把用户选择、父 Agent override 或模型自我报告当作正确路由标签。
3. Host Routing Policy 拥有常规路由决策权；模型只提供任务意图或可选语义评估。
4. 高风险、分布外或证据不足的任务必须 `abstain`，执行安全 fallback。
5. 自动决策必须可解释、可审计、可恢复；实际 provider/model/effort 和原因必须可持久重建。
6. 同一未解决 episode 内 route floor 只能保持或升级；可信阶段边界后允许在同一 turn 内重新路由和降级。
7. 父 Agent 默认只能提高质量下限或增加语义约束，不能绕过 Routing Policy 指定任意 provider/model。
8. Recovery Supervisor 核心通过形式化事件工作，不建立每 turn 注入 prompt 的自我报告协议。
9. 不用裸 Git 回滚实现工作区恢复；Session checkpoint 与工作区 checkpoint 分别拥有明确语义和所有权。
10. RouterBench 与在线运行使用同一策略实现；辅助评估器、切换、重试和恢复成本进入端到端指标。

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
| 阶段依赖、阶段验收、明确不做 | `docs/roadmap.md` |
| 未决问题 | `docs/open-questions.md` |
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

不要把聊天过程、探索顺序或推理记录直接塞进主文档。主文档只保留当前可执行结论、完整约束、依据、状态和未决问题。

一个设计事实只保留一个权威位置。其他文档通过链接引用，不复制整段定义。旧 ADR 不删除；决策变化时新建 ADR 并标记 supersede 关系。

每个 Markdown 文件以恰好一个换行结束。

## 任务起手 checklist

开始任何实质工作前，按顺序完成：

1. 读取本文件和“新会话必读”，再按当前任务加载相关专题文档。
2. 将 `/Users/wanglei/dsh-auto-mode` 视为主工作区；先确认 Git 状态和当前分支：
   ```bash
   git status --short --branch
   sh /Users/wanglei/.codex/bin/codex-git-read branch-current
   ```
3. 修改文件前，主工作区必须是 clean `main`。若不是，停止并报告；不得把已有改动带入新任务。
4. 只读核对远端 `main` 与本地 `main`。远端不可达、SHA 不一致或默认分支异常时停止并请求同步授权，不从未知基线继续：
   ```bash
   git rev-parse main
   git ls-remote --symref origin HEAD
   git ls-remote origin refs/heads/main
   ```
5. 每个修改文件的任务都从 clean、已核对的 `main` 创建独立 `codex/<task-slug>` 分支和 worktree。若运行环境已经为本任务提供独立 worktree，不创建嵌套 worktree。
6. 明确任务类型：规范/文档、DSH 扩展点调研、RouterBench、插件实现、恢复机制、委派适配或发布。
7. 先查仓库和 DSH 现状，再问用户。能从代码、文档和已记录决策得到的事实不重复询问。
8. 将新结论归为已确认规范、Proposed 决策、证据、开放问题或当前进度，并写入权威文件。
9. 开工前检查是否触碰产品关键不变量或“何时必须停下来问用户”。

## Worktree 使用方法

`.worktrees/` 是仓库内已忽略的临时 worktree 容器。所有路径都使用相对路径和受限包装器，不直接运行裸 `git worktree add/remove` 或宽泛 `git switch`。

从主工作区创建任务 worktree：

```bash
cd /Users/wanglei/dsh-auto-mode
sh /Users/wanglei/.codex/bin/codex-worktree add \
  -b codex/<task-slug> \
  .worktrees/<task-slug>/workspace \
  main
```

后续命令和文件修改都在：

```text
/Users/wanglei/dsh-auto-mode/.worktrees/<task-slug>/workspace
```

规则：

- 一个 worktree 只承载一个任务；分支名与 task slug 对应。
- 不在主工作区 `main` 直接开发。
- 不在任务 worktree 中混入其他任务或用户已有改动。
- 不创建嵌套 worktree。
- 不用 worktree 目录存放未纳入 Git 的长期交付物。
- worktree dirty 时不得移除；不得使用强制删除绕过检查。

需要切换受控分支时使用：

```bash
sh /Users/wanglei/.codex/bin/codex-worktree switch <branch>
```

任务 worktree clean 且其提交已经按授权集成后，使用：

```bash
cd /Users/wanglei/dsh-auto-mode
sh /Users/wanglei/.codex/bin/codex-worktree remove \
  .worktrees/<task-slug>/workspace
```

删除本地任务分支、prune 或任何强制操作都需要单独授权。绝不 force-push `main`。

## 任务完成 checklist

完成任何改动后，按顺序检查：

1. 按“文档维护纪律”判断需要同步的权威文件；即使无需同步，也明确判断。
2. 运行与改动表面匹配的验证。当前规范阶段至少执行：
   ```bash
   git diff --check
   git diff --cached --check
   rg -n '^(<<<<<<<|=======|>>>>>>>)' .
   ```
3. 修改文档导航时检查所有本地相对链接；修改术语或公共类型提案时检查引用位置是否同步。
4. 使用受限只读包装器审查 working diff；暂存后再审查 staged diff：
   ```bash
   sh /Users/wanglei/.codex/bin/codex-git-read diff
   sh /Users/wanglei/.codex/bin/codex-git-read diff --staged
   ```
5. 只 stage 本任务文件，检查无关改动、临时文件、密钥、token、`.env`、private key 和敏感 prompt 内容。
6. 只有用户对本次 Git 写入明确授权时才创建原子 commit。提交后确认任务 worktree clean，并记录分支和 commit SHA：
   ```bash
   git status --short --branch
   git rev-parse HEAD
   ```
7. 只有用户明确授权本次集成和远端写入时，才在 clean 主工作区再次核对远端 SHA，然后执行 fast-forward 合入和 push。远端已移动或 `--ff-only` 失败时停止，不能改用普通 merge 绕过：
   ```bash
   cd /Users/wanglei/dsh-auto-mode
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge --ff-only codex/<task-slug>
   git push origin main
   ```
8. Push 后核对本地 `main` 与远端 `main` SHA 完全一致，并确认任务 commit 是远端 ancestor；未完成远端核验不得声称已发布：
   ```bash
   git rev-parse main
   git ls-remote origin refs/heads/main
   git merge-base --is-ancestor <task-commit-sha> main
   ```
9. 只有任务 worktree clean、提交已按授权集成且远端核验通过，才移除 worktree。未授权 commit、merge 或 push 时，保留现场并报告准确路径和状态。

## 何时必须停下来问用户

以下事项不能自行决定：

- 改变质量基线、优化目标顺序、首要用户或首要成功指标。
- 将 `Proposed` ADR 改为 `Accepted`，或推翻已接受 ADR。
- 从规范评审进入实施计划、任务拆分或编码。
- 引入新的外部依赖、远程服务、遥测上传、账户体系或发布流程。
- 修改 DSH 核心扩展点、Session 持久格式或上游公共 API。
- 放宽父 Agent 权限、abstain 条件、episode 释放条件或恢复安全边界。
- 自动创建、恢复或删除工作区 checkpoint，或处理非文件外部副作用。
- 删除/重命名公共文档、事件、配置或用户可见接口。
- Commit、merge、push、删除分支/worktree 或其他 Git 引用与远端写操作未获得本次明确授权。

## 当前硬阻塞

当前没有实现层面的故障阻塞；进入实施前的设计 gate 和未决问题由 `PROJECT_STATUS.md` 与 `docs/open-questions.md` 维护。不要在这里复制完整清单。

## 安全边界

- 不提交密钥、token、`.env`、private key、账号信息或敏感 prompt 内容。
- 不用裸 Git 回滚实现产品工作区恢复。
- 不允许父 Agent 默认绕过 Routing Policy 指定任意 provider/model。
- 任何进入模型上下文的恢复指令都必须通过可持久化通道记录。
- 不把临时生成物写入项目根目录；使用任务独立的 `$TMPDIR` 子目录。
