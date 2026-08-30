# Expense Summary & SMS Parser

A React Native Android application for extracting financial transactions from SMS messages matching configured exact sender rules, parsing them with visual token extraction templates, storing them locally in SQLite, and presenting expense summaries.

## Language

**SMS Message**:
An unparsed text message received on the device from a sender containing transactional or notification text.
_Avoid_: Text, SMS body, raw message

**Sender Rule**:
A configured exact sender string used to filter and match specific SMS message senders.
_Avoid_: Filter criteria, partial match, substring filter, whitelist

**Extraction Template**:
A parsing pattern configured with visual tokens and mapped to a sender rule that defines how structured transaction fields are extracted from an SMS message.
_Avoid_: Parser config, schema, extraction rule

**Visual Token**:
A named placeholder (such as `{amount}`, `{merchant}`, `{account}`, `{balance}`, `{date}`) used in an extraction template to represent variable transaction fields.
_Avoid_: Regex group, parameter, wild card, token tag

**Quarantined Message**:
An SMS message from a matching sender that could not be parsed by the assigned extraction template, held for inspection.
_Avoid_: Unparsed SMS, failed message, dropped text, error log

**Review Queue**:
The staging area in the application where quarantined messages are displayed for user inspection, template adjustment, or dismissal.
_Avoid_: Inbox, pending list, quarantine bucket

**Batch Sync**:
The process of querying and processing SMS messages from the device inbox with timestamp filtering and deduplication against active sender rules.
_Avoid_: Refresh, historical pull, SMS scan

**Transaction**:
A financial event extracted from an SMS message representing money moving into or out of an account.
_Avoid_: Payment, record, expense entry

**Transaction Type**:
The direction of money flow for a transaction, classified strictly as either debit or credit.
_Avoid_: Operation, status, movement type

**Merchant**:
The counterparty, entity, or store involved in a debit or credit transaction.
_Avoid_: Vendor, payee, seller, shop

**Account Snippet**:
The masked or partial identifier of the bank account, credit card, or wallet referenced in an SMS message.
_Avoid_: Card number, account number, source

**Category**:
A classification assigned to a transaction based on merchant rules or user tagging (e.g., Groceries, Utilities, Food).
_Avoid_: Label, bucket, tag
