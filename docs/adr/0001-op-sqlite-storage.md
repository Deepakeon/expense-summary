# 0001: Use op-sqlite for Local Transaction Storage and Aggregations

We decided to use `op-sqlite` as our local database engine to store extracted SMS messages and parsed transactions.

## Context & Trade-off
We evaluated in-memory querying against `react-native-mmkv` and `op-sqlite`. Calculating dynamic monthly expense summaries, category breakdowns, and date range filters requires indexed relational queries. `op-sqlite` provides synchronous fast C++ SQLite bindings compatible with React Native's New Architecture while keeping all user financial data strictly on-device.
