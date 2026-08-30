# 0003: Per-Sender Custom Extraction Templates

We decided to use configurable per-sender extraction templates rather than a single black-box global parser.

## Context & Trade-off
Financial SMS formats vary significantly across institutions (e.g. HDFC vs SBI vs ICICI vs credit card alerts). Per-sender extraction templates allow users to define exact extraction patterns for each sender, preventing cross-institution parsing collisions and giving users full control over token mapping (amount, merchant, transaction type, account snippet, balance).
