<!--
translation-source: docs/routerbench.md
translation-source-blob: 2ba07bd48a8b61f0561ac1d912f943abe583b5db
translation-status: current
-->

# 可选评估轨道

[English](../routerbench.md)

## 状态

依据 ADR-010 推迟且为可选。RouterBench 不再是 route admission 或交付 AA 驱动 Auto 的必需条件。

## 目的

如果未来资源允许，聚焦评估可以回答更窄的问题：

- 策略变更是否按预期改变任务级路由？
- 语义 assessor 是否对固定 fixture 保持一致分类？
- 可观察失败后的升级是否改善完成结果？
- Session 内切换是否值得其复杂度？
- AA 快照或 normalization 变化是否导致明显回归？

这些套件评估本产品行为，不取代 AA 作为主流模型能力、价格和延迟比较的维护来源。

## 没有 RouterBench 时仍必需的测试

正常产品开发仍需以下确定性测试：

- 模型键规范化和 effort mismatch；
- 多条带日期 AA 记录的最新记录选择；
- 能力档编译；
- 价格优先、延迟第二的稳定排序；
- Task Assessor schema、timeout、低置信度和无效输出 fallback；
- 选择／请求／显示一致；
- Manual 不受影响；
- 持久解释和 route 变化展示。

这些是正确性与回归测试，不是某个模型普遍优于另一个模型的证据。

## 未来可能的套件

### Assessor fixture suite

一组小型、带版本的编码、研究、写作、架构、安全和模糊 prompt。它校验结构化分类和确定性 fallback，不评估模型质量。

### Policy scenario suite

针对 provider 丢失、catalog 数据缺失、重复失败、升级、Session reload 和父 Agent 约束的事件驱动场景。在线策略和场景 runner 应共享同一纯 policy 实现。

### 聚焦对比研究

具体产品问题值得投入时，可以在窄任务切片上做配对比较。结果必须声明适用范围，不能变成普遍 route 保证。

## 数据纪律

- Fixture 带版本且不含 secret。
- 任务输入与期望 policy trace 分离。
- 记录 model、effort、policy、normalizer、AA snapshot 和环境版本。
- Dogfood 和用户选择是观察值，不是正确标签。
- 不把小型内部套件称为独立模型榜单。

## 与 roadmap 的关系

阶段 1–4 不依赖 RouterBench。只有在阶段 5 以后直接回答某个有边界决策时，评估工作才进入相关范围。它是并行可选轨道，不是 release gate。
