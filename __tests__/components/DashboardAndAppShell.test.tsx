import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';
import { BatchSyncService } from '../../src/sync/syncService';
import { DashboardScreen } from '../../src/screens/DashboardScreen';
import { AppShell } from '../../src/navigation/AppShell';
import { ISmsReader, RawSmsMessage } from '../../src/sms/types';
import { setMockPermissionProvider } from '../../src/sms/smsReader';

function extractAllText(instance: any): string {
  if (!instance) return '';
  if (typeof instance === 'string' || typeof instance === 'number') {
    return String(instance);
  }
  let text = '';
  if (instance.children && Array.isArray(instance.children)) {
    for (const child of instance.children) {
      text += ' ' + extractAllText(child);
    }
  }
  return text;
}

class MockSmsReader implements ISmsReader {
  constructor(public messages: RawSmsMessage[] = []) {}
  async hasPermissions(): Promise<boolean> {
    return true;
  }
  async requestPermissions(): Promise<boolean> {
    return true;
  }
  async fetchSmsBatch(): Promise<RawSmsMessage[]> {
    return this.messages;
  }
}

describe('Expense Summary Dashboard & App Navigation Shell (Ticket 08)', () => {
  let repository: DatabaseRepository;
  let mockReader: MockSmsReader;
  let syncService: BatchSyncService;

  beforeEach(() => {
    jest.useFakeTimers();
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);
    mockReader = new MockSmsReader();
    syncService = new BatchSyncService(repository, mockReader);

    setMockPermissionProvider({
      hasPermissions: async () => true,
      requestPermissions: async () => true,
    });

    const rule = repository.createSenderRule('HDFCBK');
    const foodCat = repository.getCategories().find((c) => c.name === 'Food & Dining')!;
    repository.createExtractionTemplate({
      sender_rule_id: rule.id,
      template_pattern: 'Alert: Rs. {amount} spent at {merchant}',
      transaction_type: 'debit',
      default_category_id: foodCat.id,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    setMockPermissionProvider(null);
  });

  it('renders dashboard metrics and executes batch sync on Sync Now press', async () => {
    mockReader.messages = [
      {
        id: 'msg_101',
        sender: 'HDFCBK',
        body: 'Alert: Rs. 1200.00 spent at Swiggy',
        timestamp: Date.now() - 1000,
      },
    ];

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <DashboardScreen
          repository={repository}
          syncService={syncService}
          smsReader={mockReader}
        />
      );
    });

    const root = renderer!.root;

    // Trigger Sync Now
    const syncBtn = root.findByProps({ testID: 'sync-now-btn' });
    await act(async () => {
      await syncBtn.props.onPress();
    });

    const allText = extractAllText(root);
    expect(allText).toContain('1,200');
    expect(allText).toContain('Swiggy');
    expect(allText).toContain('Food & Dining');
  });

  it('navigates across tabs in AppShell', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AppShell
          repository={repository}
          syncService={syncService}
          smsReader={mockReader}
        />
      );
    });

    const root = renderer!.root;

    // Switch to Transactions Tab
    const txTab = root.findByProps({ testID: 'tab-transactions' });
    await act(async () => {
      txTab.props.onPress();
    });

    let allText = extractAllText(root);
    expect(allText).toContain('Transactions');

    // Switch to Rules Tab
    const rulesTab = root.findByProps({ testID: 'tab-rules' });
    await act(async () => {
      rulesTab.props.onPress();
    });

    allText = extractAllText(root);
    expect(allText).toContain('Sender Rules');
  });
});
