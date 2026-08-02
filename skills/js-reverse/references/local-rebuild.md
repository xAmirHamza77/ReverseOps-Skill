# Local Reproduction

Confirm the following on the page side before returning to Node:

- The real entry function
- Call order
- Parameter sources
- The browser objects it depends on
- Whether it depends on time, randomness, storage, cookies, UA, canvas, crypto

Reproduce minimally first, then patch the environment step by step; do not simulate the entire browser at once.
