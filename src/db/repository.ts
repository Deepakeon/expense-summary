import { IDatabaseDriver } from './driver';
import { seedCategories } from './schema';
import {
  Category,
  CategorySummary,
  ExtractionTemplate,
  QuarantinedMessage,
  SenderRule,
  Transaction,
  TransactionFilter,
  TransactionSummary,
} from './types';

export class DatabaseRepository {
  constructor(private driver: IDatabaseDriver) {}

  // ---------------- Categories ---------------- //

  getCategories(): Category[] {
    return this.driver.execute<Category>('SELECT * FROM categories ORDER BY id ASC').rows;
  }

  getCategoryById(id: number): Category | null {
    const res = this.driver.execute<Category>('SELECT * FROM categories WHERE id = ?', [id]);
    return res.rows.length > 0 ? res.rows[0] : null;
  }

  seedDefaultCategories(): void {
    seedCategories(this.driver);
  }

  // ---------------- Sender Rules ---------------- //

  getSenderRules(): SenderRule[] {
    return this.driver.execute<SenderRule>(
      'SELECT * FROM sender_rules ORDER BY created_at DESC'
    ).rows;
  }

  getActiveSenderRules(): SenderRule[] {
    return this.driver.execute<SenderRule>(
      'SELECT * FROM sender_rules WHERE is_active = 1 ORDER BY created_at DESC'
    ).rows;
  }

  createSenderRule(senderName: string): SenderRule {
    const trimmed = senderName.trim();
    if (!trimmed) {
      throw new Error('Sender name cannot be empty');
    }
    const now = Date.now();
    const res = this.driver.execute(
      'INSERT INTO sender_rules (sender_name, is_active, created_at) VALUES (?, 1, ?)',
      [trimmed, now]
    );
    return {
      id: res.insertId!,
      sender_name: trimmed,
      is_active: 1,
      created_at: now,
    };
  }

  toggleSenderRule(id: number, isActive: boolean): void {
    this.driver.execute('UPDATE sender_rules SET is_active = ? WHERE id = ?', [
      isActive ? 1 : 0,
      id,
    ]);
  }

  deleteSenderRule(id: number): void {
    this.driver.execute('DELETE FROM sender_rules WHERE id = ?', [id]);
  }

  // ---------------- Extraction Templates ---------------- //

  getTemplatesForSender(senderRuleId: number): ExtractionTemplate[] {
    return this.driver.execute<ExtractionTemplate>(
      'SELECT * FROM extraction_templates WHERE sender_rule_id = ? ORDER BY created_at ASC',
      [senderRuleId]
    ).rows;
  }

  getAllTemplates(): ExtractionTemplate[] {
    return this.driver.execute<ExtractionTemplate>(
      'SELECT * FROM extraction_templates ORDER BY created_at ASC'
    ).rows;
  }

  createExtractionTemplate(data: {
    sender_rule_id: number;
    template_pattern: string;
    transaction_type: 'debit' | 'credit';
    default_category_id?: number | null;
  }): ExtractionTemplate {
    const now = Date.now();
    const res = this.driver.execute(
      `INSERT INTO extraction_templates (sender_rule_id, template_pattern, transaction_type, default_category_id, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.sender_rule_id,
        data.template_pattern.trim(),
        data.transaction_type,
        data.default_category_id ?? null,
        now,
      ]
    );
    return {
      id: res.insertId!,
      sender_rule_id: data.sender_rule_id,
      template_pattern: data.template_pattern.trim(),
      transaction_type: data.transaction_type,
      default_category_id: data.default_category_id ?? null,
      created_at: now,
    };
  }

  deleteExtractionTemplate(id: number): void {
    this.driver.execute('DELETE FROM extraction_templates WHERE id = ?', [id]);
  }

  // ---------------- Transactions ---------------- //

  insertTransaction(data: {
    native_sms_id: string;
    sender: string;
    amount: number;
    currency: string;
    transaction_type: 'debit' | 'credit';
    merchant?: string | null;
    account_snippet?: string | null;
    balance?: number | null;
    category_id?: number | null;
    transaction_timestamp: number;
    raw_sms_body: string;
    content_hash: string;
  }): Transaction | null {
    const now = Date.now();
    const res = this.driver.execute(
      `INSERT OR IGNORE INTO transactions 
       (native_sms_id, sender, amount, currency, transaction_type, merchant, account_snippet, balance, category_id, transaction_timestamp, raw_sms_body, content_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.native_sms_id,
        data.sender,
        data.amount,
        data.currency,
        data.transaction_type,
        data.merchant ?? null,
        data.account_snippet ?? null,
        data.balance ?? null,
        data.category_id ?? null,
        data.transaction_timestamp,
        data.raw_sms_body,
        data.content_hash,
        now,
      ]
    );

    if (res.rowsAffected === 0) {
      return null; // Duplicate ignored
    }

    return {
      id: res.insertId!,
      native_sms_id: data.native_sms_id,
      sender: data.sender,
      amount: data.amount,
      currency: data.currency,
      transaction_type: data.transaction_type,
      merchant: data.merchant ?? null,
      account_snippet: data.account_snippet ?? null,
      balance: data.balance ?? null,
      category_id: data.category_id ?? null,
      transaction_timestamp: data.transaction_timestamp,
      raw_sms_body: data.raw_sms_body,
      content_hash: data.content_hash,
      created_at: now,
    };
  }

  getTransactions(filter: TransactionFilter = {}): Transaction[] {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filter.sender) {
      conditions.push('sender = ?');
      params.push(filter.sender);
    }
    if (filter.transaction_type) {
      conditions.push('transaction_type = ?');
      params.push(filter.transaction_type);
    }
    if (filter.category_id !== undefined) {
      conditions.push('category_id = ?');
      params.push(filter.category_id);
    }
    if (filter.minTimestamp !== undefined) {
      conditions.push('transaction_timestamp >= ?');
      params.push(filter.minTimestamp);
    }
    if (filter.maxTimestamp !== undefined) {
      conditions.push('transaction_timestamp <= ?');
      params.push(filter.maxTimestamp);
    }
    if (filter.search) {
      conditions.push('(merchant LIKE ? OR account_snippet LIKE ? OR raw_sms_body LIKE ?)');
      const term = `%${filter.search}%`;
      params.push(term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM transactions ${whereClause} ORDER BY transaction_timestamp DESC`;
    return this.driver.execute<Transaction>(sql, params).rows;
  }

  updateTransaction(
    id: number,
    updates: {
      category_id?: number | null;
      merchant?: string | null;
    }
  ): void {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.category_id !== undefined) {
      setClauses.push('category_id = ?');
      params.push(updates.category_id);
    }
    if (updates.merchant !== undefined) {
      setClauses.push('merchant = ?');
      params.push(updates.merchant);
    }

    if (setClauses.length === 0) return;

    params.push(id);
    this.driver.execute(`UPDATE transactions SET ${setClauses.join(', ')} WHERE id = ?`, params);
  }

  getTransactionSummary(minTimestamp?: number, maxTimestamp?: number): TransactionSummary {
    const conditions: string[] = [];
    const params: any[] = [];

    if (minTimestamp !== undefined) {
      conditions.push('transaction_timestamp >= ?');
      params.push(minTimestamp);
    }
    if (maxTimestamp !== undefined) {
      conditions.push('transaction_timestamp <= ?');
      params.push(maxTimestamp);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'debit' THEN amount ELSE 0 END), 0) as totalDebits,
        COALESCE(SUM(CASE WHEN transaction_type = 'credit' THEN amount ELSE 0 END), 0) as totalCredits,
        COUNT(id) as transactionCount
      FROM transactions
      ${whereClause}
    `;

    const res = this.driver.execute<{
      totalDebits: number;
      totalCredits: number;
      transactionCount: number;
    }>(sql, params).rows[0];

    const totalDebits = res?.totalDebits ?? 0;
    const totalCredits = res?.totalCredits ?? 0;
    return {
      totalDebits,
      totalCredits,
      netCashflow: totalCredits - totalDebits,
      transactionCount: res?.transactionCount ?? 0,
    };
  }

  getCategorySummary(minTimestamp?: number, maxTimestamp?: number): CategorySummary[] {
    const conditions: string[] = ["t.transaction_type = 'debit'"];
    const params: any[] = [];

    if (minTimestamp !== undefined) {
      conditions.push('t.transaction_timestamp >= ?');
      params.push(minTimestamp);
    }
    if (maxTimestamp !== undefined) {
      conditions.push('t.transaction_timestamp <= ?');
      params.push(maxTimestamp);
    }

    const sql = `
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        c.icon as categoryIcon,
        c.color as categoryColor,
        COALESCE(SUM(t.amount), 0) as totalSpent
      FROM categories c
      LEFT JOIN transactions t ON t.category_id = c.id AND ${conditions.join(' AND ')}
      GROUP BY c.id
      HAVING totalSpent > 0
      ORDER BY totalSpent DESC
    `;

    const rows = this.driver.execute<{
      categoryId: number;
      categoryName: string;
      categoryIcon?: string;
      categoryColor?: string;
      totalSpent: number;
    }>(sql, params).rows;

    const grandTotal = rows.reduce((sum, r) => sum + r.totalSpent, 0);

    return rows.map((r) => ({
      ...r,
      percentage: grandTotal > 0 ? (r.totalSpent / grandTotal) * 100 : 0,
    }));
  }

  // ---------------- Quarantined Messages ---------------- //

  insertQuarantinedMessage(data: {
    native_sms_id: string;
    sender: string;
    raw_sms_body: string;
    received_timestamp: number;
  }): QuarantinedMessage {
    const now = Date.now();
    const res = this.driver.execute(
      `INSERT INTO quarantined_messages (native_sms_id, sender, raw_sms_body, received_timestamp, status, created_at)
       VALUES (?, ?, ?, ?, 'pending', ?)`,
      [data.native_sms_id, data.sender, data.raw_sms_body, data.received_timestamp, now]
    );
    return {
      id: res.insertId!,
      native_sms_id: data.native_sms_id,
      sender: data.sender,
      raw_sms_body: data.raw_sms_body,
      received_timestamp: data.received_timestamp,
      status: 'pending',
      created_at: now,
    };
  }

  getQuarantinedMessages(status?: 'pending' | 'dismissed'): QuarantinedMessage[] {
    if (status) {
      return this.driver.execute<QuarantinedMessage>(
        'SELECT * FROM quarantined_messages WHERE status = ? ORDER BY received_timestamp DESC',
        [status]
      ).rows;
    }
    return this.driver.execute<QuarantinedMessage>(
      'SELECT * FROM quarantined_messages ORDER BY received_timestamp DESC'
    ).rows;
  }

  updateQuarantinedMessageStatus(id: number, status: 'pending' | 'dismissed'): void {
    this.driver.execute('UPDATE quarantined_messages SET status = ? WHERE id = ?', [status, id]);
  }

  // ---------------- Sync Metadata ---------------- //

  getLastSyncTimestamp(): number {
    const res = this.driver.execute<{ value: string }>(
      "SELECT value FROM sync_metadata WHERE key = 'last_sync_timestamp'"
    );
    if (res.rows.length > 0) {
      return Number(res.rows[0].value) || 0;
    }
    return 0;
  }

  setLastSyncTimestamp(timestamp: number): void {
    this.driver.execute(
      `INSERT INTO sync_metadata (key, value) VALUES ('last_sync_timestamp', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      [timestamp.toString()]
    );
  }
}
