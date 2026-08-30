import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';
import { BatchSyncService } from '../../src/sync/syncService';
import { ISmsReader, RawSmsMessage } from '../../src/sms/types';

class MockSmsReader implements ISmsReader {
  constructor(public messages: RawSmsMessage[] = []) {}

  async hasPermissions(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<boolean> {
    return true;
  }

  async fetchSmsBatch(options?: { senders?: string[]; minTimestamp?: number }): Promise<RawSmsMessage[]> {
    let list = [...this.messages];
    if (options?.minTimestamp !== undefined) {
      list = list.filter((m) => m.timestamp > options.minTimestamp!);
    }
    if (options?.senders && options.senders.length > 0) {
      list = list.filter((m) =>
        options.senders!.some(
          (s) =>
            m.sender.toLowerCase() === s.toLowerCase() ||
            m.sender.toLowerCase().endsWith(s.toLowerCase())
        )
      );
    }
    return list;
  }
}

describe('Batch Sync Pipeline (Ticket 04)', () => {
  let repository: DatabaseRepository;
  let mockReader: MockSmsReader;
  let syncService: BatchSyncService;

  beforeEach(() => {
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);
    mockReader = new MockSmsReader();
    syncService = new BatchSyncService(repository, mockReader);
  });

  it('handles sync when no active sender rules are configured', async () => {
    mockReader.messages = [
      { id: '1', sender: 'HDFCBK', body: 'Spent Rs 100', timestamp: 1000 },
    ];

    const result = await syncService.runBatchSync();
    expect(result.syncedCount).toBe(0);
    expect(result.quarantinedCount).toBe(0);
    expect(repository.getTransactions()).toHaveLength(0);
  });

  it('extracts matching SMS messages into transactions and routes non-matching into quarantine', async () => {
    // Setup sender rule and template
    const rule = repository.createSenderRule('HDFCBK');
    const categories = repository.getCategories();
    const foodCat = categories.find((c) => c.name === 'Food & Dining')!;

    repository.createExtractionTemplate({
      sender_rule_id: rule.id,
      template_pattern: 'Alert: Rs. {amount} spent at {merchant} from A/c {account}',
      transaction_type: 'debit',
      default_category_id: foodCat.id,
    });

    mockReader.messages = [
      {
        id: 'msg_1',
        sender: 'VM-HDFCBK',
        body: 'Alert: Rs. 450.00 spent at Swiggy from A/c XX1234',
        timestamp: 1000,
      },
      {
        id: 'msg_2',
        sender: 'VM-HDFCBK',
        body: 'Your OTP for netbanking is 889900. Do not share.',
        timestamp: 2000,
      },
    ];

    const result = await syncService.runBatchSync();

    expect(result.syncedCount).toBe(1);
    expect(result.quarantinedCount).toBe(1);
    expect(result.lastSyncTimestamp).toBe(2000);

    // Verify transaction
    const transactions = repository.getTransactions();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(450.0);
    expect(transactions[0].merchant).toBe('Swiggy');
    expect(transactions[0].account_snippet).toBe('XX1234');
    expect(transactions[0].category_id).toBe(foodCat.id);
    expect(transactions[0].transaction_type).toBe('debit');

    // Verify quarantined message
    const quarantined = repository.getQuarantinedMessages('pending');
    expect(quarantined).toHaveLength(1);
    expect(quarantined[0].native_sms_id).toBe('msg_2');
    expect(quarantined[0].raw_sms_body).toContain('OTP');

    // Verify sync metadata updated
    expect(repository.getLastSyncTimestamp()).toBe(2000);
  });

  it('performs idempotent deduplication on repeated syncs', async () => {
    const rule = repository.createSenderRule('SBIINB');
    repository.createExtractionTemplate({
      sender_rule_id: rule.id,
      template_pattern: 'Dear Customer, Rs {amount} debited towards {merchant}',
      transaction_type: 'debit',
    });

    mockReader.messages = [
      {
        id: 'sbi_1',
        sender: 'AD-SBIINB',
        body: 'Dear Customer, Rs 1200.00 debited towards Amazon',
        timestamp: 1000,
      },
    ];

    const firstSync = await syncService.runBatchSync();
    expect(firstSync.syncedCount).toBe(1);
    expect(repository.getTransactions()).toHaveLength(1);

    // Reset lastSyncTimestamp to simulate re-running against the same message
    repository.setLastSyncTimestamp(0);

    const secondSync = await syncService.runBatchSync();
    expect(secondSync.syncedCount).toBe(0);
    expect(secondSync.duplicateCount).toBe(1);
    expect(repository.getTransactions()).toHaveLength(1);
  });

  it('only queries messages newer than last_sync_timestamp in incremental sync', async () => {
    const rule = repository.createSenderRule('ICICIB');
    repository.createExtractionTemplate({
      sender_rule_id: rule.id,
      template_pattern: 'Rs {amount} debited at {merchant}',
      transaction_type: 'debit',
    });

    repository.setLastSyncTimestamp(1500);

    mockReader.messages = [
      { id: '1', sender: 'ICICIB', body: 'Rs 100 debited at Merchant A', timestamp: 1000 },
      { id: '2', sender: 'ICICIB', body: 'Rs 200 debited at Merchant B', timestamp: 2000 },
    ];

    const result = await syncService.runBatchSync();
    expect(result.syncedCount).toBe(1);

    const transactions = repository.getTransactions();
    expect(transactions).toHaveLength(1);
    expect(transactions[0].merchant).toBe('Merchant B');
    expect(repository.getLastSyncTimestamp()).toBe(2000);
  });
});
