# 06: Transactions List, Search & Filter UI

**What to build:** A comprehensive transactions management screen featuring a virtualized list of extracted transactions, instant search by merchant or account snippet, filters for transaction type (All, Debit, Credit) and date ranges, a transaction detail modal displaying the raw SMS message, and inline category/merchant editing.

**Blocked by:** `01: SQLite Database Setup & Schema Management`, `04: Batch Sync Pipeline with Deduplication & Quarantine`

**Status:** ready-for-agent

- [ ] Transactions screen displays extracted transactions with formatted amount, currency symbol, date, merchant, and category pill.
- [ ] Search input filters transactions in real-time by merchant name or account snippet.
- [ ] Type filter pills (All / Debit / Credit) and date range selector filter SQLite query results accurately.
- [ ] Tapping a transaction opens a detail modal showing all extracted fields and the full raw SMS message body.
- [ ] User can edit the transaction category or merchant name from the detail modal with changes persisted to SQLite.
- [ ] Component tests verify filtering, search debouncing, and edit persistence.
