import { IDatabaseDriver } from './driver';

export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: 'cart-outline', color: '#10B981' },
  { name: 'Food & Dining', icon: 'restaurant-outline', color: '#F59E0B' },
  { name: 'Utilities & Bills', icon: 'flash-outline', color: '#EF4444' },
  { name: 'Shopping', icon: 'bag-handle-outline', color: '#8B5CF6' },
  { name: 'Transportation', icon: 'car-outline', color: '#3B82F6' },
  { name: 'Health', icon: 'medkit-outline', color: '#EC4899' },
  { name: 'Transfers & Payments', icon: 'swap-horizontal-outline', color: '#6366F1' },
  { name: 'Income', icon: 'cash-outline', color: '#059669' },
  { name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6B7280' },
];

export function initDatabase(driver: IDatabaseDriver): void {
  // Create tables
  driver.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      color TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  driver.execute(`
    CREATE TABLE IF NOT EXISTS sender_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_name TEXT NOT NULL UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );
  `);

  driver.execute(`
    CREATE TABLE IF NOT EXISTS extraction_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_rule_id INTEGER NOT NULL REFERENCES sender_rules(id) ON DELETE CASCADE,
      template_pattern TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('debit', 'credit')),
      default_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL
    );
  `);

  driver.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      native_sms_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('debit', 'credit')),
      merchant TEXT,
      account_snippet TEXT,
      balance REAL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      transaction_timestamp INTEGER NOT NULL,
      raw_sms_body TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  driver.execute(`
    CREATE TABLE IF NOT EXISTS quarantined_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      native_sms_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      raw_sms_body TEXT NOT NULL,
      received_timestamp INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'dismissed')),
      created_at INTEGER NOT NULL
    );
  `);

  driver.execute(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Create indexes
  driver.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_native_hash 
    ON transactions(native_sms_id, content_hash);
  `);

  driver.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_timestamp 
    ON transactions(transaction_timestamp);
  `);

  driver.execute(`
    CREATE INDEX IF NOT EXISTS idx_transactions_sender 
    ON transactions(sender);
  `);

  driver.execute(`
    CREATE INDEX IF NOT EXISTS idx_quarantined_status 
    ON quarantined_messages(status);
  `);

  // Seed default categories idempotently
  seedCategories(driver);
}

export function seedCategories(driver: IDatabaseDriver): void {
  const now = Date.now();
  for (const cat of DEFAULT_CATEGORIES) {
    driver.execute(
      `INSERT OR IGNORE INTO categories (name, icon, color, created_at) VALUES (?, ?, ?, ?)`,
      [cat.name, cat.icon, cat.color, now]
    );
  }
}
