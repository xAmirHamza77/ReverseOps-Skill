---
name: identity-federation
description: Use for authorized assessment of federated identity systems including SAML, OIDC, OAuth2 flows, SSO misconfiguration, and token confusion issues.
---

# Identity Federation (SAML / OIDC / OAuth)

## ACTION REQUIRED（读完后立刻execute）

1. `NOW`: read precedent-pentest；SSO Testing账号与 IdP/SP scope入 scope
2. `NOW`: forbidden锁定真实用户账户的暴力尝试
3. `NEXT`: packet capturetool与documentation（元数据 URL）
4. `ACT`: protocol流映射 → 常见错配 → 验证

## Use Cases

- SAML Response signature/断言篡改面（经典缺陷模式）
- OIDC 隐式/authorization码 + PKCE 缺失
- redirect_uri / state / nonce 问题
- IdP 与 SP 元数据、多租户 issuer obfuscation
- 与 `api-security` JWT 攻击互补（本 skill 偏联邦与 SSO 流）

## 工作流

```text
□ 画清：User → SP → IdP → Token → SP
□ 收集：/.well-known/openid-configuration、SAML metadata
□ 检查：redirect_uri 精确match、state 绑定、PKCE
□ 检查：SAML signature覆盖scope、algorithm 降级
□ session固定与登出失效
```

## Toolchain

| tool | 用途 |
|------|------|
| Burp + SAML Raider 等 | 断言编辑（authorization） |
| jwt_tool | JWT 段 |
| 浏览器 DevTools | redirect链 |
| IdP 管理log | 审计 |

## 参考

- `references/sso-flow-checklist.md`
- `../api-security/` `../windows-ad/`（企业 IdP）

## routing上下文

**上游**: MASTER R37  
**下游**: 纯 API JWT → api-security；云 IdP → cloud-k8s

## task完成自检

- [ ] 是否映射完整 SSO 流？
- [ ] 每个 Finding 是否有复现与影响？
- [ ] Checklist？