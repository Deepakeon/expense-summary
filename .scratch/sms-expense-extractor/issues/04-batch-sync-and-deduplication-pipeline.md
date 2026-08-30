# 04: Batch Sync Pipeline with Deduplication & Quarantine

**What to build:** An end-to-end synchronization service that orchestrates querying new SMS messages via the native reader, evaluating them against active per-sender visual templates, persisting extracted transactions into SQLite with deduplication, routing unmatched messages from matching senders into the quarantined review queue, and updating the sync timestamp metadata.

**Blocked by:** `01: SQLite Database Setup & Schema Management`, `02: Visual Token Template Compiler & Parsing Engine`, `03: Native Android SMS Reader Bridge Module`

**Status:** ready-for-agent

- [x] Batch sync retrieves active sender rules and their extraction templates from SQLite.
- [x] Queries native SMS module for messages where `date > last_sync_timestamp` matching active senders.
- [x] For each message, parses via sender's templates; matching transactions are inserted into `transactions` with SHA-256 content hashes.
- [x] Repeated syncs do not create duplicate transactions (idempotent deduplication via unique constraints).
- [x] Messages from matching senders that fail template extraction are inserted into `quarantined_messages` with status `pending`.
- [x] `last_sync_timestamp` in `sync_metadata` is updated to the latest processed message date upon completion.
- [x] Integration tests verify complete sync flow with mixed matching, non-matching, and duplicate SMS streams.
