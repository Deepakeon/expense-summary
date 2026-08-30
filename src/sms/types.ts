export interface RawSmsMessage {
  id: string;
  sender: string;
  body: string;
  timestamp: number;
}

export interface FetchSmsBatchOptions {
  senders?: string[];
  minTimestamp?: number;
  maxLimit?: number;
}

export interface ISmsReader {
  hasPermissions(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  fetchSmsBatch(options?: FetchSmsBatchOptions): Promise<RawSmsMessage[]>;
}
