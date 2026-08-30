import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';
import { TransactionsScreen } from '../../src/screens/TransactionsScreen';
import { TransactionDetailModal } from '../../src/components/TransactionDetailModal';

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

describe('Transactions List, Search & Filter UI (Ticket 06)', () => {
  let repository: DatabaseRepository;

  beforeEach(() => {
    jest.useFakeTimers();
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);

    const categories = repository.getCategories();
    const foodCat = categories.find((c) => c.name === 'Food & Dining')!;
    const incomeCat = categories.find((c) => c.name === 'Income')!;

    repository.insertTransaction({
      native_sms_id: 'tx_1',
      sender: 'HDFCBK',
      amount: 450,
      currency: 'INR',
      transaction_type: 'debit',
      merchant: 'Swiggy',
      account_snippet: 'XX1234',
      balance: 25000,
      category_id: foodCat.id,
      transaction_timestamp: Date.now() - 1000,
      raw_sms_body: 'Rs 450 spent at Swiggy from XX1234',
      content_hash: 'hash_1',
    });

    repository.insertTransaction({
      native_sms_id: 'tx_2',
      sender: 'ICICIB',
      amount: 50000,
      currency: 'INR',
      transaction_type: 'credit',
      merchant: 'Acme Corp Salary',
      account_snippet: 'ending 9999',
      balance: 75000,
      category_id: incomeCat.id,
      transaction_timestamp: Date.now(),
      raw_sms_body: 'INR 50000 credited from Acme Corp Salary',
      content_hash: 'hash_2',
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders transactions list and filters by type', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <TransactionsScreen repository={repository} />
      );
    });

    const root = renderer!.root;
    let allText = extractAllText(root);
    expect(allText).toContain('Swiggy');
    expect(allText).toContain('Acme Corp Salary');

    // Filter by Debit
    const debitFilterBtn = root.findByProps({ testID: 'filter-debit-btn' });
    await act(async () => {
      debitFilterBtn.props.onPress();
    });

    allText = extractAllText(root);
    expect(allText).toContain('Swiggy');
    expect(allText).not.toContain('Acme Corp Salary');

    // Filter by Credit
    const creditFilterBtn = root.findByProps({ testID: 'filter-credit-btn' });
    await act(async () => {
      creditFilterBtn.props.onPress();
    });

    allText = extractAllText(root);
    expect(allText).not.toContain('Swiggy');
    expect(allText).toContain('Acme Corp Salary');
  });

  it('searches transactions by merchant or account snippet', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <TransactionsScreen repository={repository} />
      );
    });

    const root = renderer!.root;
    const searchInput = root.findByProps({ testID: 'transaction-search-input' });

    // Search for Swiggy
    await act(async () => {
      searchInput.props.onChangeText('Swiggy');
    });

    let allText = extractAllText(root);
    expect(allText).toContain('Swiggy');
    expect(allText).not.toContain('Acme Corp Salary');

    // Search for account snippet
    await act(async () => {
      searchInput.props.onChangeText('9999');
    });

    allText = extractAllText(root);
    expect(allText).not.toContain('Swiggy');
    expect(allText).toContain('Acme Corp Salary');
  });

  it('allows editing merchant and category via TransactionDetailModal', async () => {
    const tx = repository.getTransactions()[0];
    const categories = repository.getCategories();
    const shoppingCat = categories.find((c) => c.name === 'Shopping')!;
    const onUpdate = jest.fn((id, updates) => {
      repository.updateTransaction(id, updates);
    });
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <TransactionDetailModal
          visible={true}
          transaction={tx}
          categories={categories}
          onClose={onClose}
          onUpdate={onUpdate}
        />
      );
    });

    const root = renderer!.root;
    // Check raw SMS rendered
    expect(extractAllText(root)).toContain(tx.raw_sms_body);

    // Edit merchant name
    const merchantInput = root.findByProps({ testID: 'edit-merchant-input' });
    await act(async () => {
      merchantInput.props.onChangeText('Zomato Order');
    });

    // Select category Shopping
    const catPill = root.findByProps({ testID: `category-pill-${shoppingCat.id}` });
    await act(async () => {
      catPill.props.onPress();
    });

    // Save changes
    const saveBtn = root.findByProps({ testID: 'save-tx-detail-btn' });
    await act(async () => {
      saveBtn.props.onPress();
    });

    expect(onUpdate).toHaveBeenCalledWith(tx.id, {
      merchant: 'Zomato Order',
      category_id: shoppingCat.id,
    });

    const updatedTx = repository.getTransactions({ search: 'Zomato Order' });
    expect(updatedTx).toHaveLength(1);
    expect(updatedTx[0].category_id).toBe(shoppingCat.id);
  });
});
