# 07: Review Queue for Quarantined Messages UI

**What to build:** A dedicated Review Queue screen displaying quarantined SMS messages from tracked senders that failed template parsing, allowing users to inspect the raw message, dismiss it with a single tap, or jump directly into the template builder with the message pre-populated as a sample.

**Blocked by:** `04: Batch Sync Pipeline with Deduplication & Quarantine`, `05: Sender Rules & Visual Template Builder UI`

**Status:** ready-for-agent

- [x] Review Queue screen displays pending quarantined messages with sender header, received timestamp, and raw SMS preview.
- [x] 1-tap "Dismiss" action updates message status to `dismissed` in SQLite and removes it from the active review list.
- [x] "Create/Tune Template" button opens the Template Builder pre-filling the sender rule and the raw SMS into the sample tester.
- [x] Badge count indicates the number of pending quarantined messages needing attention.
- [x] Component tests verify dismissal, navigation with pre-filled sample text, and empty queue state.
