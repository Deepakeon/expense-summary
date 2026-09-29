# Workflow Log Capture, Artifact Upload, and Step Summary

Implemented comprehensive log capture for the Antigravity self-hosted runner: `agy` output is piped through `tee agent-output.log`, published directly to `$GITHUB_STEP_SUMMARY` as an expandable Markdown section, archived as a downloadable workflow artifact (`actions/upload-artifact@v4`), and linked into an issue comment upon opening a PR.

## Evidence
In `.github/workflows/antigravity-fix.yml`, updated run command to `agy ... 2>&1 | tee agent-output.log`, added step summary emission, artifact upload with `if: always()`, and notification comment on the triggering issue.

## Implications
Full visibility into the agent's diagnosis steps, test failures, and fix decisions is guaranteed both directly in the GitHub web UI (Summary and Artifacts) and in the runner log without truncation.
