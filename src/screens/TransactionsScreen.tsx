import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { DatabaseRepository } from '../db/repository';
import { Category, Transaction } from '../db/types';
import { TransactionDetailModal } from '../components/TransactionDetailModal';

interface TransactionsScreenProps {
  repository: DatabaseRepository;
}

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ repository }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const [timeframe, setTimeframe] = useState<'all' | 'month' | 'week'>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const categoriesMap = useMemo(() => {
    const map = new Map<number, Category>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const loadData = useCallback(() => {
    let minTimestamp: number | undefined;
    const now = Date.now();
    if (timeframe === 'week') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'month') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    const loaded = repository.getTransactions({
      search: search.trim() || undefined,
      transaction_type: typeFilter === 'all' ? undefined : typeFilter,
      minTimestamp,
    });
    setTransactions(loaded);
    setCategories(repository.getCategories());
  }, [repository, search, typeFilter, timeframe]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdateTransaction = (
    id: number,
    updates: { category_id?: number | null; merchant?: string | null }
  ) => {
    repository.updateTransaction(id, updates);
    loadData();
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    return `${symbol}${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search merchant, account..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          testID="transaction-search-input"
        />

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <View style={styles.typeFilterGroup}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                typeFilter === 'all' && styles.filterPillActive,
              ]}
              onPress={() => setTypeFilter('all')}
              testID="filter-all-btn"
            >
              <Text
                style={[
                  styles.filterPillText,
                  typeFilter === 'all' && styles.filterPillTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterPill,
                typeFilter === 'debit' && styles.filterPillActiveDebit,
              ]}
              onPress={() => setTypeFilter('debit')}
              testID="filter-debit-btn"
            >
              <Text
                style={[
                  styles.filterPillText,
                  typeFilter === 'debit' && styles.filterPillTextActive,
                ]}
              >
                Debit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterPill,
                typeFilter === 'credit' && styles.filterPillActiveCredit,
              ]}
              onPress={() => setTypeFilter('credit')}
              testID="filter-credit-btn"
            >
              <Text
                style={[
                  styles.filterPillText,
                  typeFilter === 'credit' && styles.filterPillTextActive,
                ]}
              >
                Credit
              </Text>
            </TouchableOpacity>
          </View>

          {/* Timeframe selector */}
          <View style={styles.timeframeGroup}>
            {(['all', 'month', 'week'] as const).map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[
                  styles.timeframePill,
                  timeframe === tf && styles.timeframePillActive,
                ]}
                onPress={() => setTimeframe(tf)}
              >
                <Text
                  style={[
                    styles.timeframeText,
                    timeframe === tf && styles.timeframeTextActive,
                  ]}
                >
                  {tf === 'all' ? 'All' : tf === 'month' ? '30D' : '7D'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
            <Text style={styles.emptyStateText}>
              Extracted bank transactions will appear here after sync.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDebit = item.transaction_type === 'debit';
          const cat = item.category_id ? categoriesMap.get(item.category_id) : null;

          return (
            <TouchableOpacity
              style={styles.txCard}
              onPress={() => setSelectedTx(item)}
              testID={`tx-item-${item.id}`}
            >
              <View style={styles.txMainInfo}>
                <View style={styles.txHeader}>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {item.merchant || item.sender}
                  </Text>
                  <Text
                    style={[
                      styles.amount,
                      isDebit ? styles.debitAmount : styles.creditAmount,
                    ]}
                  >
                    {isDebit ? '-' : '+'}
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                </View>

                <View style={styles.txSubInfo}>
                  <View style={styles.tagsRow}>
                    {cat && (
                      <View
                        style={[
                          styles.categoryTag,
                          cat.color ? { backgroundColor: `${cat.color}20`, borderColor: cat.color } : undefined,
                        ]}
                      >
                        <Text style={[styles.categoryTagText, cat.color ? { color: cat.color } : undefined]}>
                          {cat.name}
                        </Text>
                      </View>
                    )}
                    {item.account_snippet && (
                      <View style={styles.accountTag}>
                        <Text style={styles.accountTagText}>{item.account_snippet}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.transaction_timestamp)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TransactionDetailModal
        visible={!!selectedTx}
        transaction={selectedTx}
        categories={categories}
        onClose={() => setSelectedTx(null)}
        onUpdate={handleUpdateTransaction}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    color: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeFilterGroup: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
  },
  filterPill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterPillActive: {
    backgroundColor: '#3B82F6',
  },
  filterPillActiveDebit: {
    backgroundColor: '#EF4444',
  },
  filterPillActiveCredit: {
    backgroundColor: '#10B981',
  },
  filterPillText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeframeGroup: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 2,
  },
  timeframePill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  timeframePillActive: {
    backgroundColor: '#334155',
  },
  timeframeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  timeframeTextActive: {
    color: '#38BDF8',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  txMainInfo: {
    gap: 6,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  debitAmount: {
    color: '#F87171',
  },
  creditAmount: {
    color: '#34D399',
  },
  txSubInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#475569',
    backgroundColor: '#334155',
  },
  categoryTagText: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  accountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  accountTagText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyStateText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
  },
});
