import { NativeModules, Platform } from 'react-native';
import { FetchSmsBatchOptions, ISmsReader, RawSmsMessage } from './types';

const getSmsReaderModule = () => NativeModules.SmsReaderModule;

type MockSmsProvider = (options?: FetchSmsBatchOptions) => Promise<RawSmsMessage[]>;
type MockPermissionProvider = {
  hasPermissions?: () => Promise<boolean>;
  requestPermissions?: () => Promise<boolean>;
};

let mockSmsProvider: MockSmsProvider | null = null;
let mockPermissionProvider: MockPermissionProvider | null = null;

export function setMockSmsProvider(provider: MockSmsProvider | null): void {
  mockSmsProvider = provider;
}

export function setMockPermissionProvider(provider: MockPermissionProvider | null): void {
  mockPermissionProvider = provider;
}

class SmsReaderBridge implements ISmsReader {
  async hasPermissions(): Promise<boolean> {
    if (mockPermissionProvider?.hasPermissions) {
      return mockPermissionProvider.hasPermissions();
    }
    if (Platform.OS !== 'android') {
      return false;
    }
    const module = getSmsReaderModule();
    if (!module || typeof module.hasPermissions !== 'function') {
      return false;
    }
    try {
      return await module.hasPermissions();
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    if (mockPermissionProvider?.requestPermissions) {
      return mockPermissionProvider.requestPermissions();
    }
    if (Platform.OS !== 'android') {
      return false;
    }
    const module = getSmsReaderModule();
    if (!module || typeof module.requestPermissions !== 'function') {
      return false;
    }
    try {
      return await module.requestPermissions();
    } catch {
      return false;
    }
  }

  async fetchSmsBatch(options: FetchSmsBatchOptions = {}): Promise<RawSmsMessage[]> {
    if (mockSmsProvider) {
      return mockSmsProvider(options);
    }
    if (Platform.OS !== 'android') {
      return [];
    }
    const module = getSmsReaderModule();
    if (!module || typeof module.fetchSmsBatch !== 'function') {
      return [];
    }

    const senders = options.senders || [];
    const minTimestamp = options.minTimestamp ?? 0;
    const maxLimit = options.maxLimit ?? 1000;

    try {
      const messages = await module.fetchSmsBatch(senders, minTimestamp, maxLimit);
      return (messages || []).map((m: any) => ({
        id: String(m.id),
        sender: String(m.sender),
        body: String(m.body),
        timestamp: Number(m.timestamp),
      }));
    } catch (err) {
      console.warn('Failed to fetch SMS batch:', err);
      return [];
    }
  }
}

export const smsReader = new SmsReaderBridge();
