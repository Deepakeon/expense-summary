/* eslint-disable no-bitwise */
import { DatabaseRepository } from '../db/repository';
import { extractTransactionFields } from '../parser/templateEngine';
import { smsReader } from '../sms/smsReader';
import { ISmsReader, RawSmsMessage } from '../sms/types';

export interface BatchSyncResult {
  syncedCount: number;
  quarantinedCount: number;
  duplicateCount: number;
  lastSyncTimestamp: number;
}

export function computeContentHash(message: RawSmsMessage): string {
  const content = `${message.sender}_${message.timestamp}_${message.body}`;
  let hash1 = 0xdeadbeef;
  let hash2 = 0x41c64e6d;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
}

export function matchesSender(address: string, senderRule: string): boolean {
  const cleanAddress = address.trim().toLowerCase();
  const cleanRule = senderRule.trim().toLowerCase();
  if (cleanAddress === cleanRule) {
    return true;
  }
  if (cleanAddress.endsWith(`-${cleanRule}`) || cleanAddress.endsWith(cleanRule)) {
    return true;
  }
  return false;
}

export class BatchSyncService {
  constructor(
    private repository: DatabaseRepository,
    private reader: ISmsReader = smsReader
  ) {}

  async runBatchSync(): Promise<BatchSyncResult> {
    const activeRules = this.repository.getActiveSenderRules();
    const lastSyncTimestamp = this.repository.getLastSyncTimestamp();

    if (activeRules.length === 0) {
      return {
        syncedCount: 0,
        quarantinedCount: 0,
        duplicateCount: 0,
        lastSyncTimestamp,
      };
    }

    const senders = activeRules.map((r) => r.sender_name);
    const messages = await this.reader.fetchSmsBatch({
      senders,
      minTimestamp: lastSyncTimestamp,
    });

    // Sort ascending by timestamp
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    let syncedCount = 0;
    let quarantinedCount = 0;
    let duplicateCount = 0;
    let maxProcessedTimestamp = lastSyncTimestamp;

    // Preload templates for all active rules
    const templatesByRuleId = new Map<number, ReturnType<typeof this.repository.getTemplatesForSender>>();
    for (const rule of activeRules) {
      templatesByRuleId.set(rule.id, this.repository.getTemplatesForSender(rule.id));
    }

    for (const message of sortedMessages) {
      const matchingRule = activeRules.find((r) => matchesSender(message.sender, r.sender_name));
      if (!matchingRule) {
        continue;
      }

      const templates = templatesByRuleId.get(matchingRule.id) || [];
      let parsed = false;

      for (const template of templates) {
        const fields = extractTransactionFields(template.template_pattern, message.body);
        if (fields) {
          const contentHash = computeContentHash(message);
          const inserted = this.repository.insertTransaction({
            native_sms_id: message.id,
            sender: message.sender,
            amount: fields.amount,
            currency: fields.currency,
            transaction_type: template.transaction_type,
            merchant: fields.merchant,
            account_snippet: fields.account_snippet,
            balance: fields.balance,
            category_id: template.default_category_id,
            transaction_timestamp: message.timestamp,
            raw_sms_body: message.body,
            content_hash: contentHash,
          });

          if (inserted) {
            syncedCount++;
          } else {
            duplicateCount++;
          }
          parsed = true;
          break;
        }
      }

      if (!parsed) {
        this.repository.insertQuarantinedMessage({
          native_sms_id: message.id,
          sender: message.sender,
          raw_sms_body: message.body,
          received_timestamp: message.timestamp,
        });
        quarantinedCount++;
      }

      if (message.timestamp > maxProcessedTimestamp) {
        maxProcessedTimestamp = message.timestamp;
      }
    }

    if (maxProcessedTimestamp > lastSyncTimestamp) {
      this.repository.setLastSyncTimestamp(maxProcessedTimestamp);
    }

    return {
      syncedCount,
      quarantinedCount,
      duplicateCount,
      lastSyncTimestamp: this.repository.getLastSyncTimestamp(),
    };
  }
}
