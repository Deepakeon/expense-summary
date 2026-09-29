# Self-Hosted Runner & Local Agentic Workflows Resources

## Knowledge

- [GitHub Docs: About self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)
  Authoritative overview of self-hosted runner architecture, communication (outbound HTTPS long polling), differences from cloud runners, and routing labels. Use for: foundational runner mechanics and lifecycle.
- [GitHub Docs: Adding self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners)
  Step-by-step setup commands, binary downloads, registration tokens, and execution scripts. Use for: provisioning and registration syntax.
- [GitHub Docs: Configuring the self-hosted runner application as a service](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)
  Configuring systemd service wrappers (`./svc.sh`) for autostart on boot and background daemonizing. Use for: persistent daemon management.
- [GitHub Docs: Security hardening for GitHub Actions (Self-hosted runners)](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#hardening-for-self-hosted-runners)
  Crucial security guidelines regarding public fork pull requests and host machine protection. Use for: safety guardrails and label scoping.
- [GitHub Agentic Workflows (`gh-aw`) Repository](https://github.com/github/gh-aw)
  Compiler CLI and specification for Markdown-driven GitHub agentic workflows. Use for: frontmatter configuration, `runs-on` targeting, and lockfile compilation.

## Wisdom (Communities)

- [GitHub Actions Community Discussions](https://github.com/orgs/community/discussions/categories/actions-and-packages)
  High-signal official discussion board for runner edge cases, networking quirks, and proxy configurations. Use for: real-world runner troubleshooting.
- [GitHub Actions Runner Repository Issues](https://github.com/actions/runner/issues)
  Upstream bug tracker and feature requests for the actions/runner agent. Use for: runner binary bugs, systemd quirks, and environment variable edge cases.
