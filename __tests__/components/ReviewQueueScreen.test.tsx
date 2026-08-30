import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { initDatabase } from '../../src/db/schema';
import { createNodeSqliteDriver } from '../../src/db/nodeDriver';
import { DatabaseRepository } from '../../src/db/repository';
import { ReviewQueueScreen } from '../../src/screens/ReviewQueueScreen';

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

describe('Review Queue for Quarantined Messages UI (Ticket 07)', () => {
  let repository: DatabaseRepository;

  beforeEach(() => {
    jest.useFakeTimers();
    const driver = createNodeSqliteDriver(':memory:');
    initDatabase(driver);
    repository = new DatabaseRepository(driver);
    repository.createSenderRule('HDFCBK');

    repository.insertQuarantinedMessage({
      native_sms_id: 'sms_otp_1',
      sender: 'HDFCBK',
      raw_sms_body: 'Your OTP is 654321 for netbanking login.',
      received_timestamp: Date.now() - 5000,
    });

    repository.insertQuarantinedMessage({
      native_sms_id: 'sms_unparsed_2',
      sender: 'HDFCBK',
      raw_sms_body: 'Dear Customer, Rs 1250 paid at Uber without template.',
      received_timestamp: Date.now(),
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders pending quarantined messages and badge count', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReviewQueueScreen repository={repository} />
      );
    });

    const root = renderer!.root;
    const allText = extractAllText(root);
    expect(allText).toContain('Review Queue');
    expect(allText).toContain('2 pending');
    expect(allText).toContain('Your OTP is 654321');
    expect(allText).toContain('Rs 1250 paid at Uber');
  });

  it('dismisses a quarantined message with 1 tap', async () => {
    const pendingBefore = repository.getQuarantinedMessages('pending');
    expect(pendingBefore).toHaveLength(2);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReviewQueueScreen repository={repository} />
      );
    });

    const root = renderer!.root;
    const dismissBtn = root.findByProps({ testID: `dismiss-btn-${pendingBefore[0].id}` });
    await act(async () => {
      dismissBtn.props.onPress();
    });

    const pendingAfter = repository.getQuarantinedMessages('pending');
    expect(pendingAfter).toHaveLength(1);
    expect(pendingAfter[0].id).toBe(pendingBefore[1].id);

    const allText = extractAllText(root);
    expect(allText).toContain('1 pending');
  });

  it('navigates to template builder with pre-filled sample text', async () => {
    const onNavigateToTemplateBuilder = jest.fn();
    const pending = repository.getQuarantinedMessages('pending');

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReviewQueueScreen
          repository={repository}
          onNavigateToTemplateBuilder={onNavigateToTemplateBuilder}
        />
      );
    });

    const root = renderer!.root;
    const tuneBtn = root.findByProps({ testID: `tune-template-btn-${pending[1].id}` });
    await act(async () => {
      tuneBtn.props.onPress();
    });

    expect(onNavigateToTemplateBuilder).toHaveBeenCalledWith(
      pending[1].sender,
      pending[1].raw_sms_body
    );
  });
});
