import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';
import { SenderRulesScreen } from '../../src/screens/SenderRulesScreen';
import { TemplateBuilderModal } from '../../src/components/TemplateBuilderModal';
import { AddSenderRuleModal } from '../../src/components/AddSenderRuleModal';

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

describe('Sender Rules & Visual Template Builder UI (Ticket 05)', () => {
  let repository: DatabaseRepository;

  beforeEach(() => {
    jest.useFakeTimers();
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders configured sender rules and allows toggling', async () => {
    const rule = repository.createSenderRule('HDFCBK');

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SenderRulesScreen repository={repository} />
      );
    });

    const root = renderer!.root;
    const allText = extractAllText(root);
    expect(allText).toContain('HDFCBK');

    // Toggle switch
    const toggle = root.findByProps({ testID: `rule-toggle-${rule.id}` });
    await act(async () => {
      toggle.props.onValueChange(false);
    });

    expect(repository.getActiveSenderRules()).toHaveLength(0);
  });

  it('adds a new sender rule through AddSenderRuleModal', async () => {
    const onSave = jest.fn((name: string) => {
      repository.createSenderRule(name);
    });
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AddSenderRuleModal visible={true} onClose={onClose} onSave={onSave} />
      );
    });

    const root = renderer!.root;
    const input = root.findByProps({ testID: 'sender-name-input' });
    await act(async () => {
      input.props.onChangeText('SBIINB');
    });

    const saveButton = root.findByProps({ testID: 'save-rule-btn' });
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith('SBIINB');
    expect(repository.getSenderRules().map((r) => r.sender_name)).toContain('SBIINB');
  });

  it('validates template in TemplateBuilderModal and provides live extraction preview', async () => {
    const rule = repository.createSenderRule('HDFCBK');
    const categories = repository.getCategories();
    const onSave = jest.fn();
    const onClose = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <TemplateBuilderModal
          visible={true}
          senderRule={rule}
          categories={categories}
          onSave={onSave}
          onClose={onClose}
          initialSampleSms="Alert: Spent Rs. 850.00 at Starbucks with card XX9988"
        />
      );
    });

    const root = renderer!.root;
    const templateInput = root.findByProps({ testID: 'template-pattern-input' });
    await act(async () => {
      templateInput.props.onChangeText(
        'Alert: Spent Rs. {amount} at {merchant} with card {account}'
      );
    });

    // Check preview content rendered
    const allText = extractAllText(root);
    expect(allText).toContain('850');
    expect(allText).toContain('Starbucks');
    expect(allText).toContain('XX9988');

    // Save
    const saveButton = root.findByProps({ testID: 'save-template-btn' });
    await act(async () => {
      saveButton.props.onPress();
    });

    expect(onSave).toHaveBeenCalledWith({
      templatePattern: 'Alert: Spent Rs. {amount} at {merchant} with card {account}',
      transactionType: 'debit',
      defaultCategoryId: categories[0].id,
    });
  });
});
