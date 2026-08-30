# Feature Spec: SMS Expense Extractor & Summary

**Status**: `ready-for-agent`

## Problem Statement

Users receive numerous SMS messages every day from their banks and payment services confirming debits, credits, and account balances. Tracking expenses manually across different bank accounts and cards is tedious, error-prone, and often neglected. Existing generic SMS tracking tools are either opaque black-boxes that fail on specific bank formats, leak sensitive financial SMS data to external cloud servers, or lack flexible per-bank extraction controls. Users need a private, fully on-device application that allows them to specify exact bank senders, define intuitive visual extraction templates, automatically extract and categorize transactions from SMS messages, and view real-time expense summaries without any data leaving their phone.

## Solution

A React Native Android application that performs on-demand batch synchronization of SMS messages from configured exact sender rules. The application utilizes a per-sender visual token template engine where users can paste sample bank SMS messages and insert intuitive visual placeholders (e.g. `{amount}`, `{merchant}`, `{account}`, `{balance}`) to reliably extract structured transactions into a fast local SQLite database. The app provides a full dashboard suite showing monthly and weekly expense analytics, category breakdowns, a searchable transaction list, and a dedicated review queue for quarantined messages that did not match active templates. All processing and storage remain strictly local and private on the user's device.

## User Stories

1. As an Android user, I want the application to request SMS read permissions transparently, so that I understand why the permission is required before granting access.
2. As a user with multiple bank accounts, I want to create sender rules with exact sender keywords (e.g. `HDFCBK`, `SBIINB`, `ICICIB`), so that only messages from my financial institutions are scanned.
3. As a user, I want to create custom extraction templates per sender rule by pasting a sample SMS message and inserting visual tokens (such as `{amount}`, `{merchant}`, `{account}`, `{balance}`), so that I can easily parse my specific bank's message format without writing complex regex.
4. As a user, I want to specify whether an extraction template represents a debit or credit transaction, so that extracted amounts are categorized into the correct financial direction.
5. As a user, I want to test my visual extraction template against a live sample SMS message in the template editor, so that I can verify that all fields extract accurately before saving.
6. As a user, I want to trigger an on-demand batch sync from the home screen, so that newly received SMS messages are extracted into transactions immediately.
7. As a user, I want the batch sync to query only messages received since the last sync timestamp, so that sync operations are near-instant and battery-efficient.
8. As a user, I want the app to enforce deduplication using unique SMS message identifiers and content hashes, so that repeated batch syncs never create duplicate transactions.
9. As a user, I want unmatched or promotional SMS messages from tracked senders to be quarantined in a review queue, so that non-transactional messages do not corrupt my expense calculations while allowing me to review any potential template mismatches.
10. As a user, I want to inspect quarantined messages in the review queue and dismiss them or update my extraction template, so that my queue stays clean and my templates improve over time.
11. As a user, I want to view a financial dashboard summarizing my total monthly expenses, total income/credits, and net balance, so that I have an immediate overview of my financial status.
12. As a user, I want to view a breakdown of expenses grouped by category (e.g. Food, Groceries, Utilities, Shopping, Transfers), so that I can see where my money is being spent.
13. As a user, I want to browse a complete list of past transactions with filters for date range, transaction type (debit/credit), category, and sender, so that I can find specific payments easily.
14. As a user, I want to search transactions by merchant name or account snippet, so that I can quickly verify past transactions.
15. As a user, I want to edit a transaction's category, merchant name, or note, so that I can correct any misclassifications.
16. As a user, I want to view the raw SMS message attached to any transaction, so that I can audit the source text whenever needed.
17. As a user, I want to configure a global default currency (defaulting to INR `₹`) while having the app detect currency symbols automatically, so that values are formatted correctly for my region.
18. As a privacy-conscious user, I want all SMS processing and transaction storage to execute entirely on-device using local SQLite, so that my sensitive financial records are never uploaded to any remote server.

## Implementation Decisions

### 1. Android Telephony Native Bridge Module
- Built as a custom Kotlin Native Module inside the Android project.
- Queries `android.provider.Telephony.Sms.CONTENT_URI` using Android's `ContentResolver`.
- Accepts parameters for exact sender filtering and minimum timestamp (`date >= lastSyncTime`).
- Returns raw message records with native ID, sender address, body, and timestamp.
- Manages runtime permission requests for `android.permission.READ_SMS`.

### 2. Visual Token Template Compiler & Parser
- Converts user-defined template strings with visual tokens into deterministic regular expressions.
- Supported visual tokens:
  - `{amount}`: Matches numeric currency figures with optional commas, decimals, and preceding currency symbols.
  - `{merchant}`: Matches the counterparty, vendor, or store entity.
  - `{account}`: Matches the masked account or card suffix (e.g. `XX1234`, `card ending 5678`).
  - `{balance}`: Matches available or outstanding account balance figures.
  - `{date}`: Matches date/time representations if present in the message body.
- Escapes all literal template characters to avoid regex injection and ensures strict positional matching.
- Extracts named captures and coerces them into standardized transaction objects.

### 3. Local SQLite Storage (`op-sqlite`)
- Schema includes:
  - `sender_rules`: id, sender_name, created_at, is_active.
  - `extraction_templates`: id, sender_rule_id, template_pattern, transaction_type, default_category, created_at.
  - `transactions`: id, native_sms_id, sender, amount, currency, transaction_type, merchant, account_snippet, balance, category, transaction_timestamp, raw_sms_body, content_hash, created_at. Unique constraint on `(native_sms_id, content_hash)`.
  - `quarantined_messages`: id, native_sms_id, sender, raw_sms_body, received_timestamp, status (`pending`, `dismissed`), created_at.
  - `categories`: id, name, icon, color.
  - `sync_metadata`: key, value (storing `last_sync_timestamp`).

### 4. Batch Synchronization Pipeline
- Step 1: Retrieve all active sender rules and their associated extraction templates from SQLite.
- Step 2: Fetch the `last_sync_timestamp` from `sync_metadata`.
- Step 3: Call the native module to query SMS messages from the exact sender addresses where `date > last_sync_timestamp`.
- Step 4: For each retrieved SMS message, evaluate it against the sender's extraction templates:
  - If a template matches: extract fields, assign default category, compute content hash, and insert into `transactions`.
  - If no template matches: insert into `quarantined_messages` with status `pending`.
- Step 5: Update `last_sync_timestamp` to the latest message timestamp processed.

### 5. UI Architecture & Screen Flow
- **Dashboard Screen**: Top summary cards (Total Spent, Total Credited, Net Cashflow), interactive category distribution chart/bars, recent transactions list, and quick "Sync Now" floating action / header button.
- **Transactions Screen**: Paginated/virtualized list of transactions with search bar, filter pills (All / Debit / Credit), date range picker, and transaction detail modal with edit capabilities.
- **Review Queue Screen**: List of quarantined messages with sender, received time, raw SMS preview, 1-tap "Dismiss" action, and "Create/Edit Template" shortcut.
- **Sender Rules & Templates Screen**: List of configured senders, rule creation form, and interactive template builder with live sample testing box.
- **Settings Screen**: Default currency selector, permission status indicator, and database management (view stats, reset database).

## Testing Decisions

- **Good Test Characteristics**: Tests must verify user-observable behavior and data integrity through well-defined service boundaries, avoiding internal private method assertions.
- **Core Seam to Test**:
  1. **Template Compiler & Extraction Engine**: Comprehensive unit tests covering visual token conversion, extraction accuracy across various bank SMS formats, edge cases (missing optional tokens, whitespace variations), and rejection of non-matching messages.
  2. **Sync & Deduplication Engine**: Integration tests asserting that raw SMS inputs correctly populate `transactions` and `quarantined_messages` in SQLite without duplicates across consecutive sync cycles.
  3. **Analytics & Aggregation Queries**: SQL query tests ensuring correct calculation of monthly totals, category groupings, and balance computations.
  4. **Component & Screen Rendering**: Component tests using `@testing-library/react-native` verifying screen states (empty states, loading indicators, transaction list updates after sync).

## Out of Scope

- Real-time background broadcast receivers and headless JS listeners (handled exclusively via on-demand batch sync).
- iOS platform SMS extraction.
- External cloud synchronization, user accounts, or network APIs (100% on-device).
- Exporting data to CSV/JSON files.
- Automated SMS sending or OTP autofill.

## Further Notes

- The application is engineered to work seamlessly with React Native 0.87.1 on Android API levels 26+ (Android 8.0 to Android 15+).
- Default bank categories seeded on first launch: `Groceries`, `Food & Dining`, `Utilities & Bills`, `Shopping`, `Transportation`, `Health`, `Transfers & Payments`, `Income`, `Other`.
