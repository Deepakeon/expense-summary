# Agentic Observability with Arize Phoenix and Stream JSON

Monitoring autonomous Antigravity CLI workflows requires capturing tool executions, parameters, outputs, durations, and LLM token usage. Rather than parsing static logs after execution or using synchronous lifecycle hooks that block the agent loop, the recommended architecture pipes `agy --output-format stream-json` directly into an OpenTelemetry forwarder that streams traces to a local Arize Phoenix instance on port 6006.

## Evidence
- Empirically verified `agy --output-format stream-json` emits granular `ACTIVE` and `DONE` events for all tool steps with exact durations and parameter payloads.
- Validated Arize Phoenix OTLP/HTTP ingest endpoint at `http://localhost:6006/v1/traces`.
- Documented findings and trade-offs in `.scratch/agent-observability/research.md`.

## Implications
Workflows running on the self-hosted runner gain full visibility into model reasoning, tool invocations, and MCP actions without modifying the core CLI or adding run-time latency.
