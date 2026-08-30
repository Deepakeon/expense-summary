export type TransactionType = 'debit' | 'credit';

export interface Category {
  id: number;
  name: string;
  icon?: string;
  color?: string;
  created_at: number;
}

export interface SenderRule {
  id: number;
  sender_name: string;
  is_active: number; // 1 or 0
  created_at: number;
}

export interface ExtractionTemplate {
  id: number;
  sender_rule_id: number;
  template_pattern: string;
  transaction_type: TransactionType;
  default_category_id?: number | null;
  created_at: number;
}

export interface Transaction {
  id: number;
  native_sms_id: string;
  sender: string;
  amount: number;
  currency: string;
  transaction_type: TransactionType;
  merchant?: string | null;
  account_snippet?: string | null;
  balance?: number | null;
  category_id?: number | null;
  transaction_timestamp: number;
  raw_sms_body: string;
  content_hash: string;
  created_at: number;
}

export interface QuarantinedMessage {
  id: number;
  native_sms_id: string;
  sender: string;
  raw_sms_body: string;
  received_timestamp: number;
  status: 'pending' | 'dismissed';
  created_at: number;
}

export interface SyncMetadata {
  key: string;
  value: string;
}

export interface TransactionFilter {
  sender?: string;
  transaction_type?: TransactionType;
  category_id?: number;
  minTimestamp?: number;
  maxTimestamp?: number;
  search?: string;
}

export interface TransactionSummary {
  totalDebits: number;
  totalCredits: number;
  netCashflow: number;
  transactionCount: number;
}

export interface CategorySummary {
  categoryId: number;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  totalSpent: number;
  percentage: number;
}
