# 0004: Custom Kotlin Native Module for Telephony Access

We decided to implement a custom Native Android Module in Kotlin directly inside the project rather than installing third-party SMS npm libraries.

## Context & Trade-off
Modern React Native (0.87.1+) with the New Architecture frequently encounters build failures and compatibility issues with legacy, abandoned third-party SMS packages. A direct Kotlin Native Module querying `android.provider.Telephony.Sms.CONTENT_URI` with explicit runtime permission handling is minimal, type-safe, and independent of external dependency lifecycle issues.
