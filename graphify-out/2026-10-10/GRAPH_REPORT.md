# Graph Report - expenseSummary  (2026-10-10)

## Corpus Check
- 89 files · ~33,100 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 23 file(s) not represented in the graph (top: (none) 6, .xml 4, .properties 2)

## Summary
- 480 nodes · 784 edges · 57 communities (27 shown, 30 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d9c0c13d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DatabaseRepository
- DashboardScreen.tsx
- repository.ts
- package.json
- TemplateBuilderModal.tsx
- SmsReaderModule.kt
- devDependencies
- AppDelegate
- MainApplication.kt
- loki_forwarder.py
- Feature Spec: SMS Expense Extractor & Summary
- Research: Agentic Observability for Antigravity Runner (`agy`)
- Getting Started
- MainActivity.kt
- Agent skills
- Domain Docs
- Issue tracker: Local Markdown
- Mission: Self-Hosted GitHub Actions Runner for Local Antigravity Workflows
- tsconfig.json
- Established Goal: Local Self-Hosted Runner for Authenticated Antigravity
- Matt Pocock Diagnosing-Bugs Skill Integration for Local Runner
- Engine Distinction: gh-aw Gemini CLI vs Local Antigravity CLI (agy)
- Invoking /diagnosing-bugs in Antigravity CLI Non-Interactive Mode
- Native GitHub Actions Workflows Do Not Require Compilation
- Automated PR Creation in Runner Workflow
- Workflow Log Capture, Artifact Upload, and Step Summary
- Structured PR Body with Root Cause and Fix Details
- Agentic Observability with Arize Phoenix and Stream JSON
- Self-Hosted Runner & Local Agentic Workflows Resources
- Expense Summary & SMS Parser
- 0001: Use op-sqlite for Local Transaction Storage and Aggregations
- 0002: Android-Exclusive Batch SMS Extraction via ContentResolver
- 0003: Per-Sender Custom Extraction Templates
- 0004: Custom Kotlin Native Module for Telephony Access
- 0005: Visual Token Template Representation
- triage-labels.md
- SKILL.md
- NOTES.md
- 01-sqlite-schema-and-db-client.md
- 02-visual-token-template-engine.md
- 03-native-android-sms-reader.md
- 04-batch-sync-and-deduplication-pipeline.md
- 05-sender-rules-and-template-builder-ui.md
- 06-transactions-list-and-detail-ui.md
- 07-review-queue-and-quarantined-messages-ui.md
- 08-dashboard-summary-and-navigation-shell.md
- AppShell.tsx

## God Nodes (most connected - your core abstractions)
1. `DatabaseRepository` - 44 edges
2. `ISmsReader` - 16 edges
3. `react` - 15 edges
4. `IDatabaseDriver` - 15 edges
5. `react-native` - 13 edges
6. `SmsReaderModule` - 12 edges
7. `initDatabase()` - 11 edges
8. `RawSmsMessage` - 11 edges
9. `BatchSyncService` - 11 edges
10. `Category` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Slash Command /fix Triggering on Self-Hosted Runner` --references--> `main()`  [INFERRED]
  learning-records/0003-slash-command-and-issue-event-routing.md → scripts/observability/loki_forwarder.py
- `App()` --calls--> `getDatabaseRepository()`  [EXTRACTED]
  App.tsx → src/db/getDb.ts
- `App()` --calls--> `BatchSyncService`  [EXTRACTED]
  App.tsx → src/sync/syncService.ts
- `App()` --calls--> `AppShell()`  [EXTRACTED]
  App.tsx → src/navigation/AppShell.tsx
- `MockSmsReader` --implements--> `ISmsReader`  [EXTRACTED]
  __tests__/components/DashboardAndAppShell.test.tsx → src/sms/types.ts

## Import Cycles
- None detected.

## Communities (57 total, 30 thin omitted)

### Community 0 - "DatabaseRepository"
Cohesion: 0.10
Nodes (18): TemplateBuilderModalProps, styles, TransactionDetailModal(), TransactionDetailModalProps, DatabaseRepository, Category, CategorySummary, ExtractionTemplate (+10 more)

### Community 1 - "DashboardScreen.tsx"
Cohesion: 0.09
Nodes (18): AppShellProps, DashboardScreenProps, styles, MockPermissionProvider, MockSmsProvider, setMockPermissionProvider(), setMockSmsProvider(), smsReader (+10 more)

### Community 2 - "repository.ts"
Cohesion: 0.11
Nodes (17): react-test-renderer, @op-engineering/op-sqlite, react-test-renderer, IDatabaseDriver, QueryResult, getDatabaseRepository(), createNodeSqliteDriver(), NodeSqliteDriver (+9 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (41): config, { getDefaultConfig, mergeConfig }, dependencies, @op-engineering/op-sqlite, react, react-native, @react-native/new-app-screen, react-native-safe-area-context (+33 more)

### Community 4 - "TemplateBuilderModal.tsx"
Cohesion: 0.32
Nodes (10): styles, TemplateBuilderModal(), compileTemplate(), escapeRegex(), extractTransactionFields(), ParsedTransactionFields, SUPPORTED_TOKENS, SupportedToken (+2 more)

### Community 6 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, @babel/core, @babel/preset-env, @babel/runtime, better-sqlite3, eslint, jest, prettier (+14 more)

### Community 7 - "AppDelegate"
Cohesion: 0.12
Nodes (6): AppDelegate, ReactNativeDelegate, React, React_RCTAppDelegate, ReactAppDependencyProvider, UIKit

### Community 9 - "loki_forwarder.py"
Cohesion: 0.17
Nodes (5): Evidence, Implications, Slash Command /fix Triggering on Self-Hosted Runner, main(), push_to_loki()

### Community 10 - "Feature Spec: SMS Expense Extractor & Summary"
Cohesion: 0.14
Nodes (13): 1. Android Telephony Native Bridge Module, 2. Visual Token Template Compiler & Parser, 3. Local SQLite Storage (`op-sqlite`), 4. Batch Synchronization Pipeline, 5. UI Architecture & Screen Flow, Feature Spec: SMS Expense Extractor & Summary, Further Notes, Implementation Decisions (+5 more)

### Community 11 - "Research: Agentic Observability for Antigravity Runner (`agy`)"
Cohesion: 0.17
Nodes (11): 1. Executive Summary, 2. Primary Source Findings, 3. Platform Comparison: Arize Phoenix vs Langfuse vs OpenLIT, 4. Integration Architecture, 5. Concrete Implementation, A. Antigravity CLI (`agy`) Capabilities, B. Antigravity Lifecycle Hooks (`.agents/hooks.json`), C. Persistent Transcript Logs (`transcript.jsonl`) (+3 more)

### Community 12 - "Getting Started"
Cohesion: 0.18
Nodes (10): Android, Congratulations! :tada:, Getting Started, iOS, Learn More, Now what?, Step 1: Start Metro, Step 2: Build and run your app (+2 more)

### Community 14 - "Agent skills"
Cohesion: 0.29
Nodes (5): Agent skills, Domain docs, Investigation & Speed Rules, Issue tracker, Triage labels

### Community 15 - "Domain Docs"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 16 - "Issue tracker: Local Markdown"
Cohesion: 0.33
Nodes (5): Conventions, Issue tracker: Local Markdown, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 17 - "Mission: Self-Hosted GitHub Actions Runner for Local Antigravity Workflows"
Cohesion: 0.33
Nodes (5): Constraints, Mission: Self-Hosted GitHub Actions Runner for Local Antigravity Workflows, Out of scope, Success looks like, Why

### Community 18 - "tsconfig.json"
Cohesion: 0.40
Nodes (4): exclude, extends, include, @react-native/typescript-config

### Community 20 - "Established Goal: Local Self-Hosted Runner for Authenticated Antigravity"
Cohesion: 0.50
Nodes (3): Established Goal: Local Self-Hosted Runner for Authenticated Antigravity, Evidence, Implications

### Community 21 - "Matt Pocock Diagnosing-Bugs Skill Integration for Local Runner"
Cohesion: 0.50
Nodes (3): Evidence, Implications, Matt Pocock Diagnosing-Bugs Skill Integration for Local Runner

### Community 22 - "Engine Distinction: gh-aw Gemini CLI vs Local Antigravity CLI (agy)"
Cohesion: 0.50
Nodes (3): Engine Distinction: gh-aw Gemini CLI vs Local Antigravity CLI (agy), Evidence, Implications

### Community 23 - "Invoking /diagnosing-bugs in Antigravity CLI Non-Interactive Mode"
Cohesion: 0.50
Nodes (3): Evidence, Implications, Invoking /diagnosing-bugs in Antigravity CLI Non-Interactive Mode

### Community 24 - "Native GitHub Actions Workflows Do Not Require Compilation"
Cohesion: 0.50
Nodes (3): Evidence, Implications, Native GitHub Actions Workflows Do Not Require Compilation

### Community 25 - "Automated PR Creation in Runner Workflow"
Cohesion: 0.50
Nodes (3): Automated PR Creation in Runner Workflow, Evidence, Implications

### Community 26 - "Workflow Log Capture, Artifact Upload, and Step Summary"
Cohesion: 0.50
Nodes (3): Evidence, Implications, Workflow Log Capture, Artifact Upload, and Step Summary

### Community 27 - "Structured PR Body with Root Cause and Fix Details"
Cohesion: 0.50
Nodes (3): Evidence, Implications, Structured PR Body with Root Cause and Fix Details

### Community 28 - "Agentic Observability with Arize Phoenix and Stream JSON"
Cohesion: 0.50
Nodes (3): Agentic Observability with Arize Phoenix and Stream JSON, Evidence, Implications

### Community 29 - "Self-Hosted Runner & Local Agentic Workflows Resources"
Cohesion: 0.50
Nodes (3): Knowledge, Self-Hosted Runner & Local Agentic Workflows Resources, Wisdom (Communities)

### Community 56 - "AppShell.tsx"
Cohesion: 0.13
Nodes (20): App(), displayName, name, styles, react, react-native, react-native-safe-area-context, AddSenderRuleModal() (+12 more)

## Knowledge Gaps
- **25 isolated node(s):** `UIKit`, `React`, `React_RCTAppDelegate`, `ReactAppDependencyProvider`, `@react-native/new-app-screen` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 256 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `RawSmsMessage` connect `DashboardScreen.tsx` to `repository.ts`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **What connects `UIKit`, `React`, `React_RCTAppDelegate` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `DatabaseRepository` be split into smaller, more focused modules?**
  _Cohesion score 0.09595959595959595 - nodes in this community are weakly interconnected._
- **Why does `SmsReaderModule` connect `SmsReaderModule.kt` to `MainApplication.kt`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Should `DashboardScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09388335704125178 - nodes in this community are weakly interconnected._
- **Why does `DatabaseRepository` connect `DatabaseRepository` to `AppShell.tsx`, `DashboardScreen.tsx`, `repository.ts`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `repository.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10505050505050505 - nodes in this community are weakly interconnected._