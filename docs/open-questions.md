# Open questions

[简体中文](zh-CN/open-questions.md)

## Must close before implementation planning

1. Which current DSH route, Session-event, and child-agent-constraint extension points can be used directly, and which require upstream changes?
2. Which provider/model/effort combinations belong in the initial Route Profile, and who owns model-capability and ranking data?
3. How should `epsilon`, `delta`, minimum sample size, and fixed-strong rules for high-risk categories be set?
4. How does the initial RouterBench task suite avoid covering only mechanically verifiable coding tasks?
5. Does Task Assessor need a model? If so, what are its fixed configuration, maximum latency, and low-confidence threshold?
6. Which task attributes and evidence may decision logs expose without recording sensitive prompts or code?

## Recovery

1. Which tools can expose structured validation, mutation, and diff signals?
2. How should failure fingerprints avoid merging distinct failures into one episode?
3. Which release policies are fully mechanically verifiable, and which need Recovery Assessor?
4. How can Continue injection avoid expanding context and reinforcing incorrect hypotheses?
5. Should Checkpoint Provider use isolated worktrees, a copy-on-write filesystem, or a DSH sandbox backend?
6. How do non-file side effects—databases, remote APIs, messages, and deployments—declare recoverability?
7. How is the atomic relationship between a Session fork and workspace checkpoint persisted?

## Within-turn switching

1. How can policy detect a trusted phase boundary without relying on model self-report?
2. How should remaining work and provider/model switching cost be estimated?
3. How do prompt cache, provider-private state, and reasoning passback constrain cross-model takeover?
4. How should RouterBench calibrate minimum hold time and hysteresis thresholds?

## Child agents

1. Should RoutingConstraints belong to general Agent creation options, Subagent requests, or an independent persistent capability?
2. How should Host independent assessment resolve conflicts with parent-provided risk or latency information?
3. Which semantic routes may a user authorize a parent agent to override?
4. How should “different model family” be defined and verified without claiming false independence?
5. When and at what granularity can external Codex or Claude Code providers switch model and effort?

## Product and ecosystem

1. How much decision detail should users see by default without transparency becoming noise?
2. Is Auto a per-Session switch, a profile default, or a global setting?
3. What defines a real active user: weekly activity, completed Auto tasks, or retained use?
4. How are community Route Profiles signed, versioned, reviewed, and invalidated?
5. Which core seams should be contributed upstream to DSH, and which should remain differentiated plugin capabilities?
