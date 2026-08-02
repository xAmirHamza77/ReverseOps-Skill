# OWASP LLM & Agentic AI Top 10 (2025-2026)

## OWASP Top 10 for LLM Applications v2.0 (2025)

| # | risk | 核心问题 | Testing方向 |
|---|------|---------|---------|
| LLM01 | Prompt Injection | 通过构造input操控模型行为 | 直接injection、间接injection、编码bypass |
| LLM02 | Sensitive Information Disclosure | PII/API Key/训练数据泄漏 | hint词提取、output分析 |
| LLM03 | Supply Chain | 投毒模型/库/数据集 | 模型来源验证、dependency扫描 |
| LLM04 | Data & Model Poisoning | 训练/微调数据后门 | 数据attribution、行为异常detection |
| LLM05 | Improper Output Handling | output导致 XSS/SQLi/RCE | 下游系统injectionTesting |
| LLM06 | Excessive Agency | tool/自主权过大导致实际危害 | permission审计、人在回路Testing |
| LLM07 | System Prompt Leakage | 提取隐藏指令/key/业务逻辑 | 级联提取、canary token |
| LLM08 | Vector & Embedding Weaknesses | RAG 管道攻击、嵌入反转 | 检索投毒、语义相似度攻击 |
| LLM09 | Misinformation | 幻觉在高riskscenario构成安全risk | 事实性验证、置信度校准 |
| LLM10 | Unbounded Consumption | DoS/Denial-of-Wallet | Token 消耗Testing、速率限制 |

## OWASP Top 10 for Agentic Applications (ASI 2026)

| # | risk | 核心危害 | Testing方向 |
|---|------|---------|---------|
| ASI01 | Agent Goal Hijack | 恶意input/tooloutput劫持target | 指令覆盖、target篡改 |
| ASI02 | Tool Misuse & Exploitation | 合法tool的非预期使用 | Toolchain拼接、parameterinjection |
| ASI03 | Identity & Privilege Abuse | Agent privilege escalationoperation | credential窃取、委派链Testing |
| ASI04 | Agentic Supply Chain | MCP 描述符/第三方tool实时risk | 动态supply chain扫描 |
| ASI05 | Unexpected Code Execution | hint→tool→script RCE 链 | 多层代码executeTesting |
| ASI06 | Memory & Context Poisoning | 长期记忆/嵌入投毒 | 记忆持久化攻击 |
| ASI07 | Insecure Inter-Agent Communication | 智能体间通信篡改 | man-in-the-middle、重放攻击 |
| ASI08 | Cascading Failures | 单点故障触发系统级崩塌 | 故障传播Testing |
| ASI09 | Human-Agent Trust Exploitation | 操纵人类operation员批准危险operation | 权威偏差/紧迫感Testing |
| ASI10 | Rogue Agents | Agent 自我复制/持续恶意行为 | 持久化后门detection |

## 实际数据分布

真实评估中finding问题占比：
- LLM01 Prompt Injection: ~45%
- LLM06 Sensitive Info Disclosure: ~20%
- LLM08 Excessive Agency: ~15%
- 其余 7 项: ~20%

## criticaldefense原则

1. 规划与execute分离 — 解释意图的模型 ≠ execute动作的模型
2. 绑定身份/目的/scope/时效 — 不使用宽泛的environmentpermission
3. 记录一切 — tool调用/记忆/通信作为一等安全遥测
4. 爆炸半径控制 — 熔断/回滚/urgentstoppriority于便利性
5. 所有自然语言input（含检索内容）视为不可信
6. output同样不可信 — 渲染/execute/查询前先消毒
