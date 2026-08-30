# 05: Sender Rules & Visual Template Builder UI

**What to build:** An interactive user interface allowing users to create, view, edit, and toggle exact sender rules (e.g. `HDFCBK`, `SBIINB`), configure per-sender visual token extraction templates with transaction type selection (`debit`/`credit`), and test templates against a live sample SMS message with immediate token extraction preview.

**Blocked by:** `01: SQLite Database Setup & Schema Management`, `02: Visual Token Template Compiler & Parsing Engine`

**Status:** ready-for-agent

- [ ] Sender rules screen displays active/inactive sender cards with counts of configured templates.
- [ ] Rule creation modal validates and saves exact sender keyword (rejects empty or whitespace-only names).
- [ ] Visual Template Builder form supports inputting template strings containing visual tokens (`{amount}`, `{merchant}`, `{account}`, `{balance}`, `{date}`) and selecting transaction type.
- [ ] Live preview box allows users to paste sample SMS text and visually see parsed fields before saving.
- [ ] Component tests verify rule addition, toggle state changes, and live sample extraction preview.
