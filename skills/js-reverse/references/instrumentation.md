# Instrumentation

Prefer lightweight observation first:

- XHR/Fetch breakpoints
- Function-text breakpoints
- Reading the call stack and local variables after a pause

Escalate to heavier source rewriting or local instrumentation only when lightweight observation is not enough.
