# 03: Native Android SMS Reader Bridge Module

**What to build:** A custom Kotlin Native Android Module querying `android.provider.Telephony.Sms.CONTENT_URI` using Android's `ContentResolver` to retrieve SMS inbox messages filtered by exact sender headers and minimum timestamp (`date > lastSync`), with Android runtime permission (`READ_SMS`) handling and a typed TypeScript bridge interface.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Custom Kotlin native module is registered in the Android project without third-party SMS package dependencies.
- [x] Native module provides an async method to query SMS inbox by exact sender list and timestamp cutoff.
- [x] Native module handles runtime permission checks and requests for `android.permission.READ_SMS`.
- [x] TypeScript bridge module exposes strongly typed methods (`requestPermissions`, `hasPermissions`, `fetchSmsBatch`) with a mock provider for unit and integration testing.
- [x] Unit tests verify bridge response formatting and mock provider behavior.
