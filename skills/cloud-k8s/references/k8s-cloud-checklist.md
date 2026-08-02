# Cloud / K8s Checklist (Compact)

## IMDS
- [ ] Whether SSRF can reach 169.254.169.254
- [ ] Whether IMDSv2 is enforced
- [ ] Permission surface of the returned IAM role

## K8s High-Risk
- [ ] Excessive cluster-admin bindings
- [ ] Secrets in plaintext environment variables
- [ ] privileged + hostPID/hostPath combinations
- [ ] Anonymous auth / insecure apiserver port

## Containers
- [ ] Running as root
- [ ] Loadable kernel modules / docker.sock mount