# 08: Expense Summary Dashboard & App Navigation Shell

**What to build:** The top-level application shell with tabbed navigation and a Home Dashboard featuring monthly/weekly financial aggregates (Total Spent, Total Credited, Net Cashflow), category distribution breakdown, recent transactions feed, and a floating / header "Sync Now" button with last sync timestamp feedback and permission prompts.

**Blocked by:** `04: Batch Sync Pipeline with Deduplication & Quarantine`, `06: Transactions List, Search & Filter UI`, `07: Review Queue for Quarantined Messages UI`

**Status:** ready-for-agent

- [ ] Main bottom tab navigation links Dashboard, Transactions, Review Queue (with badge), and Rules screens.
- [ ] Dashboard calculates and displays total debits, total credits, and net balance for the selected month/week.
- [ ] Category distribution breakdown shows spending percentages with category icons and color coding.
- [ ] Header or floating action button triggers Batch Sync with spinner and shows "Last synced: <time>".
- [ ] Permission check on launch prompts user to grant `READ_SMS` permission if not already granted.
- [ ] End-to-end component test verifies initial load, sync execution, and summary card metric updates.
