#!/usr/bin/env python3
"""
Loki & Grafana Telemetry Forwarder for Antigravity CLI stream-json.
Reads NDJSON from stdin, ships structured logs/events to Grafana Loki,
and passes human-readable output to stdout for GitHub Actions summaries.
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error

LOKI_URL = os.getenv("LOKI_URL", "http://localhost:3100/loki/api/v1/push")
ISSUE_NUMBER = os.getenv("ISSUE_NUMBER", "unknown")
RUN_ID = os.getenv("GITHUB_RUN_ID", "local")

def push_to_loki(entries, labels):
    """
    entries: list of (timestamp_ns_str, line_str)
    labels: dict of string key-values
    """
    payload = {
        "streams": [
            {
                "stream": labels,
                "values": entries
            }
        ]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        LOKI_URL,
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            pass
    except Exception as e:
        # Avoid crashing the agent run if Loki is temporarily unreachable
        sys.stderr.write(f"[loki-forwarder warning] Failed to push to Loki: {e}\n")

def main():
    base_labels = {
        "app": "antigravity-runner",
        "issue": str(ISSUE_NUMBER),
        "run_id": str(RUN_ID)
    }

    final_response_lines = []

    for raw_line in sys.stdin:
        raw_line = raw_line.strip()
        if not raw_line:
            continue

        try:
            data = json.loads(raw_line)
        except json.JSONDecodeError:
            continue

        event_type = data.get("event", "unknown")
        labels = {**base_labels, "event": event_type}
        ts_ns = str(time.time_ns())

        # Enrich labels for tools
        if event_type == "step_update":
            step = data.get("step_update", {})
            step_type = step.get("step_type", "unknown")
            state = step.get("state", "unknown")
            labels["step_type"] = step_type
            labels["state"] = state

            if step_type == "tool":
                labels["tool"] = step.get("tool_name", "unknown")

        # Push JSON event line to Loki
        push_to_loki([[ts_ns, raw_line]], labels)

        # Collect response text for CLI output
        if event_type == "result":
            res = data.get("result", {})
            response_text = res.get("response", "")
            if response_text:
                final_response_lines.append(response_text)

    # Print final response to stdout for CI logs / step summary
    if final_response_lines:
        print("\n".join(final_response_lines))

if __name__ == "__main__":
    main()
