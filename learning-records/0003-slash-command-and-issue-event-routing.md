# Slash Command /fix Triggering on Self-Hosted Runner

Established execution flow for `/fix` slash command on GitHub Issues: workflow definitions must be committed to the default repository branch (`main`) so GitHub Actions parses the trigger and dispatches the `agent` job to the local self-hosted runner.

## Evidence
Workflow frontmatter defines `slash_command: { name: fix, events: [issues, issue_comment] }` and `runs-on: self-hosted`. Runner ID 3 registered to `Deepakeon/expense-summary`.

## Implications
When a collaborator creates or comments `/fix` on an issue, GitHub dispatches the job to the active local runner daemon. The runner executes Matt Pocock's `diagnosing-bugs` loop locally using host environment tools.
