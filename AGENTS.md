# AGENTS.md

## Agent skills

### Issue tracker

Issues and specs live as local markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped to matching label strings (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repository layout (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.

## Investigation & Speed Rules

- **Fast navigation (Graphify)**:
  - Check `graphify-out/wiki/index.md` first to understand architecture.
  - Run CLI `graphify query "<symbol>" --budget 500` or `graphify explain "<symbol>"` to find symbol locations (MCP `query_graph` takes `question` param).
  - Target exact symbol names (e.g. `matchesSender`), not broad sentences.
  - Do NOT browse directories or call `view_file` speculatively across files. Only inspect narrow line ranges (<= 60 lines) surfaced by Graphify.
- **Scope & No PR archaeology**: Do NOT browse closed PRs (`gh pr view/diff`), historical issues, or git commit history unless explicitly referenced by the task or regression report. Rely strictly on current code, repro tests, and issue details.
- **Pre-installed dependencies**: In CI and dev environments, assume dependencies are pre-installed; never run `npm install` or `npm ci` unless package manifests have been modified.
