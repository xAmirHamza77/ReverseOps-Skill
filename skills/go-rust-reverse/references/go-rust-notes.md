# Go/Rust Hints

Go: find `runtime.main` / `main.main` first, then recover via the pclntab.  
Rust: collect `src/` path strings and `Option`/`Result` handling blocks first.  
Both: prefer string-driven analysis, and avoid getting lost in runtime libraries.
