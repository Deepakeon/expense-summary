# Invoking /diagnosing-bugs in Antigravity CLI Non-Interactive Mode

Discovered mechanism for automated skill execution via `agy`: Antigravity discovers global skills under `~/.gemini/config/skills/`. In `--print` mode, slash commands (such as `/diagnosing-bugs`) expand automatically. For unattended CI execution, `--dangerously-skip-permissions` must be supplied to auto-approve tool execution (file editing, testing, git commands) without hanging on interactive terminal prompts.

## Evidence
`ln -s ~/.agents/skills/diagnosing-bugs ~/.gemini/config/skills/diagnosing-bugs` enabled `agy` to list and mount `diagnosing-bugs`. Testing `agy --help` confirmed `--dangerously-skip-permissions` and slash-command support in print mode.

## Implications
Workflows calling `agy` can directly invoke `/diagnosing-bugs` as the prompt prefix. The agent executes the 5-phase diagnosis loop completely autonomously on the self-hosted runner.
