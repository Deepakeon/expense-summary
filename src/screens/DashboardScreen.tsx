import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { DatabaseRepository } from '../db/repository';
import { BatchSyncService, BatchSyncResult } from '../sync/syncService';
import { CategorySummary, Transaction, TransactionSummary } from '../db/types';
import { ISmsReader } from '../sms/types';
import { smsReader as defaultSmsReader } from '../sms/smsReader';

interface DashboardScreenProps {
  repository: DatabaseRepository;
  syncService: BatchSyncService;
  smsReader?: ISmsReader;
  onNavigateToTransactions?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  repository,
  syncService,
  smsReader = defaultSmsReader,
  onNavigateToTransactions,
}) => {
  const [timeframe, setTimeframe] = useState<'month' | 'week' | 'all'>('month');
  const [summary, setSummary] = useState<TransactionSummary>({
    totalDebits: 0,
    totalCredits: 0,
    netCashflow: 0,
    transactionCount: 0,
  });
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);

  const loadData = useCallback(() => {
    let minTimestamp: number | undefined;
    const now = Date.now();
    if (timeframe === 'week') {
      minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'month') {
      minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
    }

    setSummary(repository.getTransactionSummary(minTimestamp));
    setCategorySummaries(repository.getCategorySummary(minTimestamp));
    setRecentTransactions(repository.getTransactions({ minTimestamp }).slice(0, 5));
    setLastSyncTime(repository.getLastSyncTimestamp());
  }, [repository, timeframe]);

  useEffect(() => {
    loadData();
    smsReader.hasPermissions().then((granted) => setHasPermission(granted));
  }, [loadData, smsReader]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const perm = await smsReader.hasPermissions();
      if (!perm) {
        const requested = await smsReader.requestPermissions();
        setHasPermission(requested);
        if (!requested) {
          setSyncFeedback('SMS read permission was denied');
          setIsSyncing(false);
          return;
        }
      }
      const result: BatchSyncResult = await syncService.runBatchSync();
      setSyncFeedback(
        `Synced ${result.syncedCount} new transactions${
          result.quarantinedCount > 0 ? `, ${result.quarantinedCount} quarantined` : ''
        }`
      );
      loadData();
    } catch (err: any) {
      setSyncFeedback(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatSyncTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Expense Summary</Text>
            <Text style={styles.lastSyncText}>Last synced: {formatSyncTime(lastSyncTime)}</Text>
          </View>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSync}
            disabled={isSyncing}
            testID="sync-now-btn"
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sync Feedback Toast / Banner */}
        {syncFeedback && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{syncFeedback}</Text>
          </View>
        )}

        {/* Permission Banner */}
        {!hasPermission && (
          <TouchableOpacity
            style={styles.permissionBanner}
            onPress={async () => {
              const res = await smsReader.requestPermissions();
              setHasPermission(res);
              if (res) handleSync();
            }}
          >
            <Text style={styles.permissionBannerText}>
              ⚠️ SMS permission required to extract transactions. Tap to grant access.
            </Text>
          </TouchableOpacity>
        )}

        {/* Timeframe Selector */}
        <View style={styles.timeframeRow}>
          {(['month', 'week', 'all'] as const).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                timeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setTimeframe(tf)}
            >
              <Text
                style={[
                  styles.timeframeButtonText,
                  timeframe === tf && styles.timeframeButtonTextActive,
                ]}
              >
                {tf === 'month' ? 'This Month (30D)' : tf === 'week' ? 'This Week (7D)' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Metric Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.debitCard]}>
            <Text style={styles.summaryCardLabel}>Total Spent (Debits)</Text>
            <Text style={[styles.summaryCardValue, styles.debitValue]}>
              {formatCurrency(summary.totalDebits)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.creditCard]}>
            <Text style={styles.summaryCardLabel}>Total Credited (Income)</Text>
            <Text style={[styles.summaryCardValue, styles.creditValue]}>
              {formatCurrency(summary.totalCredits)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.balanceCard]}>
            <Text style={styles.summaryCardLabel}>Net Cashflow</Text>
            <Text
              style={[
                styles.summaryCardValue,
                summary.netCashflow >= 0 ? styles.positiveCashflow : styles.negativeCashflow,
              ]}
            >
              {summary.netCashflow >= 0 ? '+ ' : '- '}
              {formatCurrency(Math.abs(summary.netCashflow))}
            </Text>
          </View>
        </View>

        {/* Category Distribution Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Spending Breakdown</Text>
          {categorySummaries.length === 0 ? (
            <Text style={styles.noDataText}>No expense transactions in this period.</Text>
          ) : (
            <View style={styles.categoryList}>
              {categorySummaries.map((cat) => (
                <View key={cat.categoryId} style={styles.categoryItem}>
                  <View style={styles.categoryHeaderRow}>
                    <Text style={styles.categoryName}>{cat.categoryName}</Text>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(cat.totalSpent)} ({cat.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.max(0, cat.percentage))}%`,
                          backgroundColor: cat.categoryColor || '#3B82F6',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {onNavigateToTransactions && (
              <TouchableOpacity onPress={onNavigateToTransactions}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentTransactions.length === 0 ? (
            <Text style={styles.noDataText}>No recent transactions recorded.</Text>
          ) : (
            <View style={styles.recentList}>
              {recentTransactions.map((tx) => {
                const isDebit = tx.transaction_type === 'debit';
                return (
                  <View key={tx.id} style={styles.recentItem}>
                    <View style={styles.recentItemLeft}>
                      <Text style={styles.recentMerchant} numberOfLines={1}>
                        {tx.merchant || tx.sender}
                      </Text>
                      <Text style={styles.recentDate}>
                        {new Date(tx.transaction_timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.recentAmount,
                        isDebit ? styles.debitAmount : styles.creditAmount,
                      ]}
                    >
                      {isDebit ? '-' : '+'}
                      {formatCurrency(tx.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  lastSyncText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  syncButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  feedbackBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  feedbackText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  permissionBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  permissionBannerText: {
    color: '#FCD34D',
    fontSize: 12,
    fontWeight: '500',
  },
  timeframeRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 3,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#334155',
  },
  timeframeButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  timeframeButtonTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  summaryGrid: {
    gap: 10,
  },
  summaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  debitCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  creditCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  summaryCardLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  debitValue: {
    color: '#F87171',
  },
  creditValue: {
    color: '#34D399',
  },
  positiveCashflow: {
    color: '#60A5FA',
  },
  negativeCashflow: {
    color: '#F87171',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  viewAllText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  noDataText: {
    color: '#64748B',
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    gap: 6,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  recentItemLeft: {
    flex: 1,
  },
  recentMerchant: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  recentDate: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  debitAmount: {
    color: '#F87171',
  },
  creditAmount: {
    color: '#34D399',
  },
});
