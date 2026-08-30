import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Category, SenderRule } from '../db/types';
import {
  extractTransactionFields,
  validateTemplatePattern,
  SUPPORTED_TOKENS,
  ParsedTransactionFields,
} from '../parser/templateEngine';

interface TemplateBuilderModalProps {
  visible: boolean;
  senderRule: SenderRule | null;
  categories: Category[];
  initialSampleSms?: string;
  onClose: () => void;
  onSave: (data: {
    templatePattern: string;
    transactionType: 'debit' | 'credit';
    defaultCategoryId?: number | null;
  }) => void;
}

export const TemplateBuilderModal: React.FC<TemplateBuilderModalProps> = ({
  visible,
  senderRule,
  categories,
  initialSampleSms = '',
  onClose,
  onSave,
}) => {
  const [templatePattern, setTemplatePattern] = useState('');
  const [sampleSms, setSampleSms] = useState(initialSampleSms);
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSampleSms(initialSampleSms);
      setError(null);
    }
  }, [visible, initialSampleSms]);

  const insertToken = (token: string) => {
    setTemplatePattern((prev) => `${prev}{${token}} `);
  };

  // Compute live preview
  let previewResult: ParsedTransactionFields | null = null;
  let validationError: string | null = null;

  if (templatePattern.trim()) {
    const validation = validateTemplatePattern(templatePattern);
    if (!validation.isValid) {
      validationError = validation.error || 'Invalid template';
    } else if (sampleSms.trim()) {
      previewResult = extractTransactionFields(templatePattern, sampleSms);
    }
  }

  const handleSave = () => {
    const validation = validateTemplatePattern(templatePattern);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid template pattern');
      return;
    }

    onSave({
      templatePattern: templatePattern.trim(),
      transactionType,
      defaultCategoryId: selectedCategoryId,
    });
    setTemplatePattern('');
    setSampleSms('');
    setError(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Visual Template Builder</Text>
              {senderRule && <Text style={styles.subtitle}>Sender: {senderRule.sender_name}</Text>}
            </View>

            {/* Quick Visual Token Buttons */}
            <Text style={styles.sectionLabel}>Insert Visual Tokens:</Text>
            <View style={styles.tokenPillsContainer}>
              {SUPPORTED_TOKENS.map((token) => (
                <TouchableOpacity
                  key={token}
                  style={styles.tokenPill}
                  onPress={() => insertToken(token)}
                  testID={`token-btn-${token}`}
                >
                  <Text style={styles.tokenPillText}>+{`{${token}}`}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Template Pattern Input */}
            <Text style={styles.sectionLabel}>Extraction Template Pattern:</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              multiline
              placeholder="e.g. Alert: Rs. {amount} spent at {merchant} on {date}. Bal: {balance}"
              placeholderTextColor="#9CA3AF"
              value={templatePattern}
              onChangeText={(txt) => {
                setTemplatePattern(txt);
                setError(null);
              }}
              testID="template-pattern-input"
            />

            {/* Transaction Type Selector */}
            <Text style={styles.sectionLabel}>Transaction Type:</Text>
            <View style={styles.typeSelectorRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'debit' && styles.typeButtonActiveDebit,
                ]}
                onPress={() => setTransactionType('debit')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'debit' && styles.typeButtonTextActive,
                  ]}
                >
                  Debit (Expense)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  transactionType === 'credit' && styles.typeButtonActiveCredit,
                ]}
                onPress={() => setTransactionType('credit')}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    transactionType === 'credit' && styles.typeButtonTextActive,
                  ]}
                >
                  Credit (Income)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Default Category Picker */}
            <Text style={styles.sectionLabel}>Default Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    selectedCategoryId === cat.id && styles.categoryPillActive,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      selectedCategoryId === cat.id && styles.categoryPillTextActive,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Live Sample SMS Testing */}
            <Text style={styles.sectionLabel}>Live Sample SMS Message (for testing):</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              multiline
              placeholder="Paste a sample SMS message to test this template..."
              placeholderTextColor="#9CA3AF"
              value={sampleSms}
              onChangeText={setSampleSms}
              testID="sample-sms-input"
            />

            {/* Live Preview Result Box */}
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>Live Sample Extraction Preview</Text>
              {validationError ? (
                <Text style={styles.validationErrorText}>⚠️ {validationError}</Text>
              ) : previewResult ? (
                <View style={styles.previewFields}>
                  <Text style={styles.previewField}>
                    <Text style={styles.previewFieldLabel}>Amount: </Text>
                    {previewResult.currency} {previewResult.amount}
                  </Text>
                  {previewResult.merchant && (
                    <Text style={styles.previewField}>
                      <Text style={styles.previewFieldLabel}>Merchant: </Text>
                      {previewResult.merchant}
                    </Text>
                  )}
                  {previewResult.account_snippet && (
                    <Text style={styles.previewField}>
                      <Text style={styles.previewFieldLabel}>Account: </Text>
                      {previewResult.account_snippet}
                    </Text>
                  )}
                  {previewResult.balance !== undefined && previewResult.balance !== null && (
                    <Text style={styles.previewField}>
                      <Text style={styles.previewFieldLabel}>Balance: </Text>
                      {previewResult.balance}
                    </Text>
                  )}
                  {previewResult.date_str && (
                    <Text style={styles.previewField}>
                      <Text style={styles.previewFieldLabel}>Date: </Text>
                      {previewResult.date_str}
                    </Text>
                  )}
                </View>
              ) : sampleSms.trim() && templatePattern.trim() ? (
                <Text style={styles.unmatchedText}>
                  ❌ Message does not match template pattern.
                </Text>
              ) : (
                <Text style={styles.helperText}>
                  Enter a template and sample SMS to see extracted fields in real-time.
                </Text>
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                testID="save-template-btn"
              >
                <Text style={styles.saveButtonText}>Save Template</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 16,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  headerRow: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 12,
    marginBottom: 6,
  },
  tokenPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tokenPill: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tokenPillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    color: '#F8FAFC',
    padding: 10,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  typeButtonActiveDebit: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  typeButtonActiveCredit: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  typeButtonText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  categoryPill: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  previewBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginTop: 12,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  previewFields: {
    gap: 4,
  },
  previewField: {
    color: '#F8FAFC',
    fontSize: 13,
  },
  previewFieldLabel: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  validationErrorText: {
    color: '#F59E0B',
    fontSize: 13,
  },
  unmatchedText: {
    color: '#F87171',
    fontSize: 13,
  },
  helperText: {
    color: '#64748B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
