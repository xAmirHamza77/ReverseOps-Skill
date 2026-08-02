---
name: cloud-k8s
description: Use for authorized cloud, container, and Kubernetes security assessment including metadata SSRF, IAM misconfig, container escape paths, and cluster RBAC review.
---

# Cloud / Container / Kubernetes Security

## ACTION REQUIRED (execute immediately after reading)

1. `NOW`: Read `../field-journal/precedent-pentest.md` — **cloud/K8s testing requires written authorization**
2. `NOW`: case-init + scope; define account boundaries clearly; destructive operations are prohibited
3. `NOW`: Confirm this is cloud metadata/container/K8s/IAM work, not generic web scanning (for the latter use `pentest-tools/`)
4. `NEXT`: tool-index; kubectl/aws/gcloud, etc. usually require manual installation
5. `ACT`: Start from "identity and attack surface"; full-network scanning by default is prohibited

## Applicable Scenarios

- Cloud metadata SSRF (169.254.169.254 / IMDS)
- IAM excessive permissions, public storage buckets, misconfigured security groups
- Docker/containerd escape path assessment
- Kubernetes RBAC, Secrets, Admission, supply-chain images
- Container image vulnerabilities (can be combined with `supply-chain-security/`)

## Workflow

### Phase 1 — Identity & Boundaries

```text
□ Current identity: cloud AK/SK, K8s SA, node SSH?
□ Scope: single account / single cluster / single namespace
□ Network profile: authorized_target_only
```

### Phase 2 — Cloud Control Plane

```bash
# Examples (substitute per vendor; MUST be within the authorized account)
aws sts get-caller-identity
aws s3 ls
# Azure / GCP equivalent identity commands
```

```text
□ Public buckets / incorrect ACLs
□ Metadata: IMDSv1 vs v2; SSRF chains
□ Assumable roles (PassRole) and lateral movement
```

### Phase 3 — Containers

```text
□ Whether privileged / hostPath / hostNetwork
□ capabilities (SYS_ADMIN, etc.)
□ Writable host paths → escape candidates
□ Image history and known CVEs → Trivy
```

### Phase 4 — Kubernetes

```bash
kubectl auth can-i --list
kubectl get pods,secrets,svc -A
kubectl get clusterrolebindings
```

```text
□ SA token mounting and permissions
□ Missing dangerous admission webhooks
□ etcd / dashboard exposure
□ Whether network policies allow-all by default
```

## Toolchain

| Tool | Purpose | Bootstrap |
|------|---------|-----------|
| kubectl | Cluster interaction | Manual |
| trivy | Images/IaC | bootstrap `trivy` if available |
| kube-bench / kubeaudit | CIS/config | Manual |
| pacu / scoutsuite | Cloud audit (authorized) | Manual |
| nuclei | Known cloud vulnerability templates | bootstrap nmap/nuclei ecosystem |

## References

- `references/k8s-cloud-checklist.md`
- CTF counterpart: `../../CTF-Sandbox-Orchestrator/competition-agent-cloud/`
- `../supply-chain-security/` `../pentest-tools/`

## Routing Context

**Upstream**: MASTER R23  
**Downstream**: obtained node shell → `attack-chain` / `windows-ad`; image vulnerabilities → supply-chain  
**MUST NOT**: scan other tenants on public cloud without authorization

## Task Completion Checklist

- [ ] Was the work limited to the authorized account/cluster?
- [ ] Do findings include reproduction steps and impact?
- [ ] Were destructive operations avoided?
- [ ] Report / journal?