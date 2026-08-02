# Code Audit Checklist (Compact)

- [ ] Inventory of all external input entry points
- [ ] Authentication/auth-middleware coverage
- [ ] Whether multi-tenant IDs are bound to sessions
- [ ] Deserialization / pickle / YAML load
- [ ] SSRF egress and protocol restrictions
- [ ] Key and token storage
- [ ] File upload paths and types
- [ ] Dangerous exec/system/Runtime calls