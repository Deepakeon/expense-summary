# 0002: Android-Exclusive Batch SMS Extraction via ContentResolver

We decided to target Android exclusively and use on-demand batch querying of the Android Telephony Content Provider for SMS extraction.

## Context & Trade-off
iOS security restrictions prevent third-party apps from programmatically reading general SMS messages. We chose on-demand batch scanning over continuous real-time background listeners to minimize battery consumption, eliminate complex background service lifecycles, and give users explicit control over when their SMS inbox is queried.
