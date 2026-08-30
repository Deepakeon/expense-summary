import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';

describe('Database Setup, Migrations and Repositories (Ticket 01)', () => {
  let repository: DatabaseRepository;

  beforeEach(() => {
    // In-memory SQLite for test isolation
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);
  });

  describe('Schema & Categories Seeding', () => {
    it('seeds default categories idempotently', () => {
      const categories = repository.getCategories();
      expect(categories.length).toBeGreaterThanOrEqual(8);

      const categoryNames = categories.map((c) => c.name);
      expect(categoryNames).toContain('Groceries');
      expect(categoryNames).toContain('Food & Dining');
      expect(categoryNames).toContain('Utilities & Bills');
      expect(categoryNames).toContain('Shopping');
      expect(categoryNames).toContain('Transportation');
      expect(categoryNames).toContain('Transfers & Payments');
      expect(categoryNames).toContain('Income');
      expect(categoryNames).toContain('Other');

      // Re-running initialization should not duplicate categories
      repository.seedDefaultCategories();
      const categoriesAfter = repository.getCategories();
      expect(categoriesAfter.length).toBe(categories.length);
    });
  });

  describe('Sender Rules CRUD', () => {
    it('creates, retrieves, toggles, and deletes sender rules', () => {
      const rule = repository.createSenderRule('HDFCBK');
      expect(rule.id).toBeDefined();
      expect(rule.sender_name).toBe('HDFCBK');
      expect(rule.is_active).toBe(1);

      const rules = repository.getSenderRules();
      expect(rules).toHaveLength(1);
      expect(rules[0].sender_name).toBe('HDFCBK');

      // Toggle active status
      repository.toggleSenderRule(rule.id, false);
      expect(repository.getActiveSenderRules()).toHaveLength(0);

      repository.toggleSenderRule(rule.id, true);
      expect(repository.getActiveSenderRules()).toHaveLength(1);

      // Delete rule
      repository.deleteSenderRule(rule.id);
      expect(repository.getSenderRules()).toHaveLength(0);
    });
  });

  describe('Extraction Templates CRUD', () => {
    it('creates and retrieves extraction templates associated with a sender rule', () => {
      const rule = repository.createSenderRule('SBIINB');
      const categories = repository.getCategories();
      const defaultCat = categories.find((c) => c.name === 'Food & Dining') || categories[0];

      const template = repository.createExtractionTemplate({
        sender_rule_id: rule.id,
        template_pattern: 'Rs. {amount} debited from A/c {account} to {merchant}. Bal: {balance}',
        transaction_type: 'debit',
        default_category_id: defaultCat.id,
      });

      expect(template.id).toBeDefined();
      expect(template.sender_rule_id).toBe(rule.id);
      expect(template.transaction_type).toBe('debit');

      const templates = repository.getTemplatesForSender(rule.id);
      expect(templates).toHaveLength(1);
      expect(templates[0].template_pattern).toBe(template.template_pattern);

      repository.deleteExtractionTemplate(template.id);
      expect(repository.getTemplatesForSender(rule.id)).toHaveLength(0);
    });
  });

  describe('Transactions CRUD and Deduplication Constraints', () => {
    it('inserts transactions and enforces uniqueness on native_sms_id and content_hash', () => {
      const categories = repository.getCategories();
      const cat = categories[0];

      const txData = {
        native_sms_id: 'sms_123',
        sender: 'HDFCBK',
        amount: 450.0,
        currency: 'INR',
        transaction_type: 'debit' as const,
        merchant: 'Swiggy',
        account_snippet: 'XX1234',
        balance: 15420.5,
        category_id: cat.id,
        transaction_timestamp: 1725000000000,
        raw_sms_body: 'Rs. 450.00 debited from A/c XX1234 to Swiggy. Bal: Rs. 15420.50',
        content_hash: 'hash_abc123',
      };

      const inserted = repository.insertTransaction(txData);
      expect(inserted).not.toBeNull();
      expect(inserted!.id).toBeDefined();
      expect(inserted!.amount).toBe(450.0);
      expect(inserted!.merchant).toBe('Swiggy');

      // Attempt duplicate insert with same native_sms_id and content_hash should be ignored (or return null / false)
      const duplicate = repository.insertTransaction(txData);
      expect(duplicate).toBeNull();

      const allTx = repository.getTransactions({});
      expect(allTx).toHaveLength(1);
    });

    it('filters transactions by type, date range, and search query', () => {
      const cat = repository.getCategories()[0];

      repository.insertTransaction({
        native_sms_id: '1',
        sender: 'HDFCBK',
        amount: 100,
        currency: 'INR',
        transaction_type: 'debit',
        merchant: 'Amazon',
        account_snippet: '1111',
        balance: 5000,
        category_id: cat.id,
        transaction_timestamp: 1000,
        raw_sms_body: 'Debited 100 Amazon',
        content_hash: 'h1',
      });

      repository.insertTransaction({
        native_sms_id: '2',
        sender: 'HDFCBK',
        amount: 5000,
        currency: 'INR',
        transaction_type: 'credit',
        merchant: 'Salary',
        account_snippet: '1111',
        balance: 10000,
        category_id: cat.id,
        transaction_timestamp: 2000,
        raw_sms_body: 'Credited 5000 Salary',
        content_hash: 'h2',
      });

      // Filter by type
      expect(repository.getTransactions({ transaction_type: 'debit' })).toHaveLength(1);
      expect(repository.getTransactions({ transaction_type: 'credit' })).toHaveLength(1);

      // Search by merchant
      expect(repository.getTransactions({ search: 'Amazon' })).toHaveLength(1);
      expect(repository.getTransactions({ search: 'NonExistent' })).toHaveLength(0);

      // Date range
      expect(repository.getTransactions({ minTimestamp: 1500 })).toHaveLength(1);
    });

    it('calculates transaction and category summaries accurately', () => {
      const categories = repository.getCategories();
      const foodCat = categories.find((c) => c.name === 'Food & Dining')!;
      const groceriesCat = categories.find((c) => c.name === 'Groceries')!;

      // Insert 2 debits and 1 credit
      repository.insertTransaction({
        native_sms_id: 't1',
        sender: 'HDFCBK',
        amount: 300,
        currency: 'INR',
        transaction_type: 'debit',
        merchant: 'Zomato',
        category_id: foodCat.id,
        transaction_timestamp: 1000,
        raw_sms_body: 'Debited 300',
        content_hash: 'h1',
      });

      repository.insertTransaction({
        native_sms_id: 't2',
        sender: 'HDFCBK',
        amount: 700,
        currency: 'INR',
        transaction_type: 'debit',
        merchant: 'Blinkit',
        category_id: groceriesCat.id,
        transaction_timestamp: 2000,
        raw_sms_body: 'Debited 700',
        content_hash: 'h2',
      });

      repository.insertTransaction({
        native_sms_id: 't3',
        sender: 'HDFCBK',
        amount: 5000,
        currency: 'INR',
        transaction_type: 'credit',
        merchant: 'Refund',
        category_id: null,
        transaction_timestamp: 3000,
        raw_sms_body: 'Credited 5000',
        content_hash: 'h3',
      });

      const summary = repository.getTransactionSummary();
      expect(summary.totalDebits).toBe(1000);
      expect(summary.totalCredits).toBe(5000);
      expect(summary.netCashflow).toBe(4000);
      expect(summary.transactionCount).toBe(3);

      const categorySummary = repository.getCategorySummary();
      expect(categorySummary).toHaveLength(2);

      const groceriesSummary = categorySummary.find((c) => c.categoryName === 'Groceries')!;
      expect(groceriesSummary.totalSpent).toBe(700);
      expect(groceriesSummary.percentage).toBe(70);

      const foodSummary = categorySummary.find((c) => c.categoryName === 'Food & Dining')!;
      expect(foodSummary.totalSpent).toBe(300);
      expect(foodSummary.percentage).toBe(30);
    });
  });

  describe('Quarantined Messages CRUD', () => {
    it('stores quarantined messages and allows status updates', () => {
      const msg = repository.insertQuarantinedMessage({
        native_sms_id: 'sms_999',
        sender: 'HDFCBK',
        raw_sms_body: 'Your OTP is 123456 for login.',
        received_timestamp: 1725000000000,
      });

      expect(msg.id).toBeDefined();
      expect(msg.status).toBe('pending');

      const pending = repository.getQuarantinedMessages('pending');
      expect(pending).toHaveLength(1);
      expect(pending[0].raw_sms_body).toContain('OTP');

      // Update status to dismissed
      repository.updateQuarantinedMessageStatus(msg.id, 'dismissed');
      expect(repository.getQuarantinedMessages('pending')).toHaveLength(0);
      expect(repository.getQuarantinedMessages('dismissed')).toHaveLength(1);
    });
  });

  describe('Sync Metadata', () => {
    it('gets and sets last sync timestamp', () => {
      expect(repository.getLastSyncTimestamp()).toBe(0);

      repository.setLastSyncTimestamp(1725000000000);
      expect(repository.getLastSyncTimestamp()).toBe(1725000000000);
    });
  });
});
