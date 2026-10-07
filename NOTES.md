# Teaching Notes

- **User Communication Style**: Extreme concision; sacrifice grammar for the sake of concision.
- **Host Workstation**: Linux x86_64 (`deepak`).
- **Antigravity Status**: Local CLI installed at `~/.local/bin/agy` (v1.2.12), state and auth stored under `~/.gemini/antigravity-cli`.
- **Repository Target**: `Deepakeon/expense-summary` (Git remote fixed from typo, `gh` authenticated as `Deepakeon`).
- **Workflow Engine**: `gh-aw` (v0.89.21) compiling `.github/workflows/*.md` into standard GitHub Actions `.lock.yml`.
- **Debugging Methodology**: Enforce Matt Pocock's `diagnosing-bugs`, `tdd`, and `triage` skills for all bug resolution workflows on the runner.
- **Runner State**: Registered with id 2 (`deepak-Lenovo-V15-G5-IRL`) in `~/actions-runner`.
- **Observability Stack**: Arize Phoenix local container (`:6006`) with `agy --output-format stream-json` telemetry pipeline (Lesson 10).
