# 02: Visual Token Template Compiler & Parsing Engine

**What to build:** A deterministic parsing engine that compiles visual token templates (e.g. `Rs. {amount} debited from A/c {account} to {merchant} on {date}. Bal: {balance}`) into safe regular expressions, extracts structured transaction fields from raw SMS messages, handles currency symbol detection, and coerces extracted tokens into standardized transaction records.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Compiler converts visual placeholders (`{amount}`, `{merchant}`, `{account}`, `{balance}`, `{date}`) into strict, position-aware regular expressions while escaping literal punctuation.
- [ ] Number and currency extraction normalizes amounts with commas/decimals (e.g. `1,234.50`) and detects currency markers (`₹`, `Rs.`, `INR`, `$`, `€`).
- [ ] Extractor assigns transaction type (`debit` vs `credit`) and maps fields accurately from sample SMS messages from various institutions.
- [ ] Template validation rejects non-matching SMS messages cleanly and reports syntax errors for invalid user templates.
- [ ] Comprehensive unit tests verify extraction across diverse bank formats, whitespace variations, and edge cases.
