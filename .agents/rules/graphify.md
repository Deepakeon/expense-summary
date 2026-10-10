---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- **Wiki-first navigation**: `graphify-out/wiki/index.md` exists. Always read relevant community docs in `graphify-out/wiki/` first instead of reading raw source files.
- **Symbol targeting over fuzzy queries**: When querying the graph, search exact symbol/class/function names (e.g. `matchesSender`, `SmsReaderModule`), NOT long conversational sentences.
- **CLI over lazy MCP**: Prefer running CLI `graphify query "<symbol>" --budget 500` or `graphify explain "<symbol>"` via `run_command`. If using MCP `query_graph`, the argument name is `question` (NOT `query`).
- **No speculative file browsing**: Do NOT call `view_file` across multiple files or read entire files end-to-end to explore. Only view specific line ranges (StartLine/EndLine <= 60 lines) identified by Graphify `source_location`.
- **Relationships**: Use `graphify path "<A>" "<B>"` or `shortest_path` to trace relationships between components.
- **Read GRAPH_REPORT.md only for overview**: Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review or when query/path/explain do not surface enough context.
- **Update after code changes**: After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost).
