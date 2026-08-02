---
name: radio-sdr
description: Use for authorized RF/SDR security research including signal identification, replay feasibility study in shielded labs, and wireless protocol analysis outside classic Wi-Fi.
---

# RF / SDR Security Research

## ACTION REQUIRED（读完后立刻execute）

1. `NOW`: **频谱与发射受法律严格管制**；仅authorization频段/屏蔽室/实验target
2. `NOW`: scope 写明设备、频段、是否allowed发射（default只收）
3. `ACT`: 只接收识别 → 解调分析 → 实验室复现评估

## Use Cases

- 无线遥控/传感器等非 Wi-Fi RF（authorization）
- ADS-B/遥控等protocol研究（合法接收）
- 与 wifi-wireless 分工：本 skill 偏 **SDR 通用 RF**；Wi-Fi 攻防走 R29

## 工作流

```text
□ 法规与license确认
□ 只收：识别中心频率与调制
□ GNU Radio / URH 分析
□ 重放仅屏蔽室且书面allowed
□ 结论侧重：是否可unauthorized控制 / 加固recommended
```

## Toolchain

| tool | 用途 |
|------|------|
| RTL-SDR / HackRF（合规） | 收发hardware |
| URH / GNU Radio | 分析 |
| Inspectrum | 信号 |

## 参考

- `references/sdr-lab-rules.md`
- `../wifi-wireless/` `../ot-ics/` `../hardware-security/`

## routing上下文

**上游**: MASTER R38  
**MUST NOT**: 干扰公共通信、unauthorized发射

## task完成自检

- [ ] 是否default只收并记录法规边界？
- [ ] Checklist？