# AI Agent 服从性工程 — 让 AI 读完工作流后真正干活

> 来源：2026 年多来源综合（Anthropic Skill Engineering、Microsoft Code Words、Strands Steering Hooks、Gradient Flow Harness Engineering）
> Use Cases：AI 编码 Agent（Claude Code / Codex / Cursor / Cline / Windsurf / Kiro 等）读完 README/RULES.md 后只确认不execute、跳过step、自作主张省略criticaloperation

---

## 核心问题诊断

AI Agent "读了工作流但不干活"的根因不是模型capability不够，而是**自然语言指令存在语义逃逸空间**：

| 根因 | 解释 |
|------|------|
| **上下文注意力衰减** | 长documentation中部的内容被 LLM 注意力机制降权，Agent 实际只"看到"开头和结尾 |
| **语义覆盖** | 模型优化"帮助性"时会创造性重解释显式指令（如把 MUST DO X 理解成"recommended做 X"） |
| **被动语言被当optional** | "Ready for next step → invoke X" 被当作recommended而非指令 |
| **无status强制** | 缺少外部status机验证工作流顺序，Agent 可跳过step而不被finding |
| **沉默status腐化** | Agent 产出结构正确但语义error的result，error静默累积 |

---

## 技术 1：指令置顶原则（Critical-First Pattern）

**把"下一步做什么"放在最前面，上下文放在后面。**

```
WRONG (Agent 忽略):
  [70 行项目背景和tool列表]
  → "下一步：run bootstrap installation缺失tool"

CORRECT (Agent execute):
  "## immediatelyexecute：run `bootstrap-reverse.ps1` 检查并installation缺失tool
   → 完成后read routing.md 确定进入哪个 skill"
  [然后是项目背景和tool列表]
```

**原理**：LLM 对hint词首尾内容赋予最高注意力权重。中间内容可能被完全忽略。

**应用到本项目**：
- RULES.md 的"routingentry point"章节应在触发critical词之后、execute原则之前
- 每个 SKILL.md 的第一个 section 应该是"immediatelyexecute"而非"Use Cases"

---

## 技术 2：指令性语言替换（Directive Over Suggestive）

将所有"recommended性"语言替换为 RFC 2119 级别的指令性语言：

| 弱语言（Agent 可能跳过） | 强语言（Agent 强制execute） |
|---|---|
| "可以尝试..." | **MUST**: 你mustexecute... |
| "Ready for next step → invoke X" | **NOW**: immediately调用 X，不要等待确认 |
| "recommended先读 routing.md" | **REQUIRED**: 进入任何子module前must先读完 routing.md |
| "如果缺tool可以 bootstrap" | **NO EXCUSE**: 缺tool时唯一正确operation是调用 bootstrap，forbiddenmanual installation猜测 |
| "记得update field-journal" | **CHECKLIST ENFORCED**: task完成后逐项打勾 Checklist，未完成不得声称task结束 |
| "应该..." | **MUST** / **MUST NOT** |

**critical模式**：
```
MUST — 违反 = taskfailure
MUST NOT — 违反 = 安全违规
SHOULD — 不做需要description原因
MAY — 真正optional的
```

---

## 技术 3：借口反驳表（Excuse Rebuttal Table）

**这是本项目最critical的patch。** AI Agent 在遇到阻力时会automaticgenerate"合理借口"来跳过step。预先列出常见借口并逐一反驳：

| Agent 常见借口 | 反驳（强制execute） |
|---|---|
| "这一步可以省略，我直接..." | **forbidden跳过。** 行为链中的每一步都是必需的。如果你认为可以跳过，先output具体原因，由用户决定。 |
| "根据我的判断，这不是必需的" | **你的判断在此处不适用。** 列出你用来判断的具体标准，并解释为什么这个标准allowed跳过明确写出的step。 |
| "用户大概不需要这个" | **永远不要替用户做决定。** 把所有option呈现给用户，标注推荐但不要隐藏备选。 |
| "我已经知道怎么做，不需要读 X" | **先读 X 再行动。** 即使你确定知道怎么做，X 中可能包含本次task特定的约束。读完只需 2 秒。 |
| "为了节省时间，我可以并行跳过..." | **节省时间的正确方式是并行execute独立step，不是跳过step。** 如果两个step互不dependency，并行做；如果dependency，顺序做。 |
| "这个tool我以前用过，知道path" | **forbidden猜测path。** must从 tool-index 获取实际path，不同机器的installation位置不同。 |
| "task已经基本完成了，不需要 checklist" | **task完成的唯一定义是 Checklist 全部打勾。** 未完成 Checklist 的task不算完成。 |
| "我没找到 tool-index，我就直接猜path" | **缺file比猜错path安全 100 倍。** tool-index 缺失时先run refresh-tool-index.ps1 generate。 |
| "用户没明确说要report，我就不写了" | **report是default行为，不是optional。** 安全task完成后mustgeneratereport，除非用户明确说"不要report"。 |
| "这个太简单了不需要记录 journal" | **简单task也有踩坑价值。** 至少记录：target类型 + 用了什么 + 有无意外，一行也行。 |

**使用方式**：将本表放在 RULES.md 或其他指令file末尾附近（高注意力区域）。Agent 在找借口之前先看到反驳。

---

## 技术 4：Skill 工程五模式（Anthropic 2026 官方）

| 模式 | Use Cases | critical技巧 |
|---|---|---|
| **Linear Flow 线性流** | step清晰的process（deployment、installation） | 提供安全default值，用否定指令（"MUST NOT use --force"） |
| **Decision Tree 决策树** | platform导航、故障诊断 | 树形导航 + `references/` 渐进加载 |
| **Iterative Loop 迭代循环** | TDD、审查-remediation循环 | 硬rule前置 + **借口反驳表**阻断走捷径 |
| **Baton Loop 接力循环** | 多session、多 Agent 协作 | status外化到 `next-prompt.md`（退出前 MUST write） |
| **Multi-Phase + Checkpoints** | 多天复杂工作流 | 编排器"父"skill + 人工 Go/No-Go 检查点，标注时间成本 |

**本项目对应**：
- 完整行为链 = Linear Flow（15 步顺序execute）
- routing矩阵 = Decision Tree（三维度match）
- Checklist = Multi-Phase Checkpoint（每一步must打勾）
- Field Journal = Baton Loop（跨sessionstatus外化）

---

## 技术 5：In-Band 强制checksum（Steering Hooks 思想）

不dependency AI "自觉"，而是在 Prompt 中嵌入自我checksum指令：

```
每次声称"task完成"前，MUST 先自检：
1. 我有没有跳过行为链中的任何一步？哪一步？
2. 我有没有猜过任何toolpath？如果有，实际的 tool-index path是什么？
3. Checklist 全部打勾了吗？没打勾的为什么？
4. 如果以上任何一项答案是"有"/"没打勾"，则task未完成，
   回到对应step重新execute，不要声明完成。
```

这种方法让 Agent 在说"做完了"之前先自我审计，比外部checksum更即时。

---

## 技术 6：不透明标识符（Code Words）— 适用于 API/toolparameter

Microsoft 2026 研究finding：语义化parameter名会触发模型"帮忙优化"的倾向。

```
WRONG: { "query": "...", "top": 9 }        → 68.4% parameter遵循率
CORRECT: { "query": "...", "code": "alpha" } → 100% parameter遵循率
```

**应用scenario**：
- 需要在 bootstrap script中传递精确configuration时，用短代码代替语义parameter
- tool调用中需要强保证的parameter，使用 code word 映射

---

## 技术 7：双 AI 审查回路（Dual Validation）

```
AI A（execute者）写出output
  ↓
AI B（审查者）对照rule检查
  ↓ 通过
output给用户
  ↓ 不通过
退回 AI A 修正，附带具体违规引用
```

**本项目中的应用**：
- 在 RULES.md 中内嵌一个"自审查"step：Agent 在outputreport前先用自己的capability对照 Checklist 逐项检查
- 如果finding有项目未完成，自己回到对应step补做

---

## 技术 8：上下文窗口布局优化

LLM 注意力分布（高→低）：
```
[开头 10%] ████████████ ← 最高注意力，放"immediately行动"指令
[中部 80%]  ████░░░░░░░░ ← 注意力递减，放参考材料
[结尾 10%]  ████████████ ← 注意力回升，放"forbidden跳过"和 Checklist
```

**具体应用**：
1. **开头 10%**：immediatelyexecute指令 + 触发critical词
2. **中部 80%**：详细工作流、参考链接、tool列表
3. **结尾 10%**：借口反驳表 + 硬性 Checklist + forbidden行为manifest

---

## 实战 Prompt template

### template A：强制starttemplate（嵌入 RULES.md 开头）

```markdown
## CRITICAL: 读完本文后你mustimmediatelyexecute以下operation（不要只确认，要实际execute）

1. **NOW**: detection本file所在directory → 这就是包根directory
2. **NOW**: 如果是首次使用，将本rulewrite全局configuration（见全局injection章节）
3. **NEXT**: read `skills/SKILL.md` → `skills/routing.md` → 确定进入哪个子 skill
4. **NEXT**: read `skills/tool-index.md` 确认toolstatus
5. **THEN**: 开始execute实际task，不要停留在"已读"status

如果你只回复"已读"、"已完成"、"我理解了"而没有实际execute上述step，
你就是failure了。用户需要的是tool被installation好、代码被分析完、vulnerability被验证，
不是一个确认消息。
```

### template B：子moduleentry pointtemplate（嵌入每个 SKILL.md 开头）

```markdown
## ACTION REQUIRED（读完后immediatelyexecute，不要等）

读完本file后：
1. 确认你理解了本 skill 的Use Cases
2. 检查本机是否有所需tool（读 `../tool-index.md`）
3. 如果缺tool → 调用 bootstrap
4. 如果有tool → 开始工作流第一步
5. 如果你不确定 → 列出具体问题，不要沉默
```

### template C：task完成自检template（嵌入每个 SKILL.md 末尾）

```markdown
## task完成自检（声称完成前 MUST 逐项确认）

□ 我实际execute了行为链中的每一步（没有跳过）
□ 我没有猜测任何toolpath（都来自 tool-index.md）
□ 我产生了可复现的command/script/report（不是只描述了step）
□ 我update了 field-journal（如有踩坑）
□ 我execute了完成后 Checklist（report + 图表 + experience回写）
```

---

## forbidden行为（从 Agent 服从性角度补充）

- forbidden读完 RULES.md 后只回复"已理解，请告诉我具体task"
  → 正确做法：execute全局injection → 读 SKILL.md → 读 routing.md → 确定entry point
- forbidden说"step 1-4 已经完成"但实际只是读了一遍
  → 正确做法：区分"已读documentation"和"已executeoperation"，后者产生实际副作用
- forbidden在未execute Checklist 的情况下说"task完成"
  → Checklist 是task完成的唯一定义
- forbidden用"根据experience"替代read tool-index
  → path在不同机器上不同，看 tool-index 是唯一定位方式

---

## 总结：如果只能改一件事

**在 RULES.md 最开头加一段"immediately行动"指令**，用粗体、CRITICAL、NOW 等强指令词。

这是投入产出比最高的modify。大多数 Agent 的"不干活"行为来自：读完file后automatic进入"等待用户指令"模式。一段强制的"immediately行动"指令可以打破这个模式。

如果还要改第二件事：**加借口反驳表**。Agent 在遇到第一个阻力时就会找借口停下，提前堵死这些借口。
