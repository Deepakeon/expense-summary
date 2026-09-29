# Mission: Self-Hosted GitHub Actions Runner for Local Antigravity Workflows

## Why
Run GitHub Actions agentic workflows directly on the local Linux workstation where Antigravity is already authenticated. This eliminates cloud API rate limits, reuses local machine configuration and credentials, and enables fast local iteration on repository automation.

## Success looks like
- A dedicated self-hosted GitHub Actions runner installed and registered for `Deepakeon/expense-summary`.
- The runner daemon running reliably (interactively or via systemd service) and reporting `Idle`/`Online` in GitHub repo settings.
- Workflow definitions (`bug-resolver.md`) configured with `runs-on: self-hosted` and compiled cleanly via `gh aw compile`.
- Workflows triggered from GitHub execute locally on the workstation with access to the local environment and Antigravity tooling.
- Matt Pocock's `diagnosing-bugs`, `tdd`, and `triage` skills strictly applied by the local runner agent for all issue debugging.

## Constraints
- Linux x86_64 host environment.
- Runner inherits the host user's local file permissions and environment variables.
- Host machine must remain awake and connected to the internet during execution.
- Security: self-hosted runners should only run workflows from trusted sources to prevent arbitrary code execution on the host machine.

## Out of scope
- Multi-node autoscaling clusters (Kubernetes / ARC).
- Containerized runner-in-docker isolation unless explicitly required later.
- Windows/macOS runner environments.
