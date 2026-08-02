---
name: supply-chain-security
description: Use for software supply-chain security assessment covering SBOM, SCA, CI/CD pipelines, container images, build integrity, dependency provenance, and vulnerability reachability.
---
# Supply Chain Security Testing

## ACTION REQUIRED（读完后立刻execute）

1. `NOW`: read `../field-journal/precedent-pentest.md` — 确认本 skill 的operation是已authorization的常规operation
2. `NOW`: 确认当前task是否hit本 skill 的适用scope
3. `NEXT`: read `../tool-index.md`，checksumtoolavailable性和实际path
4. `NEXT`: 缺tool时调用 bootstrap，不要猜path
5. `ACT`: 进入"工作流"第一步并execute，不要停在确认status

> SBOM / SCA / CI/CD 管道 / dependencyattribution
> 法规driver：美国行政令 SBOM、中国国标、EU CRA

## Use Cases

- 软件supply chain安全评估
- open sourcedependencyvulnerability扫描与验证
- CI/CD 管道安全审计
- container镜像安全分析
- 第三方component合规审查
- build产物attribution与完整性验证

## 六层supply chain治理framework

```text
Layer 1: 源码信任评估 → 上游仓库/维护者/发布历史审查
Layer 2: build管道集成 → CI/CD 安全门禁、signature验证
Layer 3: 制品分发完整性 → signature、checksum和、SBOM 附加
Layer 4: run时保护 → container扫描、准入控制
Layer 5: 持续monitoring → CVE 实时追踪、vulnerability可达性分析
Layer 6: 事件response → supply chain攻击应急、回滚policy
```

## 工作流

### 1. SBOM generate与审计

```text
generate SBOM：
□ CycloneDX 格式: cdxgen → bom.json
□ SPDX 格式: sbom-tool generate
□ Syft: syft <image|dir> -o spdx-json

审计要点：
□ 是否存在未知/unauthorized的dependency
□ 是否存在已废弃/stop维护的包
□ License冲突detection
□ 直接dependency vs 传递dependencymanifest
□ 每个component的发布timeline和维护者status
```

### 2. 软件组成分析（SCA）

```bash
# OSV-Scanner（free、Google 维护）
osv-scanner scan -r . --format json

# OWASP Dependency-Track（企业级持续monitoring）
docker run -p 8080:8080 dependencytrack/apiserver
# → upload SBOM → automaticmatch NVD/OSV/GitHub Advisory

# Snyk（commercial）
snyk test --all-projects
snyk monitor  # 持续monitoring

# Trivy（container + dependency + IaC）
trivy fs .          # file系统扫描
trivy image nginx   # container镜像
trivy config .      # IaC configuration
```

### 3. vulnerability可达性验证

```text
SCA alert ≠ 实际risk！大多数 SCA tool只有 ~15% 的alert是实际可达的。

验证step：
1. 用 Dependency-Track 或 Trivy 获取 CVE 列表
2. 筛选 CVSS ≥ 7.0 的vulnerability
3. 对有 PoC 的 CVE 做可达性分析
   - Code Property Graph 切片: 追踪用户input到vulnerability函数的path
   - DEPTEX 方法: EPD (Execution Path Dominance) + LLM 语义验证
4. 在隔离environment中验证 PoC
5. 对可达的vulnerability按实际影响排序remediationpriority级
```

tool参考：
- CodeQL: GitHub 代码查询 → 数据流分析
- Snyk Code: 可达性标记
- DEPTEX: LLM 辅助上下文感知risk评估

### 4. CI/CD 管道安全

```text
安全检查点：
□ 代码提交 → pre-commit hook: gitleaks (key扫描)
□ PR phase → SCA 扫描 (Trivy/OSV-Scanner)
□ buildphase → 制品signature (cosign)
□ 推送phase → SBOM 附加 (syft + attest)
□ deploymentphase → 准入控制 (OPA/Kyverno + 镜像扫描)
□ run时 → 持续vulnerabilitymonitoring (Dependency-Track)

管道自身安全：
□ Pipeline as Code 审计（GitHub Actions / GitLab CI configurationinjection）
□ Runner 隔离（防止恶意build突破container）
□ key管理（Actions Secrets / Vault，forbidden硬编码）
□ 第三方 Action 审查（锁定 commit SHA，非 tag）
```

### 5. container镜像安全

```bash
# Dockerfile 审计
hadolint Dockerfile

# 镜像扫描（多层：OS + 应用dependency + configuration）
trivy image --severity HIGH,CRITICAL nginx:latest

# 最小基础镜像
# priority: distroless → alpine → slim → 避免 latest
docker scout quickview nginx:latest

# 镜像signature
cosign sign --key cosign.key myimage:tag
cosign verify --key cosign.pub myimage:tag
```

### 6. 第三方dependency审查

```text
新增dependency Checklist：
□ 维护status：最近 6 个月有提交？维护者活跃度？
□ 安全历史：过去有无被植入恶意代码？
□ dependency树：引入后新增多少传递dependency？
□ License：与项目License兼容？
□ 替代方案：有无更安全的替代（Snyk Advisor / Socket.dev 评分）？

risk评估矩阵：
  高维护 × 低dependency数 × 兼容License → 低risk
  低维护 × 高dependency数 × License冲突 → 高risk
```

## Toolchain

| tool | 用途 | 获取 |
|------|------|------|
| OWASP Dependency-Track | 企业级持续 SCA | `docker pull dependencytrack/apiserver` |
| OSV-Scanner | free SCA（OSV.dev 生态） | `go install github.com/google/osv-scanner` |
| Trivy | 镜像 + dependency + IaC 扫描 | `apt install trivy` |
| Syft | SBOM generate | `curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh` |
| cdxgen | CycloneDX SBOM generate | `npm install -g @cyclonedx/cdxgen` |
| Cosign | containersignature | `go install github.com/sigstore/cosign/v2/cmd/cosign` |
| Gitleaks | key/credential扫描 | `go install github.com/gitleaks/gitleaks/v8` |
| Snyk | commercial SCA + 可达性 | `npm install -g snyk` |
| CodeQL | 代码查询 + 数据流 | GitHub Actions 内置 |

## 参考

- `references/sbom-sca-methodology.md` — SBOM + SCA methodology
- `references/cicd-pipeline-security.md` — CI/CD 管道安全审计


## Task Completion Checklist (MUST pass before claiming completion)

- [ ] 我是否execute了工作流中的每一步（而不是只阅读）？
- [ ] Did I use real tool paths based on `tool-index`?
- [ ] 我是否产出了可复现evidence（command/script/截图/report）？
- [ ] 我是否完成并回写了 RULES 要求的 Checklist 项？
