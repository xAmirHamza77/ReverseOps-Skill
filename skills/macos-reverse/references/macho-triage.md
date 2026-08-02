# Mach-O Triage

```bash
file ./app
otool -hv ./app
otool -l ./app | head
codesign -d --entitlements :- ./app
```

Points of focus: `com.apple.security.*` entitlements, Library Validation, and flags related to disabling library injection.
