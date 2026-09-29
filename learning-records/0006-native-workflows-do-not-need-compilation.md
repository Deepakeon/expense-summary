# Native GitHub Actions Workflows Do Not Require Compilation

`gh aw compile` only compiles Markdown-based workflows (`.github/workflows/*.md`) into `.lock.yml`. Standard YAML workflow files (like `antigravity-fix.yml`) are native GitHub Actions definitions executed directly by GitHub without any compiler or build step.

## Evidence
User ran `gh aw compile` after removing `bug-resolver.md`. The compiler returned `✗ no workflow markdown files found`. `.github/workflows/antigravity-fix.yml` is already a valid standalone GitHub Actions YAML file.

## Implications
When using native Antigravity `.yml` workflows, skip `gh aw compile`. Directly commit and push the `.yml` file to GitHub.
