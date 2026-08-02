# SBOM + SCA methodology

## SBOM 标准对比

| 标准 | 格式 | 生态 | 推荐scenario |
|------|------|------|---------|
| SPDX | JSON/YAML/tag-value | Linux Foundation、Yocto | License合规priority |
| CycloneDX | JSON/XML | OWASP、Kubernetes | 安全分析priority |
| SWID | XML | ISO 标准 | 企业资产管理 |

## SBOM generateToolchain

```bash
# cdxgen: 从源码generate CycloneDX SBOM
cdxgen -o bom.json -t cyclonedx

# Syft: 从container/file系统generate
syft nginx:latest -o spdx-json > sbom.spdx.json

# SBOM-Tool: 微软Toolchain
sbom-tool generate -b ./build -bc ./src -pn MyApp -pv 1.0
```

## SCA tool对比

| tool | free | 速度 | 数据库 | 可达性 |
|------|:--:|------|--------|:--:|
| OSV-Scanner | ✅ | 极快 | OSV.dev | ❌ |
| Trivy | ✅ | 快 | 多源 | ❌ |
| Dependency-Track | ✅ | 中 | NVD+OSV+GitHub | ❌ (需plugin) |
| Snyk | ❌ | 中 | 专有 | ✅ |
| CodeQL | ✅ | 慢 | 代码级 | ✅ |

## vulnerabilitypriority级policy

```
CVSS ≥ 9.0 + 有公开 PoC + 可达 → P0 immediatelyremediation
CVSS ≥ 7.0 + 有 PoC + 可达 → P1 本周remediation
CVSS ≥ 7.0 + 无 PoC 或不可达 → P2 下个迭代remediation
其余 → 按常规process
```

## 手工验证三步法

```bash
# 1. 确认version（不要盲信 SBOM 字段）
# container内: dpkg -l | grep <package>
# Node: cat node_modules/<pkg>/package.json | jq .version
# Python: pip show <package>

# 2. 确认vulnerability
# 搜索 CVE: https://osv.dev / https://nvd.nist.gov
# 查看受影响versionscope
# 找到 GitHub Advisory / oss-security 邮件列表

# 3. 验证影响
# 搜索公开 PoC: GitHub/Exploit-DB
# 分析利用条件: 是否需要authentication/本地访问/特定configuration
# 在隔离environment验证: docker run --rm -it vulnerable-image bash
```

## 持续monitoring

```yaml
# 每日 SBOM update + 扫描
schedule:
  - cron: "0 6 * * *"  # 每天早上 6 点
    steps:
      - cdxgen -o bom.json
      - osv-scanner scan --sbom bom.json
      - trivy fs --exit-code 1 --severity CRITICAL .
```

Source: OWASP CycloneDX, SPDX, Google OSV, CISA SBOM Guidance
