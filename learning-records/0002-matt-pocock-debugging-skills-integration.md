# Matt Pocock Diagnosing-Bugs Skill Integration for Local Runner

User mandated the use of Matt Pocock's `diagnosing-bugs` and related skills (`tdd`, `triage`) for all debugging in this workspace. The local runner agent will apply the strict 5-phase diagnosis loop (tight red feedback loop, reproduction/minimisation, falsifiable hypotheses, targeted instrumentation, test-driven fix verification) when resolving bugs.

## Evidence
User requested: "lets go ahead but i want to use the matt pocock diagnosing-bugs and its related skills for debugging". Skills exist locally in `~/.gemini/skills/` and are declared in `.github/workflows/bug-resolver.md` frontmatter (`mattpocock/skills/diagnosing-bugs@c55ee46073ed923f86ce59a5eb3b6d895095d1b7`).

## Implications
All bug resolution workflows running on the local self-hosted runner adhere to the 5-phase discipline. No fixes are accepted without a reproducible, minimal red-capable test in `__tests__/`.
