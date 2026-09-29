# Established Goal: Local Self-Hosted Runner for Authenticated Antigravity

User initiated learning workspace to deploy a self-hosted GitHub Actions runner directly on their local Linux PC. The objective is running agentic workflows locally with their existing authenticated Antigravity CLI session to bypass cloud API limits and reuse workstation tools.

## Evidence
User specified setup flow: repo settings -> Actions -> Runners -> setup commands -> workflow frontmatter `runs-on: self-hosted`. Local environment has `gh` CLI authenticated to `Deepakeon/expensse-summary` and `agy` (v1.2.12) installed in `~/.local/bin/agy`.

## Implications
Sets foundation for Lesson 1 covering runner architecture and local registration, followed by workflow integration (`runs-on: self-hosted`) and runner service daemonization.
