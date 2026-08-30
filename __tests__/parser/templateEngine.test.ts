import {
  extractTransactionFields,
  validateTemplatePattern,
} from '../../src/parser/templateEngine';

describe('Visual Token Template Engine', () => {
  describe('validateTemplatePattern', () => {
    it('validates a valid template containing amount', () => {
      const result = validateTemplatePattern(
        'Rs {amount} debited from A/c {account} to {merchant} on {date}. Bal: {balance}'
      );
      expect(result.isValid).toBe(true);
      expect(result.tokens).toEqual(['amount', 'account', 'merchant', 'date', 'balance']);
    });

    it('rejects a template missing {amount}', () => {
      const result = validateTemplatePattern('Debited from A/c {account} to {merchant}');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/amount/i);
    });

    it('rejects invalid or unknown tokens', () => {
      const result = validateTemplatePattern('Rs {amount} spent on {unknown_token}');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/unknown_token/i);
    });

    it('rejects empty or whitespace-only templates', () => {
      const result = validateTemplatePattern('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/empty/i);
    });

    it('rejects unclosed token brackets', () => {
      const result = validateTemplatePattern('Rs {amount debited');
      expect(result.isValid).toBe(false);
      expect(result.error).toMatch(/bracket|closed/i);
    });
  });

  describe('extractTransactionFields with various bank formats', () => {
    it('extracts HDFC Bank debit format accurately', () => {
      const template =
        'Alert: You have spent Rs. {amount} on HDFC Bank CARD {account} at {merchant} on {date}. Avl bal: {balance}';
      const sms =
        'Alert: You have spent Rs. 1,450.00 on HDFC Bank CARD XX8821 at SWIGGY BANGALORE on 24-08-2023 20:15:00. Avl bal: 45,210.50';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(1450.0);
      expect(fields?.currency).toBe('INR');
      expect(fields?.account_snippet).toBe('XX8821');
      expect(fields?.merchant).toBe('SWIGGY BANGALORE');
      expect(fields?.balance).toBe(45210.5);
      expect(fields?.date_str).toBe('24-08-2023 20:15:00');
    });

    it('extracts SBI debit format with ₹ symbol', () => {
      const template =
        'Dear SBI User, your A/c {account} debited by ₹{amount} on {date} transfer to {merchant} Ref {balance}';
      const sms =
        'Dear SBI User, your A/c **3421 debited by ₹500.00 on 12-Jan-24 transfer to AMAZON PAY Ref 12345';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(500.0);
      expect(fields?.currency).toBe('INR');
      expect(fields?.account_snippet).toBe('**3421');
      expect(fields?.merchant).toBe('AMAZON PAY');
    });

    it('extracts ICICI Bank credit format', () => {
      const template =
        'Your A/c {account} is credited with INR {amount} on {date}. Info: {merchant}. Available Bal: INR {balance}.';
      const sms =
        'Your A/c ending 9012 is credited with INR 75,000.00 on 01-Sep-23. Info: SALARY TECH CORP. Available Bal: INR 1,20,500.75.';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(75000.0);
      expect(fields?.currency).toBe('INR');
      expect(fields?.account_snippet).toBe('ending 9012');
      expect(fields?.merchant).toBe('SALARY TECH CORP');
      expect(fields?.balance).toBe(120500.75);
    });

    it('extracts USD / $ currency transactions', () => {
      const template = 'Paid ${amount} at {merchant} using card {account}.';
      const sms = 'Paid $42.50 at Starbucks Coffee using card *1122.';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(42.5);
      expect(fields?.currency).toBe('USD');
      expect(fields?.merchant).toBe('Starbucks Coffee');
      expect(fields?.account_snippet).toBe('*1122');
    });

    it('handles newline and whitespace variations between template and sms', () => {
      const template = 'Debited: Rs {amount}\nFrom: {account}\nTo: {merchant}';
      const sms = 'Debited:   Rs 320.00 \n From:  XX9901 \n To:   Uber Rides  ';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(320.0);
      expect(fields?.account_snippet).toBe('XX9901');
      expect(fields?.merchant).toBe('Uber Rides');
    });

    it('returns null when SMS does not match template', () => {
      const template = 'Dear Customer, Rs.{amount} spent at {merchant}';
      const sms = 'Get 50% discount on your next purchase using code SAVE50!';

      const fields = extractTransactionFields(template, sms);
      expect(fields).toBeNull();
    });

    it('handles templates with special regex characters in literal text', () => {
      const template = 'Alert (Txn): [Rs. {amount}] debited for {merchant}? Bal={balance}.';
      const sms = 'Alert (Txn): [Rs. 999.00] debited for Netflix? Bal=8500.00.';

      const fields = extractTransactionFields(template, sms);
      expect(fields).not.toBeNull();
      expect(fields?.amount).toBe(999.0);
      expect(fields?.merchant).toBe('Netflix');
      expect(fields?.balance).toBe(8500.0);
    });
  });
});
