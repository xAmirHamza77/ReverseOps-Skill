# CI/CD 管道安全审计

## 管道attack surface

```text
威胁模型（STRIDE）:
□ 欺骗: 伪造build/signature/来源
□ 篡改: modify源代码/build产物/dependency
□ 否认: 无审计log的恶意operation
□ information disclosure: 管道log/build产物泄漏key
□ 拒绝服务: 耗尽 CI 资源/破坏build
□ permission提升: Runner 逃逸/key窃取
```

## 审计manifest

### 1. Pipeline as Code configuration

```yaml
# GitHub Actions 审计要点
# ❌ 危险模式
on:
  pull_request_target:  # 可访问 secrets 的 PR 触发
    types: [opened]

# ❌ scriptinjection
- run: echo "${{ github.event.issue.title }}"  # 用户input → shell

# ❌ 不受限的 token permission
permissions: write-all

# ✅ 安全模式
on:
  pull_request:  # 无 secrets 访问
    types: [opened]

# ✅ 固定到 SHA
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683

# ✅ 最小permission
permissions:
  contents: read
```

### 2. key管理

```bash
# 扫描历史提交中的key
gitleaks detect --source . --verbose
trufflehog git file://. --only-verified

# 检查 Actions Secrets 使用
gh secret list
# 确认: 无硬编码key、定期轮换、最小permission

# run时keyinjection
# ✅ 使用 OIDC 替代长期key
# ✅ Secrets 仅在需要时暴露到特定step
```

### 3. build完整性

```bash
# buildattribution
# generate不可篡改的build记录（SLSA L2+）
slsa-provenance generate --source . --output provenance.json

# 产物signature
cosign sign-blob --key cosign.key artifact.tar.gz

# 验证
cosign verify-blob --key cosign.pub --signature artifact.tar.gz.sig artifact.tar.gz
```

### 4. Runner 安全

```text
□ 是否使用 GitHub-hosted runner？（推荐，每次全新environment）
□ Self-hosted runner: 是否在隔离的 VM/container中run？
□ 是否run过 fork PR？（self-hosted runner risk极高）
□ Runner 是否有network出站限制？
□ build缓存是否可能跨build泄漏？
```

### 5. dependency拉取安全

```text
□ npm: package-lock.json 是否提交？ forbidden --force / --legacy-peer-deps
□ pip: requirements.txt 是否冻结version？ forbidden pip install <未验证来源>
□ Docker: FROM 是否固定 digest？ forbidden latest tag
□ Go: go.sum 是否提交？
□ 私有包: 注册表authentication是否用短期 token？
```

## automatic化检查 Pipeline

```yaml
# .github/workflows/supply-chain.yml
name: Supply Chain Security
on: [push, pull_request]

jobs:
  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: SBOM Generate
        run: |
          npm install -g @cyclonedx/cdxgen
          cdxgen -o sbom.json
      
      - name: OSV Scan
        run: |
          go install github.com/google/osv-scanner/cmd/osv-scanner@latest
          osv-scanner scan --sbom sbom.json --format sarif > osv-results.sarif
      
      - name: Trivy Scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: CRITICAL,HIGH
          exit-code: 1
      
      - name: Secret Scan
        run: |
          docker run --rm -v $PWD:/src ghcr.io/gitleaks/gitleaks:latest \
            detect --source /src --verbose
      
      - name: Dependency-Track Upload
        run: |
          curl -X POST https://dtrack.example.com/api/v1/bom \
            -H "X-Api-Key: ${{ secrets.DTRACK_API_KEY }}" \
            -F "autoCreate=true" -F "project=myapp" -F "bom=@sbom.json"
```

Source: SLSA Framework, OWASP CI/CD Top 10, GitHub Security Lab
