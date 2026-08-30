import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Category, Transaction } from '../db/types';

interface TransactionDetailModalProps {
  visible: boolean;
  transaction: Transaction | null;
  categories: Category[];
  onClose: () => void;
  onUpdate: (
    id: number,
    updates: { category_id?: number | null; merchant?: string | null }
  ) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  visible,
  transaction,
  categories,
  onClose,
  onUpdate,
}) => {
  const [merchant, setMerchant] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    if (transaction) {
      setMerchant(transaction.merchant || '');
      setSelectedCategoryId(transaction.category_id ?? null);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isDebit = transaction.transaction_type === 'debit';
  const currencySymbol = transaction.currency === 'INR' ? '₹' : transaction.currency === 'USD' ? '$' : transaction.currency === 'EUR' ? '€' : transaction.currency === 'GBP' ? '£' : transaction.currency;

  const handleSave = () => {
    onUpdate(transaction.id, {
      merchant: merchant.trim() || null,
      category_id: selectedCategoryId,
    });
    onClose();
  };

  const formattedDate = new Date(transaction.transaction_timestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>Transaction Details</Text>
                <Text style={styles.senderSubtext}>Sender: {transaction.sender}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Amount Banner */}
            <View
              style={[
                styles.amountBanner,
                isDebit ? styles.debitBanner : styles.creditBanner,
              ]}
            >
              <Text
                style={[
                  styles.amountText,
                  isDebit ? styles.debitText : styles.creditText,
                ]}
              >
                {isDebit ? '- ' : '+ '}
                {currencySymbol}
                {transaction.amount.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
              <Text
                style={[
                  styles.typeBadge,
                  isDebit ? styles.debitTypeBadge : styles.creditTypeBadge,
                ]}
              >
                {transaction.transaction_type.toUpperCase()}
              </Text>
            </View>

            {/* Editable Merchant */}
            <Text style={styles.label}>Merchant / Payee:</Text>
            <TextInput
              style={styles.input}
              value={merchant}
              onChangeText={setMerchant}
              placeholder="Merchant or payee name"
              placeholderTextColor="#9CA3AF"
              testID="edit-merchant-input"
            />

            {/* Category Selector */}
            <Text style={styles.label}>Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillActive,
                      isSelected && cat.color ? { borderColor: cat.color } : undefined,
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    testID={`category-pill-${cat.id}`}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isSelected && styles.categoryPillTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Meta Information */}
            <View style={styles.metaBox}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date & Time:</Text>
                <Text style={styles.metaValue}>{formattedDate}</Text>
              </View>
              {transaction.account_snippet && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Account / Card:</Text>
                  <Text style={styles.metaValue}>{transaction.account_snippet}</Text>
                </View>
              )}
              {transaction.balance !== null && transaction.balance !== undefined && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Account Balance:</Text>
                  <Text style={styles.metaValue}>
                    {currencySymbol}
                    {transaction.balance.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>
              )}
            </View>

            {/* Raw SMS Message Section */}
            <Text style={styles.label}>Original Raw SMS Message:</Text>
            <View style={styles.smsBox}>
              <Text style={styles.smsBodyText}>{transaction.raw_sms_body}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                testID="save-tx-detail-btn"
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    maxHeight: '90%',
    padding: 18,
  },
  scrollContainer: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  senderSubtext: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debitBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
  },
  creditBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '800',
  },
  debitText: {
    color: '#F87171',
  },
  creditText: {
    color: '#34D399',
  },
  typeBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  debitTypeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    color: '#FCA5A5',
  },
  creditTypeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    color: '#6EE7B7',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginTop: 12,
    marginBottom: 6,
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
  categoryScroll: {
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
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  categoryPillText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  metaBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metaValue: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '500',
  },
  smsBox: {
    backgroundColor: '#0A0F1D',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 12,
  },
  smsBodyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cancelBtnText: {
    color: '#CBD5E1',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
