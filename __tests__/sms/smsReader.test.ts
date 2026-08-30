import {
  smsReader,
  setMockSmsProvider,
  setMockPermissionProvider,
} from '../../src/sms/smsReader';
import { RawSmsMessage } from '../../src/sms/types';

describe('SmsReader Bridge Module', () => {
  afterEach(() => {
    setMockSmsProvider(null);
    setMockPermissionProvider(null);
  });

  it('checks permissions via mock provider', async () => {
    setMockPermissionProvider({
      hasPermissions: async () => true,
      requestPermissions: async () => true,
    });

    const hasPerm = await smsReader.hasPermissions();
    expect(hasPerm).toBe(true);

    const reqPerm = await smsReader.requestPermissions();
    expect(reqPerm).toBe(true);
  });

  it('handles denied permissions via mock provider', async () => {
    setMockPermissionProvider({
      hasPermissions: async () => false,
      requestPermissions: async () => false,
    });

    const hasPerm = await smsReader.hasPermissions();
    expect(hasPerm).toBe(false);

    const reqPerm = await smsReader.requestPermissions();
    expect(reqPerm).toBe(false);
  });

  it('fetches SMS batch through mock provider with filtering', async () => {
    const mockMessages: RawSmsMessage[] = [
      {
        id: '101',
        sender: 'VM-HDFCBK',
        body: 'Alert: Spent Rs 500 at Swiggy',
        timestamp: 1000,
      },
      {
        id: '102',
        sender: 'AD-SBIINB',
        body: 'Dear SBI User, debited Rs 200',
        timestamp: 2000,
      },
      {
        id: '103',
        sender: 'SPAM-DEALS',
        body: 'Get 50% discount today',
        timestamp: 3000,
      },
    ];

    setMockSmsProvider(async (options) => {
      let filtered = [...mockMessages];
      if (options?.minTimestamp !== undefined) {
        filtered = filtered.filter((m) => m.timestamp > options.minTimestamp!);
      }
      if (options?.senders && options.senders.length > 0) {
        filtered = filtered.filter((m) =>
          options.senders!.some((s) => m.sender.toLowerCase().includes(s.toLowerCase()))
        );
      }
      return filtered;
    });

    const result = await smsReader.fetchSmsBatch({
      senders: ['HDFCBK'],
      minTimestamp: 500,
    });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('101');
    expect(result[0].sender).toBe('VM-HDFCBK');
  });
});
