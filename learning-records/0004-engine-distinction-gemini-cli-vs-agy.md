# Engine Distinction: gh-aw Gemini CLI vs Local Antigravity CLI (agy)

Critical discovery regarding workflow execution: `gh-aw` workflows specifying `engine: { id: gemini }` install `@google/gemini-cli` via npm and invoke `generativelanguage.googleapis.com` via `GEMINI_API_KEY`, consuming API tokens and facing rate limits. They do not execute the local `agy` binary or reuse Antigravity session auth.

## Evidence
Workflow lockfile (`bug-resolver.lock.yml`) contains `npm install -g @google/gemini-cli@0.43.0` and runs `gemini --yolo ...` with `GEMINI_API_KEY`. Compiling `gh aw` with `--engine antigravity` fails with `invalid engine value`. Conversely, running `/home/deepak/.local/bin/agy` directly on host succeeds using internal Antigravity authentication without API keys.

## Implications
To avoid Gemini API token costs and rate limits, workflows targeted to the self-hosted runner must invoke `agy` directly in a native workflow run step rather than relying on `gh-aw`'s `gemini` engine.
