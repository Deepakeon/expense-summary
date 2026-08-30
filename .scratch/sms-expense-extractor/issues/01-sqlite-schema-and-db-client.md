# 01: SQLite Database Setup & Schema Management

**What to build:** An embedded local SQLite database client using `op-sqlite` with automated migrations that initializes the application tables (`sender_rules`, `extraction_templates`, `transactions`, `quarantined_messages`, `categories`, `sync_metadata`), seeds default categories, and provides a typed data access layer with verified integrity tests.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] `op-sqlite` is configured and successfully initializes the local database on app startup.
- [x] Database schema tables are created: `sender_rules`, `extraction_templates`, `transactions`, `quarantined_messages`, `categories`, and `sync_metadata`.
- [x] Default expense categories (`Groceries`, `Food & Dining`, `Utilities & Bills`, `Shopping`, `Transportation`, `Health`, `Transfers & Payments`, `Income`, `Other`) are seeded idempotently.
- [x] Unique index on `transactions(native_sms_id, content_hash)` is enforced.
- [x] Data access functions for CRUD operations on sender rules, templates, transactions, and quarantined messages pass unit and integration tests.
