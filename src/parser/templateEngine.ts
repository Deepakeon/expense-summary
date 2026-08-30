export const SUPPORTED_TOKENS = ['amount', 'merchant', 'account', 'balance', 'date'] as const;

export type SupportedToken = typeof SUPPORTED_TOKENS[number];

export interface ParsedTransactionFields {
  amount: number;
  currency: string;
  merchant?: string | null;
  account_snippet?: string | null;
  balance?: number | null;
  date_str?: string | null;
}

export interface TemplateValidationResult {
  isValid: boolean;
  error?: string;
  tokens: string[];
}

export function validateTemplatePattern(pattern: string): TemplateValidationResult {
  if (!pattern || !pattern.trim()) {
    return { isValid: false, error: 'Template pattern cannot be empty', tokens: [] };
  }

  // Check for unmatched / unclosed brackets
  const openCount = (pattern.match(/\{/g) || []).length;
  const closeCount = (pattern.match(/\}/g) || []).length;
  if (openCount !== closeCount) {
    return { isValid: false, error: 'Unmatched or unclosed curly brackets in template', tokens: [] };
  }

  const tokenMatches = [...pattern.matchAll(/\{([^}]+)\}/g)];
  const tokens: string[] = [];

  for (const match of tokenMatches) {
    const tokenName = match[1].trim();
    if (!SUPPORTED_TOKENS.includes(tokenName as SupportedToken)) {
      return {
        isValid: false,
        error: `Unknown token "{${tokenName}}". Supported tokens are: ${SUPPORTED_TOKENS.map((t) => `{${t}}`).join(', ')}`,
        tokens: [],
      };
    }
    if (!tokens.includes(tokenName)) {
      tokens.push(tokenName);
    }
  }

  if (!tokens.includes('amount')) {
    return {
      isValid: false,
      error: 'Template must contain at least the {amount} token',
      tokens,
    };
  }

  return { isValid: true, tokens };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function compileTemplate(pattern: string): RegExp {
  const validation = validateTemplatePattern(pattern);
  if (!validation.isValid) {
    throw new Error(`Invalid template pattern: ${validation.error}`);
  }

  // Token tokenization
  const parts: string[] = [];
  let lastIndex = 0;
  const tokenRegex = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(pattern)) !== null) {
    const literal = pattern.slice(lastIndex, match.index);
    if (literal) {
      // Escape literal regex characters and replace whitespace sequence with \s+
      const escapedLiteral = escapeRegex(literal).replace(/\s+/g, '\\s+');
      parts.push(escapedLiteral);
    }

    const tokenName = match[1].trim() as SupportedToken;
    switch (tokenName) {
      case 'amount':
        parts.push('(?<amount>(?:[A-Za-z$€£₹.]+\\s*)?[0-9,]+(?:\\.[0-9]+)?)');
        break;
      case 'balance':
        parts.push('(?<balance>(?:[A-Za-z$€£₹.]+\\s*)?[0-9,]+(?:\\.[0-9]+)?)');
        break;
      case 'account':
        parts.push('(?<account>.+?)');
        break;
      case 'merchant':
        parts.push('(?<merchant>.+?)');
        break;
      case 'date':
        parts.push('(?<date>.+?)');
        break;
      default:
        parts.push(`(?<${tokenName}>.+?)`);
    }

    lastIndex = match.index + match[0].length;
  }

  const remaining = pattern.slice(lastIndex);
  if (remaining) {
    const escapedRemaining = escapeRegex(remaining).replace(/\s+/g, '\\s+');
    parts.push(escapedRemaining);
  }

  const fullPattern = `^\\s*${parts.join('')}\\s*$`;
  return new RegExp(fullPattern, 'i');
}

export function extractTransactionFields(
  pattern: string,
  smsMessage: string
): ParsedTransactionFields | null {
  try {
    const regex = compileTemplate(pattern);
    // Normalize SMS message linebreaks and spaces for consistent matching
    const normalizedMessage = smsMessage.trim().replace(/\r\n/g, '\n');
    const match = regex.exec(normalizedMessage);

    if (!match || !match.groups) {
      return null;
    }

    const groups = match.groups;
    const rawAmount = groups.amount;
    if (!rawAmount) {
      return null;
    }

    // Determine currency
    let currency = 'INR';
    const rawAmountLower = rawAmount.toLowerCase();
    const smsLower = smsMessage.toLowerCase();

    if (rawAmount.includes('$') || smsLower.includes('usd') || smsLower.includes('$')) {
      currency = 'USD';
    } else if (rawAmount.includes('€') || smsLower.includes('eur') || smsLower.includes('€')) {
      currency = 'EUR';
    } else if (rawAmount.includes('£') || smsLower.includes('gbp') || smsLower.includes('£')) {
      currency = 'GBP';
    } else if (
      rawAmount.includes('₹') ||
      rawAmountLower.includes('rs') ||
      rawAmountLower.includes('inr') ||
      smsLower.includes('₹') ||
      smsLower.includes('inr') ||
      smsLower.includes('rs')
    ) {
      currency = 'INR';
    }

    // Extract numeric amount
    const cleanAmountStr = rawAmount.replace(/[^0-9.]/g, '');
    const amount = parseFloat(cleanAmountStr);
    if (isNaN(amount)) {
      return null;
    }

    // Extract numeric balance if present
    let balance: number | null = null;
    if (groups.balance) {
      const cleanBalanceStr = groups.balance.replace(/[^0-9.]/g, '');
      const parsedBal = parseFloat(cleanBalanceStr);
      if (!isNaN(parsedBal)) {
        balance = parsedBal;
      }
    }

    const merchant = groups.merchant ? groups.merchant.trim().replace(/^[\s:,-]+|[\s:,-]+$/g, '') : null;
    const account_snippet = groups.account ? groups.account.trim().replace(/^[\s:,-]+|[\s:,-]+$/g, '') : null;
    const date_str = groups.date ? groups.date.trim() : null;

    return {
      amount,
      currency,
      merchant: merchant || null,
      account_snippet: account_snippet || null,
      balance,
      date_str: date_str || null,
    };
  } catch {
    return null;
  }
}
